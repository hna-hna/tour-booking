from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from datetime import datetime

# Import các Model cần thiết cho việc truy vấn và Join bảng
from app.models.order import Order
from app.models.tour import Tour
from app.models.tour_guide import TourGuide ,TourGuideAssignment

order_bp = Blueprint('orders', __name__)

# ---------------------------------------------------------
# 1. LẤY CHI TIẾT ĐƠN HÀNG (Kèm thông tin Hướng dẫn viên)
# ---------------------------------------------------------
@order_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_detail(order_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Thực hiện Join 4 bảng để lấy đầy đủ thông tin:
        # Order -> Tour (để lấy tên tour)
        # Tour -> Assignment (bảng trung gian)
        # Assignment -> TourGuide (để lấy thông tin người dẫn đoàn)
        result = db.session.query(Order, Tour, TourGuide)\
            .join(Tour, Order.tour_id == Tour.id)\
            .outerjoin(TourGuideAssignment, Tour.id == TourGuideAssignment.tour_id)\
            .outerjoin(TourGuide, TourGuideAssignment.guide_id == TourGuide.id)\
            .filter(Order.id == order_id, Order.user_id == current_user_id)\
            .first()

        if not result:
            return jsonify({"error": "Không tìm thấy đơn hàng hoặc bạn không có quyền xem"}), 404
        
        order, tour, guide = result

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
                "price_per_person": tour.price,
                "start_date": tour.start_date.isoformat() if tour.start_date and hasattr(tour.start_date, 'isoformat') else tour.start_date,
                "end_date": tour.end_date.isoformat() if tour.end_date and hasattr(tour.end_date, 'isoformat') else tour.end_date
            },
            # Trả về thông tin HDV nếu đã được phân công
            "guide": {
                "id": guide.id,
                "user_id": str(guide.user_id), # Dùng ID này để Front-end mở trang Chat
                "full_name": guide.full_name,
                "phone": guide.phone,
                "license_number": guide.license_number,
                "email": guide.email,
                "languages": guide.languages,
                "specialties": guide.specialties,
                "years_of_experience": guide.years_of_experience
            } if guide else None,
            "payment": {
                "method": "Thanh toán trực tuyến",
                "transaction_id": f"PAY{order.id:06d}",
                "payment_date": order.booking_date.isoformat() if order.booking_date else None
            }
        }), 200
    except Exception as e:
        print(f"Lỗi lấy chi tiết đơn hàng: {e}")
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500

# ---------------------------------------------------------
# 2. LẤY DANH SÁCH LỊCH SỬ ĐƠN HÀNG CỦA TÔI
# ---------------------------------------------------------
@order_bp.route('/my-orders', methods=['GET'])
@jwt_required()
def get_my_orders():
    try:
        current_user_id = get_jwt_identity()
        
        # Lấy các đơn hàng của User hiện tại, sắp xếp mới nhất lên đầu
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
        print(f"Lỗi lấy lịch sử đơn hàng: {e}")
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500

# ---------------------------------------------------------
# 3. TẠO ĐƠN ĐẶT TOUR MỚI
# ---------------------------------------------------------
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
            status='paid' # Mặc định sau khi đặt là đã thanh toán
        )
        
        db.session.add(new_order)
        db.session.commit()
        
        return jsonify({"msg": "Đặt tour thành công!", "order_id": new_order.id}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Lỗi tạo đơn hàng: {e}")
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500

# ---------------------------------------------------------
# 4. HỦY ĐƠN HÀNG (Trong vòng 24h)
# ---------------------------------------------------------
@order_bp.route('/<int:order_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_order(order_id):
    try:
        current_user_id = get_jwt_identity()
        order = Order.query.filter_by(id=order_id, user_id=current_user_id).first()
        
        if not order:
            return jsonify({"error": "Không tìm thấy đơn hàng"}), 404
            
        # Logic kiểm tra thời gian 24 giờ
        if order.booking_date:
            time_diff = datetime.utcnow() - order.booking_date
            if time_diff.total_seconds() > 24 * 3600:
                return jsonify({"error": "Đã quá thời hạn 24 giờ để hủy tour miễn phí."}), 400

        # Kiểm tra trạng thái đơn hàng có được phép hủy không
        if order.status not in ['pending', 'paid', 'Đã thanh toán']: 
            return jsonify({"error": "Không thể hủy đơn hàng ở trạng thái này."}), 400
            
        order.status = 'cancelled'
        db.session.commit()
        
        return jsonify({"msg": "Hủy đơn hàng thành công!", "order_id": order_id}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Lỗi hủy đơn hàng: {e}")
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500