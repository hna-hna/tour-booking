#backend

from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment, GuideStatus
from app.models.order import Order, Payment
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

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
        assignment_status = None # Trạng thái của yêu cầu phân công
        
        if t.guide_assignments:
            # Lấy assignment mới nhất dựa trên ID (người được phân công gần nhất)
            latest_assignment = sorted(t.guide_assignments, key=lambda x: x.id, reverse=True)[0]
            
            guide = TourGuide.query.get(latest_assignment.guide_id)
            if guide:
                guide_id = guide.id
                assignment_status = latest_assignment.status
                
                if latest_assignment.status == 'accepted':
                    guide_name = guide.full_name
                elif latest_assignment.status == 'pending':
                    guide_name = f"{guide.full_name} (chờ xác nhận)"
                elif latest_assignment.status == 'rejected':
                    guide_name = f"{guide.full_name} (đã từ chối)"
        
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
            "assignment_status": assignment_status,
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

        existing_guide = TourGuide.query.filter_by(email=data.get("email")).first()
        if existing_guide:
            return jsonify({
                "msg": f"HDV '{data.get('full_name')}' đã thuộc supplier khác (ID: {existing_guide.supplier_id})"
            }), 400

        existing_user = User.query.filter_by(email=data.get("email")).first()
        if existing_user and existing_user.role != UserRole.GUIDE:
            return jsonify({"msg": "Email này đã được sử dụng cho tài khoản khác"}), 400

        if existing_user and existing_user.role == UserRole.GUIDE:
            user = existing_user
        else:
            user = User(
                email=data.get("email"),
                password_hash=generate_password_hash("123456"),
                full_name=data.get("full_name"),
                role=UserRole.GUIDE,
                is_active=True
            )
            db.session.add(user)
            db.session.flush() 
        
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
    
    # Chỉ cho phép phân công nếu chưa có ai nhận, hoặc người cũ đã từ chối (rejected)
    # Nếu đang có một yêu cầu ở trạng thái 'pending', không cho phân công đè
    active_assignment = TourGuideAssignment.query.filter_by(tour_id=tour_id, status='pending').first()
    if active_assignment:
        return jsonify({"msg": "Đang có yêu cầu chờ HDV xác nhận, không thể phân công mới"}), 400
    
    guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first()
    if not guide: return jsonify({"msg": "Guide không hợp lệ"}), 404
    
    # Tạo yêu cầu mới
    assignment = TourGuideAssignment(tour_id=tour_id, guide_id=guide_id, status='pending')
    db.session.add(assignment)
    
    tour.status = 'waiting_guide'
    if hasattr(tour, 'needs_guide'): tour.needs_guide = True
    
    db.session.commit()
    return jsonify({"msg": "Đã gửi yêu cầu dẫn tour thành công"}), 201

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
    name_filter = request.args.get('name', '').strip()
    sort = request.args.get('sort', 'revenue') 

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

    if name_filter:
        query = query.filter(Tour.name.ilike(f"%{name_filter}%"))

    if sort == "newest":
        query = query.order_by(Tour.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(Tour.created_at.asc())
    else: 
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
@supplier_bp.route('/pending-guides', methods=['GET'])
@jwt_required()
def get_pending_guides():
    sid = get_jwt_identity()
    # Lấy các HDV đã chọn cty này nhưng is_approved = False
    pending = TourGuide.query.filter_by(supplier_id=sid, is_approved=False).all()
    
    results = []
    for g in pending:
        # Bỏ qua các HDV cũ (rác database) không có thời gian tạo request
        if not g.request_at:
            continue
            
        # Kiểm tra timeout ngay khi NCC xem danh sách
        if datetime.utcnow() > g.request_at + timedelta(minutes=30):
            g.supplier_id = None
            db.session.commit()
            continue

        results.append({
            "user_id": g.user_id,
            "full_name": g.full_name,
            "email": g.email,
            "phone": g.phone,
            "created_at": g.request_at.isoformat() if g.request_at else None
        })
    return jsonify(results), 200

@supplier_bp.route('/approve-guide/<string:user_id>', methods=['POST'])
@jwt_required()
def approve_guide(user_id):
    sid = get_jwt_identity()
    guide = TourGuide.query.filter_by(user_id=user_id, supplier_id=sid).first()
    
    if not guide: return jsonify({"msg": "Không Fthấy HDV"}), 404

    try:
        guide.is_approved = True
        if guide.old_status:
            guide.status = guide.old_status
        else:
            guide.status = "AVAILABLE"
            
        db.session.commit()
        return jsonify({"msg": "Đã duyệt HDV gia nhập công ty"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@supplier_bp.route('/reject-guide/<string:user_id>', methods=['POST'])
@jwt_required()
def reject_guide(user_id):
    sid = get_jwt_identity()
    guide = TourGuide.query.filter_by(user_id=user_id, supplier_id=sid).first()
    
    if not guide: return jsonify({"msg": "Không tìm thấy HDV"}), 404

    try:
        guide.is_approved = False
        guide.supplier_id = None
        guide.request_at = None
        if guide.old_status:
            guide.status = guide.old_status
        else:
            guide.status = "AVAILABLE"
            
        db.session.commit()
        return jsonify({"msg": "Đã từ chối HDV gia nhập công ty"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500