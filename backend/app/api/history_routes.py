# backend/app/api/history_routes.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Order, Tour # Nhớ import đủ model

history_bp = Blueprint('history', __name__)

# API 1: XEM DANH SÁCH ĐƠN HÀNG 
@history_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_my_orders():
    current_user_id = get_jwt_identity()
    
    # Lấy đơn hàng của user này, sắp xếp ngày đặt mới nhất lên đầu
    orders = db.session.query(Order).filter(Order.user_id == current_user_id)\
                       .order_by(Order.booking_date.desc()).all()
    
    results = []
    for order in orders:
        # Lấy thông tin Tour tương ứng
        tour = db.session.get(Tour, order.tour_id)
        
        results.append({
            "id": order.id,
            "tour_name": tour.name if tour else "Tour đã bị xóa",
            "image": getattr(tour, 'image', ''), # Link ảnh tour nếu có
            "booking_date": order.booking_date.strftime('%Y-%m-%d %H:%M'),
            "start_date": order.start_date.strftime('%Y-%m-%d'),
            "guest_count": order.guest_count,
            "total_price": order.total_price,
            "status": order.status  # pending, paid, cancelled, completed
        })
        
    return jsonify(results), 200

# API HỦY ĐƠN HÀNG
@history_bp.route('/orders/<int:order_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_order(order_id):
    current_user_id = get_jwt_identity()
    
    # 1. Tìm đơn hàng
    order = db.session.get(Order, order_id)
    
    if not order:
        return jsonify({"msg": "Không tìm thấy đơn hàng"}), 404
        
    # 2. Check quyền: Có phải đơn của user này không?
    # (Tránh trường hợp user A đoán ID đơn của user B để hủy phá)
    if str(order.user_id) != str(current_user_id):
        return jsonify({"msg": "Bạn không có quyền hủy đơn này"}), 403
        
    # 3. Check trạng thái: Chỉ cho hủy khi chưa thanh toán (pending)
    if order.status != 'pending':
        return jsonify({"msg": "Chỉ có thể hủy đơn hàng khi đang chờ thanh toán!"}), 400
        
    try:
        # Cập nhật trạng thái
        order.status = 'cancelled'
        db.session.commit()
        return jsonify({"msg": "Đã hủy đơn hàng thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Lỗi hệ thống: " + str(e)}), 500