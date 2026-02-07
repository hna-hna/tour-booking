#backend/app/api/auth_routes.py
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
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    # Kiểm tra mật khẩu đúng không
    if user.password_hash == password:
        # Tạo Token (Vé vào cổng), lưu thêm ID và Role vào trong vé
        token = create_access_token(identity=str(user.id), additional_claims={"role": user.role.value})
        
        return jsonify({
            "msg": "Đăng nhập thành công",
            "access_token": token,
            "user_info": {
                "id": user.id,
                "name": user.full_name,
                "role": user.role.value
            }
        }), 200
    
    return jsonify({"msg": "Sai email hoặc mật khẩu!"}), 401