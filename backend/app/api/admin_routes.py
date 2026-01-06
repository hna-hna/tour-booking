from flask import Blueprint, request, jsonify
from extensions import db
from models import Tour, UserRole, User
from flask_jwt_extended import jwt_required, get_jwt_identity

admin_bp = Blueprint('admin', __name__)

# Middleware giả lập check quyền Admin (Hoặc import decorator từ team)
def admin_required(fn):
    # Logic check role admin ở đây (bạn có thể dùng logic team đã làm)
    pass 

# 1. API Lấy danh sách tour đang chờ duyệt (Pending)
@admin_bp.route('/tours/pending', methods=['GET'])
# @jwt_required() 
# @role_required(['admin']) # Nếu team bạn đã có decorator này
def get_pending_tours():
    # Lấy các tour có status = 'pending'
    tours = Tour.query.filter_by(status='pending').all()
    
    result = []
    for t in tours:
        result.append({
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "supplier_id": t.supplier_id,
            "created_at": t.created_at
        })
    return jsonify(result), 200

# 2. API Duyệt hoặc Từ chối Tour
@admin_bp.route('/tours/<int:tour_id>/moderate', methods=['PUT'])
# @jwt_required()
def moderate_tour(tour_id):
    # Body nhận vào: { "action": "approve" } hoặc { "action": "reject" }
    data = request.get_json()
    action = data.get('action')
    
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({"msg": "Tour không tồn tại"}), 404
        
    if action == 'approve':
        tour.status = 'approved'
        msg = "Đã duyệt tour thành công"
    elif action == 'reject':
        tour.status = 'rejected'
        msg = "Đã từ chối tour"
    else:
        return jsonify({"msg": "Hành động không hợp lệ"}), 400
        
    db.session.commit()
    return jsonify({"msg": msg, "status": tour.status}), 200
    