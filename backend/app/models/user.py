from app.extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import enum

# Tạo danh sách các Vai trò (Role)
class UserRole(enum.Enum):
    CUSTOMER = "customer"
    SUPPLIER = "supplier"
    GUIDE = "guide"
    ADMIN = "admin"

# 1. Bảng USERS (Người dùng)
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
# Hàm mã hóa mật khẩu
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Hàm kiểm tra mật khẩu
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
