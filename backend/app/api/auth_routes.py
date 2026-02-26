# backend/app/api/auth_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import User, UserRole
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

# 1. API ĐĂNG KÝ (Register)
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Kiểm tra dữ liệu
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Vui lòng nhập email và mật khẩu!"}), 400
    
    # Kiểm tra trùng email
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email này đã được sử dụng!"}), 409
    
    # Xử lý Role (Mặc định là Customer)
    role_str = data.get('role', 'customer')
    try:
        role_enum = UserRole[role_str.upper()]
    except:
        role_enum = UserRole.CUSTOMER

    # Tạo user mới
    new_user = User(
        email=data['email'],
        full_name=data.get('full_name', 'No Name'),
        role=role_enum
    )
    new_user.set_password(data['password'])
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"msg": "Đăng ký thành công!", "email": new_user.email}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Lỗi server: {str(e)}"}), 500

# 2. API ĐĂNG NHẬP (Login)
# backend/app/api/auth_routes.py

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"msg": "Vui lòng nhập đầy đủ email và mật khẩu"}), 400

        # Tìm user trong database
        user = User.query.filter_by(email=email).first()

        # BƯỚC QUAN TRỌNG: Kiểm tra xem user có tồn tại hay không trước khi check pass
        if user is None:
            return jsonify({"msg": "Email không tồn tại!"}), 401

        # Kiểm tra mật khẩu (Sử dụng cách so sánh trực tiếp của bạn)
        if user.password_hash == password:
            # Tạo Token
            token = create_access_token(
                identity=str(user.id), 
                additional_claims={"role": user.role.value}
            )
            
            return jsonify({
                "msg": "Đăng nhập thành công",
                "access_token": token,
                "user_id": user.id,
                "user_info": {
                    "id": user.id,
                    "name": user.full_name,
                    "role": user.role.value
                }
            }), 200
        else:
            return jsonify({"msg": "Mật khẩu không chính xác!"}), 401

    except Exception as e:
        print(f"Lỗi hệ thống: {str(e)}")
        return jsonify({"msg": "Đã xảy ra lỗi hệ thống trên Server"}), 500