import os
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    cmds = [
        "ALTER TABLE tour_guides ADD COLUMN is_approved BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE tour_guides ADD COLUMN request_at TIMESTAMP;",
        "ALTER TABLE tour_guides ADD COLUMN old_status VARCHAR(50);"
    ]
    for cmd in cmds:
        try:
            db.session.execute(text(cmd))
            db.session.commit()
            print(f"Success: {cmd}")
        except Exception as e:
            db.session.rollback()
            print(f"Error on {cmd}: {e}")
