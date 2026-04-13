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


class AIChatHistory(db.Model):
    __tablename__ = 'ai_chat_history'
    
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(255), nullable=True)
    session_id = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    tours = db.Column(db.JSON, default=[])
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {
            "sender_id": "AI" if self.role == 'assistant' else self.user_id,
            "content": self.content,
            "tours": self.tours,
            "timestamp": self.created_at.isoformat()
        }
    