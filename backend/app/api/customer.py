from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.ai_engine.recommender import TourRecommender
from app.models import Tour
from app.models.order import Order
from sqlalchemy import func
from datetime import datetime

customer_bp = Blueprint('customer_bp', __name__)
recommender = TourRecommender()


# ================= SEARCH =================
@customer_bp.route('/tours/search', methods=['GET'])
def search_tours():
    query_string = request.args.get('q', '').strip()
    query = Tour.query.filter(Tour.status == 'approved', Tour.start_date >= datetime.utcnow())

    if query_string:
        query = query.filter(
            (Tour.name.ilike(f'%{query_string}%')) |
            (Tour.description.ilike(f'%{query_string}%'))
        )

    tours = query.all()

    results = []
    for tour in tours:
        results.append({
            "id": tour.id,
            "name": tour.name,
            "price": tour.price,
            "description": tour.description,
        })

    return jsonify(results), 200


# ================= RECOMMEND =================
@customer_bp.route('/tours/recommend', methods=['GET'])
@jwt_required()
def get_recommendations():
    user_id = get_jwt_identity()

    suggested_ids = recommender.recommend(user_id)

    tours = Tour.query.filter(Tour.id.in_(suggested_ids), Tour.start_date >= datetime.utcnow()).all()

    results = [
        {"id": t.id, "name": t.name, "price": t.price, "image": t.image}
        for t in tours
    ]

    return jsonify(results), 200


# ================= POPULAR =================
@customer_bp.route('/tours/popular', methods=['GET'])
def get_popular_tours():
    try:
        top_orders = db.session.query(
            Order.tour_id,
            func.count(Order.id).label('total_sales')
        ).filter(Order.status == 'paid') \
         .group_by(Order.tour_id) \
         .order_by(func.count(Order.id).desc()) \
         .limit(6).all()

        results = []

        if not top_orders:
            tours = Tour.query.filter(Tour.status == 'approved', Tour.start_date >= datetime.utcnow()) \
                              .order_by(Tour.created_at.desc()) \
                              .limit(6).all()

            for t in tours:
                results.append({
                    "id": t.id,
                    "name": t.name,
                    "price": t.price,
                    "image": t.image,
                    "description": t.description
                })

            return jsonify(results), 200

        for tour_id, total_sales in top_orders:
            tour = Tour.query.get(tour_id)
            if tour and tour.status == 'approved' and tour.start_date and tour.start_date >= datetime.utcnow():
                results.append({
                    "id": tour.id,
                    "name": tour.name,
                    "price": tour.price,
                    "image": tour.image,
                    "description": tour.description,
                    "sales": total_sales
                })

        return jsonify(results), 200

    except Exception as e:
        print(f"Error fetching popular tours: {e}")
        return jsonify([]), 200