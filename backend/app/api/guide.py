from flask import Blueprint, jsonify, request, current_app
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment
from app.models.user import User
from app.models.order import Order
from flask_jwt_extended import jwt_required, get_jwt_identity

guide_bp = Blueprint('guide', __name__)

# --- HÀM TRỢ GIÚP LẤY GUIDE ---
def get_current_guide(user_id):
    return TourGuide.query.filter_by(user_id=user_id).first()

# 1. Lấy danh sách tour ĐÃ ĐỒNG Ý
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


# 2. Lấy danh sách LỊCH SỬ tour
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


# 3. Lấy danh sách YÊU CẦU dẫn tour
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


# 4. Phản hồi yêu cầu
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

    # ❗ CHỈ cho phản hồi khi đang waiting_guide
    if tour.status not in ['waiting_guide', 'pending_guide']:
        return jsonify({"msg": "Tour chưa sẵn sàng để phản hồi"}), 403

    # ===== LOGIC MỚI =====
    if action == 'accept':
        assign.status = 'accepted'

        # ✅ chuyển sang chờ admin duyệt
        tour.status = 'pending'

        # ✅ tránh nhiều guide nhận
        TourGuideAssignment.query.filter(
            TourGuideAssignment.tour_id == tour.id,
            TourGuideAssignment.id != assign.id
        ).update({"status": "rejected"})

        if hasattr(tour, 'needs_guide'):
            tour.needs_guide = False

        msg = "Đã nhận tour thành công!"

    elif action == 'reject':
        assign.status = 'rejected'

        # ✅ trả về cho supplier assign lại
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


# 5. Lấy danh sách khách hàng
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


# 6. Profile Guide
@guide_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def guide_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    guide = TourGuide.query.filter_by(user_id=user_id).first()

    if not user:
        return jsonify({"msg": "Không tìm thấy người dùng"}), 404

    if request.method == 'GET':
        raw_status = getattr(guide, 'status', 'AVAILABLE')
        status_value = raw_status.value if hasattr(raw_status, 'value') else str(raw_status)

        return jsonify({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": getattr(user, 'phone', ''),
            "status": status_value,
            "years_of_experience": getattr(guide, 'years_of_experience', 0),
            "languages": getattr(guide, 'languages', '')
        }), 200

    if request.method == 'PUT':
        data = request.get_json()
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone' in data:
            user.phone = data['phone']

        if guide:
            if 'status' in data:
                guide.status = data['status']
            if 'languages' in data:
                langs = data['languages']
                guide.languages = ", ".join(langs) if isinstance(langs, list) else langs
            if 'years_of_experience' in data:
                guide.years_of_experience = data['years_of_experience']

        try:
            db.session.commit()
            return jsonify({"msg": "Cập nhật hồ sơ thành công"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Lỗi database"}), 500


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
        
        # 3. Quan trọng: Hoàn thành tất cả đơn hàng của tour này
        orders = Order.query.filter_by(tour_id=tour_id, status='paid').all()
        for order in orders:
            order.status = 'completed'

        # 4. Tính tiền hoa hồng cho Supplier (giữ nguyên logic cũ)
        if tour.supplier_id:
            supplier = User.query.get(tour.supplier_id)
            if supplier:
                total_revenue = sum(o.total_price for o in orders)
                supplier_revenue = total_revenue * 0.85
                supplier.balance = (supplier.balance or 0.0) + supplier_revenue

        db.session.commit()

        return jsonify({
            "msg": "Tour đã được đánh dấu hoàn thành. Tất cả đơn hàng liên quan cũng đã hoàn tất.",
            "status": "completed"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500