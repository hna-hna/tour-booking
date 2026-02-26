# backend/app/api/supplier.py
from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment
from app.models.order import Order, Payment
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_
import os

supplier_bp = Blueprint('supplier_bp', __name__)

# 1. LẤY DANH SÁCH TOUR CỦA TÔI
@supplier_bp.route('/tours', methods=['GET'])
@jwt_required()
def get_my_tours():
    sid = get_jwt_identity()
    tours = Tour.query.filter_by(supplier_id=sid).all()
    
    result = []
    for t in tours:
        guide_name = "Chưa phân công"
        guide_id = None
        
        # Lấy assignment đầu diện để hiển thị tên HDV
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

# 2. CREATE: Tạo Tour mới
@supplier_bp.route('/tours', methods=['POST'])
@jwt_required()
def create_tour():
    sid = get_jwt_identity()
    data = request.get_json()
    try:
        image_url = data.get('image')
        guide_id = data.get('guide_id')

        new_tour = Tour(
            name=data.get('name'),
            description=data.get('description'),
            itinerary=data.get('itinerary'),
            price=data.get('price'),
            quantity=data.get('quantity', 20),
            supplier_id=sid,
            status='pending',
            image=image_url  
        )
        
        db.session.add(new_tour)
        db.session.flush()  # Lấy ID tour để tạo assignment
        
        # Phân công HDV (Nếu có)
        if guide_id:
            assignment = TourGuideAssignment(
                tour_id=new_tour.id,
                guide_id=guide_id
            )
            db.session.add(assignment)
            
        db.session.commit()
        return jsonify({"message": "Tạo tour thành công, đang chờ duyệt"}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# 3. CẬP NHẬT TOUR
@supplier_bp.route('/tours/<int:tour_id>', methods=['PUT'])
@jwt_required()
def update_my_tour(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first_or_404()
    
    if tour.status not in ['pending', 'rejected']:
        return jsonify({"msg": "Không thể sửa tour đã được duyệt"}), 403
    
    data = request.get_json() or {}
    tour.name = data.get('name', tour.name)
    tour.price = data.get('price', tour.price)
    tour.itinerary = data.get('itinerary', tour.itinerary)
    tour.description = data.get('description', tour.description)
    tour.quantity = data.get('quantity', tour.quantity)  
    tour.image = data.get('image', tour.image)
    
    db.session.commit()
    return jsonify({"msg": "Cập nhật thành công"}), 200

# 4. QUẢN LÝ HƯỚNG DẪN VIÊN
@supplier_bp.route('/guides', methods=['GET'])
@jwt_required()
def get_my_guides():
    sid = get_jwt_identity()
    guides = TourGuide.query.filter_by(supplier_id=sid).all()
    return jsonify([g.to_dict() for g in guides]), 200

@supplier_bp.route('/guides', methods=['POST'])
@jwt_required()
def create_guide():
    sid = get_jwt_identity()
    data = request.get_json()
    
    try:
        guide = TourGuide(
            supplier_id=sid,
            full_name=data.get('full_name'),
            phone=data.get('phone'),
            email=data.get('email'),
            license_number=data.get('license_number'),
            years_of_experience=data.get('years_of_experience', 0),
            languages=data.get('languages'),
            specialties=data.get('specialties'),
            status=data.get("status", "AVAILABLE").upper()
        )
        db.session.add(guide)
        db.session.commit()
        return jsonify({"message": "Thêm HDV thành công", "guide": guide.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# 5. BÁO CÁO DOANH THU (Commission 15%)
@supplier_bp.route('/revenue/summary', methods=['GET'])
@jwt_required()
def get_revenue_summary():
    sid = get_jwt_identity()
    
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

    return jsonify({
        'total_revenue': total_revenue,       
        'admin_commission': admin_commission, 
        'supplier_revenue': supplier_revenue, 
        'total_orders': stats.total_orders or 0
    }), 200