from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment
from app.models.order import Order, Payment
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash
import os

supplier_bp = Blueprint('supplier_bp', __name__)

# --- QUẢN LÝ TOUR ---

@supplier_bp.route('/tours', methods=['GET'])
@jwt_required()
def get_my_tours():
    sid = get_jwt_identity()
    tours = Tour.query.filter_by(supplier_id=sid).all()
    
    result = []
    for t in tours:
        guide_name = "Chưa phân công"
        guide_id = None
        
        if t.guide_assignments: 
            assignment = t.guide_assignments[0] 
            guide = TourGuide.query.get(assignment.guide_id)
            if guide:
                guide_name = guide.full_name
                guide_id = guide.id

        result.append({
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "quantity": t.quantity,  
            "status": t.status,
            "image": t.image,
            "guide_name": guide_name,
            "guide_id": guide_id,
            "itinerary": t.itinerary,
            "description": t.description
        })
    return jsonify(result), 200

@supplier_bp.route('/tours', methods=['POST'])
@jwt_required()
def create_tour():
    sid = get_jwt_identity()
    data = request.get_json()
    try:
        new_tour = Tour(
            name=data.get('name'),
            description=data.get('description'),
            itinerary=data.get('itinerary'),
            price=data.get('price'),
            quantity=data.get('quantity', 20),
            supplier_id=sid,
            status='pending',
            image=data.get('image')
        )
        db.session.add(new_tour)
        db.session.flush()
        
        guide_id = data.get('guide_id')
        if guide_id:
            assignment = TourGuideAssignment(tour_id=new_tour.id, guide_id=guide_id)
            db.session.add(assignment)
            
        db.session.commit()
        return jsonify({"message": "Tạo tour thành công, đang chờ duyệt"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- QUẢN LÝ HƯỚNG DẪN VIÊN ---

@supplier_bp.route('/guides', methods=['GET'])
@jwt_required()
def get_my_guides():
    sid = get_jwt_identity()
    guides = TourGuide.query.filter_by(supplier_id=sid).all()
    return jsonify([g.to_dict() for g in guides]), 200

# Lấy danh sách HDV tự do (chưa có chủ quản) - Gộp từ nhánh Na
@supplier_bp.route('/pending-guides', methods=['GET'])
@jwt_required()
def get_pending_guides():
    guides_query = db.session.query(User).outerjoin(TourGuide, User.id == TourGuide.user_id)\
        .filter(User.role == UserRole.GUIDE)\
        .filter(TourGuide.supplier_id == None).all()
        
    result = []
    for user in guides_query:
        tg = TourGuide.query.filter_by(user_id=user.id).first()
        status = tg.status.value if tg and hasattr(tg.status, 'value') else "Chưa có hồ sơ"
        
        result.append({
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone or "Chưa cập nhật",
            "status": status
        })
    return jsonify(result), 200

# Duyệt HDV vào hệ thống của nhà cung cấp - Gộp từ nhánh Na
@supplier_bp.route('/approve-guide/<int:guide_user_id>', methods=['POST'])
@jwt_required()
def approve_guide(guide_user_id):
    sid = int(get_jwt_identity())
    user = User.query.get(guide_user_id)
    if not user or user.role != UserRole.GUIDE:
        return jsonify({"msg": "Không tìm thấy hướng dẫn viên hợp lệ"}), 404
        
    guide = TourGuide.query.filter_by(user_id=guide_user_id).first()
    try:
        if guide:
            if guide.supplier_id:
                return jsonify({"msg": "Hướng dẫn viên này đã thuộc nhà cung cấp khác!"}), 400
            guide.supplier_id = sid
            guide.status = 'AVAILABLE'
        else:
            guide = TourGuide(user_id=user.id, supplier_id=sid, full_name=user.full_name, status='AVAILABLE')
            db.session.add(guide)
            
        db.session.commit()
        return jsonify({"msg": "Đã duyệt hướng dẫn viên thành công!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- BÁO CÁO DOANH THU ---

@supplier_bp.route('/revenue/summary', methods=['GET'])
@jwt_required()
def get_revenue_summary():
    sid = get_jwt_identity()
    user = User.query.get(sid)
    
    stats = db.session.query(
        func.count(Order.id).label('total_orders'),
        func.sum(Payment.amount).label('total_revenue')
    ).join(Payment, Order.id == Payment.order_id)\
     .join(Tour, Order.tour_id == Tour.id)\
     .filter(Tour.supplier_id == sid)\
     .filter(Payment.status == 'success')\
     .first()

    total_revenue = stats.total_revenue or 0
    admin_commission = total_revenue * 0.15
    supplier_revenue = total_revenue * 0.85
    # Lấy số dư thực tế từ bảng User (Gộp từ nhánh Na)
    available_balance = getattr(user, 'balance', 0.0) if user else 0.0

    return jsonify({
        'total_revenue': total_revenue,       
        'admin_commission': admin_commission, 
        'supplier_revenue': supplier_revenue, 
        'available_balance': available_balance,
        'total_orders': stats.total_orders or 0
    }), 200