from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE tours ADD COLUMN reject_reason TEXT;"))
        db.session.commit()
        print("SQL SUCCESS: Added reject_reason")
    except Exception as e:
        print("SQL ERROR/EXISTS:", str(e))
