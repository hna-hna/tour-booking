from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment
from app.models.order import Order, Payment
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.models.user import User, UserRole
from werkzeug.security import generate_password_hash
from datetime import datetime

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

        if t.guide_assignments:
            # Ưu tiên assignment đã accepted
            accepted = next(
                (a for a in t.guide_assignments if a.status == 'accepted'), None
            )
            # Nếu chưa có ai accept, lấy pending mới nhất
            pending = next(
                (a for a in t.guide_assignments if a.status == 'pending'), None
            )
            assignment = accepted or pending

            if assignment:
                guide = TourGuide.query.get(assignment.guide_id)
                if guide:
                    guide_id = guide.id
                    if accepted:
                        guide_name = guide.full_name
                    else:
                        guide_name = f"{guide.full_name} (chờ xác nhận)"

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


# 2. CREATE TOUR
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
            status='pending', # Nếu không có HDV thì chuyển thẳng cho Admin duyệt
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
                assignment = TourGuideAssignment(
                    tour_id=new_tour.id,
                    guide_id=guide_id,
                    status='pending'
                )
                db.session.add(assignment)
                new_tour.status = 'waiting_guide' # Nếu có HDV thì chờ HDV xác nhận trước
                if hasattr(new_tour, 'needs_guide'):
                    new_tour.needs_guide = True

        db.session.commit()
        return jsonify({"message": "Tạo tour thành công, đang chờ HDV xác nhận"}), 201

    except Exception as e:
        import traceback
        with open("error_log.txt", "a", encoding="utf-8") as f:
            f.write("CREATE TOUR ERROR: " + traceback.format_exc() + "\n")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 3. UPDATE TOUR
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

    if data.get("start_date"):
        tour.start_date = datetime.strptime(data["start_date"], "%Y-%m-%d")
    if data.get("end_date"):
        tour.end_date = datetime.strptime(data["end_date"], "%Y-%m-%d")

    db.session.commit()
    return jsonify({"msg": "Cập nhật thành công"}), 200


# 4. DANH SÁCH GUIDE
@supplier_bp.route('/guides', methods=['GET'])
@jwt_required()
def get_my_guides():
    sid = get_jwt_identity()
    guides = TourGuide.query.filter_by(supplier_id=sid).all()
    return jsonify([g.to_dict() for g in guides]), 200


# 5. TẠO GUIDE
@supplier_bp.route('/guides', methods=['POST'])
@jwt_required()
def create_guide():
    sid = get_jwt_identity()
    data = request.get_json()

    try:
        if not data.get("email") or not data.get("full_name"):
            return jsonify({"msg": "Thiếu email hoặc full_name"}), 400

        existing_user = User.query.filter_by(email=data.get("email")).first()
        if existing_user:
            return jsonify({"msg": "Email đã tồn tại"}), 400

        new_user = User(
            email=data.get("email"),
            password_hash=generate_password_hash("123456"),
            full_name=data.get("full_name"),
            role=UserRole.GUIDE,
            is_active=True
        )
        db.session.add(new_user)
        db.session.flush()

        guide = TourGuide(
            user_id=new_user.id,
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

        return jsonify({
            "message": "Thêm HDV thành công",
            "guide": guide.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 6. PHÂN CÔNG GUIDE CHO TOUR
@supplier_bp.route('/tours/<int:tour_id>/assign-guide', methods=['POST'])
@jwt_required()
def assign_guide(tour_id):
    sid = get_jwt_identity()
    data = request.get_json()
    guide_id = data.get("guide_id")

    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first()
    if not tour:
        return jsonify({"msg": "Không tìm thấy tour"}), 404

    if tour.status not in ['pending_guide', 'waiting_guide']:
        return jsonify({"msg": "Tour không ở trạng thái có thể phân công"}), 403

    guide = TourGuide.query.filter_by(id=guide_id, supplier_id=sid).first()
    if not guide:
        return jsonify({"msg": "Guide không hợp lệ"}), 404

    existing = TourGuideAssignment.query.filter_by(
        tour_id=tour_id,
        guide_id=guide_id,
        status='pending'
    ).first()
    
    if existing:
        return jsonify({"msg": "HDV này đã được phân công cho tour rồi"}), 400

    assignment = TourGuideAssignment(
        tour_id=tour_id,
        guide_id=guide_id,
        status='pending'
    )
    db.session.add(assignment)
    tour.status = 'waiting_guide'

    if hasattr(tour, 'needs_guide'):
        tour.needs_guide = False

    db.session.commit()
    return jsonify({"msg": "Đã gửi yêu cầu dẫn tour cho HDV mới"}), 201


# 7. BÁO CÁO DOANH THU TỔNG QUAN
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
    total_revenue = stats.total_revenue or 0

    admin_commission = total_revenue * 0.15
    supplier_revenue = total_revenue * 0.85

    escrow_stats = db.session.query(func.sum(Payment.amount))\
        .join(Order, Payment.order_id == Order.id)\
        .join(Tour, Order.tour_id == Tour.id)\
        .filter(Tour.supplier_id == sid)\
        .filter(Payment.status == 'pending')\
        .scalar()
    escrow_amount = escrow_stats or 0

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


# 8. DOANH THU CHI TIẾT THEO TOUR
@supplier_bp.route('/revenue/by-tour', methods=['GET'])
@jwt_required()
def get_revenue_by_tour():
    sid = get_jwt_identity()

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


# 9. GỬI YÊU CẦU HỦY TOUR
@supplier_bp.route('/tours/<int:tour_id>/request-cancel', methods=['PUT'])
@jwt_required()
def request_cancel_tour(tour_id):
    sid = get_jwt_identity()

    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first()
    if not tour:
        return jsonify({"msg": "Không tìm thấy tour"}), 404

    if tour.status != 'approved':
        return jsonify({"msg": "Chỉ có thể yêu cầu hủy tour đã được duyệt"}), 400

    try:
        tour.status = 'cancel_requested'
        db.session.commit()
        return jsonify({"msg": "Đã gửi yêu cầu hủy tour đến admin"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 10. XÓA TOUR (Chỉ xóa khi chưa duyệt hoặc bị từ chối)
@supplier_bp.route('/tours/<int:tour_id>', methods=['DELETE'])
@jwt_required()
def delete_tour(tour_id):
    sid = get_jwt_identity()
    tour = Tour.query.filter_by(id=tour_id, supplier_id=sid).first_or_404()
    
    # Kiểm tra trạng thái an toàn trước khi xóa
    if tour.status not in ['pending', 'rejected', 'pending_guide', 'waiting_guide']:
        return jsonify({"msg": "Không thể xóa tour đã được duyệt hoặc đang chờ hủy"}), 403
        
    try:
        db.session.delete(tour)
        db.session.commit()
        return jsonify({"msg": "Xóa tour thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500