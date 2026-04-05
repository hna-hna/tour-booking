from app import create_app, db
from sqlalchemy import text, inspect

app = create_app()
with app.app_context():
    try:
        inspector = inspect(db.engine)
        columns = inspector.get_columns('users')
        for c in columns:
            print(f"Column: {c['name']}, Type: {c['type']}")
    except Exception as e:
        print("DB ERROR:", str(e))
