from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment, GuideStatus
from app.models.order import Order, Payment
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash
from datetime import datetime

supplier_bp = Blueprint('supplier_bp', __name__)

@supplier_bp.route('/tours', methods=['GET'])
@jwt_required()
def get_my_tours():
    sid = get_jwt_identity()
    status_filter = request.args.get('status')
    query = Tour.query.filter_by(supplier_id=sid)
    if status_filter:
        query = query.filter(Tour.status == status_filter)
    tours = query.all()
    result = []
    for t in tours:
        guide_name = "Chưa phân công"
        guide_id = None
        if t.guide_assignments:
            accepted = next((a for a in t.guide_assignments if a.status == 'accepted'), None)
            pending = next((a for a in t.guide_assignments if a.status == 'pending'), None)
            assignment = accepted or pending
            if assignment:
                guide = TourGuide.query.get(assignment.guide_id)
                if guide:
                    guide_id = guide.id
                    guide_name = guide.full_name if accepted else f"{guide.full_name} (chờ xác nhận)"
        
        result.append({
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "quantity": t.quantity,
            "status": t.status,
            "reject_reason": getattr(t, 'reject_reason', ''),
            "image": t.image,
            "guide_name": guide_name,
            "guide_id": guide_id,
            "itinerary": t.itinerary,
            "description": t.description,
            "start_date": t.start_date.strftime('%Y-%m-%d') if t.start_date else None,
            "end_date": t.end_date.strftime('%Y-%m-%d') if t.end_date else None,
            "needs_guide": getattr(t, 'needs_guide', False)
        })
    return jsonify(result), 200

@supplier_bp.route('/tours', methods=['POST'])
@jwt_required()
def create_tour():
    sid = get_jwt_identity()
    data = request.get_json()
    try:
        image_url = data.get('image')
        guide_id = data.get('guide_id')
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        
        new_tour = Tour(
            name=data.get('name'), 
            description=data.get('description'),
            itinerary=data.get('itinerary'), 
            price=data.get('price'),
            quantity=data.get('quantity', 20), 
            supplier_id=sid,
            status='pending',
            image=image_url,
            start_date=datetime.strptime(start_date, "%Y-%m-%d") if start_date else None,
            end_date=datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
        )
        
        if hasattr(new_tour, 'needs_guide'): 
            new_tour.needs_guide = False
            
        db.session.add(new_tour)
        db.session.flush()
        
        if guide_id:
            guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first()
            if guide:
                assignment = TourGuideAssignment(tour_id=new_tour.id, guide_id=guide_id, status='pending')
                db.session.add(assignment)
                new_tour.status = 'waiting_guide'
                if hasattr(new_tour, 'needs_guide'):
                    new_tour.needs_guide = True

        db.session.commit()
        return jsonify({"message": "Tạo tour thành công", "id": new_tour.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@supplier_bp.route('/tours/<int:tour_id>', methods=['PUT'])
@jwt_required()
def update_my_tour(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first_or_404()
    if tour.status not in ['pending', 'rejected', 'pending_guide', 'waiting_guide']:
        return jsonify({"msg": "Không thể sửa tour đã được duyệt"}), 403
    data = request.get_json() or {}
    tour.name = data.get('name', tour.name)
    tour.price = data.get('price', tour.price)
    tour.itinerary = data.get('itinerary', tour.itinerary)
    tour.description = data.get('description', tour.description)
    tour.quantity = data.get('quantity', tour.quantity)
    tour.image = data.get('image', tour.image)
    if data.get("start_date"): tour.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d")
    if data.get("end_date"): tour.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d")
    db.session.commit()
    return jsonify({"msg": "Cập nhật thành công"}), 200

@supplier_bp.route('/guides', methods=['GET'])
@jwt_required()
def get_my_guides():
    sid = get_jwt_identity()
    status_filter = request.args.get('status')
    query = TourGuide.query.filter_by(supplier_id=sid)
    if status_filter and status_filter.upper() != "ALL":
        try:
            enum_status = GuideStatus[status_filter.upper()]
            query = query.filter(TourGuide.status == enum_status)
        except KeyError:
            return jsonify({"msg": "Trạng thái lọc không hợp lệ"}), 400
    guides = query.all()
    return jsonify([g.to_dict() for g in guides]), 200

@supplier_bp.route('/guides', methods=['POST'])
@jwt_required()
def create_guide():
    sid = get_jwt_identity()
    data = request.get_json()
    try:
        if not data.get("email") or not data.get("full_name"):
            return jsonify({"msg": "Thiếu email hoặc full_name"}), 400

        #  KIỂM TRA 1 HDV CHỈ THUỘC 1 SUPPLIER
        existing_guide = TourGuide.query.filter_by(email=data.get("email")).first()
        if existing_guide:
            return jsonify({
                "msg": f"HDV '{data.get('full_name')}' đã thuộc supplier khác (ID: {existing_guide.supplier_id})"
            }), 400

        # Kiểm tra user đã tồn tại chưa
        existing_user = User.query.filter_by(email=data.get("email")).first()
        if existing_user and existing_user.role != UserRole.GUIDE:
            return jsonify({"msg": "Email này đã được sử dụng cho tài khoản khác"}), 400

        if existing_user and existing_user.role == UserRole.GUIDE:
            # User đã là guide → chỉ tạo TourGuide mới
            user = existing_user
        else:
            # Tạo user mới
            user = User(
                email=data.get("email"),
                password_hash=generate_password_hash("123456"),
                full_name=data.get("full_name"),
                role=UserRole.GUIDE,
                is_active=True
            )
            db.session.add(user)
            db.session.flush()  # Để lấy user.id
        
        #  TẠO GUIDE CHO SUPPLIER NÀY
        input_status = data.get("status", "AVAILABLE").upper()
        guide_status = GuideStatus[input_status] if input_status in GuideStatus.__members__ else GuideStatus.AVAILABLE

        guide = TourGuide(
            user_id=user.id, 
            supplier_id=sid, 
            full_name=data.get('full_name'),
            phone=data.get('phone'), 
            email=data.get('email'),
            license_number=data.get('license_number'),
            years_of_experience=data.get('years_of_experience', 0),
            languages=data.get('languages'), 
            specialties=data.get('specialties'),
            status=guide_status
        )
        db.session.add(guide)
        db.session.commit()
        return jsonify({"message": "Thêm HDV thành công", "guide": guide.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@supplier_bp.route('/tours/<int:tour_id>/assign-guide', methods=['POST'])
@jwt_required()
def assign_guide(tour_id):
    sid = get_jwt_identity()
    data = request.get_json()
    guide_id = data.get("guide_id")
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first()
    if not tour: return jsonify({"msg": "Không tìm thấy tour"}), 404
    if tour.status not in ['pending_guide', 'waiting_guide', 'pending']:
        return jsonify({"msg": "Tour không ở trạng thái có thể phân công"}), 403
    guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first()
    if not guide: return jsonify({"msg": "Guide không hợp lệ"}), 404
    
    existing = TourGuideAssignment.query.filter_by(tour_id=tour_id, guide_id=guide_id, status='pending').first()
    if existing: return jsonify({"msg": "HDV này đã được phân công cho tour rồi"}), 400
    
    assignment = TourGuideAssignment(tour_id=tour_id, guide_id=guide_id, status='pending')
    db.session.add(assignment)
    tour.status = 'waiting_guide'
    if hasattr(tour, 'needs_guide'): tour.needs_guide = True
    db.session.commit()
    return jsonify({"msg": "Đã gửi yêu cầu dẫn tour cho HDV mới"}), 201

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
    
    total_orders = stats.total_orders or 0
    total_revenue = float(stats.total_revenue or 0)
    admin_commission = total_revenue * 0.15
    supplier_revenue = total_revenue * 0.85
    
    return jsonify({
        'total_revenue': total_revenue, 
        'admin_commission': admin_commission,
        'supplier_revenue': supplier_revenue, 
        'total_orders': total_orders
    }), 200

@supplier_bp.route('/revenue/by-tour', methods=['GET'])
@jwt_required()
def get_revenue_by_tour():
    sid = get_jwt_identity()

    #  FILTER & SORT PARAMS 
    name_filter = request.args.get('name', '').strip()
    sort = request.args.get('sort', 'revenue')  # revenue | newest | oldest

    query = db.session.query(
        Tour.id.label('tour_id'),
        Tour.name.label('tour_name'),
        func.count(Order.id).label('total_bookings'),
        func.sum(Payment.amount).label('total_revenue'),
        Tour.created_at
    ).outerjoin(Order, Tour.id == Order.tour_id)\
     .outerjoin(Payment, Order.id == Payment.order_id)\
     .filter(Tour.supplier_id == sid)\
     .filter((Payment.status == 'success') | (Payment.id.is_(None)))\
     .group_by(Tour.id, Tour.name, Tour.created_at)

    # FILTER THEO TÊN TOUR
    if name_filter:
        query = query.filter(Tour.name.ilike(f"%{name_filter}%"))

    #  SORT 
    if sort == "newest":
        query = query.order_by(Tour.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(Tour.created_at.asc())
    else:  # revenue (default)
        query = query.order_by(func.sum(Payment.amount).desc().nulls_last())

    results = query.all()
    
    data = []
    for r in results:
        total_rev = float(r.total_revenue or 0)
        data.append({
            'tour_id': r.tour_id,
            'tour_name': r.tour_name,
            'total_revenue': total_rev,
            'admin_commission': total_rev * 0.15,
            'supplier_revenue': total_rev * 0.85,
            'total_bookings': r.total_bookings or 0
        })

    return jsonify(data), 200


@supplier_bp.route('/tours/<int:tour_id>/request-cancel', methods=['PUT'])
@jwt_required()
def request_cancel_tour(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first()
    if not tour: return jsonify({"msg": "Không tìm thấy tour"}), 404
    if tour.status != 'approved': return jsonify({"msg": "Chỉ có thể yêu cầu hủy tour đã được duyệt"}), 400
    try:
        tour.status = 'cancel_requested'
        db.session.commit()
        return jsonify({"msg": "Đã gửi yêu cầu hủy tour đến admin"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@supplier_bp.route('/tours/<int:tour_id>', methods=['DELETE'])
@jwt_required()
def delete_tour(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first_or_404()
    if tour.status not in ['pending', 'rejected', 'pending_guide', 'waiting_guide']:
        return jsonify({"msg": "Không thể xóa tour đã được duyệt"}), 403
    try:
        db.session.delete(tour)
        db.session.commit()
        return jsonify({"msg": "Xóa tour thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@supplier_bp.route('/guides/<int:guide_id>/status', methods=['PATCH'])
@jwt_required()
def update_guide_status(guide_id):
    sid = get_jwt_identity()
    data = request.get_json()
    new_status_str = data.get('status')
    guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first_or_404()
    try:
        guide.status = GuideStatus[new_status_str.upper()]
        db.session.commit()
        return jsonify({"msg": "Cập nhật thành công", "new_status": guide.status.value}), 200
    except (KeyError, AttributeError):
        return jsonify({"msg": "Trạng thái không hợp lệ"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@supplier_bp.route('/guides/<int:guide_id>', methods=['DELETE'])
@jwt_required()
def delete_guide(guide_id):
    sid = get_jwt_identity()
    guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first_or_404()
    try:
        user = User.query.get(guide.user_id)
        if user: db.session.delete(user)
        db.session.delete(guide)
        db.session.commit()
        return jsonify({"msg": "Xóa HDV thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500