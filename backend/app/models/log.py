
# backend/app/models/log.py
from app.extensions import db
from datetime import datetime
#log lưu lịch sử của ng dùng 
class UserLog(db.Model):
    __tablename__ = 'user_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


# bảng Log xem Tour (dữ liệu đầu vào cho AI gợi ý)
class TourViewLog(db.Model):
    __tablename__ = 'tour_view_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    viewed_at = db.Column(db.DateTime, default=datetime.utcnow)

#bảng Log Tìm kiếm (dữ liệu để AI hiểu nhu cầu khách)
class SearchLog(db.Model):
    __tablename__ = 'search_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    keyword = db.Column(db.String(200), nullable=False) 
    searched_at = db.Column(db.DateTime, default=datetime.utcnow)