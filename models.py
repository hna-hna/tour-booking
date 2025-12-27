from extensions import db
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
    phone = db.Column(db.String(20), nullable=True) 
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Hàm mã hóa mật khẩu
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Hàm kiểm tra mật khẩu
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# 2. Bảng ORDERS (Đơn hàng)
class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tour_id = db.Column(db.Integer, nullable=False) 
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, paid, completed, cancelled
    guest_count = db.Column(db.Integer, nullable=False)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow)

# 3. Bảng PAYMENTS (Thanh toán)
class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100))
    status = db.Column(db.String(20)) # success, failed
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)