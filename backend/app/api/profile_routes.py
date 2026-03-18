#backend/app/api/profile_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User

profile_bp = Blueprint('profile', __name__)

# 1. LẤY THÔNG TIN (GET)
@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id) 
    
    if not user:
        return jsonify({"error": "Không tìm thấy người dùng"}), 404
    
    # Tối ưu: Dùng "or" để xử lý trường hợp Database lưu Null -> Trả về chuỗi rỗng "" cho Frontend dễ hiển thị
    return jsonify({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        # Lấy value của Enum an toàn
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "phone": user.phone or "",      
        "address": user.address or "",
        "avatar": user.avatar or ""
    }), 200

# 2. CẬP NHẬT THÔNG TIN (PUT)
@profile_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_my_profile():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({"error": "Không tìm thấy người dùng"}), 404
        
    data = request.get_json()
    
    # --- CÁC ĐIỂM SỬA ĐỔI ---
    
    # 1. Validate Tên: Không cho phép đổi tên thành rỗng
    if 'full_name' in data:
        new_name = data['full_name'].strip()
        if not new_name:
            return jsonify({"error": "Họ tên không được để trống"}), 400
        user.full_name = new_name

    # 2. Cập nhật các trường khác (Cho phép rỗng)
    if 'phone' in data:
        user.phone = data['phone']
        
    if 'address' in data: 
        user.address = data['address']
        
    if 'avatar' in data:
        user.avatar = data['avatar']
    # ------------------------
        
    try:
        db.session.commit()
        return jsonify({
            "msg": "Cập nhật thành công",
            "user": {
                "full_name": user.full_name,
                "phone": user.phone or "",
                "address": user.address or "",
                "avatar": user.avatar or ""
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        # Log lỗi ra terminal để dễ debug
        print(f"Lỗi Database: {e}")
        return jsonify({"error": "Lỗi hệ thống, không thể lưu dữ liệu"}), 500