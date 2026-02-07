#backend/app/models/tour.py
from app.extensions import db
from datetime import datetime

class Tour(db.Model):
    __tablename__ = 'tours'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False) 
    image = db.Column(db.String(255), nullable=True)    
    description = db.Column(db.Text)
    itinerary = db.Column(db.Text)
    quantity = db.Column(db.Integer)
    price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending') 
    supplier_id = db.Column(db.Integer, db.ForeignKey('users.id'))    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    start_date = db.Column(db.DateTime, nullable=True) # Ngày đi
    end_date = db.Column(db.DateTime, nullable=True)   # Ngày về
    # Quan hệ với phân công hướng dẫn viên
    assignments = db.relationship('TourGuideAssignment', backref='tour', lazy=True)

#Bảng Phân công hướng dẫn viên
class TourGuideAssignment(db.Model):
    __tablename__ = 'tour_guide_assignments'
    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    guide_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) 
    status = db.Column(db.String(20), default='pending') 
    assigned_date = db.Column(db.DateTime, default=db.func.current_timestamp())

