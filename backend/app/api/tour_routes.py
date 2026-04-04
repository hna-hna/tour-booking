from flask import Blueprint, jsonify, request
from app.models.tour import Tour
from app.models.order import Order
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db 
from datetime import datetime

try:
    from app.ai_engine.recommender import TourRecommender
    recommender = TourRecommender()
except ImportError:
    recommender = None
    print("Cảnh báo: Không tìm thấy TourRecommender. AI gợi ý sẽ bị tắt.")

tour_bp = Blueprint("tour", __name__, url_prefix="/api/tours")


def format_tours_from_ids(tour_ids):
    if not tour_ids:
        return []
    
    # Chỉ lấy các tour đã được Admin phê duyệt (Status = approved) và còn hạn khởi hành
    tours = Tour.query.filter(Tour.id.in_(tour_ids), Tour.status == 'approved', Tour.start_date >= datetime.utcnow()).all()
    
    # Nếu AI gợi ý các tour chưa được duyệt, lấy 3 tour bất kỳ đã duyệt làm dự phòng
    if len(tours) == 0:
        tours = Tour.query.filter(Tour.status == 'approved', Tour.start_date >= datetime.utcnow()).limit(3).all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "image": t.image,
            "start_date": t.start_date.isoformat() if t.start_date and hasattr(t.start_date, 'isoformat') else t.start_date
        }
        for t in tours
    ]

# ──────────────────────────────────────────────
# 1. API: TOUR PHỔ BIẾN 
# ──────────────────────────────────────────────
@tour_bp.route("/popular", methods=["GET"])
def get_popular_tours():
    # Lấy 6 tour mới nhất đã được phê duyệt và còn hạn khởi hành
    tours = Tour.query.filter(Tour.status == 'approved', Tour.start_date >= datetime.utcnow()).order_by(Tour.created_at.desc()).limit(6).all()
    
    result = [{
        "id": t.id,
        "name": t.name,
        "price": t.price,
        "image": t.image,
        "start_date": t.start_date.isoformat() if t.start_date and hasattr(t.start_date, 'isoformat') else t.start_date
    } for t in tours]
    
    return jsonify(result), 200


# ──────────────────────────────────────────────
# 2. API: TOUR GỢI Ý (Đã xử lý dứt điểm ép kiểu UUID)
# ──────────────────────────────────────────────
@tour_bp.route("/recommend", methods=["GET"])
@jwt_required()
def get_recommended_tours():
    user_id = get_jwt_identity() # UUID String từ Supabase
    tour_ids = []

    try:
        if recommender:
            # Trường hợp ID là số nguyên tự tăng (SQLite/MySQL cục bộ cũ)
            if str(user_id).isdigit():
                uid_internal = int(user_id)
                tour_ids = recommender.recommend(uid_internal) # Gọi hàm mặc định của bạn
            else:
                # Trường hợp chuỗi UUID của Supabase (Truyền named parameter nếu hàm của bạn hỗ trợ top_n)
                try:
                    tour_ids = recommender.recommend(user_id=user_id, top_n=6)
                except TypeError:
                    # Nếu hàm recommend cũ của bạn không hỗ trợ user_id kiểu string UUID, bẫy lỗi ở đây
                    tour_ids = []
    except Exception as e:
        print(f"Lỗi AI Recommender: {e}")
        tour_ids = []

    # Cơ chế Fallback: Nếu AI chưa có dữ liệu (User mới/UUID mới), trả về 6 tour phổ biến
    if not tour_ids:
        fallback_tours = Tour.query.filter(Tour.status == 'approved', Tour.start_date >= datetime.utcnow()).limit(6).all()
        tour_ids = [t.id for t in fallback_tours]
    
    result = format_tours_from_ids(tour_ids)
    return jsonify(result), 200


# ──────────────────────────────────────────────
# 3. API: DANH SÁCH TẤT CẢ TOUR (Public)
# ──────────────────────────────────────────────
@tour_bp.route("", methods=["GET"])
@tour_bp.route("/", methods=["GET"])
def get_public_tours():
    # Chỉ lấy các tour đã được Admin phê duyệt và còn hạn khởi hành
    tours = Tour.query.filter(Tour.status == 'approved', Tour.start_date >= datetime.utcnow()).all()
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
