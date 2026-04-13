import os
import stripe
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.order import Order, Payment 
from datetime import datetime
from app.utils.vnpay import vnpay
import urllib.parse

payment_bp = Blueprint('payment', __name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
@payment_bp.route('/create-payment-intent', methods=['POST'])
@jwt_required()
def create_payment():
    try:
        user_id = get_jwt_identity()
        data = request.json
        amount = data.get('amount')
        tour_id = data.get('tour_id')
        guests = data.get('guests')
        date_str = data.get('date')

        booking_date = datetime.utcnow()
        if date_str:
            try:
                booking_date = datetime.strptime(date_str, '%Y-%m-%d')
            except: pass

        intent = stripe.PaymentIntent.create(
            amount=int(amount),
            currency='vnd',
            metadata={'user_id': user_id, 'tour_id': tour_id}
        )

        new_order = Order(
            user_id=user_id, tour_id=tour_id, guest_count=guests,
            total_price=amount, booking_date=booking_date, status='pending'
        )
        db.session.add(new_order)
        db.session.flush()

        new_payment = Payment(
            order_id=new_order.id, amount=amount, payment_method='stripe',
            transaction_id=intent.id, status='pending'
        )
        db.session.add(new_payment)
        db.session.commit()
        
        return jsonify({'clientSecret': intent.client_secret, 'orderId': new_order.id})
    except Exception as e:
        db.session.rollback()
        return jsonify(error=str(e)), 403

@payment_bp.route('/confirm-order', methods=['POST'])
def confirm_order():
    try:
        data = request.json
        payment_intent_id = data.get('payment_intent_id')
        payment = Payment.query.filter_by(transaction_id=payment_intent_id).first()

        if not payment: return jsonify(msg="Không tìm thấy giao dịch này"), 404

        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        if intent.status == 'succeeded':
            payment.status = 'success'
            order = Order.query.get(payment.order_id)
            if order: order.status = 'paid'
            db.session.commit()
            return jsonify(msg="Xác nhận thanh toán thành công"), 200
        else:
            return jsonify(msg="Thanh toán chưa hoàn tất trên Stripe"), 400
    except Exception as e:
        return jsonify(error=str(e)), 500
VNP_TMN_CODE = "UTD4XGMJ"
VNP_HASH_SECRET = "95R9Y4MFJ1FJPK3AQPDCQAAWPQRTQFHF" 

VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNP_RETURN_URL = "http://localhost:3000/vnpay-return"

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
        
        order_desc = f"ThanhToan_{tour_id}_{int(datetime.now().timestamp())}"

        new_order = Order(
            user_id=user_id, tour_id=tour_id, guest_count=guests,
            total_price=amount, booking_date=booking_date, status='pending'
        )
        db.session.add(new_order)
        db.session.flush()

        vnp_TxnRef = str(int(datetime.now().timestamp()))

        new_payment = Payment(
            order_id=new_order.id, amount=amount, payment_method='vnpay',
            transaction_id=vnp_TxnRef, status='pending'
        )
        db.session.add(new_payment)
        db.session.commit()

        vnp = vnpay()
        vnp.requestData['vnp_Version'] = '2.1.0'
        vnp.requestData['vnp_Command'] = 'pay'
        vnp.requestData['vnp_TmnCode'] = VNP_TMN_CODE
        vnp.requestData['vnp_Amount'] = str(amount * 100)
        vnp.requestData['vnp_CurrCode'] = 'VND'
        vnp.requestData['vnp_TxnRef'] = vnp_TxnRef
        vnp.requestData['vnp_OrderInfo'] = order_desc
        vnp.requestData['vnp_OrderType'] = 'other'
        vnp.requestData['vnp_Locale'] = 'vn'
        
        ipaddr = request.remote_addr
        if ipaddr in ['127.0.0.1', '::1', None]:
            ipaddr = '113.160.225.12'
        vnp.requestData['vnp_IpAddr'] = ipaddr
        
        vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
        vnp.requestData['vnp_ReturnUrl'] = VNP_RETURN_URL
        
        vnpay_payment_url = vnp.get_payment_url(VNP_URL, VNP_HASH_SECRET)
        return jsonify({'paymentUrl': vnpay_payment_url})

    except Exception as e:
        print("Lỗi VNPay:", str(e))
        return jsonify(error=str(e)), 500

@payment_bp.route('/vnpay_return', methods=['GET'])
def vnpay_return_verify():
    inputData = request.args
    if inputData:
        vnp = vnpay()
        vnp.responseData = inputData.to_dict()
        
        order_id = inputData.get('vnp_TxnRef')
        vnp_ResponseCode = inputData.get('vnp_ResponseCode')
        
        if vnp.validate_response(VNP_HASH_SECRET):
            payment = Payment.query.filter_by(transaction_id=order_id).first()
            if payment:
                if vnp_ResponseCode == "00":
                    payment.status = 'success'
                    order = Order.query.get(payment.order_id)
                    if order: order.status = 'paid'
                    db.session.commit()
                    return jsonify({"RspCode": "00", "Message": "Confirm Success"})
                else:
                    payment.status = 'failed'
                    db.session.commit()
                    return jsonify({"RspCode": "01", "Message": "Payment Failed"})
            else:
                return jsonify({"RspCode": "02", "Message": "Order Not Found"})
        else:
            return jsonify({"RspCode": "97", "Message": "Invalid Signature"})
    else:
        return jsonify({"RspCode": "99", "Message": "Invalid Request"})