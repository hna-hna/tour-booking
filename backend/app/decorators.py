from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from models import UserRole

def role_required(allowed_roles):
    """
    Hàm này kiểm tra xem người dùng có quyền (role) để vào hay không.
    allowed_roles: Danh sách các vai trò được phép (vd: ['admin', 'supplier'])
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                #Kiểm tra xem có gửi Token kèm theo không
                verify_jwt_in_request()
                
                #Lấy thông tin Role từ trong Token
                claims = get_jwt()
                user_role = claims.get("role")
                
                #kiểm tra Role của user có nằm trong danh sách cho phép không?
                if user_role not in allowed_roles:
                    return jsonify({"msg": "Bạn không có quyền truy cập chức năng này!"}), 403
                    
                return fn(*args, **kwargs)
                
            except Exception as e:
                return jsonify({"msg": "Lỗi xác thực hoặc hết phiên đăng nhập", "error": str(e)}), 401
                
        return decorator
    return wrapper