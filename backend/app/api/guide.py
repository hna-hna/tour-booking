from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.tour import Tour
from app.models.tour_guide import TourGuide, TourGuideAssignment
from app.models.user import User
from app.models import  User, Tour, TourGuideAssignment, TourGuide
from app.models.order import Order
from flask_jwt_extended import jwt_required, get_jwt_identity

guide_bp = Blueprint('guide', __name__)

def get_current_guide(user_id):
    return TourGuide.query.filter_by(user_id=user_id).first()

# 1. Lấy danh sách tour ĐÃ ĐỒNG Ý
@guide_bp.route('/tours', methods=['GET'])
@jwt_required()
def get_assigned_tours():
    user_id = get_jwt_identity()
    
    # Tìm hồ sơ HDV bằng TourGuide
    guide_profile = TourGuide.query.filter_by(user_id=user_id).first()
    if not guide_profile:
        return jsonify({"msg": "Không tìm thấy profile hướng dẫn viên"}), 404

    # Lấy tour dựa trên guide_profile.id
    data = db.session.query(TourGuideAssignment, Tour).join(
        Tour, TourGuideAssignment.tour_id == Tour.id
    ).filter(
        TourGuideAssignment.guide_id == guide_profile.id,
        TourGuideAssignment.status == 'accepted',
        Tour.status != 'completed'
    ).all()

    results = []
    for assign, tour in data:
        results.append({
            "id": tour.id,
            "name": tour.name,
            "start_date": tour.start_date.isoformat() if tour.start_date else None,
            "status": tour.status
        })
    return jsonify(results), 200

# 2. Lấy danh sách LỊCH SỬ tour
@guide_bp.route('/tours/history', methods=['GET'])
@jwt_required()
def get_tour_history():
    user_id = get_jwt_identity()
    
    guide_profile = TourGuide.query.filter_by(user_id=user_id).first()
    if not guide_profile:
        return jsonify({"msg": "Không tìm thấy profile hướng dẫn viên"}), 404

    data = db.session.query(TourGuideAssignment, Tour).join(
        Tour, TourGuideAssignment.tour_id == Tour.id
    ).filter(
        TourGuideAssignment.guide_id == guide_profile.id,
        TourGuideAssignment.status == 'accepted',
        Tour.status == 'completed'
    ).all()

    # Tự tạo danh sách kết quả thay vì dùng to_dict()
    results = []
    for assign, tour in data:
        results.append({
            "id": assign.id,
            "tour_id": tour.id,
            "tour_name": tour.name, # Frontend đang dùng item.tour_name
            "start_date": tour.start_date.isoformat() if tour.start_date else None,
            "assigned_date": assign.assigned_date.isoformat() if assign.assigned_date else None,
            "status": tour.status,
            "location": getattr(tour, 'location', 'Việt Nam')
        })
    
    return jsonify(results), 200

# 3. Lấy danh sách YÊU CẦU dẫn tour
@guide_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_tour_requests():
    user_id = get_jwt_identity()
    guide = get_current_guide(user_id)
    if user.role != 'guide':
        return jsonify({"msg": "Bạn không có quyền truy cập vào đây!"}), 403
    print(f"DEBUG: User đang đăng nhập là {user_id}, Tìm thấy Guide ID: {guide.id if guide else 'None'}")

    if not guide:
        return jsonify([]), 200

    assignments = TourGuideAssignment.query.filter_by(guide_id=guide.id, status='pending').all()
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
                "assigned_date": assign.assigned_date
            })
    return jsonify(results), 200

# 4. Phản hồi yêu cầu
@guide_bp.route('/requests/<int:request_id>/respond', methods=['PUT'])
@jwt_required() 
def respond_to_request(request_id):
    data = request.get_json()
    action = data.get('action') 
    
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

# 5. Lấy danh sách khách hàng của tour
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
        if 'full_name' in data: user.full_name = data['full_name']
        if 'phone' in data: user.phone = data['phone']
        
        if guide:
            if 'status' in data:
                guide.status = data['status']
            if 'languages' in data:
                guide.languages = ", ".join(data['languages']) if isinstance(data['languages'], list) else data['languages']
            if 'years_of_experience' in data:
                guide.years_of_experience = data['years_of_experience']

        try:
            db.session.commit()
            return jsonify({"msg": "Cập nhật hồ sơ thành công"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Lỗi database"}), 500

# 7. Kết thúc tour & CHIA HOA HỒNG
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
    try:
        assignment.status = 'completed'
        if tour:
            tour.status = 'completed'
            
            orders = Order.query.filter_by(tour_id=tour_id, status='paid').all()
            total_revenue = sum(o.total_price for o in orders)
            
            if tour.supplier_id:
                supplier = User.query.get(tour.supplier_id)
                if supplier:
                    # NCC nhận 85%, Admin giữ 15% (theo logic Dashboard Admin)
                    supplier_revenue = total_revenue * 0.85
                    supplier.balance = getattr(supplier, 'balance', 0.0) + supplier_revenue
                    
        db.session.commit()
        return jsonify({
            "msg": "Chúc mừng! Bạn đã hoàn thành tour và doanh thu đã được chuyển cho Nhà cung cấp.", 
            "status": "completed"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500