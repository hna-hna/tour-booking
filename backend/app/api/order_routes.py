from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.order import Order
from app.models.tour import Tour

order_bp = Blueprint('orders', __name__)

@order_bp.route('/my-orders', methods=['GET'])
@jwt_required()
def get_my_orders():
    try:
        current_user_id = get_jwt_identity()
        
        # Lấy danh sách order, join với bảng Tour để lấy Tên và Hình ảnh
        orders = db.session.query(Order, Tour)\
            .join(Tour, Order.tour_id == Tour.id)\
            .filter(Order.user_id == current_user_id)\
            .order_by(Order.booking_date.desc())\
            .all()
            
        result = []
        for order, tour in orders:
            result.append({
                "id": order.id,
                "tour_id": tour.id,
                "tour_name": tour.name,
                "tour_image": tour.image,
                "total_price": order.total_price,
                "guest_count": order.guest_count,
                "status": order.status,
                "booking_date": order.booking_date.isoformat(),
            })
            
        return jsonify(result), 200
        
    except Exception as e:
        print("Lỗi lấy lịch sử đơn hàng:", e)
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500


@order_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    try:
        from flask import request
        current_user_id = get_jwt_identity()
        data = request.json
        
        tour_id = data.get('tour_id')
        total_price = data.get('total_price')
        guest_count = data.get('guest_count')
        
        if not tour_id or not total_price or not guest_count:
            return jsonify({"error": "Thiếu thông tin bắt buộc"}), 400
            
        new_order = Order(
            user_id=current_user_id,
            tour_id=tour_id,
            total_price=float(total_price),
            guest_count=int(guest_count),
            status='paid' # Giả định thanh toán thành công
        )
        
        db.session.add(new_order)
        db.session.commit()
        
        return jsonify({"msg": "Đặt tour thành công!", "order_id": new_order.id}), 201
        
    except Exception as e:
        db.session.rollback()
        print("Lỗi tạo đơn hàng:", e)
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500

@order_bp.route('/<int:order_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_order(order_id):
    from datetime import datetime
    try:
        current_user_id = get_jwt_identity()
        
        # Tìm order thuộc về user này
        order = Order.query.filter_by(id=order_id, user_id=current_user_id).first()
        
        if not order:
            return jsonify({"error": "Không tìm thấy đơn hàng"}), 404
            
        # Kiểm tra thời gian: chỉ cho phép hủy trong vòng 24h
        if order.booking_date:
            time_diff = datetime.utcnow() - order.booking_date
            if time_diff.total_seconds() > 24 * 3600:
                return jsonify({"error": "Đã quá thời hạn 24 giờ để hủy tour miễn phí."}), 400

        # Chỉ cho phép hủy nếu đơn hàng đang ở trạng thái pending hoặc paid
        if order.status not in ['pending', 'paid', 'Đã thanh toán']: 
            return jsonify({"error": "Không thể hủy đơn hàng ở trạng thái này."}), 400
            
        order.status = 'cancelled'
        db.session.commit()
        
        return jsonify({"msg": "Hủy đơn hàng thành công! Tiền sẽ được hoàn lại.", "order_id": order_id}), 200
        
    except Exception as e:
        db.session.rollback()
        print("Lỗi hủy đơn hàng:", e)
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500
