# backend/app/api/auth_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import User, UserRole, TourGuide, GuideStatus
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
        db.session.flush()  
        # flush để lấy new_user.id trước khi commit

        # Nếu là GUIDE → tạo profile trong tour_guides
        if role_enum == UserRole.GUIDE:
            guide_profile = TourGuide(
                user_id=new_user.id,
                supplier_id=data.get("supplier_id"),
                full_name=new_user.full_name,
                email=new_user.email,
                status=GuideStatus.AVAILABLE
            )
            db.session.add(guide_profile)

        db.session.commit()

        return jsonify({
            "msg": "Đăng ký thành công!",
            "email": new_user.email
        }), 201

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
        if user.check_password(password):
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

@auth_bp.route('/fix-admin', methods=['GET'])
def fix_admin():
    from app.models.user import User, UserRole
    from app.extensions import db
    admins = User.query.filter_by(role=UserRole.ADMIN).all()
    if not admins:
        try:
            new_admin = User(email="admin@example.com", full_name="System Admin", role=UserRole.ADMIN)
            new_admin.set_password("admin123")
            db.session.add(new_admin)
            db.session.commit()
            return "Đã tạo tài khoản Admin (admin@example.com / admin123)"
        except Exception as e:
            return f"Lỗi tạo admin: {e}"
    else:
        for admin in admins:
            admin.set_password('admin123')
        db.session.commit()
        return "Đã đổi mật khẩu toàn bộ tài khoản Admin hiện có thành: admin123"