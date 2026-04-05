from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        # Thêm cột is_deleted vào bảng users
        db.session.execute(text("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;"))
        db.session.commit()
        print("SQL SUCCESS: Added is_deleted to users table")
    except Exception as e:
        print("SQL ERROR/EXISTS:", str(e))
