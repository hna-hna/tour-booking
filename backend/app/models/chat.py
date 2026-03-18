# backend/app/models/chat.py
from app.extensions import db
from datetime import datetime

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # người gửi
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # người nhận
    content = db.Column(db.Text, nullable=False) # nội dung tin nhắn
    is_read = db.Column(db.Boolean, default=False) # trạng tahis xem 
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    