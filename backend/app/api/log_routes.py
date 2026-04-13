# backend/app/api/log_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.log import TourViewLog, SearchLog, UserLog
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

log_bp = Blueprint('log', __name__)

def get_current_user_id_safe():
    try:
        verify_jwt_in_request(optional=True) 
        return get_jwt_identity() 
    except Exception:
        return None 

def log_user_action(user_id, action, target_id=None, details=None):
    if not user_id: return 
    try:
        log = UserLog(
            user_id=user_id,
            action=action,
            target_id=target_id,
            details=details
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Lỗi ghi UserLog: {e}")

# API Ghi nhận Xem Tour
@log_bp.route('/view', methods=['POST'])
def log_view_tour():
    data = request.get_json()
    tour_id = data.get('tour_id')
    user_id = get_current_user_id_safe()

    if not tour_id:
        return jsonify({"msg": "Missing tour_id"}), 400

    # Ghi vào TourViewLog
    new_view = TourViewLog(user_id=user_id, tour_id=tour_id)
    db.session.add(new_view)
    
    # Đồng thời ghi vào UserLog
    if user_id:
        log_user_action(user_id, "view_tour", tour_id, f"Người dùng xem chi tiết tour ID: {tour_id}")
    
    db.session.commit()
    return jsonify({"msg": "View logged"}), 201

# API Ghi nhận Tìm kiếm
@log_bp.route('/search', methods=['POST'])
def log_search():
    data = request.get_json()
    keyword = data.get('keyword')
    if not keyword: return jsonify({"msg": "Missing keyword"}), 400

    user_id = get_current_user_id_safe()
    new_search = SearchLog(user_id=user_id, keyword=keyword)
    db.session.add(new_search)
    
    if user_id:
        log_user_action(user_id, "search", None, f"Tìm kiếm từ khóa: {keyword}")
        
    db.session.commit()
    return jsonify({"msg": "Search logged"}), 201