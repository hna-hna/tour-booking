from flask import Blueprint, request, jsonify
from app.extensions import db, supabase
from app.models.user import User
from app.models.chat import Message, AIChatHistory
from app.models.tour import Tour
from app.models.order import Order
from app.models.log import SearchLog, TourViewLog
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from datetime import datetime
import requests
import os
import re
import json
from app.services.recommendation_service import get_popular_tours
from app.ai_engine.recommender import TourRecommender

chat_bp = Blueprint('chat', __name__)
recommender = TourRecommender()

OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

def detect_intent(message):
    msg = message.lower().strip()
    
    intent = {
        "beach": any(kw in msg for kw in ["biển", "biển xanh", "bãi biển", "nam du", "nha trang", "phú yên", "quy nhơn", "hòn sơn", "đà nẵng"]),
        "mountain": any(kw in msg for kw in ["núi", "đà lạt", "măng đen", "hà nội", "sapa", "tây bắc"]),
        "family": any(kw in msg for kw in ["gia đình", "cả nhà", "trẻ em", "con nhỏ"]),
        "couple": any(kw in msg for kw in ["cặp đôi", "người yêu", "trăng mật", "romantic"]),
        "relax": any(kw in msg for kw in ["nghỉ dưỡng", "thư giãn", "resort", "spa"]),
        "adventure": any(kw in msg for kw in ["phiêu lưu", "khám phá", "trekking", "leo núi"]),
        "short_trip": any(kw in msg for kw in ["2 ngày 1 đêm", "3 ngày 2 đêm", "cuối tuần", "ngắn ngày"]),
        "long_trip": any(kw in msg for kw in ["4 ngày", "5 ngày", "dài ngày", "kỳ nghỉ dài"]),
    }
    
    # Ngân sách
    budget_match = re.search(r'(\d+)\s*(triệu|tr|đồng|d|vnđ)?', msg)
    budget_max = None
    if budget_match:
        num = int(budget_match.group(1))
        unit = budget_match.group(2) or ""
        if "triệu" in unit or "tr" in unit:
            budget_max = num * 1_000_000
        elif "đồng" in unit or "d" in unit or "vnđ" in unit:
            budget_max = num
        else:
            budget_max = num * 1_000_000 

    return intent, budget_max


def ensure_minimum_tours(tours, min_count=4):
    if len(tours) >= min_count:
        return tours
    popular = get_popular_tours(min_count)
    existing_ids = {t.id for t in tours}
    for p in popular:
        if p.id not in existing_ids:
            tours.append(p)
        if len(tours) >= min_count:
            break
    return tours

# ──────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────

@chat_bp.route('/partners', methods=['GET'])
@jwt_required()
def get_chat_partners():
    current_user_id = str(get_jwt_identity())
    try:
        response = supabase.table("messages")\
            .select("sender_id, receiver_id")\
            .or_(f"sender_id.eq.{current_user_id},receiver_id.eq.{current_user_id}")\
            .execute()
        messages = response.data or []

        partner_ids = {msg['receiver_id'] if msg['sender_id'] == current_user_id else msg['sender_id'] for msg in messages}
        
        partners = []
        for pid in partner_ids:
            if str(pid).isdigit():
                user = User.query.get(int(pid))
            else:
                user = User.query.filter_by(id=pid).first() 
                
            if user:
                user_msgs = [m for m in messages if 
                             (m['sender_id'] == current_user_id and m['receiver_id'] == pid) or 
                             (m['sender_id'] == pid and m['receiver_id'] == current_user_id)]
                user_msgs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)    
                last_msg = user_msgs[0] if user_msgs else None
                role_display = "Hướng dẫn viên" if user.role == 'guide' else "Khách hàng"

                partners.append({
                    "id": user.id,
                    "name": user.full_name,
                    "role": role_display,
                    "lastMessage": last_msg.get('content', "") if last_msg else ""
                })
        return jsonify(partners), 200
    except Exception as e:
        print("Lỗi get partners:", str(e))
        return jsonify({"error": str(e)}), 500


@chat_bp.route('/ai', methods=['POST'])
@jwt_required()
def chat_with_ai():
    from sqlalchemy import text
    try:
        db.session.execute(text("SELECT user_id FROM ai_chat_history LIMIT 1"))
    except Exception:
        db.session.rollback()
        db.session.execute(text("DROP TABLE IF EXISTS ai_chat_history CASCADE;"))
        db.session.commit()
        db.create_all()

    data = request.get_json()
    user_message = data.get('message')
    user_id = str(get_jwt_identity()) 
    session_id = data.get('session_id')

    if not user_message:
        return jsonify({"reply": "Bạn chưa nhập tin nhắn."}), 400

    # 1. Thu thập Context
    recent_keywords = ""
    recent_views = ""
    recent_orders = ""
    try:
        searches = SearchLog.query.filter_by(user_id=user_id).order_by(SearchLog.searched_at.desc()).limit(5).all()
        recent_keywords = ", ".join([s.keyword for s in searches if s.keyword]) or "chưa có"

        views = TourViewLog.query.filter_by(user_id=user_id).order_by(TourViewLog.viewed_at.desc()).limit(4).all()
        recent_views_list = []
        for v in views:
            t = Tour.query.get(v.tour_id)
            if t: recent_views_list.append(t.name)
        recent_views = ", ".join(recent_views_list) or "chưa xem"

        orders = Order.query.filter_by(user_id=user_id).order_by(Order.booking_date.desc()).limit(3).all()
        recent_orders_list = []
        for o in orders:
            t = Tour.query.get(o.tour_id)
            if t: recent_orders_list.append(t.name)
        recent_orders = ", ".join(recent_orders_list) or "chưa đặt tour nào"
    except Exception:
        pass

    context_extra = f"Khách tìm kiếm: {recent_keywords}\nKhách đã xem: {recent_views}\nKhách đã đặt: {recent_orders}"

    # 2. Phân tích lọc tour
    intent, budget_max = detect_intent(user_message)
    query = Tour.query.filter_by(status='approved')

    if intent["beach"]: query = query.filter(Tour.itinerary.ilike("%biển%") | Tour.description.ilike("%biển%"))
    if intent["mountain"]: query = query.filter(Tour.itinerary.ilike("%núi%") | Tour.description.ilike("%núi%"))
    if budget_max: query = query.filter(Tour.price <= budget_max)

    filtered_tours = query.limit(10).all()
    final_tours = ensure_minimum_tours(filtered_tours, min_count=5)

    tour_context = "\n".join([f"- ID {t.id}: {t.name} ({t.price:,} VNĐ)" for t in final_tours])

    # 3. Gọi Ollama
    system_prompt = f"""
Bạn là trợ lý du lịch AI tiếng Việt. {context_extra}

Danh sách tour CÓ THỂ GIỚI THIỆU:
{tour_context}

YÊU CẦU BẮT BUỘC:
- Luôn gợi ý 2-3 Tour từ danh sách ID phía trên.
- Chỉ trả về chuỗi JSON duy nhất. Không viết lời chào thừa thãi ở ngoài JSON.

Mẫu JSON:
{{
  "reply": "Chào bạn! Mình có các tour biển rất đẹp cho bạn đây...",
  "tour_ids": [danh_sách_số_id_nguyên]
}}
"""
    payload = {"model": MODEL_NAME, "prompt": f"{system_prompt}\nKhách: {user_message}", "format": "json", "stream": False}

    reply = "Chào anh/chị! Em có thể giúp gì cho việc tìm kiếm tour hôm nay ạ?"
    suggested_ids = []

    try:
        resp = requests.post(OLLAMA_API_URL, json=payload, timeout=60)
        ai_text = resp.json().get('response', '{}')
        
        clean_text = re.sub(r'```json|```', '', ai_text).strip()
        parsed = json.loads(clean_text)
        
        reply = parsed.get('reply', reply)
        suggested_ids = [int(x) for x in parsed.get('tour_ids', []) if str(x).isdigit()]
    except Exception:
        pass

    if not suggested_ids and final_tours:
        suggested_ids = [t.id for t in final_tours[:3]]

    suggested_tours = []
    if suggested_ids:
        tours_db = Tour.query.filter(Tour.id.in_(suggested_ids)).all()
        suggested_tours = [{"id": t.id, "name": t.name, "price": t.price, "image": t.image} for t in tours_db]

    # 4. Ghi DB lịch sử
    try:
        db.session.add(AIChatHistory(user_id=user_id, session_id=session_id, role='user', content=user_message))
        db.session.add(AIChatHistory(user_id=user_id, session_id=session_id, role='assistant', content=reply, tours=suggested_tours))
        db.session.commit()
    except Exception:
        db.session.rollback()

    return jsonify({"reply": reply, "suggested_tours": suggested_tours}), 200


@chat_bp.route('/ai/history', methods=['GET'])
@jwt_required()
def get_ai_history():
    user_id = str(get_jwt_identity())
    session_id = request.args.get('session_id')

    try:
        if session_id:
            history = AIChatHistory.query.filter_by(session_id=session_id).order_by(AIChatHistory.created_at.asc()).all()
        else:
            if not str(user_id).isdigit():
                from sqlalchemy import text
                query = text("SELECT * FROM ai_chat_history WHERE user_id = :uid ORDER BY created_at ASC LIMIT 20")
                result = db.session.execute(query, {"uid": user_id})
                
                return jsonify([{
                    "sender_id": "AI" if r.role == 'assistant' else str(r.user_id),
                    "content": r.content,
                    "tours": r.tours if hasattr(r, 'tours') else [],
                    "timestamp": r.created_at.isoformat() if r.created_at else ""
                } for r in result]), 200

            history = AIChatHistory.query.filter_by(user_id=user_id).order_by(AIChatHistory.created_at.asc()).limit(20).all()
        
        return jsonify([{
            "sender_id": "AI" if m.role == 'assistant' else m.user_id,
            "content": m.content,
            "tours": m.tours,
            "timestamp": m.created_at.isoformat() if m.created_at else ""
        } for m in history]), 200

    except Exception:
        return jsonify([]), 200


# 🛡️ Giữ lại 1 hàm lấy lịch sử Chat trực tiếp duy nhất ở đây (đã lọc trùng)
@chat_bp.route('/messages/<string:partner_id>', methods=['GET'])
@jwt_required()
def get_full_chat_history(partner_id):
    current_user_id = get_jwt_identity()
    try:
        my_id = str(current_user_id)
        p_id = str(partner_id)

        cond1 = f"and(sender_id.eq.{my_id},receiver_id.eq.{p_id})"
        cond2 = f"and(sender_id.eq.{p_id},receiver_id.eq.{my_id})"
        
        response = supabase.table("messages").select("*").or_(f"{cond1},{cond2}").order("timestamp", desc=False).execute()
        messages = response.data if response.data else []

        supabase.table("messages").update({"is_read": True}).eq("sender_id", p_id).eq("receiver_id", my_id).execute()

        return jsonify([{
            "id": msg.get('id'),
            "sender_id": str(msg.get('sender_id')),
            "receiver_id": str(msg.get('receiver_id')),
            "content": msg.get('content', ''),
            "timestamp": msg.get('created_at') or msg.get('timestamp') or ""
        } for msg in messages]), 200
    except Exception as e:
        print(f"Lỗi bốc lịch sử chat: {e}")
        return jsonify({"error": str(e)}), 500

    
@chat_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    data = request.get_json()
    sender_id = str(get_jwt_identity())
    receiver_id = str(data.get('receiver_id'))
    content = data.get('content')

    if not content:
        return jsonify({'error': 'Nội dung trống'}), 400

    try:
        res = supabase.table('messages').insert({
            "sender_id": str(sender_id),
            "receiver_id": str(receiver_id),
            "content": content,
            "is_read": False,
            "timestamp": datetime.utcnow().isoformat()
        }).execute()

        inserted = res.data[0]

        return jsonify({
            'status': 'success',
            'data': {
                'id': inserted['id'],
                'sender_id': inserted['sender_id'],
                'receiver_id': inserted['receiver_id'],
                'content': inserted['content'],
                'timestamp': inserted['timestamp']
            }
        }), 201
    except Exception as e:
        print("Supabase send error:", str(e))
        return jsonify({'error': str(e)}), 500