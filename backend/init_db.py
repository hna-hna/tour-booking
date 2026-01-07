from app import create_app
from app.extensions import db
# Import các model để Flask  tạo bảng
from app.models import User, Tour, TourViewLog, TourGuideAssignment

app = create_app()
with app.app_context():
    print("Đang khởi tạo database...")
    db.create_all() 
    print("Đã tạo bảng thành công!")