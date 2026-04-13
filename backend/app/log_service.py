# backend/app/log_service.py
from app.extensions import db
from app.models.log import UserLog
from flask_jwt_extended import get_jwt_identity
from datetime import datetime


def log_user_action(action: str, target_id=None, details=None, user_id=None):
    """
    Ghi log hành vi người dùng
    - action: ví dụ 'login', 'view_tour', 'create_order', 'chat_ai', ...
    - target_id: ID của đối tượng liên quan (tour_id, order_id, ...)
    - details: Thông tin bổ sung (JSON string hoặc text)
    - user_id: Nếu truyền vào (dùng cho guest), không truyền sẽ lấy từ JWT
    """
    try:
        if user_id is None:
            user_id = get_jwt_identity()

        log_entry = UserLog(
            user_id=user_id,
            action=action,
            target_id=target_id,
            details=details,
            timestamp=datetime.utcnow()
        )
        db.session.add(log_entry)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"[LOG ERROR] Không thể ghi log {action}: {e}")
        return False