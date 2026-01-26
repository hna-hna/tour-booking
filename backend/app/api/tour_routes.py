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

#lấy id theo tour không cần nhà đăng nhập nhà cung cấp
@tour_bp.route('/<int:tour_id>', methods=['GET'])
def get_tour_detail(tour_id):
    tour = Tour.query.get_or_404(tour_id)
    return jsonify({
        "id": tour.id,
        "name": tour.name,
        "price": tour.price, # Giá thực nhà cung cấp đã upload
        "description": tour.description,
        "itinerary": tour.itinerary,
        "quantity": tour.quantity
    }), 200