from app import create_app
from extensions import db
from models import User, UserRole

app = create_app()

with app.app_context():
    # Xóa dữ liệu cũ nếu có để tránh lỗi trùng lặp
    db.drop_all()
    db.create_all()

    print("Đang tạo dữ liệu mẫu...")

    # Tạo 4 user với 4 vai trò
    admin = User(email="admin@test.com", full_name="Admin Boss", role=UserRole.ADMIN)
    admin.set_password("123456")

    guide = User(email="guide@test.com", full_name="Mr. Guide", role=UserRole.GUIDE)
    guide.set_password("123456")

    supplier = User(email="supplier@test.com", full_name="Nha Cung Cap Tour", role=UserRole.SUPPLIER)
    supplier.set_password("123456")

    customer = User(email="khach@test.com", full_name="Nguyen Van Khach", role=UserRole.CUSTOMER)
    customer.set_password("123456")

    db.session.add_all([admin, guide, supplier, customer])
    db.session.commit()
    print(" Đã tạo xong 4 tài khoản: Admin, Guide, Supplier, Customer. Pass: 123456")