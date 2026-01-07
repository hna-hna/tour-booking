# backend/app/models/log.py
from app.extensions import db
from datetime import datetime

# 6. Bảng Logging chung (Ghi lại thao tác hệ thống - System Logs)
class Logging(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# 7. Bảng Log xem Tour (Dữ liệu đầu vào quan trọng cho AI gợi ý)
class TourViewLog(db.Model):
    __tablename__ = 'tour_view_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Nullable cho khách vãng lai
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)

# 8. Bảng Log Tìm kiếm (Dữ liệu để AI hiểu nhu cầu khách)
class SearchLog(db.Model):
    __tablename__ = 'search_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    keyword = db.Column(db.String(200), nullable=False) # VD: "Đà Lạt", "Biển"
    searched_at = db.Column(db.DateTime, default=datetime.utcnow)