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

# --- UTILS ---
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

# --- ROUTES ---

@chat_bp.route('/partners', methods=['GET'])
@jwt_required()
def get_chat_partners():
    current_user_id = get_jwt_identity()
    try:
        messages = Message.query.filter(
            or_(Message.sender_id == current_user_id, Message.receiver_id == current_user_id)
        ).all()

        partner_ids = {msg.receiver_id if msg.sender_id == current_user_id else msg.sender_id for msg in messages}
        
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

@chat_bp.route('/ai', methods=['POST'])
def chat_with_ai():
    data = request.get_json()
    user_message = data.get('message')
    user_id = data.get('user_id')
    session_id = data.get('session_id') 

    if not user_message:
        return jsonify({"reply": "Bạn chưa nhập tin nhắn."}), 400

    try:
        # Lưu lịch sử tin nhắn của User
        user_history = AIChatHistory(
            user_id=user_id,
            session_id=session_id,
            role='user',
            content=user_message
        )
        db.session.add(user_history)

        # Lưu log tìm kiếm
        if user_id:
            db.session.add(SearchLog(user_id=user_id, keyword=user_message))
        
        db.session.commit()

        # Hybrid Recommendation logic
        intent, budget = detect_intent(user_message)
        filtered_tours = filter_tours(intent, budget)
        final_tours = ensure_minimum_tours(filtered_tours, min_count=3)

        tour_context = "".join([f"- ID {t.id}: {t.name} ({t.price} VNĐ)\n" for t in final_tours])

        system_prompt = f"Bạn là AI tư vấn du lịch. Danh sách tour: \n{tour_context}\nTrả về JSON {{'reply': '...', 'tour_ids': []}}"

        payload = {
            "model": MODEL_NAME,
            "prompt": f"{system_prompt}\n\nKhách: {user_message}",
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

        # Lấy data tour chi tiết
        suggested_tours_data = []
        if suggested_ids:
            tours_db = Tour.query.filter(Tour.id.in_(suggested_ids)).all()
            suggested_tours_data = [{"id": t.id, "name": t.name, "price": t.price, "image": t.image} for t in tours_db]

        # Lưu lịch sử tin nhắn của AI
        ai_history = AIChatHistory(
            user_id=user_id,
            session_id=session_id,
            role='assistant',
            content=reply_text,
            tours=suggested_tours_data
        )
        db.session.add(ai_history)
        db.session.commit()

        return jsonify({"reply": reply_text, "suggested_tours": suggested_tours_data}), 200

    except Exception as e:
        print(f"Ollama Error: {e}")
        return jsonify({"reply": "Xin lỗi, hệ thống AI đang bảo trì."}), 500

@chat_bp.route('/ai/history', methods=['GET'])
def get_ai_history():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify([]), 200
    
    history = AIChatHistory.query.filter_by(session_id=session_id).order_by(AIChatHistory.created_at.asc()).all()
    return jsonify([{
        "sender_id": "AI" if m.role == 'assistant' else m.user_id,
        "content": m.content,
        "tours": m.tours
    } for m in history]), 200

@chat_bp.route('/messages/<int:partner_id>', methods=['GET'])
@jwt_required()
def get_full_chat_history(partner_id):
    current_user_id = int(get_jwt_identity())
    messages = Message.query.filter(
        or_(
            (Message.sender_id == current_user_id) & (Message.receiver_id == partner_id),
            (Message.sender_id == partner_id) & (Message.receiver_id == current_user_id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    Message.query.filter(Message.sender_id == partner_id, Message.receiver_id == current_user_id).update({"is_read": True})
    db.session.commit()
    
    return jsonify([{
        "id": msg.id,
        "sender_id": msg.sender_id,
        "content": msg.content,
        "timestamp": msg.timestamp.isoformat()
    } for msg in messages]), 200

@chat_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    receiver_id = int(data.get('receiver_id'))
    content = data.get('content')

    if not content or receiver_id == current_user_id:
        return jsonify({"error": "Nội dung không hợp lệ"}), 400

    new_msg = Message(sender_id=current_user_id, receiver_id=receiver_id, content=content)
    db.session.add(new_msg)
    db.session.commit()

    socket_data = {
        'id': new_msg.id,
        'sender_id': current_user_id,
        'receiver_id': receiver_id,
        'content': content,
        'timestamp': datetime.utcnow().isoformat()
    }
    socketio.emit('receive_message', socket_data, room=f"user_{receiver_id}")
    return jsonify({"msg": "Đã gửi", "data": socket_data}), 201