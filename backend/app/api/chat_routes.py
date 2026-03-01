# backend/app/api/chat_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User
from app.models.chat import Message
from app.models.tour import Tour
from app.models.log import SearchLog
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from datetime import datetime
from app.services.recommendation_service import get_popular_tours 
import requests 
import re
import json
import os

chat_bp = Blueprint('chat', __name__)


def detect_intent(message):
    msg = message.lower()

    intent = {
        "sea": "biển" in msg,
        "mountain": "núi" in msg,
        "family": "gia đình" in msg
    }

    # Detect ngân sách (ví dụ: 3 triệu)
    budget_match = re.search(r'(\d+)\s*triệu', msg)
    budget = None
    if budget_match:
        budget = int(budget_match.group(1)) * 1000000

    return intent, budget


def filter_tours(intent, budget):
    query = Tour.query.filter_by(status='approved')

    if intent["sea"]:
        query = query.filter(
            or_(
                Tour.description.ilike("%biển%")
            )
        )

    if intent["mountain"]:
        query = query.filter(
            or_(
                Tour.location.ilike("%núi%"),
                Tour.description.ilike("%núi%")
            )
        )

    if budget:
        query = query.filter(Tour.price <= budget)

    return query.all()


def ensure_minimum_tours(tours, min_count=3):
    if len(tours) >= min_count:
        return tours

    popular = get_popular_tours(min_count)  # Hàm bạn đã có
    existing_ids = {t.id for t in tours}

    for p in popular:
        if p.id not in existing_ids:
            tours.append(p)
        if len(tours) >= min_count:
            break

    return tours

# Cấu hình ollama
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"
# ================================
# 1. API Lấy danh sách người đã từng chat
# ================================
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

    if not user_message:
        return jsonify({"reply": "Bạn chưa nhập tin nhắn."}), 400

    try:
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

        return jsonify({
            "reply": reply_text,
            "suggested_tours": suggested_tours_data
        }), 200

    except Exception as e:
        print(f"Ollama Error: {e}")
        return jsonify({"reply": "Xin lỗi, hệ thống AI đang bảo trì."}), 500

# =================================
# 3. API Lấy toàn bộ lịch sử chat giữa 2 người
# =================================
@chat_bp.route('/messages/<int:partner_id>', methods=['GET'])
@jwt_required()
def get_full_chat_history(partner_id):
    current_user_id = get_jwt_identity()

    try:
        messages = Message.query.filter(
            or_(
                (Message.sender_id == current_user_id) & (Message.receiver_id == partner_id),
                (Message.sender_id == partner_id) & (Message.receiver_id == current_user_id)
            )
        ).order_by(Message.timestamp.asc()).all()

        result = []

        for msg in messages:
            result.append({
                "id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "content": msg.content,
                "is_read": msg.is_read,
                "timestamp": msg.timestamp.isoformat()
            })

        # Tự động đánh dấu đã đọc
        Message.query.filter(
            Message.sender_id == partner_id,
            Message.receiver_id == current_user_id,
            Message.is_read == False
        ).update({"is_read": True})

        db.session.commit()

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500