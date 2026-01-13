from flask import Blueprint, request, jsonify
from app.models.tour import Tour

customer_bp = Blueprint('customer_bp', __name__)

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