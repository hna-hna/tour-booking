from flask import Blueprint, jsonify
from app.models.tour import Tour

tour_bp = Blueprint("tour", __name__, url_prefix="/api/tours")

# API: Lấy danh sách tour đã duyệt (Public)
@tour_bp.route("", methods=["GET"])
@tour_bp.route("/", methods=["GET"])
def get_public_tours():
    # Chỉ lấy các tour đã được Admin phê duyệt
    tours = Tour.query.filter_by(status="approved").all()
    return jsonify([
        {
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "description": t.description or "",
            "image": t.image,
            "start_date": t.start_date,
            "end_date": t.end_date
        }
        for t in tours
    ]), 200

# API: Lấy chi tiết 1 Tour (Public)
@tour_bp.route('/<int:tour_id>', methods=['GET'])
def get_tour_detail(tour_id):
    tour = Tour.query.get_or_404(tour_id)
    
    return jsonify({
        "id": tour.id,
        "name": tour.name,
        "description": tour.description or "",
        "price": tour.price,
        "image": tour.image,
        "start_date": tour.start_date,
        "end_date": tour.end_date,
        "status": tour.status,
        "itinerary": tour.itinerary or "", 
        "quantity": getattr(tour, 'quantity', 0),
        "supplier_id": getattr(tour, 'supplier_id', None)
    }), 200