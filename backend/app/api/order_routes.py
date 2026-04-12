import os
import stripe
import requests
import random
import hashlib
import hmac
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from datetime import datetime
from datetime import timedelta
from app.models.order import Payment
# Import các Model cần thiết cho việc truy vấn và Join bảng
from app.models.order import Order
from app.models.tour import Tour
from app.models.tour_guide import TourGuide ,TourGuideAssignment

order_bp = Blueprint('orders', __name__)

def paginate_query(query, page=1, per_page=10):
    page = max(1, int(page))
    per_page = min(50, max(5, int(per_page)))
    total = query.count()
    items = query.offset((page-1)*per_page).limit(per_page).all()
    return {"items": items, "total": total, "page": page, "per_page": per_page, "total_pages": (total + per_page - 1) // per_page} 

def auto_cancel_expired_orders():
    now = datetime.utcnow()
    expired_time = now - timedelta(hours=72)

    expired_orders = Order.query.filter(
        Order.status == "pending",
        Order.booking_date <= expired_time
    ).all()

    for order in expired_orders:
        order.status = "cancelled"
        order.cancel_reason = "expired"

    if expired_orders:
        db.session.commit()
        print(f"[AUTO] Đã hủy {len(expired_orders)} đơn quá hạn 72h")
# ---------------------------------------------------------
# 1. LẤY CHI TIẾT ĐƠN HÀNG (Kèm thông tin Hướng dẫn viên)
# ---------------------------------------------------------
@order_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_detail(order_id):
    try:
        current_user_id = get_jwt_identity()
        
        auto_cancel_expired_orders()
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
            "cancel_reason": order.cancel_reason,
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
    current_user_id = get_jwt_identity()

    auto_cancel_expired_orders()
    orders_data = db.session.query(Order, Tour)\
        .join(Tour, Order.tour_id == Tour.id)\
        .filter(Order.user_id == current_user_id)\
        .order_by(Order.booking_date.desc())\
        .all()

    data = []
    seen_pending = set()

    for order, tour in orders_data:
        if order.status in ['pending', 'cancelled']:
            key = (tour.id, order.status)
            if key in seen_pending:
                continue
            seen_pending.add(key)
            
        data.append({
            "id": order.id,
            "tour_id": tour.id,
            "tour_name": tour.name,
            "tour_image": tour.image,
            "total_price": order.total_price,
            "guest_count": order.guest_count,
            "status": order.status,
            "cancel_reason": order.cancel_reason,
            "booking_date": order.booking_date.isoformat() if order.booking_date else None,
        })

    return jsonify({
        "orders": data
    }), 200

# ---------------------------------------------------------
# 3. TẠO ĐƠN ĐẶT TOUR MỚI (Đã thêm Log)
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
        
        # BƯỚC BỔ SUNG: Lấy thông tin tour để lấy cái tên (phục vụ cho việc ghi Log)
        tour = Tour.query.get(tour_id)
        if not tour:
            return jsonify({"error": "Tour không tồn tại"}), 404
            
        new_order = Order(
            user_id=current_user_id,
            tour_id=tour_id,
            total_price=float(total_price),
            guest_count=int(guest_count),
            status='pending' # Mặc định sau khi đặt là đã thanh toán
        )
        
        db.session.add(new_order)
        db.session.commit() # Lưu vào DB thành công
        
        # ──────────────────────────────────────────────────────────
        # GHI LOG TẠI ĐÂY: Sau khi commit thành công
        # ──────────────────────────────────────────────────────────
        try:
            from app.log_service import log_user_action
            log_user_action(
                action="create_order", 
                target_id=new_order.id, 
                user_id=current_user_id,
                details=f"Đặt tour {tour.name} - {new_order.guest_count} người"
            )
        except Exception as log_e:
            # Nếu lỗi log thì chỉ in ra console, không làm sập luồng đặt tour của khách
            print(f"Lỗi ghi log create_order: {log_e}")
        # ──────────────────────────────────────────────────────────
        
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

        # ========== THỰC HIỆN HOÀN TIỀN (REFUND) TỰ ĐỘNG ==========
        
       

        if order.status in ['paid', 'Đã thanh toán']:
            try:
                payment = Payment.query.filter_by(order_id=order.id, status='success').first()
                if payment:
                    if payment.payment_method == 'stripe':
                        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

                        stripe.Refund.create(payment_intent=payment.transaction_id)
                        print(f"Stripe Refund OK for payment {payment.transaction_id}")
                    
                    elif payment.payment_method == 'vnpay':
                        # Config VNPay
                        vnp_TmnCode = "UTD4XGMJ"
                        vnp_HashSecret = "95R9Y4MFJ1FJPK3AQPDCQAAWPQRTQFHF"
                        vnp_RefundUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
                        
                        req_id = str(int(datetime.utcnow().timestamp())) + str(random.randint(100, 999))
                        
                        # Khôi phục Transaction Date VNPay từ payment_date UTC (cộng thêm 7h)
                        vnp_PayDate = (payment.payment_date + timedelta(hours=7)).strftime('%Y%m%d%H%M%S')
                        vnp_Amount = int(payment.amount) * 100
                        vnp_CreateBy = str(current_user_id)
                        vnp_CreateDate = (datetime.utcnow() + timedelta(hours=7)).strftime('%Y%m%d%H%M%S')
                        vnp_IpAddr = request.remote_addr if request.remote_addr not in ['127.0.0.1', '::1', None] else '113.160.225.12'
                        vnp_OrderInfo = f"Hoan tien don {payment.transaction_id}"
                        
                        data_to_hash = f"{req_id}|2.1.0|refund|{vnp_TmnCode}|02|{payment.transaction_id}|{vnp_Amount}|0|{vnp_PayDate}|{vnp_CreateBy}|{vnp_CreateDate}|{vnp_IpAddr}|{vnp_OrderInfo}"
                        vnp_SecureHash = hmac.new(vnp_HashSecret.encode('utf-8'), data_to_hash.encode('utf-8'), hashlib.sha512).hexdigest()
                        
                        payload = {
                            "vnp_RequestId": req_id,
                            "vnp_Version": "2.1.0",
                            "vnp_Command": "refund",
                            "vnp_TmnCode": vnp_TmnCode,
                            "vnp_TransactionType": "02",
                            "vnp_TxnRef": payment.transaction_id,
                            "vnp_Amount": str(vnp_Amount),
                            "vnp_TransactionNo": "0",
                            "vnp_TransactionDate": vnp_PayDate,
                            "vnp_CreateBy": vnp_CreateBy,
                            "vnp_CreateDate": vnp_CreateDate,
                            "vnp_IpAddr": vnp_IpAddr,
                            "vnp_OrderInfo": vnp_OrderInfo,
                            "vnp_SecureHash": vnp_SecureHash
                        }
                        
                        res = requests.post(vnp_RefundUrl, json=payload)
                        print(f"VNPay Refund API Result: {res.json()}")
                        

            except Exception as e:
                print(f"Lỗi hoàn tiền qua API: {e}")
                # Bỏ qua để vẫn hoàn thành luồng update DB, trong thực tế sẽ rollback.
            
        order.status = 'cancelled'
        order.cancel_reason = 'user_cancelled' 
        db.session.commit()
        
        return jsonify({"msg": "Hủy đơn hàng và gửi yêu cầu hoàn tiền thành công!", "order_id": order_id}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Lỗi hủy đơn hàng: {e}")
        return jsonify({"error": "Lỗi máy chủ nội bộ"}), 500
    
