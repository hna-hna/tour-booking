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
