# backend/app/models/tour_guide.py
from app.extensions import db
from datetime import datetime
from enum import Enum

class GuideStatus(Enum): # trạng thái hdv
    AVAILABLE = 'AVAILABLE'    # Trống lịch
    BUSY = 'BUSY'             # Bận lịch
    ON_LEAVE = 'ON_LEAVE'     # Tạm nghỉ

class TourGuide(db.Model):
    __tablename__ = 'tour_guides'
    
    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Thông tin cá nhân
    full_name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    
    # Chứng chỉ và kinh nghiệm
    license_number = db.Column(db.String(50))  # Số thẻ HDV
    years_of_experience = db.Column(db.Integer, default=0)
    languages = db.Column(db.String(200))  # VD: "Vietnamese, English, Chinese"
    specialties = db.Column(db.Text)  # VD: "Mountain trekking, Cultural tours"
    
    # Trạng thái làm việc
    status = db.Column(
    db.Enum(GuideStatus, values_callable=lambda x: [e.value for e in x]),
    default=GuideStatus.AVAILABLE.value,
    nullable=False
)

    
   
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    supplier = db.relationship('User', backref='tour_guides')
    assignments = db.relationship('TourGuideAssignment', backref='guide', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'supplier_id': self.supplier_id,
            'full_name': self.full_name,
            'phone': self.phone,
            'email': self.email,
            'license_number': self.license_number,
            'years_of_experience': self.years_of_experience,
            'languages': self.languages,
            'specialties': self.specialties,
            'status': self.status if isinstance(self.status, str) else self.status.value,

            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
        }


class TourGuideAssignment(db.Model):
    """Bảng phân công HDV cho tour cụ thể"""
    __tablename__ = 'tour_guide_assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    guide_id = db.Column(db.Integer, db.ForeignKey('tour_guides.id'), nullable=False)
    assigned_date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)  # Ghi chú về phân công(vd: đón khách tại sb,..)
    
    # Relationships(truy xuất dl)
    tour = db.relationship('Tour', back_populates='guide_assignments')
    
    def to_dict(self):   
        return {
            'id': self.id,
            'tour_id': self.tour_id,
            'guide_id': self.guide_id,
            'assigned_date': self.assigned_date.isoformat() if self.assigned_date else None,
            'notes': self.notes
        }