from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import TourViewLog, SearchLog
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

log_bp = Blueprint('log', __name__)

# 1. API Ghi nhận khách vừa xem 1 tour (View Log)
@log_bp.route('/view', methods=['POST'])
def log_view_tour():
    data = request.get_json()
    tour_id = data.get('tour_id')
    
    user_id = None
    # Cố gắng lấy user_id nếu đã đăng nhập, nếu chưa thì để None
    try:
        verify_jwt_in_request(optional=True) # Kiểm tra token nhưng không bắt buộc
        user_id = get_jwt_identity()
    except:
        pass # Khách vãng lai

    if not tour_id:
        return jsonify({"msg": "Missing tour_id"}), 400

    new_log = TourViewLog(user_id=user_id, tour_id=tour_id)
    db.session.add(new_log)
    db.session.commit()
    
    return jsonify({"msg": "Logged view"}), 200

# 2. API Ghi nhận khách vừa tìm kiếm (Search Log)
@log_bp.route('/search', methods=['POST'])
def log_search():
    data = request.get_json()
    keyword = data.get('keyword')
    
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except:
        pass

    if keyword:
        new_log = SearchLog(user_id=user_id, keyword=keyword)
        db.session.add(new_log)
        db.session.commit()
        
    return jsonify({"msg": "Logged search"}), 200
    