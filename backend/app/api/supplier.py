# backend/app/api/supplier.py
from flask import Blueprint, request, jsonify,current_app
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment
from app.models.order import Order
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, and_
from werkzeug.utils import secure_filename
from app.models.order import Order, Payment
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
        # Logic lấy tên HDV từ bảng liên kết
        guide_name = "Chưa phân công"
        guide_id = None
        
        # Kiểm tra xem tour này có phân công ai chưa
        # (Lấy người đầu tiên trong danh sách phân công)
        if t.guide_assignments: 
            assignment = t.guide_assignments[0] # Lấy assignment đầu tiên
            # Query lấy thông tin chi tiết HDV
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
            "guide_name": guide_name, # Đã lấy được tên thật
            "guide_id": guide_id,     # Trả về ID để frontend dùng lúc Edit
            "itinerary": t.itinerary,
            "description": t.description
        })

    return jsonify(result), 200


# LẤY CHI TIẾT 1 TOUR (Bổ sung để hiển thị đủ ảnh)
@supplier_bp.route('/tours/<int:tour_id>', methods=['GET'])
def get_tour_detail_supplier(tour_id):
    tour = Tour.query.get_or_404(tour_id)
    return jsonify({
        "id": tour.id,
        "name": tour.name,
        "description": tour.description or "",
        "itinerary": tour.itinerary or "",
        "price": tour.price,
        "quantity": tour.quantity,
        "status": tour.status,
        "image": tour.image,  
        "supplier_id": tour.supplier_id
    }), 200


# 2. CREATE: Tạo Tour mới


@supplier_bp.route('/tours', methods=['POST'])
@jwt_required()
def create_tour():
    sid = get_jwt_identity()
    data = request.get_json() # Chuyển sang nhận JSON cho đồng bộ
    try:
        # Nhận link ảnh trực tiếp (đã upload lên Supabase từ Frontend)
        image_url = data.get('image')
        guide_id = data.get('guide_id')
   
    
        

        # 3. Tạo đối tượng Tour
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
        db.session.flush()  # Lấy ID tour vừa tạo
        
        # 4. Phân công HDV (Nếu có)
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
        print("Error creating tour:", str(e)) # In lỗi ra terminal để debug
        return jsonify({"error": str(e)}), 500

# 3. CẬP NHẬT TOUR (Chỉ khi pending hoặc rejected)
@supplier_bp.route('/tours/<int:tour_id>', methods=['PUT'])
@jwt_required()
def update_my_tour(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first_or_404()
    
    if tour.status not in ['pending', 'rejected']:
        return jsonify({"msg": "Không thể sửa tour đã được duyệt"}), 403
    
    data = request.get_json() or {}
    # Cập nhật các field
    tour.name = data.get('name', tour.name)
    tour.price = data.get('price', tour.price)
    tour.itinerary = data.get('itinerary', tour.itinerary)
    tour.description = data.get('description', tour.description)
    tour.guide_name = data.get('guide_name', tour.guide_name)
    tour.quantity = data.get('quantity', tour.quantity)  
    tour.image = data.get('image', tour.image)
    
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
             status=data.get("status", "AVAILABLE").upper(),  
           
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

# Cập nhật trạng thái HDV (AVAILABLE/BUSY/ON_LEAVE)
@supplier_bp.route('/guides/<int:guide_id>/status', methods=['PATCH'])
@jwt_required()
def update_guide_status(guide_id):
    sid = get_jwt_identity()
    guide = TourGuide.query.filter_by(
        id=guide_id,
        supplier_id=sid
    ).first_or_404()

    data = request.get_json()
    status = data.get('status', '').strip().upper()

    if status not in ['AVAILABLE', 'BUSY', 'ON_LEAVE']:
        return jsonify({
            "error": "Trạng thái không hợp lệ. Chỉ chấp nhận: AVAILABLE, BUSY, ON_LEAVE"
        }), 400

    guide.status = status  # ✅ GÁN STRING
    db.session.commit()

    return jsonify({
        "message": f"Đã cập nhật trạng thái thành {status}",
        "guide": guide.to_dict()
    }), 200




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
    
    # Query: Tính tổng doanh thu và tổng số đơn từ bảng Payment
    stats = db.session.query(
        func.count(Order.id).label('total_orders'),
        func.sum(Payment.amount).label('total_revenue')
    ).join(Payment, Order.id == Payment.order_id)\
     .join(Tour, Order.tour_id == Tour.id)\
     .filter(Tour.supplier_id == sid)\
     .filter(Payment.status == 'success')\
     .first()

    # Xử lý kết quả (tránh lỗi None)
    total_orders = stats.total_orders or 0
    total_revenue = stats.total_revenue or 0 # Nếu không có đơn nào, trả về 0
    
    # Tính toán hoa hồng (15%)
    admin_commission = total_revenue * 0.15
    supplier_revenue = total_revenue * 0.85
    
    # Query: Tính tiền đang chờ (Escrow) - Đơn có Payment status là 'pending'
    escrow_stats = db.session.query(func.sum(Payment.amount))\
        .join(Order, Payment.order_id == Order.id)\
        .join(Tour, Order.tour_id == Tour.id)\
        .filter(Tour.supplier_id == sid)\
        .filter(Payment.status == 'pending')\
        .scalar()
        
    escrow_amount = escrow_stats or 0
    
    # Query: Đếm số lượng đơn đang chờ
    pending_orders_count = db.session.query(func.count(Order.id))\
        .join(Tour, Order.tour_id == Tour.id)\
        .filter(Tour.supplier_id == sid)\
        .filter(Order.status == 'pending')\
        .scalar()

    return jsonify({
        'total_revenue': total_revenue,       
        'admin_commission': admin_commission, 
        'supplier_revenue': supplier_revenue, 
        'escrow_amount': escrow_amount,       
        'paid_out_amount': 0,                 
        'pending_payout': supplier_revenue,   
        'total_orders': total_orders,
        'pending_orders': pending_orders_count or 0
    }), 200

# 9. Báo cáo chi tiết theo tour
@supplier_bp.route('/revenue/by-tour', methods=['GET'])
@jwt_required()
def get_revenue_by_tour():
    sid = get_jwt_identity()
    
    # Group by Tour
    results = db.session.query(
        Tour.id,
        Tour.name,
        func.count(Order.id).label('total_bookings'),
        func.sum(Payment.amount).label('total_revenue')
    ).join(Order, Tour.id == Order.tour_id)\
     .join(Payment, Order.id == Payment.order_id)\
     .filter(Tour.supplier_id == sid)\
     .filter(Payment.status == 'success')\
     .group_by(Tour.id, Tour.name)\
     .all()
    
    data = []
    for r in results:
        rev = r.total_revenue or 0
        data.append({
            'tour_id': r.id,
            'tour_name': r.name,
            'total_revenue': rev,
            'admin_commission': rev * 0.15,
            'supplier_revenue': rev * 0.85,
            'total_bookings': r.total_bookings
        })
    
    return jsonify(data), 200