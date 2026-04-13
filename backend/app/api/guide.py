import json
from flask import Blueprint, jsonify, request, current_app
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment
from app.models.user import User, UserRole
from app.models.order import Order
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
guide_bp = Blueprint('guide', __name__)

def check_request_timeout(guide):
    if not guide: return False
    if guide.supplier_id and not getattr(guide, 'is_approved', True):
        request_at = getattr(guide, 'request_at', None)
        if request_at:
            # Nếu quá 30 phút
            if datetime.utcnow() > request_at + timedelta(minutes=30):
                guide.supplier_id = None
                if hasattr(guide, 'old_status') and guide.old_status:
                    guide.status = guide.old_status
                guide.request_at = None
                db.session.commit()
                return True
    return False

def get_current_guide(user_id):
    return TourGuide.query.filter_by(user_id=user_id).first()

#Lấy danh sách tour ĐÃ ĐỒNG Ý
@guide_bp.route('/tours', methods=['GET'])
@jwt_required()
def get_assigned_tours():
    user_id = get_jwt_identity()
    guide = get_current_guide(user_id)

    if not guide:
        return jsonify({"msg": "Không tìm thấy profile hướng dẫn viên"}), 404

    assignments = TourGuideAssignment.query.filter_by(guide_id=guide.id, status='accepted').all()
    results = []
    for assign in assignments:
        tour = Tour.query.get(assign.tour_id)
        if tour:
            results.append({
                "id": tour.id,
                "name": tour.name,
                "start_date": tour.start_date.strftime('%Y-%m-%d') if tour.start_date else None,
                "end_date": tour.end_date.strftime('%Y-%m-%d') if tour.end_date else None,
                "image": getattr(tour, 'image', None),
                "status": "accepted"
            })
    return jsonify(results), 200


# Lấy danh sách LỊCH SỬ tour
@guide_bp.route('/tours/history', methods=['GET'])
@jwt_required()
def get_tour_history():
    user_id = get_jwt_identity()
    guide = get_current_guide(user_id)

    if not guide:
        return jsonify([]), 200

    assignments = TourGuideAssignment.query.filter_by(guide_id=guide.id, status='completed').all()
    results = []
    for assign in assignments:
        tour = Tour.query.get(assign.tour_id)
        if tour:
            results.append({
                "id": assign.id,
                "tour_id": tour.id,
                "tour_name": tour.name,
                "start_date": tour.start_date.strftime('%Y-%m-%d') if tour.start_date else None,
                "assigned_date": assign.assigned_date,
                "status": assign.status,
                "location": "Việt Nam"
            })
    return jsonify(results), 200


# Lấy danh sách YÊU CẦU dẫn tour
@guide_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_tour_requests():
    user_id = get_jwt_identity()
    guide = get_current_guide(user_id)

    if not guide:
        return jsonify([]), 200

    assignments = TourGuideAssignment.query.filter_by(
        guide_id=guide.id, 
        status='pending'
    ).all()

    results = []
    for assign in assignments:
        tour = Tour.query.get(assign.tour_id)
        if tour:
            results.append({
                "request_id": assign.id,
                "tour_id": tour.id,
                "name": tour.name,
                "start_date": tour.start_date.strftime('%Y-%m-%d') if tour.start_date else None,
                "price": getattr(tour, 'price', 0),
                "assigned_date": assign.assigned_date.isoformat() if assign.assigned_date else None,
                "tour_status": tour.status,
                "can_respond": tour.status in ['waiting_guide', 'pending_guide'] and assign.status == 'pending'            })
    return jsonify(results), 200


#Phản hồi yêu cầu
@guide_bp.route('/requests/<int:request_id>/respond', methods=['PUT'])
@jwt_required()
def respond_to_request(request_id):
    user_id = get_jwt_identity()
    guide = get_current_guide(user_id)

    if not guide:
        return jsonify({"msg": "Không tìm thấy profile hướng dẫn viên"}), 404

    data = request.get_json()
    action = data.get('action')

    assign = TourGuideAssignment.query.get(request_id)
    if not assign:
        return jsonify({"msg": "Không tìm thấy yêu cầu"}), 404

    if assign.guide_id != guide.id:
        return jsonify({"msg": "Bạn không có quyền phản hồi yêu cầu này"}), 403

    if assign.status != 'pending':
        return jsonify({"msg": "Yêu cầu này đã được xử lý rồi"}), 400

    tour = Tour.query.get(assign.tour_id)
    if not tour:
        return jsonify({"msg": "Không tìm thấy tour"}), 404

    if tour.status not in ['waiting_guide', 'pending_guide']:
        return jsonify({"msg": "Tour chưa sẵn sàng để phản hồi"}), 403

    if action == 'accept':
        assign.status = 'accepted'

        # chuyển sang chờ admin duyệt
        tour.status = 'pending'

        # tránh nhiều guide nhận
        TourGuideAssignment.query.filter(
            TourGuideAssignment.tour_id == tour.id,
            TourGuideAssignment.id != assign.id
        ).update({"status": "rejected"})

        if hasattr(tour, 'needs_guide'):
            tour.needs_guide = False

        msg = "Đã nhận tour thành công!"

    elif action == 'reject':
        assign.status = 'rejected'

        # trả về cho supplier assign lại
        tour.status = 'pending_guide'

        if hasattr(tour, 'needs_guide'):
            tour.needs_guide = True

        msg = "Đã từ chối tour."

    else:
        return jsonify({"msg": "Hành động không hợp lệ"}), 400

    try:
        db.session.commit()
        return jsonify({"msg": msg}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Lấy doanh thu của tour (cho HDV)
@guide_bp.route('/tours/<int:tour_id>/revenue', methods=['GET'])
@jwt_required()
def get_tour_revenue_for_guide(tour_id):
    user_id = get_jwt_identity()
    guide = get_current_guide(user_id)
    if not guide:
        return jsonify({"msg": "Không tìm thấy hồ sơ HDV"}), 404

    # Kiểm tra xem HDV có được phân công cho tour này không
    assignment = TourGuideAssignment.query.filter_by(tour_id=tour_id, guide_id=guide.id).first()
    if not assignment:
        return jsonify({"msg": "Bạn không có quyền xem thông tin tour này"}), 403

    # Tính tổng doanh thu từ các đơn hàng 'paid' hoặc 'completed'
    orders = Order.query.filter_by(tour_id=tour_id).filter(
        Order.status.in_(['paid', 'completed', 'Đã thanh toán', 'Hoàn thành'])
    ).all()
    
    total_revenue = sum(o.total_price for o in orders)
    # Giả định hoa hồng Guide là 10% (có thể điều chỉnh sau)
    guide_commission = total_revenue * 0.10

    return jsonify({
        "tour_id": tour_id,
        "total_revenue": total_revenue,
        "guide_commission": guide_commission,
        "commission_rate": "10%"
    }), 200


# Lấy danh sách khách hàng
@guide_bp.route('/tours/<int:tour_id>/customers', methods=['GET'])
@jwt_required()
def get_tour_customers(tour_id):
    orders = Order.query.filter_by(tour_id=tour_id, status='paid').all()
    customers = []
    for order in orders:
        user = User.query.get(order.user_id)
        if user:
            customers.append({
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": getattr(user, 'phone', 'N/A'),
                "guest_count": order.guest_count,
                "check_in": False
            })
    return jsonify(customers), 200

# 7. Kết thúc tour
@guide_bp.route('/tours/<int:tour_id>/finish', methods=['PUT'])
@jwt_required()
def finish_tour(tour_id):
    user_id = get_jwt_identity()
    guide = get_current_guide(user_id)

    if not guide:
        return jsonify({"msg": "Lỗi phân quyền"}), 403

    assignment = TourGuideAssignment.query.filter_by(
        tour_id=tour_id, 
        guide_id=guide.id,
        status='accepted'
    ).first()
    
    if not assignment:
        return jsonify({"msg": "Bạn chưa nhận tour này hoặc tour đã kết thúc"}), 404

    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({"msg": "Không tìm thấy tour"}), 404

    try:
        # 1. Hoàn thành phân công HDV
        assignment.status = 'completed'
        
        # 2. Hoàn thành Tour
        tour.status = 'completed'
        
        # 3. Hoàn thành tất cả đơn hàng của tour này
        orders = Order.query.filter_by(tour_id=tour_id, status='paid').all()
        for order in orders:
            order.status = 'completed'

      
        db.session.commit()

        return jsonify({
            "msg": "Tour đã được đánh dấu hoàn thành thành công!",
            "status": "completed"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@guide_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def guide_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    guide = get_current_guide(user_id)

    if not user: return jsonify({"msg": "Không tìm thấy"}), 404

    if not guide and user.role == UserRole.GUIDE:
        guide = TourGuide(
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=getattr(user, 'phone', '')
        )
        db.session.add(guide)
        db.session.commit()

    # Kiểm tra xem yêu cầu gia nhập cty có bị quá 30p không
    check_request_timeout(guide)

    if request.method == 'GET':
        status_value = guide.status.value if hasattr(guide.status, 'value') else str(guide.status)
        # Lấy tên cty chủ nếu đã được duyệt
        supplier_name = ""
        if guide.supplier_id and getattr(guide, 'is_approved', False):
            supplier = User.query.get(guide.supplier_id)
            supplier_name = supplier.full_name if supplier else ""

        return jsonify({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": getattr(user, 'phone', ''),
            "status": status_value,
            "supplier_id": guide.supplier_id,
            "supplier_name": supplier_name,
            "is_approved": getattr(guide, 'is_approved', False),
            "years_of_experience": guide.years_of_experience,
            "languages": guide.languages
        }), 200

    if request.method == 'PUT':
        data = request.get_json()
        user.full_name = data.get('full_name', user.full_name)
        user.phone = data.get('phone', user.phone)
        guide.status = data.get('status', guide.status)
        guide.languages = ", ".join(data['languages']) if isinstance(data.get('languages'), list) else guide.languages
        guide.years_of_experience = data.get('years_of_experience', guide.years_of_experience)
        db.session.commit()
        return jsonify({"msg": "Cập nhật thành công"}), 200

@guide_bp.route('/suppliers', methods=['GET'])
@jwt_required()
def get_all_suppliers():
    suppliers = User.query.filter_by(role=UserRole.SUPPLIER, is_active=True).all()
    return jsonify([{"id": s.id, "full_name": s.full_name} for s in suppliers]), 200

@guide_bp.route('/request-join-supplier', methods=['POST'])
@jwt_required()
def request_join_supplier():
    user_id = get_jwt_identity()
    guide = get_current_guide(user_id)
    supplier_id = request.get_json().get('supplier_id')

    if not guide: return jsonify({"msg": "Lỗi"}), 404

    try:
        guide.old_status = guide.status.value if hasattr(guide.status, 'value') else str(guide.status)
        guide.supplier_id = supplier_id
        guide.is_approved = False
        guide.request_at = datetime.utcnow()
        guide.status = "BUSY" 
        
        db.session.commit()
        return jsonify({"msg": "Yêu cầu đã gửi. Chờ duyệt trong 30p"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500