# profile_routes.py
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
    
    # Tìm user trong db
    user = db.session.get(User, current_user_id) 
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value, # Lấy giá trị chuỗi của Enum
        "phone": getattr(user, 'phone', '') # An toàn nếu chưa có sđt
    }), 200

# 2. CẬP NHẬT THÔNG TIN (PUT)
@profile_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_my_profile():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    data = request.get_json()
    
    # Chỉ cho phép sửa Tên và SĐT
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'phone' in data:
        user.phone = data['phone']
        
    try:
        db.session.commit()
        return jsonify({
            "msg": "Cập nhật thành công",
            "user": {
                "full_name": user.full_name,
                "phone": user.phone
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500