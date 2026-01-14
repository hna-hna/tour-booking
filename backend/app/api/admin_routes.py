#backend/app/api/admin/routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.tour import Tour
from app.models.user import User, UserRole  # Import thêm User
from app.models.order import Order          # Import thêm Order
# from flask_jwt_extended import jwt_required, get_jwt_identity # Bật lại khi nào có Auth

# Thêm url_prefix để tất cả API đều bắt đầu bằng /api/admin
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# PHẦN 1: QUẢN LÝ TOUR 

# 1. API Lấy danh sách tour đang chờ duyệt
@admin_bp.route('/tours/pending', methods=['GET'])
# @jwt_required() bắt login
# @role_required(['admin'])  decorator check quyền
def get_pending_tours():
    # Lấy các tour có trạng thái = 'pending'
    tours = Tour.query.filter_by(status='pending').all()
    
    result = []
    for t in tours:
        # Xử lý an toàn nếu description bị None
        desc = getattr(t, 'description', '') or ''
        
        result.append({
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "description": desc,
            "supplier_id": t.supplier_id,
            "created_at": t.created_at.strftime('%Y-%m-%d %H:%M:%S') if t.created_at else None,
            "status": t.status
        })
    return jsonify(result), 200

# 2. API Duyệt hoặc Từ chối Tour
@admin_bp.route('/tours/<int:tour_id>/moderate', methods=['PUT'])
# @jwt_required()
def moderate_tour(tour_id):
    # Body nhận vào: { "action": "approve" } hoặc { "action": "reject" }
    data = request.get_json()
    action = data.get('action') # 'approve' hoặc 'reject'
    
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({"msg": "Tour không tồn tại"}), 404
        
    if action == 'approve':
        tour.status = 'approved'
        msg = "Đã duyệt tour thành công"
    elif action == 'reject':
        tour.status = 'rejected'
        msg = "Đã từ chối tour"
    else:
        return jsonify({"msg": "Hành động không hợp lệ"}), 400
        
    db.session.commit()
    return jsonify({"msg": msg, "status": tour.status}), 200


# =======================================================
# PHẦN 2: QUẢN LÝ USER (Của Na - Mới thêm vào)
# =======================================================

# 3. Lấy danh sách toàn bộ Users
@admin_bp.route('/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    return jsonify([
        {
            'id': u.id,
            'full_name': u.full_name,
            'email': u.email,
            'role': u.role.value, # Lấy giá trị string từ Enum
            'is_active': u.is_active,
            'created_at': u.created_at.strftime('%Y-%m-%d %H:%M:%S') if u.created_at else None
        } for u in users
    ]), 200

# 4. Khóa/Mở khóa User
@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['PUT'])
def toggle_user_status(user_id):
    user = User.query.get_or_404(user_id)
    
    # Đảo ngược trạng thái
    user.is_active = not user.is_active
    db.session.commit()
    
    status_text = "Hoạt động" if user.is_active else "Đã khóa"
    return jsonify({'message': f'Trạng thái user đã đổi thành: {status_text}', 'is_active': user.is_active}), 200

# 5. Cập nhật thông tin User
@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user_info(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    # Nếu muốn cho phép sửa Role (cẩn thận lỗi Enum nếu gửi sai chuỗi)
    if 'role' in data:
        try:
            # data['role'] phải là 'customer', 'supplier', 'admin'...
            user.role = UserRole(data['role'])
        except ValueError:
            return jsonify({'msg': 'Role không hợp lệ'}), 400
            
    db.session.commit()
    return jsonify({'message': 'Cập nhật thông tin thành công'}), 200

# 6. Xóa User (Soft delete hoặc Hard delete tùy nhu cầu)
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    # Hard delete (Xóa vĩnh viễn)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Đã xóa user vĩnh viễn'}), 200


# PHẦN 3: QUẢN LÝ ĐƠN HÀNG (Của Na - Mới thêm vào)


# 7. Lấy danh sách toàn bộ đơn hàng
@admin_bp.route('/orders', methods=['GET'])
def get_all_orders():
    # Sắp xếp đơn mới nhất lên đầu
    orders = Order.query.order_by(Order.booking_date.desc()).all()
    
    results = []
    for o in orders:
        # Xử lý quan hệ để tránh lỗi nếu user hoặc tour bị xóa
        user_name = o.user.full_name if o.user else "Unknown User"
        user_email = o.user.email if o.user else "No Email"
        
        # Giả sử trong model Order,thêm quan hệ 'tour' 
        # Nếu chưa có thì tạm thời để string rỗng
        tour_name = o.tour.name if hasattr(o, 'tour') and o.tour else f"Tour ID: {o.tour_id}"

        results.append({
            'id': o.id,
            'customer_name': user_name,
            'customer_email': user_email,
            'tour_name': tour_name,
            'total_price': o.total_price,
            'status': o.status,
            'guest_count': o.guest_count,
            'booking_date': o.booking_date.strftime('%Y-%m-%d %H:%M') if o.booking_date else None
        })

    return jsonify(results), 200