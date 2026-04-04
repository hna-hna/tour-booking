from app import create_app
from app.extensions import db
from app.models.tour import Tour

app = create_app()
with app.app_context():
    try:
        t = Tour.query.first()
        if t:
            print("OK, found tour:", t.name, t.reject_reason)
        else:
            print("OK, no tours found.")
    except Exception as e:
        print("FAIL:", str(e))
