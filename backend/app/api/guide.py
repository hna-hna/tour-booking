#backend/app/api/guide.py 
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.tour import Tour, TourGuideAssignment
from app.models.user import User
from app.models.order import Order

guide_bp = Blueprint('guide', __name__, url_prefix="/api/guide")

# --- BIẾN DÙNG CHUNG ĐỂ TEST (Đổi thành 100 để khớp SQL của bạn) ---
CURRENT_GUIDE_ID = 100

# 1. Lấy danh sách tour ĐÃ ĐỒNG Ý (Trang Lịch dẫn tour - status: accepted)
@guide_bp.route('/tours', methods=['GET'])
def get_assigned_tours():
    # Sau này thay bằng get_jwt_identity()
    user_id = CURRENT_GUIDE_ID 
    
    assignments = TourGuideAssignment.query.filter_by(guide_id=user_id, status='accepted').all()
    results = []
    for assign in assignments:
        tour = Tour.query.get(assign.tour_id)
        if tour:
            results.append({
                "id": tour.id,
                "name": tour.name,
                "start_date": tour.start_date, 
                "end_date": tour.end_date,
                "image": getattr(tour, 'image', None),
                "status": "accepted"
            })
    return jsonify(results), 200

# 2. Lấy danh sách LỊCH SỬ tour (Trang Lịch sử - status: completed)
@guide_bp.route('/tours/history', methods=['GET'])
def get_tour_history():
    user_id = 100
    
    assignments = TourGuideAssignment.query.filter_by(guide_id=user_id, status='completed').all()
    results = []
    for assign in assignments:
        tour = Tour.query.get(assign.tour_id)
        if tour:
            results.append({
                "id": assign.id,
                "tour_id": tour.id,
                "tour_name": tour.name,
                "start_date": tour.start_date,
                "assigned_date": assign.assigned_date,
                "status": assign.status,
                "location": "Việt Nam"
            })
    return jsonify(results), 200

# 3. Lấy danh sách YÊU CẦU dẫn tour (Trang Yêu cầu - status: pending)
@guide_bp.route('/requests', methods=['GET'])
def get_tour_requests():
    user_id = CURRENT_GUIDE_ID
    
    assignments = TourGuideAssignment.query.filter_by(guide_id=user_id, status='pending').all()
    results = []
    for assign in assignments:
        tour = Tour.query.get(assign.tour_id)
        if tour:
            results.append({
                "request_id": assign.id,
                "tour_id": tour.id,
                "name": tour.name,
                "start_date": tour.start_date,
                "price": getattr(tour, 'price', 0),
                "assigned_date": assign.assigned_date
            })
    return jsonify(results), 200

# 4. Phản hồi yêu cầu (Chấp nhận hoặc Từ chối)
@guide_bp.route('/requests/<int:request_id>/respond', methods=['PUT'])
def respond_to_request(request_id):
    data = request.get_json()
    action = data.get('action') # 'accept' hoặc 'reject'
    
    assign = TourGuideAssignment.query.get(request_id)
    if not assign:
        return jsonify({"msg": "Không tìm thấy yêu cầu"}), 404
        
    if action == 'accept':
        assign.status = 'accepted'
        msg = "Đã nhận tour thành công!"
    elif action == 'reject':
        assign.status = 'rejected'
        msg = "Đã từ chối tour."
    else:
        return jsonify({"msg": "Hành động không hợp lệ"}), 400
        
    db.session.commit()
    return jsonify({"msg": msg}), 200

# 5. Lấy danh sách khách hàng của 1 Tour (Dùng cho trang Chi tiết)
@guide_bp.route('/tours/<int:tour_id>/customers', methods=['GET'])
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

# 6. Lấy và cập nhật Profile Guide
@guide_bp.route('/profile', methods=['GET', 'PUT'])
def guide_profile():
    user_id = CURRENT_GUIDE_ID
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"msg": "Không tìm thấy người dùng"}), 404

    if request.method == 'GET':
        return jsonify({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": getattr(user, 'phone', ''),
            "experience": "Hiện tại chưa cập nhật"
        }), 200
    
    if request.method == 'PUT':
        data = request.get_json()
        if 'full_name' in data: user.full_name = data['full_name']
        if 'phone' in data: user.phone = data['phone']
        db.session.commit()
        return jsonify({"msg": "Cập nhật hồ sơ thành công"}), 200
        
@guide_bp.route('/tours/<int:tour_id>/finish', methods=['PUT'])
def finish_tour(tour_id):
    # 1. Tìm bản ghi phân công của HDV này với Tour này
    user_id = 100 # Hardcode ID Guide (Sau này dùng get_jwt_identity())
    
    assignment = TourGuideAssignment.query.filter_by(
        tour_id=tour_id, 
        guide_id=user_id,
        status='accepted' # Chỉ tour đang nhận mới được hoàn thành
    ).first()
    
    if not assignment:
        return jsonify({"msg": "Bạn chưa nhận tour này hoặc tour không tồn tại"}), 404

    # 2. Tìm bản ghi Tour gốc
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({"msg": "Tour không tồn tại"}), 404

    try:
        # --- ĐỒNG BỘ TRẠNG THÁI TẠI ĐÂY ---
        
        # Việc 1: Đổi trạng thái phân công -> completed
        assignment.status = 'completed'
        
        # Việc 2: Đổi trạng thái Tour gốc -> completed
        tour.status = 'completed'
        
        # (Tại đây bạn có thể thêm logic chia tiền hoa hồng 85/15 cho NCC và Admin sau này)
        
        # Việc 3: Lưu tất cả thay đổi cùng lúc
        db.session.commit()
        
        return jsonify({"msg": "Chúc mừng! Bạn đã hoàn thành tour.", "status": "completed"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500