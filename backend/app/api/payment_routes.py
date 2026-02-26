# File: backend/payment_route.py
import os
import stripe
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
# Import cả Order và Payment từ file models
from app.models.order import Order, Payment 
from datetime import datetime
from app.utils.vnpay import vnpay
from datetime import datetime
import urllib.parse

payment_bp = Blueprint('payment', __name__)

# Cấu hình Secret Key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
# 1. API TẠO PAYMENT INTENT + LƯU ĐƠN HÀNG + LƯU GIAO DỊCH
@payment_bp.route('/create-payment-intent', methods=['POST'])
@jwt_required()
def create_payment():
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        amount = data.get('amount')
        tour_id = data.get('tour_id')
        guests = data.get('guests')
        date_str = data.get('date') # 'YYYY-MM-DD'

        # Xử lý ngày tháng
        booking_date = datetime.utcnow()
        if date_str:
            try:
                # Chuyển string thành object datetime
                booking_date = datetime.strptime(date_str, '%Y-%m-%d')
            except:
                pass

        # A. Tạo Intent trên Stripe
        intent = stripe.PaymentIntent.create(
            amount=int(amount),
            currency='vnd',
            metadata={
                'user_id': user_id,
                'tour_id': tour_id
            }
        )

        # B. Lưu Order (Dùng guest_count thay vì quantity)
        new_order = Order(
            user_id=user_id,
            tour_id=tour_id,
            guest_count=guests,   # <--- ĐÃ SỬA: Khớp với model Order
            total_price=amount,
            booking_date=booking_date,
            status='pending'      # Trạng thái chờ
        )
        
        db.session.add(new_order)
        db.session.flush() # Flush để lấy new_order.id ngay lập tức (chưa commit hẳn)

        # C. Lưu vào bảng Payment (Để giữ mã transaction_id)
        new_payment = Payment(
            order_id=new_order.id,
            amount=amount,
            payment_method='stripe',
            transaction_id=intent.id, # <--- Lưu mã Stripe (pi_...) vào đây
            status='pending'
        )
        
        db.session.add(new_payment)
        db.session.commit() # Lưu cả 2 bảng cùng lúc
        
        return jsonify({
            'clientSecret': intent.client_secret,
            'orderId': new_order.id
        })
    except Exception as e:
        db.session.rollback() # Hoàn tác nếu lỗi
        print("Lỗi tạo đơn:", str(e))
        return jsonify(error=str(e)), 403

# 2. API XÁC NHẬN ĐƠN HÀNG
@payment_bp.route('/confirm-order', methods=['POST'])
def confirm_order():
    try:
        data = request.json
        payment_intent_id = data.get('payment_intent_id')

        # 1. Tìm bản ghi Payment dựa trên mã giao dịch Stripe
        payment = Payment.query.filter_by(transaction_id=payment_intent_id).first()

        if not payment:
            return jsonify(msg="Không tìm thấy giao dịch này"), 404

        # 2. Kiểm tra trạng thái trên Stripe cho chắc chắn
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status == 'succeeded':
            # Cập nhật bảng Payment
            payment.status = 'success'
            
            # Cập nhật bảng Order liên quan
            order = Order.query.get(payment.order_id)
            if order:
                order.status = 'paid' # Đổi trạng thái đơn hàng thành đã thanh toán
            
            db.session.commit()
            return jsonify(msg="Xác nhận thanh toán thành công"), 200
        else:
            return jsonify(msg="Thanh toán chưa hoàn tất trên Stripe"), 400

    except Exception as e:
        return jsonify(error=str(e)), 500
    # CẤU HÌNH VNPAY (Thay bằng mã thật của bạn)
VNP_TMN_CODE = "G1Z7RSKY"
VNP_HASH_SECRET = "D2MH27P6OT4M4F6AJQQ4E06Y7GJ0H6U2"
VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"

# URL trả về (Frontend)
VNP_RETURN_URL = "http://localhost:3000/vnpay-return"

# ---------------------------------------------------------
# 3. API TẠO URL THANH TOÁN VNPAY
# ---------------------------------------------------------
@payment_bp.route('/create_payment_vnpay', methods=['POST'])
@jwt_required()
def create_payment_vnpay():
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        amount = int(data.get('amount'))
        tour_id = data.get('tour_id')
        guests = data.get('guests')
        date_str = data.get('date')
        booking_date = datetime.strptime(date_str, '%Y-%m-%d') if date_str else datetime.utcnow()
        order_desc = f"Thanh toan don hang {datetime.now().timestamp()}"

        # A. Lưu đơn hàng vào DB trước (Status: Pending)
        new_order = Order(
            user_id=user_id,
            tour_id=tour_id,
            guest_count=guests,
            total_price=amount,
            booking_date=booking_date,
            status='pending'
        )
        db.session.add(new_order)
        db.session.flush()

        # B. Tạo mã giao dịch VNPay (Phải là duy nhất)
        vnp_TxnRef = str(int(datetime.now().timestamp())) # Hoặc dùng new_order.id kết hợp timestamp

        # C. Lưu vào bảng Payment (Status: Pending)
        new_payment = Payment(
            order_id=new_order.id,
            amount=amount,
            payment_method='vnpay',
            transaction_id=vnp_TxnRef, # Lưu mã tham chiếu này để đối soát
            status='pending'
        )
        db.session.add(new_payment)
        db.session.commit()

        # D. Gọi thư viện VNPay để tạo URL
        vnp = vnpay()
        vnp.requestData['vnp_Version'] = '2.1.0'
        vnp.requestData['vnp_Command'] = 'pay'
        vnp.requestData['vnp_TmnCode'] = VNP_TMN_CODE
        vnp.requestData['vnp_Amount'] = str(amount * 100) # VNPay yêu cầu nhân 100
        vnp.requestData['vnp_CurrCode'] = 'VND'
        vnp.requestData['vnp_TxnRef'] = vnp_TxnRef
        vnp.requestData['vnp_OrderInfo'] = order_desc
        vnp.requestData['vnp_OrderType'] = 'other'
        vnp.requestData['vnp_Locale'] = 'vn'
        
        # IP khách hàng (Lấy tạm localhost nếu chạy local)
        ipaddr = request.remote_addr
        vnp.requestData['vnp_IpAddr'] = ipaddr
        
        vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
        vnp.requestData['vnp_ReturnUrl'] = VNP_RETURN_URL
        
        vnpay_payment_url = vnp.get_payment_url(VNP_URL, VNP_HASH_SECRET)
        
        return jsonify({'paymentUrl': vnpay_payment_url})

    except Exception as e:
        print("Lỗi VNPay:", str(e))
        return jsonify(error=str(e)), 500

# ---------------------------------------------------------
# 4. API XỬ LÝ KẾT QUẢ VNPAY TRẢ VỀ (Frontend gọi cái này)
# ---------------------------------------------------------
@payment_bp.route('/vnpay_return', methods=['GET'])
def vnpay_return_verify():
    inputData = request.args
    if inputData:
        vnp = vnpay()
        vnp.responseData = inputData.to_dict()
        
        order_id = inputData.get('vnp_TxnRef')
        amount = int(inputData.get('vnp_Amount')) / 100
        order_desc = inputData.get('vnp_OrderInfo')
        vnp_ResponseCode = inputData.get('vnp_ResponseCode')
        
        # Kiểm tra Checksum để đảm bảo dữ liệu không bị giả mạo
        if vnp.validate_response(VNP_HASH_SECRET):
            # Checksum đúng
            
            # Tìm Payment trong DB dựa trên vnp_TxnRef (transaction_id)
            payment = Payment.query.filter_by(transaction_id=order_id).first()
            
            if payment:
                if vnp_ResponseCode == "00":
                    # Thanh toán thành công
                    print(f"Thanh toán thành công: {order_id}")
                    payment.status = 'success'
                    
                    # Update Order
                    order = Order.query.get(payment.order_id)
                    if order:
                         order.status = 'paid'
                    
                    db.session.commit()
                    return jsonify({"RspCode": "00", "Message": "Confirm Success"})
                else:
                    # Thanh toán thất bại / Hủy
                    print(f"Thanh toán thất bại: {order_id}")
                    payment.status = 'failed'
                    db.session.commit()
                    return jsonify({"RspCode": "01", "Message": "Payment Failed"})
            else:
                return jsonify({"RspCode": "02", "Message": "Order Not Found"})
        else:
            return jsonify({"RspCode": "97", "Message": "Invalid Signature"})
    else:
        return jsonify({"RspCode": "99", "Message": "Invalid Request"})