# backend/seed_data.py
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole # Import đúng đường dẫn
from app.models.tour import Tour          # Import thêm Tour

app = create_app()

with app.app_context():
    # 1. Reset Database
    db.drop_all()
    db.create_all()
    print("  Đã xóa và tạo lại bảng mới.")

    # 2. Tạo User
    admin = User(email="admin@test.com", full_name="Admin Boss", role=UserRole.ADMIN)
    admin.set_password("123456")

    supplier = User(email="supplier@test.com", full_name="Vinpearl Travel", role=UserRole.SUPPLIER)
    supplier.set_password("123456")

    customer = User(email="khach@test.com", full_name="Nguyen Van Khach", role=UserRole.CUSTOMER)
    customer.set_password("123456")
    
    # User Guide (nếu cần)
    guide = User(email="guide@test.com", full_name="Mr. Guide", role=UserRole.GUIDE)
    guide.set_password("123456")

    db.session.add_all([admin, supplier, customer, guide])
    db.session.commit()
    print("✅ Đã tạo 4 Users (Pass: 123456)")

    # 3. Tạo Tour giả (QUAN TRỌNG ĐỂ TEST)
    # Tour 1: Đang chờ duyệt (Pending)
    tour_pending = Tour(
        name="Tour Săn Mây Đà Lạt",
        price=1500000,
        description="Đi sớm săn mây, uống cà phê...",
        status='pending',
        supplier_id=supplier.id
    )

    # Tour 2: Cũng đang chờ duyệt
    tour_pending_2 = Tour(
        name="Tour Lặn Biển Nha Trang",
        price=2000000,
        description="Ngắm san hô tuyệt đẹp",
        status='pending',
        supplier_id=supplier.id
    )

    # Tour 3: Đã duyệt (Approved) - cái này sẽ KHÔNG hiện ở trang duyệt
    tour_approved = Tour(
        name="Tour Phố Cổ Hội An",
        price=500000,
        status='approved',
        supplier_id=supplier.id
    )

    db.session.add_all([tour_pending, tour_pending_2, tour_approved])
    db.session.commit()
    print("✅ Đã tạo 2 Tour Pending và 1 Tour Approved.")