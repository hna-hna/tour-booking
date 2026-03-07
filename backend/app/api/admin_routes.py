#backend/app/api/admin/routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.tour import Tour
from app.models.user import User, UserRole  
from app.models.order import Order         
from sqlalchemy import func
# from flask_jwt_extended import jwt_required, get_jwt_identity # Bật lại khi nào có Auth

# Thêm url_prefix để tất cả API đều bắt đầu bằng /api/admin
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# QUẢN LÝ TOUR 

#  API Lấy danh sách tour đang chờ duyệt
@admin_bp.route('/tours/pending', methods=['GET'])
# @jwt_required()
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

#API Duyệt hoặc Từ chối Tour
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


# QUẢN LÝ USER

#lấy danh sách toàn bộ Users
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

# Khóa/Mở khóa User
@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['PUT'])
def toggle_user_status(user_id):
    user = User.query.get_or_404(user_id)
    
    # Đảo ngược trạng thái
    user.is_active = not user.is_active
    db.session.commit()
    
    status_text = "Hoạt động" if user.is_active else "Đã khóa"
    return jsonify({'message': f'Trạng thái user đã đổi thành: {status_text}', 'is_active': user.is_active}), 200

# Cập nhật thông tin User
@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user_info(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    # Nếu muốn cho phép sửa Role 
    if 'role' in data:
        try:
            # data['role'] phải là 'customer', 'supplier', 'admin'...
            user.role = UserRole(data['role'])
        except ValueError:
            return jsonify({'msg': 'Role không hợp lệ'}), 400
            
    db.session.commit()
    return jsonify({'message': 'Cập nhật thông tin thành công'}), 200

#Xóa User (Soft delete hoặc Hard delete tùy nhu cầu)
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    # Hard delete (Xóa vĩnh viễn)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Đã xóa user vĩnh viễn'}), 200

# lấy danh sách toàn bộ đơn hàng
@admin_bp.route('/orders', methods=['GET'])
def get_all_orders():
    # Sử dụng outerjoin để lấy thông tin user và tour
    query_result = db.session.query(Order, User, Tour)\
        .outerjoin(User, Order.user_id == User.id)\
        .outerjoin(Tour, Order.tour_id == Tour.id)\
        .order_by(Order.booking_date.desc())\
        .all()
    
    results = []
    for order, user, tour in query_result:
        user_name = user.full_name if user else "Unknown User"
        user_email = user.email if user else "No Email"
        tour_name = tour.name if tour else f"Tour ID: {order.tour_id}"

        results.append({
            'id': order.id,
            'customer_name': user_name,
            'customer_email': user_email,
            'tour_name': tour_name,
            'total_price': order.total_price,
            'status': order.status,
            'guest_count': order.guest_count,
            'booking_date': order.booking_date.strftime('%Y-%m-%d %H:%M') if order.booking_date else None
        })

    return jsonify(results), 200
        
        
# 8. API Tổng quan 
@admin_bp.route('/dashboard/stats', methods=['GET'])
def get_admin_dashboard_stats():
   
    # Tổng doanh thu:
    # Lấy tổng dòng tiền (Gross Merchandise Value) từ các đơn đã thanh toán
    total_flow = db.session.query(func.sum(Order.total_price)).filter(
        Order.status.in_(['Đã thanh toán', 'Hoàn thành', 'paid', 'completed'])
    ).scalar() or 0
    
    # 1. Hoa hồng Admin thực nhận (15%)
    admin_commission = total_flow * 0.15
    
    # 2. Tiền hệ thống đang giữ cho NCC (85% - Quỹ Escrow)
    escrow_balance = total_flow * 0.85  
    
    # Đơn hàng mới: Tổng số đơn hàng trong hệ thống
    total_orders = Order.query.count()
    
    # Khách hàng: Số lượng User có vai trò là customer
    total_customers = User.query.filter_by(role=UserRole.CUSTOMER).count()
    
    # Tour chờ duyệt: Số tour có status là pending
    pending_tours = Tour.query.filter_by(status='pending').count()
    
    return jsonify({
        "total_revenue": total_flow,          # Tổng doanh số (100%)
        "admin_commission": admin_commission, # Tiền của bạn (15%)
        "escrow_balance": escrow_balance,     # Tiền trả NCC (85%)
        "total_orders": Order.query.count(),
        "total_customers": User.query.filter_by(role=UserRole.CUSTOMER).count(),
        "pending_tours": Tour.query.filter_by(status='pending').count()
    }), 200

# 9. Báo cáo chi tiết theo tour (Admin)
@admin_bp.route('/dashboard/revenue-by-tour', methods=['GET'])
def get_admin_revenue_by_tour():
    # Lấy admin_commission 15% là doanh thu của admin
    tours = Tour.query.all()
    
    result = []
    for tour in tours:
        orders = Order.query.filter(
            db.and_(
                Order.tour_id == tour.id,
                # Admin quan tâm mọi trạng thái có tiền hoặc chỉ "Đã thanh toán"? Tương tự như supplier, lấy các đơn Đã thanh toán hoặc Hoàn thành
                Order.status.in_(['Đã thanh toán', 'Hoàn thành', 'paid', 'completed']) 
            )
        ).all()
        
        total = sum([o.total_price for o in orders])
        
        # Chỉ đưa vào kết quả nếu tour đó có doanh thu hoặc có yêu cầu hiển thị tất cả
        if total > 0:
            result.append({
                'tour_id': tour.id,
                'tour_name': tour.name,
                'total_revenue': total, # Tổng tiền khách đã trả
                'admin_commission': total * 0.15, # Tiền nền tảng nhận được
                'supplier_revenue': total * 0.85, # Tiền trả nhà cung cấp
                'total_bookings': len(orders)
            })
    
    # Sắp xếp theo tổng doanh thu giảm dần
    result.sort(key=lambda x: x['total_revenue'], reverse=True)
            
    return jsonify(result), 200
