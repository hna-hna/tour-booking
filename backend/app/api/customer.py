#backend/app/api/customer.py 
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.ai_engine.recommender import TourRecommender
from app.models import Tour
from app.models.order import Order
from app.models.tour import Tour
from sqlalchemy import func


customer_bp = Blueprint('customer_bp', __name__)
recommender = TourRecommender()

@customer_bp.route('/tours/search', methods=['GET'])
def search_tours():
    # Lấy từ khóa từ tham số query trên URL 
    query_string = request.args.get('q', '').strip()
    
    # 1. Khởi tạo query cơ bản: Chỉ lấy những Tour đã được DUYỆT (approved)
    # Điều này quan trọng vì khách không được thấy tour đang chờ duyệt hoặc bị từ chối
    query = Tour.query.filter_by(status='approved')

    if query_string:
        # 2. Tìm kiếm theo Tên hoặc Địa điểm ( ilike để không phân biệt hoa thường)
        query = query.filter(
            (Tour.name.ilike(f'%{query_string}%')) | 
            (Tour.description.ilike(f'%{query_string}%')) 
        )

    tours = query.all()

    # 3. Trả về kết quả
    results = []
    for tour in tours:
        results.append({
            "id": tour.id,
            "name": tour.name,
            "price": tour.price,
            "description": tour.description,
        })

    return jsonify(results), 200

    @customer_bp.route('/tours/recommend', methods=['GET'])
    @jwt_required()
    def get_recommendations():
      user_id = get_jwt_identity()
    
    # Lấy danh sách ID tour gợi ý
      suggested_ids = recommender.recommend(user_id)
    
    # Query thông tin chi tiết
      tours = Tour.query.filter(Tour.id.in_(suggested_ids)).all()
    
      results = [{"id": t.id, "name": t.name, "price": t.price, "image": t.image} for t in tours]
      return jsonify(results), 200

#API Lấy Tour Phổ Biến (Top 6 tour bán chạy nhất)
@customer_bp.route('/tours/popular', methods=['GET'])
def get_popular_tours():
    try:
        # Query: Đếm số lượng order cho mỗi tour_id, sắp xếp giảm dần, lấy top 6
        top_orders = db.session.query(
            Order.tour_id, 
            func.count(Order.id).label('total_sales')
        ).filter(Order.status == 'paid') \
         .group_by(Order.tour_id) \
         .order_by(func.count(Order.id).desc()) \
         .limit(6).all()
        
        results = []
        
        # Nếu chưa có đơn hàng nào, lấy đại 6 tour mới nhất đã duyệt
        if not top_orders:
            tours = Tour.query.filter_by(status='approved').order_by(Tour.created_at.desc()).limit(6).all()
            for t in tours:
                results.append({
                    "id": t.id,
                    "name": t.name,
                    "price": t.price,
                    "image": t.image,
                    "description": t.description
                })
            return jsonify(results), 200

        # Nếu có đơn hàng, lấy thông tin chi tiết các tour đó
        for tour_id, total_sales in top_orders:
            tour = Tour.query.get(tour_id)
            if tour and tour.status == 'approved': # Chỉ lấy tour còn hoạt động
                results.append({
                    "id": tour.id,
                    "name": tour.name,
                    "price": tour.price,
                    "image": tour.image,
                    "description": tour.description,
                    "sales": total_sales # Có thể hiển thị "Đã bán: X"
                })
                
        return jsonify(results), 200

    except Exception as e:
        print(f"Error fetching popular tours: {e}")
        return jsonify([]), 200 # Trả về mảng rỗng 