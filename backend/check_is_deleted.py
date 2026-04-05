from app import create_app, db
from app.models.user import User
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('users')]
    print("Columns in users table:", columns)
    if 'is_deleted' in columns:
        print("SUCCESS: is_deleted column exists.")
    else:
        print("MISSING: is_deleted column does not exist.")
