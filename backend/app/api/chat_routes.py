# backend/app/api/chat_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.user import User
from app.models.chat import Message
from app.models.tour import Tour
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
import openai
import os

chat_bp = Blueprint('chat', __name__)

# Cấu hình OpenAI Key (Lấy từ biến môi trường .env)
openai.api_key = os.getenv("OPENAI_API_KEY")

# 2. API Lấy danh sách người đã từng chat (Partners)
@chat_bp.route('/partners', methods=['GET'])
@jwt_required()
def get_chat_partners():
    current_user_id = get_jwt_identity()
    
    try:
        # Tìm tất cả tin nhắn mà user là người gửi HOẶC người nhận
        messages = Message.query.filter(
            or_(Message.sender_id == current_user_id, Message.receiver_id == current_user_id)
        ).all()
        
        # Lọc ra tập hợp các ID đối tác (dùng set để loại bỏ trùng lặp)
        partner_ids = set()
        for msg in messages:
            if msg.sender_id == current_user_id:
                partner_ids.add(msg.receiver_id)
            else:
                partner_ids.add(msg.sender_id)
        
        # Lấy thông tin chi tiết của các đối tác từ bảng User
        partners = []
        for pid in partner_ids:
            user = User.query.get(pid)
            if user:
                # Lấy tin nhắn cuối cùng để hiển thị preview
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

# 3. API Chat với AI (OpenAI)
@chat_bp.route('/ai', methods=['POST'])
def chat_with_ai():
    data = request.get_json()
    user_message = data.get('message')
    user_id = data.get('user_id') # Có thể null nếu khách vãng lai
    
    if not user_message:
        return jsonify({"reply": "Bạn chưa nhập tin nhắn."}), 400

    try:
        # A. Lấy thông tin ngữ cảnh (Context)
        
        # 1. Thông tin User
        user_info = "Khách vãng lai"
        if user_id:
            user = User.query.get(user_id)
            if user:
                user_info = f"Tên: {user.full_name}, Email: {user.email}"

        # 2. Thông tin Tour (Lấy 5-10 tour tiêu biểu để AI có dữ liệu trả lời)
        # Lưu ý: Không gửi hết cả nghìn tour vì tốn token và chậm
        tours = Tour.query.filter_by(status='approved').limit(10).all()
        tour_context = ""
        for t in tours:
            tour_context += f"- Tour ID {t.id}: {t.name}, Giá: {t.price} VNĐ, Mô tả: {t.description[:100]}...\n"

        # B. Tạo Prompt (Kịch bản cho AI)
        system_prompt = f"""
        Bạn là Trợ lý ảo chuyên nghiệp của hệ thống đặt tour du lịch 'Tour Booking'.
        
        Thông tin khách hàng đang chat: {user_info}
        
        Dữ liệu các tour hiện có trong hệ thống:
        {tour_context}
        
        Nhiệm vụ của bạn:
        1. Trả lời ngắn gọn, thân thiện, dùng tiếng Việt.
        2. Nếu khách hỏi về tour, hãy dùng dữ liệu ở trên để tư vấn (kèm giá tiền).
        3. Nếu khách hỏi ngoài lề (không liên quan du lịch), hãy khéo léo từ chối.
        4. Luôn khuyến khích khách đặt tour.
        """

        # C. Gọi OpenAI API (Phiên bản mới >= 1.0.0 dùng client)
        # Nếu dùng bản cũ (<1.0.0) thì dùng openai.ChatCompletion.create
        # Ở đây viết theo cách gọi REST API chuẩn hoặc thư viện mới
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo", # Hoặc gpt-4o-mini cho rẻ
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=300
        )

        reply_text = response.choices[0].message['content']
        return jsonify({"reply": reply_text}), 200

    except Exception as e:
        print(f"OpenAI Error: {e}")
        return jsonify({"reply": "Xin lỗi, hiện tại AI đang quá tải. Bạn vui lòng thử lại sau hoặc liên hệ hotline."}), 500
        