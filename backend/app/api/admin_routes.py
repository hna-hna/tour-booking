from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.tour import Tour
from app.models.user import User, UserRole  
from app.models.order import Order         
from sqlalchemy import func, extract
from datetime import datetime, timedelta, date
from flask_jwt_extended import jwt_required, get_jwt_identity 

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/tours/pending', methods=['GET'])
@jwt_required()
#@role_required(['admin'])  
def get_pending_tours():
    tours = Tour.query.filter(Tour.status.in_(['pending', 'cancel_requested'])).all()
    
    result = []
    for t in tours:
        # Xử lý an toàn nếu description bị None
        desc = getattr(t, 'description', '') or ''
        
        result.append({
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "quantity": t.quantity,
            "description": desc,
            "supplier_id": t.supplier_id,
            "created_at": t.created_at.strftime('%Y-%m-%d %H:%M:%S') if t.created_at else None,
            "status": t.status,
            "start_date": t.start_date.strftime('%Y-%m-%d') if t.start_date else None
        })
    return jsonify(result), 200

@admin_bp.route('/tours/history', methods=['GET'])
def get_tours_history():
    tours = Tour.query.filter(Tour.status.in_(['approved', 'rejected', 'cancelled'])).all()
    
    result = []
    for t in tours:
        desc = getattr(t, 'description', '') or ''
        
        result.append({
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "quantity": t.quantity,
            "description": desc,
            "supplier_id": t.supplier_id,
            "created_at": t.created_at.strftime('%Y-%m-%d %H:%M:%S') if t.created_at else None,
            "status": t.status,
            "start_date": t.start_date.strftime('%Y-%m-%d') if t.start_date else None
        })
    return jsonify(result), 200

@admin_bp.route('/tours/cancel-requests', methods=['GET'])
def get_cancel_requests():
    tours = Tour.query.filter_by(status='cancel_requested').all()

    result = []
    for t in tours:
        result.append({
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "supplier_id": t.supplier_id,
            "status": t.status,
            "created_at": t.created_at.strftime('%Y-%m-%d %H:%M:%S') if t.created_at else None
        })

    return jsonify(result), 200





@admin_bp.route('/tours/<int:tour_id>/cancel', methods=['PUT'])
def handle_cancel_request(tour_id):
    data = request.get_json()
    action = data.get('action') 

    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({"msg": "Tour không tồn tại"}), 404

    if tour.status != 'cancel_requested':
        return jsonify({"msg": "Tour không ở trạng thái chờ hủy"}), 400

    try:
        if action == 'approve':
            tour.status = 'cancelled'
            msg = "Đã duyệt hủy tour"
        elif action == 'reject':
            tour.status = 'approved' 
            msg = "Đã từ chối yêu cầu hủy"
        else:
            return jsonify({"msg": "Hành động không hợp lệ"}), 400

        db.session.commit()
        return jsonify({"msg": msg, "status": tour.status}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/tours/<int:tour_id>/moderate', methods=['PUT'])
@jwt_required()
def moderate_tour(tour_id):
    data = request.get_json()
    action = data.get('action')
    reject_reason = data.get('reject_reason')
    
    tour = Tour.query.get(tour_id)
    if not tour:
        return jsonify({"msg": "Tour không tồn tại"}), 404
        
    if action == 'approve':
        tour.status = 'approved'
        tour.reject_reason = None
        msg = "Đã duyệt tour thành công"
    elif action == 'reject':
        tour.status = 'rejected'
        if reject_reason:
            tour.reject_reason = reject_reason
        msg = "Đã từ chối tour"
    else:
        return jsonify({"msg": "Hành động không hợp lệ"}), 400
        
    db.session.commit()
    return jsonify({"msg": msg, "status": tour.status}), 200




@admin_bp.route('/users', methods=['GET'])
def get_all_users():
    status_filter = request.args.get('status', 'all')
    
    query = User.query
    
    try:
        if status_filter == 'active':
            query = query.filter_by(is_active=True, is_deleted=False)
        elif status_filter == 'locked':
            query = query.filter_by(is_active=False, is_deleted=False)
        elif status_filter == 'deleted':
            query = query.filter_by(is_deleted=True)
        else:
            query = query.filter_by(is_deleted=False)
        
        users = query.all()
    except Exception as e:
        print(f"Error fetching users: {e}")
        db.session.rollback()
        users = User.query.all()

    return jsonify([
        {
            'id': u.id,
            'full_name': u.full_name,
            'email': u.email,
            'role': u.role.value,
            'is_active': u.is_active,
            'is_deleted': u.is_deleted,
            'created_at': u.created_at.strftime('%Y-%m-%d %H:%M:%S') if u.created_at else None
        } for u in users
    ]), 200

@admin_bp.route('/users/<user_id>/toggle-status', methods=['PUT'])
def toggle_user_status(user_id):
    user = User.query.get_or_404(user_id)
    
    try:
        user.is_active = not user.is_active
        db.session.commit()
        
        status_text = "Hoạt động" if user.is_active else "Đã khóa"
        return jsonify({'message': f'Trạng thái user đã đổi thành: {status_text}', 'is_active': user.is_active}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('full_name') or not data.get('role'):
        return jsonify({"msg": "Thiếu thông tin bắt buộc"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email đã tồn tại"}), 409

    try:
        role_enum = UserRole(data['role'])
    except ValueError:
        return jsonify({'msg': 'Role không hợp lệ'}), 400

    new_user = User(
        email=data['email'],
        full_name=data['full_name'],
        role=role_enum
    )
    new_user.set_password("123456")

    try:
        db.session.add(new_user)
        db.session.flush()

        if role_enum == UserRole.GUIDE:
            from app.models.tour_guide import TourGuide, GuideStatus
            guide_profile = TourGuide(
                user_id=new_user.id,
                full_name=new_user.full_name,
                email=new_user.email,
                status=GuideStatus.AVAILABLE
            )
            db.session.add(guide_profile)

        db.session.commit()
        return jsonify({"msg": "Tạo người dùng thành công. Mật khẩu mặc định: 123456"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['PUT'])
def update_user_info(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'full_name' in data:
        user.full_name = data['full_name']
    
    if 'email' in data:
        if data['email'] != user.email and User.query.filter_by(email=data['email']).first():
            return jsonify({'msg': 'Email đã tồn tại'}), 409
        user.email = data['email']
    
    if 'role' in data:
        try:
            user.role = UserRole(data['role'])
        except ValueError:
            return jsonify({'msg': 'Role không hợp lệ'}), 400
            
    try:
        db.session.commit()
        return jsonify({'message': 'Cập nhật thông tin thành công'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    
    try:
        user.is_deleted = True
        user.is_active = False 
        db.session.commit()
        return jsonify({'message': 'Đã xóa người dùng thành công (Xóa mềm)'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/orders', methods=['GET'])
def get_all_orders():
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
        
        
@admin_bp.route('/dashboard/stats', methods=['GET'])
def get_admin_dashboard_stats():
    period = request.args.get('period', 'all')
    now = datetime.utcnow()
    
    curr_start, curr_end = None, None
    prev_start, prev_end = None, None
    
    if period == 'month':
        curr_start = date(now.year, now.month, 1)
        curr_end = now
        if now.month == 1:
            prev_start = date(now.year - 1, 12, 1)
            prev_end = date(now.year - 1, 12, 31)
        else:
            prev_start = date(now.year, now.month - 1, 1)
            prev_end = curr_start - timedelta(days=1)
            
    elif period == 'year':
        curr_start = date(now.year, 1, 1)
        curr_end = now
        prev_start = date(now.year - 1, 1, 1)
        prev_end = date(now.year - 1, 12, 31)

    def get_revenue(start, end):
        query = db.session.query(func.sum(Order.total_price)).filter(
            Order.status.in_(['Đã thanh toán', 'Hoàn thành', 'paid', 'completed', 'success'])
        )
        if start:
            query = query.filter(Order.booking_date >= start)
        if end:
            query = query.filter(Order.booking_date <= end)
        return query.scalar() or 0

    total_flow = get_revenue(curr_start, curr_end)
    prev_flow = get_revenue(prev_start, prev_end)
    
    revenue_change = 0
    if prev_flow > 0:
        revenue_change = ((total_flow - prev_flow) / prev_flow) * 100
    elif total_flow > 0:
        revenue_change = 100

    admin_commission = total_flow * 0.15
    escrow_balance = total_flow * 0.85  
    
    total_orders = Order.query.count()
    if curr_start:
        total_orders = Order.query.filter(Order.booking_date >= curr_start).count()
        
    return jsonify({
        "total_revenue": total_flow,
        "prev_revenue": prev_flow,
        "revenue_change": round(revenue_change, 1),
        "admin_commission": admin_commission,
        "escrow_balance": escrow_balance,
        "total_orders": total_orders,
        "total_customers": User.query.filter_by(role=UserRole.CUSTOMER).count(),
        "pending_tours": Tour.query.filter_by(status='pending').count()
    }), 200

@admin_bp.route('/dashboard/revenue-by-tour', methods=['GET'])
def get_admin_revenue_by_tour():
    results = db.session.query(
        Tour.id,
        Tour.name,
        func.count(Order.id).label('total_bookings'),
        func.sum(Order.total_price).label('total_revenue')
    ).outerjoin(
        Order,
        db.and_(
            Order.tour_id == Tour.id,
            Order.status.in_(['Đã thanh toán', 'Hoàn thành', 'paid', 'completed']) 
        )
    ).group_by(Tour.id, Tour.name).all()
    
    data = []
    for r in results:
        rev = r.total_revenue or 0
        if rev > 0:
            data.append({
                'tour_id': r.id,
                'tour_name': r.name,
                'total_revenue': rev,
                'admin_commission': rev * 0.15,
                'supplier_revenue': rev * 0.85, 
                'total_bookings': r.total_bookings
            })
    
    data.sort(key=lambda x: x['total_revenue'], reverse=True)
            
    return jsonify(data), 200

@admin_bp.route('/role-stats', methods=['GET'])
def get_role_stats():
    customer_query = db.session.query(
        User.id, User.full_name, User.email,
        Order.total_price, Order.status, Tour.name.label("tour_name")
    ).outerjoin(Order, User.id == Order.user_id)\
     .outerjoin(Tour, Order.tour_id == Tour.id)\
     .filter(User.role == UserRole.CUSTOMER).all()
     
    c_dict = {}
    for row in customer_query:
        user_id, name, email, price, status, tour_name = row
        if user_id not in c_dict:
            c_dict[user_id] = {
                "id": user_id, "name": name, "email": email,
                "total_tours": 0, "total_spent": 0, "tours": set()
            }
        if status: # co order
            c_dict[user_id]["total_tours"] += 1
            if status in ['paid', 'Đã thanh toán', 'completed', 'success'] and price:
                c_dict[user_id]["total_spent"] += price
            if tour_name:
                c_dict[user_id]["tours"].add(tour_name)
                
    customer_result = []
    for uid, stats in c_dict.items():
        if stats["total_tours"] > 0 or len(stats["tours"]) > 0:
            stats["tours"] = list(stats["tours"])
            customer_result.append(stats)

    # 2. Supplier Stats
    supplier_query = db.session.query(
        User.id, User.full_name, User.email, Tour.name.label("tour_name")
    ).outerjoin(Tour, User.id == Tour.supplier_id)\
     .filter(User.role == UserRole.SUPPLIER).all()
     
    s_dict = {}
    for row in supplier_query:
        user_id, name, email, tour_name = row
        if user_id not in s_dict:
            s_dict[user_id] = {"id": user_id, "name": name, "email": email, "total_tours": 0, "tours": set()}
        if tour_name:
            s_dict[user_id]["total_tours"] += 1
            s_dict[user_id]["tours"].add(tour_name)
            
    supplier_result = [
        {"id": v["id"], "name": v["name"], "email": v["email"], "total_tours": v["total_tours"], "tours": list(v["tours"])}
        for v in s_dict.values() if v["total_tours"] > 0
    ]

    from app.models.tour_guide import TourGuide, TourGuideAssignment
    guide_query = db.session.query(
        User.id, User.full_name, User.email,
        Tour.id.label("tour_id"),
        Tour.name.label("tour_name")
    ).outerjoin(TourGuide, TourGuide.user_id == User.id)\
     .outerjoin(TourGuideAssignment, TourGuideAssignment.guide_id == TourGuide.id)\
     .outerjoin(Tour, TourGuideAssignment.tour_id == Tour.id)\
     .filter(User.role == UserRole.GUIDE).all()
     
    g_dict = {}
    for row in guide_query:
        user_id, name, email, t_id, t_name = row
        if user_id not in g_dict:
             g_dict[user_id] = {"id": user_id, "name": name, "email": email, "total_tours": 0, "tours": [], "assignments": 0}
        
        if t_name:
             g_dict[user_id]["assignments"] += 1
             g_dict[user_id]["tours"].append({"id": t_id, "name": t_name})
             
    guide_result = []
    for uid, v in g_dict.items():
        if v["assignments"] > 0:
             v["tours"] = list(v["tours"])
             v["total_tours"] = v["assignments"]
             del v["assignments"]
             guide_result.append(v)

    return jsonify({
        "customers": customer_result,
        "suppliers": supplier_result,
        "guides": guide_result
    }), 200

@admin_bp.route('/tours/<int:tour_id>/revenue-details', methods=['GET'])
def get_admin_tour_revenue_details(tour_id):
    tour = Tour.query.get_or_404(tour_id)
    
    orders = Order.query.filter_by(tour_id=tour_id).filter(
        Order.status.in_(['Đã thanh toán', 'Hoàn thành', 'paid', 'completed', 'success'])
    ).all()
    
    total_revenue = sum(o.total_price for o in orders)
    total_bookings = len(orders)
    
    admin_commission = total_revenue * 0.15
    supplier_revenue = total_revenue * 0.85
    guide_commission = total_revenue * 0.10 
    
    return jsonify({
        "tour_id": tour.id,
        "tour_name": tour.name,
        "total_revenue": total_revenue,
        "total_bookings": total_bookings,
        "admin_commission": admin_commission,
        "supplier_revenue": supplier_revenue,
        "guide_commission": guide_commission,
        "commission_rates": {
            "admin": "15%",
            "supplier_net": "85%",
            "guide": "10%"
        }
    }), 200