# backend/app/api/review_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.review import Review
from app.models.user import User
from app.models.tour import Tour

review_bp = Blueprint('review', __name__, url_prefix='/api')

@review_bp.route('/reviews', methods=['GET'])
def get_reviews():
    try:
        reviews = db.session.query(Review, User.full_name, Tour.name.label('tour_name'))\
            .join(User, Review.user_id == User.id)\
            .join(Tour, Review.tour_id == Tour.id)\
            .order_by(Review.created_at.desc())\
            .limit(10)\
            .all()

        result = []
        for review, full_name, tour_name in reviews:
            result.append({
                "id": review.id,
                "full_name": full_name,
                "tour_name": tour_name,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at.isoformat() if review.created_at else None
            })
        return jsonify(result), 200
    except Exception as e:
        print("Lỗi get reviews:", e)
        return jsonify([]), 200


@review_bp.route('/reviews', methods=['POST'])
@jwt_required()
def create_review():
    data = request.get_json()
    user_id = get_jwt_identity()
    tour_id = data.get('tour_id')
    order_id = data.get('order_id')
    rating = data.get('rating')
    comment = data.get('comment')

    if not tour_id or not rating:
        return jsonify({"error": "Thiếu thông tin tour hoặc rating"}), 400

    try:
        new_review = Review(
            user_id=user_id,
            tour_id=tour_id,
            rating=rating,
            comment=comment
        )
        db.session.add(new_review)
        db.session.commit()

        return jsonify({"msg": "Đánh giá thành công! Cảm ơn bạn."}), 201
    except Exception as e:
        db.session.rollback()
        print("Lỗi tạo review:", e)
        return jsonify({"error": "Không thể lưu đánh giá"}), 500