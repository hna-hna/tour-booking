from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    # Tìm user admin theo email
    admin_email = "admin@test.com"  # Thay bằng email admin của bạn
    admin = User.query.filter_by(email=admin_email).first()

    if admin:
        new_password = "admin123"  # Mật khẩu mới bạn muốn đặt
        admin.set_password(new_password)
        db.session.commit()
        print(f"✅ Đã đổi mật khẩu cho Admin ({admin_email}) thành: {new_password}")
    else:
        print("❌ Không tìm thấy user với email này!")