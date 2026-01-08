# backend/app/api/log_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.log import TourViewLog, SearchLog, UserLog
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

log_bp = Blueprint('log', __name__)

def get_current_user_id_safe():
    try:
        verify_jwt_in_request(optional=True) # kiểm tra token 
        return get_jwt_identity() #trả về id
    except Exception:
        return None # Khách vãng lai

# 1. API Ghi nhận khách vừa xem 1 tour (View Log)
@log_bp.route('/view', methods=['POST'])
def log_view_tour():
    try:
        data = request.get_json()
        tour_id = data.get('tour_id')

        if not tour_id:
            return jsonify({"msg": "Missing tour_id"}), 400

        user_id = get_current_user_id_safe()

        # Lưu vào DB
        new_log = TourViewLog(user_id=user_id, tour_id=tour_id)
        db.session.add(new_log)
        db.session.commit()
        
        return jsonify({"msg": "View logged successfully"}), 201
        
    except Exception as e:
        db.session.rollback() 
        print(f"Error logging view: {e}")
        return jsonify({"msg": "Failed to log view"}), 500

# 2. API Ghi nhận khách vừa tìm kiếm (Search Log)
@log_bp.route('/search', methods=['POST'])
def log_search():
    try:
        data = request.get_json()
        keyword = data.get('keyword')

        if not keyword or keyword.strip() == "":
            return jsonify({"msg": "Missing keyword"}), 400

        user_id = get_current_user_id_safe()

        new_log = SearchLog(user_id=user_id, keyword=keyword)
        db.session.add(new_log)
        db.session.commit()
        
        return jsonify({"msg": "Search logged successfully"}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error logging search: {e}")
        return jsonify({"msg": "Failed to log search"}), 500
