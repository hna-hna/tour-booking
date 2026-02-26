# backend/app/models/tour_guide.py
from app.extensions import db
from datetime import datetime
from enum import Enum

class GuideStatus(Enum): # Trạng thái hướng dẫn viên
    AVAILABLE = 'AVAILABLE'     # Trống lịch
    BUSY = 'BUSY'               # Bận lịch
    ON_LEAVE = 'ON_LEAVE'       # Tạm nghỉ

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
    # assignments dùng 'SupplierGuideAssignment' để khớp với bảng bên dưới
    assignments = db.relationship('SupplierGuideAssignment', backref='guide', lazy='dynamic')
    
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
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }



class SupplierGuideAssignment(db.Model):
    """Bảng phân công HDV cho tour cụ thể (tạo bởi Supplier)"""
    __tablename__ = 'supplier_guide_assignments'
    
    # Đảm bảo không lỗi khi định nghĩa lại bảng trong quá trình migration
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    guide_id = db.Column(db.Integer, db.ForeignKey('tour_guides.id'), nullable=False)
    assigned_date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True) # Ghi chú (vd: đón khách tại sân bay,...)
    status = db.Column(db.String(20), default='pending') # Trạng thái phân công: pending, accepted, rejected, completed

    # Relationships
    # Sử dụng backref='guide_assignments' để tour.guide_assignments có thể truy cập được
    tour = db.relationship('Tour', backref=db.backref('guide_assignments', lazy=True))
    
    def to_dict(self):   
        return {
            'id': self.id,
            'tour_id': self.tour_id,
            'guide_id': self.guide_id,
            'assigned_date': self.assigned_date.isoformat() if self.assigned_date else None,
            'notes': self.notes,
            'status': self.status
        }