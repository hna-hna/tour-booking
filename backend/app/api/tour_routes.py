from flask import Blueprint, jsonify
from app.models.tour import Tour

tour_bp = Blueprint("tour", __name__, url_prefix="/api/tours")

@tour_bp.route("", methods=["GET"])
def get_public_tours():
    tours = Tour.query.filter_by(status="approved").all()

    return jsonify([
        {
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "description": t.description,
        }
        for t in tours
    ]), 200
# API: Lấy chi tiết 1 Tour (Public)
@tour_bp.route('/<int:tour_id>', methods=['GET'])
def get_tour_detail(tour_id):
    # Tìm tour theo ID
    tour = Tour.query.get(tour_id)
    
    if not tour:
        return jsonify({"msg": "Không tìm thấy tour"}), 404
    
    # Trả về dữ liệu JSON
    return jsonify({
        "id": tour.id,
        "name": tour.name,
        "description": tour.description,
        "price": tour.price,
        "image": getattr(tour, 'image', None),
        "start_date": tour.start_date,
        "end_date": tour.end_date,
        "status": tour.status,
        
        # Quan trọng: Trả về lịch trình (JSON)
        "itinerary": tour.itinerary, 
        
        # Nếu model của bạn là provider_id hay supplier_id thì sửa dòng dưới cho khớp
        "supplier_id": getattr(tour, 'supplier_id', getattr(tour, 'supplier_id', None))
    }), 200

# API: Lấy danh sách tất cả Tour (Để dùng cho trang danh sách nếu cần)
@tour_bp.route('/', methods=['GET'])
def get_all_tours():
    tours = Tour.query.filter_by(status='approved').all()
    results = []
    for t in tours:
        results.append({
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "image": getattr(t, 'image', None),
            "start_date": t.start_date,
            "end_date": t.end_date
        })
    return jsonify(results), 200