# backend/app/api/supplier.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment, GuideStatus
from app.models.order import Order
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_

supplier_bp = Blueprint('supplier_bp', __name__)

# 1. LẤY DANH SÁCH TOUR CỦA TÔI
@supplier_bp.route('/tours', methods=['GET'])
@jwt_required()
def get_my_tours():
    sid = get_jwt_identity()
    tours = Tour.query.filter_by(supplier_id=sid).all()
    return jsonify([{
        "id": t.id,
        "name": t.name,
        "price": t.price,
        "quantity": t.quantity,  
        "status": t.status,
        "guide_name": getattr(t, 'guide_name', 'Chưa phân công'),
        "itinerary": getattr(t, 'itinerary', ''),
        "description": getattr(t, 'description', '')
    } for t in tours]), 200

# 2. CREATE: Tạo Tour mới
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
            status='pending'
        )
        
        db.session.add(new_tour)
        db.session.flush()  # Để lấy tour_id phục vụ việc phân công HDV
        
        # Phân công Hướng dẫn viên (HDV) nếu có truyền guide_id
        if data.get('guide_id'):
            assignment = TourGuideAssignment(
                tour_id=new_tour.id,
                guide_id=data.get('guide_id')
            )
            db.session.add(assignment)
            
        db.session.commit()
        return jsonify({"message": "Tạo tour thành công, đang chờ duyệt"}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# 3. CẬP NHẬT TOUR (Chỉ khi pending hoặc rejected)
@supplier_bp.route('/tours/<int:tour_id>', methods=['PUT'])
@jwt_required()
def update_my_tour(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first_or_404()
    
    if tour.status not in ['pending', 'rejected']:
        return jsonify({"msg": "Không thể sửa tour đã được duyệt"}), 403
    
    data = request.json
    
    # Cập nhật các field
    tour.name = data.get('name', tour.name)
    tour.price = data.get('price', tour.price)
    tour.itinerary = data.get('itinerary', tour.itinerary)
    tour.description = data.get('description', tour.description)
    tour.guide_name = data.get('guide_name', tour.guide_name)
    tour.quantity = data.get('quantity', tour.quantity)  
    
    db.session.commit()
    return jsonify({"msg": "Cập nhật thành công"}), 200

# 4. XÓA TOUR (Chỉ khi pending hoặc rejected)
@supplier_bp.route('/tours/<int:tour_id>', methods=['DELETE'])
@jwt_required()
def delete_my_tour(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first_or_404()
    
    if tour.status not in ['pending', 'rejected']:
        return jsonify({"msg": "Không thể xóa tour đã được duyệt"}), 403
        
    db.session.delete(tour)
    db.session.commit()
    return jsonify({"msg": "Đã xóa tour"}), 200

# 5. XEM ĐƠN HÀNG CỦA TOUR CỦA TÔI (Optional - nếu cần)
@supplier_bp.route('/tours/<int:tour_id>/orders', methods=['GET'])
@jwt_required()
def get_tour_orders(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first_or_404()
    
    orders = Order.query.filter_by(tour_id=tour_id).all()
    
    return jsonify([{
        "id": o.id,
        "customer_name": o.customer_name,
        "status": o.status,
        "total_price": o.total_price,
        "created_at": o.created_at.isoformat() if o.created_at else None
    } for o in orders]), 200
# ==========================================
# PHẦN 1: QUẢN LÝ HƯỚNG DẪN VIÊN
# ==========================================

# 1. Lấy danh sách HDV của tôi
@supplier_bp.route('/guides', methods=['GET'])
@jwt_required()
def get_my_guides():
    sid = get_jwt_identity()
    guides = TourGuide.query.filter_by(supplier_id=sid).all()
    return jsonify([g.to_dict() for g in guides]), 200

# 2. Thêm HDV mới
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
            status=GuideStatus.AVAILABLE,
           
        )
        
        db.session.add(guide)
        db.session.commit()
        
        return jsonify({
            "message": "Thêm hướng dẫn viên thành công",
            "guide": guide.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# 3. Cập nhật thông tin HDV
@supplier_bp.route('/guides/<int:guide_id>', methods=['PUT'])
@jwt_required()
def update_guide(guide_id):
    sid = get_jwt_identity()
    guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first_or_404()
    
    data = request.get_json()
    
    # Update fields
    if 'full_name' in data:
        guide.full_name = data['full_name']
    if 'phone' in data:
        guide.phone = data['phone']
    if 'email' in data:
        guide.email = data['email']
    if 'license_number' in data:
        guide.license_number = data['license_number']
    if 'years_of_experience' in data:
        guide.years_of_experience = data['years_of_experience']
    if 'languages' in data:
        guide.languages = data['languages']
    if 'specialties' in data:
        guide.specialties = data['specialties']
    
    if 'status' in data:
        try:
            guide.status = GuideStatus(data['status'])
        except ValueError:
            return jsonify({"error": "Invalid status"}), 400
    
    db.session.commit()
    return jsonify({
        "message": "Cập nhật thành công",
        "guide": guide.to_dict()
    }), 200

# 4. Cập nhật trạng thái HDV (available/busy/on_leave)
@supplier_bp.route('/guides/<int:guide_id>/status', methods=['PATCH'])
@jwt_required()
def update_guide_status(guide_id):
    sid = get_jwt_identity()
    guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first_or_404()
    
    data = request.get_json()
    status = data.get('status')
    
    try:
        guide.status = GuideStatus(status)
        db.session.commit()
        return jsonify({
            "message": f"Đã cập nhật trạng thái thành {status}",
            "guide": guide.to_dict()
        }), 200
    except ValueError:
        return jsonify({"error": "Trạng thái không hợp lệ. Chỉ chấp nhận: available, busy, on_leave"}), 400

# 5. Xóa HDV
@supplier_bp.route('/guides/<int:guide_id>', methods=['DELETE'])
@jwt_required()
def delete_guide(guide_id):
    sid = get_jwt_identity()
    guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first_or_404()
    
    db.session.delete(guide)
    db.session.commit()
    return jsonify({"message": "Đã xóa hướng dẫn viên"}), 200

# ==========================================
# PHẦN 2: THEO DÕI ĐƠN HÀNG
# ==========================================

# 6. Lấy đơn hàng của các tour của tôi
@supplier_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_my_orders():
    sid = get_jwt_identity()
    
    # Lấy tất cả tour của supplier
    my_tour_ids = [t.id for t in Tour.query.filter_by(supplier_id=sid).all()]
    
    # Lấy các đơn hàng của những tour đó
    orders = Order.query.filter(Order.tour_id.in_(my_tour_ids)).order_by(Order.booking_date.desc()).all()
    
    result = []
    for o in orders:
        tour = Tour.query.get(o.tour_id)
        user = o.user if hasattr(o, 'user') else None
        
        result.append({
            'id': o.id,
            'tour_name': tour.name if tour else f"Tour #{o.tour_id}",
            'customer_name': user.full_name if user else "Unknown",
            'customer_email': user.email if user else "",
            'guest_count': o.guest_count,
            'total_price': o.total_price,
            'status': o.status,
            'booking_date': o.booking_date.isoformat() if o.booking_date else None,
            'payment_status': getattr(o, 'payment_status', 'pending')
        })
    
    return jsonify(result), 200

# 7. Lấy đơn hàng đang chờ (Escrow)
@supplier_bp.route('/orders/pending', methods=['GET'])
@jwt_required()
def get_pending_orders():
    sid = get_jwt_identity()
    
    my_tour_ids = [t.id for t in Tour.query.filter_by(supplier_id=sid).all()]
    
    # Chỉ lấy đơn đã thanh toán nhưng chưa hoàn thành (tiền đang nằm ở admin)
    pending_orders = Order.query.filter(
        and_(
            Order.tour_id.in_(my_tour_ids),
            Order.status == 'Đã thanh toán'  # Hoặc status nào mà tiền đang escrow
        )
    ).all()
    
    result = []
    total_escrow = 0
    
    for o in pending_orders:
        tour = Tour.query.get(o.tour_id)
        supplier_revenue = o.total_price * 0.85  # 85% cho supplier
        total_escrow += supplier_revenue
        
        result.append({
            'id': o.id,
            'tour_name': tour.name if tour else f"Tour #{o.tour_id}",
            'customer_name': o.user.full_name if hasattr(o, 'user') and o.user else "Unknown",
            'total_price': o.total_price,
            'supplier_revenue': supplier_revenue,
            'admin_commission': o.total_price * 0.15,
            'status': o.status,
            'booking_date': o.booking_date.isoformat() if o.booking_date else None
        })
    
    return jsonify({
        'orders': result,
        'total_escrow': total_escrow,
        'count': len(result)
    }), 200

# ==========================================
# PHẦN 3: BÁO CÁO DOANH THU
# ==========================================

# 8. Báo cáo doanh thu tổng quan
@supplier_bp.route('/revenue/summary', methods=['GET'])
@jwt_required()
def get_revenue_summary():
    sid = get_jwt_identity()
    
    # Lấy tất cả tour của supplier
    my_tour_ids = [t.id for t in Tour.query.filter_by(supplier_id=sid).all()]
    
    # Tổng doanh thu từ đơn đã thanh toán
    completed_orders = Order.query.filter(
        and_(
            Order.tour_id.in_(my_tour_ids),
            Order.status.in_(['Đã thanh toán', 'Hoàn thành'])
        )
    ).all()
    
    total_revenue = sum([o.total_price for o in completed_orders])
    admin_commission = total_revenue * 0.15
    supplier_revenue = total_revenue * 0.85
    
    # Doanh thu đang chờ (Escrow)
    pending_orders = Order.query.filter(
        and_(
            Order.tour_id.in_(my_tour_ids),
            Order.status == 'Đã thanh toán'
        )
    ).all()
    
    escrow_amount = sum([o.total_price * 0.85 for o in pending_orders])
    
    
    paid_out_amount = 0  # Tạm thời set 0, cần thêm logic thanh toán cho supplier
    
    return jsonify({
        'total_revenue': total_revenue,           # Tổng doanh thu (100%)
        'admin_commission': admin_commission,     # Hoa hồng admin (15%)
        'supplier_revenue': supplier_revenue,     # Doanh thu của supplier (85%)
        'escrow_amount': escrow_amount,           # Đang chờ xử lý
        'paid_out_amount': paid_out_amount,       # Đã nhận
        'pending_payout': supplier_revenue - paid_out_amount,  # Còn chờ nhận
        'total_orders': len(completed_orders),
        'pending_orders': len(pending_orders)
    }), 200

# 9. Báo cáo chi tiết theo tour
@supplier_bp.route('/revenue/by-tour', methods=['GET'])
@jwt_required()
def get_revenue_by_tour():
    sid = get_jwt_identity()
    
    tours = Tour.query.filter_by(supplier_id=sid).all()
    
    result = []
    for tour in tours:
        orders = Order.query.filter(
            and_(
                Order.tour_id == tour.id,
                Order.status.in_(['Đã thanh toán', 'Hoàn thành'])
            )
        ).all()
        
        total = sum([o.total_price for o in orders])
        
        result.append({
            'tour_id': tour.id,
            'tour_name': tour.name,
            'total_revenue': total,
            'admin_commission': total * 0.15,
            'supplier_revenue': total * 0.85,
            'total_bookings': len(orders)
        })
    
    return jsonify(result), 200