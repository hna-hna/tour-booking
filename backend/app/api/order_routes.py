from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.order import Order
from app.models.tour import Tour
from datetime import datetime

order_bp = Blueprint('orders', __name__)

# 1. Lấy danh sách đơn hàng của tôi
@order_bp.route('/my-orders', methods=['GET'])
@jwt_required()
def get_my_orders():
    try:
        current_user_id = get_jwt_identity()
        
        # Join Order với Tour để lấy tên và ảnh minh họa
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
                "booking_date": order.booking_date.isoformat() if order.booking_date else None,
            })
            
        return jsonify(result), 200
        
    except Exception as e:
        print("Lỗi lấy lịch sử đơn hàng:", e)
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500

# 2. Lấy chi tiết một đơn hàng (Gộp từ nhánh nnna)
@order_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_details(order_id):
    try:
        current_user_id = get_jwt_identity()
        from app.models.order import Payment
        
        # Query bộ ba: Order, Tour và thông tin Payment (nếu có)
        result = db.session.query(Order, Tour, Payment)\
            .join(Tour, Order.tour_id == Tour.id)\
            .outerjoin(Payment, Order.id == Payment.order_id)\
            .filter(Order.id == order_id, Order.user_id == current_user_id)\
            .first()
            
        if not result:
            return jsonify({"error": "Không tìm thấy đơn hàng hoặc bạn không có quyền xem."}), 404
            
        order, tour, payment = result
        
        return jsonify({
            "id": order.id,
            "status": order.status,
            "total_price": order.total_price,
            "guest_count": order.guest_count,
            "booking_date": order.booking_date.isoformat() if order.booking_date else None,
            "tour": {
                "id": tour.id,
                "name": tour.name,
                "image": tour.image,
                "itinerary": tour.itinerary,
                "price_per_person": tour.price
            },
            "payment": {
                "method": payment.payment_method if payment else "Chưa thanh toán",
                "transaction_id": payment.transaction_id if payment else None,
                "payment_date": payment.payment_date.isoformat() if payment and payment.payment_date else None,
            }
        }), 200
        
    except Exception as e:
        print("Lỗi lấy chi tiết đơn hàng:", str(e))
        return jsonify({"error": f"Lỗi máy chủ: {str(e)}"}), 500

# 3. Tạo đơn hàng mới
@order_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    try:
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
            status='paid' # Giả định thanh toán thành công ngay khi tạo
        )
        
        db.session.add(new_order)
        db.session.commit()
        
        return jsonify({"msg": "Đặt tour thành công!", "order_id": new_order.id}), 201
        
    except Exception as e:
        db.session.rollback()
        print("Lỗi tạo đơn hàng:", e)
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500

# 4. Hủy đơn hàng (Chỉ cho phép trong vòng 24h)
@order_bp.route('/<int:order_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_order(order_id):
    try:
        current_user_id = get_jwt_identity()
        order = Order.query.filter_by(id=order_id, user_id=current_user_id).first()
        
        if not order:
            return jsonify({"error": "Không tìm thấy đơn hàng"}), 404
            
        # Kiểm tra điều kiện thời gian
        if order.booking_date:
            time_diff = datetime.utcnow() - order.booking_date
            if time_diff.total_seconds() > 24 * 3600:
                return jsonify({"error": "Đã quá thời hạn 24 giờ để hủy tour miễn phí."}), 400

        # Kiểm tra trạng thái có thể hủy
        if order.status not in ['pending', 'paid', 'Đã thanh toán']: 
            return jsonify({"error": "Không thể hủy đơn hàng ở trạng thái này."}), 400
            
        order.status = 'cancelled'
        db.session.commit()
        
        return jsonify({"msg": "Hủy đơn hàng thành công! Tiền sẽ được hoàn lại.", "order_id": order_id}), 200
        
    except Exception as e:
        db.session.rollback()
        print("Lỗi hủy đơn hàng:", e)
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500