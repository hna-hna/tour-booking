from app import create_app, db
from app.models.user import User
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        # Check columns
        res = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'"))
        cols = [r[0] for r in res.fetchall()]
        print("COLUMNS:", cols)
        
        # Check users count
        count = User.query.count()
        print("USER COUNT:", count)
        
        if 'is_deleted' not in cols:
            print("ERROR: Column 'is_deleted' is missing!")
            
    except Exception as e:
        print("DB ERROR:", str(e))
