from flask import Blueprint, request, jsonify
from app.extensions import db, socketio
from app.models.user import User
from app.models.chat import Message, AIChatHistory
from app.models.tour import Tour
from app.models.log import SearchLog
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from datetime import datetime
from app.services.recommendation_service import get_popular_tours 
import requests 
import re
import json

chat_bp = Blueprint('chat', __name__)

def detect_intent(message):
    msg = message.lower()
    intent = {
        "sea": "biển" in msg,
        "mountain": "núi" in msg,
        "family": "gia đình" in msg
    }
    budget_match = re.search(r'(\d+)\s*triệu', msg)
    budget = None
    if budget_match:
        budget = int(budget_match.group(1)) * 1000000
    return intent, budget

def filter_tours(intent, budget):
    query = Tour.query.filter_by(status='approved')
    if intent["sea"]:
        query = query.filter(Tour.description.ilike("%biển%"))
    if intent["mountain"]:
        query = query.filter(or_(Tour.location.ilike("%núi%"), Tour.description.ilike("%núi%")))
    if budget:
        query = query.filter(Tour.price <= budget)
    return query.all()

def ensure_minimum_tours(tours, min_count=3):
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

OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

@chat_bp.route('/partners', methods=['GET'])
@jwt_required()
def get_chat_partners():
    current_user_id = get_jwt_identity()

    try:
        messages = Message.query.filter(
            or_(
                Message.sender_id == current_user_id,
                Message.receiver_id == current_user_id
            )
        ).all()

        partner_ids = set()
        for msg in messages:
            if msg.sender_id == current_user_id:
                partner_ids.add(msg.receiver_id)
            else:
                partner_ids.add(msg.sender_id)

        partners = []
        for pid in partner_ids:
            user = User.query.get(pid)
            if user:
                last_msg = Message.query.filter(
                    or_(
                        (Message.sender_id == current_user_id) & (Message.receiver_id == pid),
                        (Message.sender_id == pid) & (Message.receiver_id == current_user_id)
                    )
                ).order_by(Message.timestamp.desc()).first()

                role_display = "Hướng dẫn viên" if user.role.value == 'guide' else "Khách hàng"

                partners.append({
                    "id": user.id,
                    "name": user.full_name,
                    "role": role_display,
                    "lastMessage": last_msg.content if last_msg else ""
                })

        return jsonify(partners), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================================
# 2. API Chat với AI
# ================================
@chat_bp.route('/ai', methods=['POST'])
def chat_with_ai():
    data = request.get_json()
    user_message = data.get('message')
    user_id = data.get('user_id')
    session_id = data.get('session_id') # Phải lấy cái này để lọc lịch sử

    if not user_message:
        return jsonify({"reply": "Bạn chưa nhập tin nhắn."}), 400

    try:
        user_history = AIChatHistory(
            user_id=user_id,
            session_id=session_id,
            role='user',
            content=user_message
        )
        db.session.add(user_history)
        db.session.commit()

        # --- B1: LƯU LOG ---
        if user_id:
            db.session.add(SearchLog(
                user_id=user_id,
                keyword=user_message,
                searched_at=datetime.utcnow()
            ))
            db.session.commit()

        # --- B2: LẤY USER INFO ---
        user_info = "Khách vãng lai"
        if user_id:
            user = User.query.get(user_id)
            if user:
                user_info = f"Tên: {user.full_name}"

        # --- B3: HYBRID RECOMMENDATION ---
        intent, budget = detect_intent(user_message)

        filtered_tours = filter_tours(intent, budget)

        final_tours = ensure_minimum_tours(filtered_tours, min_count=3)

        # --- B4: TẠO CONTEXT CHO AI ---
        tour_context = ""
        for t in final_tours:
            tour_context += f"- ID {t.id}: {t.name} ({t.price} VNĐ) - {t.description[:120]}...\n"

        system_prompt = f"""
        Bạn là AI tư vấn du lịch chuyên nghiệp.
        Thông tin khách: {user_info}

        Danh sách tour phù hợp:
        {tour_context}

        Hãy:
        - Viết câu trả lời thân thiện.
        - Giải thích vì sao tour phù hợp.
        - Trả về JSON với format:

        {{
            "reply": "Câu trả lời",
            "tour_ids": [id1, id2]
        }}
        """

        payload = {
            "model": MODEL_NAME,
            "prompt": f"{system_prompt}\n\nKhách hỏi: {user_message}",
            "stream": False,
            "format": "json"
        }

        response = requests.post(OLLAMA_API_URL, json=payload)
        result = response.json()

        ai_response_content = result.get('response', '')

        try:
            parsed_json = json.loads(ai_response_content)
            reply_text = parsed_json.get('reply', '')
            suggested_ids = parsed_json.get('tour_ids', [])
        except:
            reply_text = ai_response_content
            suggested_ids = []

        # --- B5: LẤY DATA TOUR ---
        suggested_tours_data = []
        if suggested_ids:
            valid_ids = {t.id for t in final_tours}
            safe_ids = [i for i in suggested_ids if i in valid_ids]

            tours_db = Tour.query.filter(Tour.id.in_(safe_ids)).all()
            for t in tours_db:
                suggested_tours_data.append({
                    "id": t.id,
                    "name": t.name,
                    "price": t.price,
                    "image": t.image
                })

        ai_history = AIChatHistory(
            user_id=user_id,
            session_id=session_id,
            role='assistant',
            content=reply_text, # reply_text lấy từ kết quả Ollama
            tours=suggested_tours_data
        )
        db.session.add(ai_history)
        db.session.commit()

        return jsonify({
            "reply": reply_text,
            "suggested_tours": suggested_tours_data
        }), 200

    except Exception as e:
        print(f"Ollama Error: {e}")
        return jsonify({"reply": "Xin lỗi, hệ thống AI đang bảo trì."}), 500

@chat_bp.route('/messages/<int:partner_id>', methods=['GET'])
@jwt_required()
def get_full_chat_history(partner_id):
    current_user_id = int(get_jwt_identity())
    try:
        messages = Message.query.filter(
            or_(
                (Message.sender_id == current_user_id) & (Message.receiver_id == partner_id),
                (Message.sender_id == partner_id) & (Message.receiver_id == current_user_id)
            )
        ).order_by(Message.timestamp.asc()).all()
        result = [{
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "is_read": msg.is_read,
            "timestamp": msg.timestamp.isoformat()
        } for msg in messages]
        Message.query.filter(Message.sender_id == partner_id, Message.receiver_id == current_user_id).update({"is_read": True})
        db.session.commit()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    current_user_id = int(get_jwt_identity()) # ID người gửi lấy từ Token
    data = request.get_json()
    try:
        receiver_id = int(data.get('receiver_id')) # ID người nhận lấy từ request
        content = data.get('content')
    except:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    if not content or receiver_id == current_user_id:
        return jsonify({"error": "Nội dung hoặc người nhận không hợp lệ"}), 400

    # QUAN TRỌNG: Kiểm tra nếu tự nhắn cho mình (để debug)
    if receiver_id == current_user_id:
        return jsonify({"error": "Không thể tự gửi cho chính mình"}), 400

    try:
        new_msg = Message(
            sender_id=current_user_id,
            receiver_id=receiver_id,
            content=content,
            timestamp=datetime.utcnow()
        )
        db.session.add(new_msg)
        db.session.commit()

        # Dữ liệu bắn qua Socket phải đầy đủ để Frontend không cần load lại
        socket_data = {
            'id': new_msg.id,
            'sender_id': current_user_id,
            'receiver_id': receiver_id,
            'content': content,
            'timestamp': new_msg.timestamp.isoformat()
        }
        
        # Gửi đến phòng của người nhận
        socketio.emit('receive_message', socket_data, room=f"user_{receiver_id}")
        
        return jsonify({"msg": "Đã gửi", "data": socket_data}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    # API Lấy lịch sử AI theo Session
@chat_bp.route('/ai/history', methods=['GET'])
def get_ai_history():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify([]), 200
    
    # Truy vấn bằng SQLAlchemy để khớp với lúc lưu
    history = AIChatHistory.query.filter_by(session_id=session_id)\
        .order_by(AIChatHistory.created_at.asc()).all()
    
    return jsonify([{
        "sender_id": "AI" if m.role == 'assistant' else m.user_id,
        "content": m.content,
        "tours": m.tours
    } for m in history]), 200