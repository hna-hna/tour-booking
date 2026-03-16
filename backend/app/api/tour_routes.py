# backend/app/api/tour.py (hoặc tên file chứa tour_bp của bạn)
from flask import Blueprint, jsonify
from app.models.tour import Tour
from flask_jwt_extended import jwt_required, get_jwt_identity

# --- THÊM IMPORT AI MODEL ---
from app.ai_engine.recommender import TourRecommender

tour_bp = Blueprint("tour", __name__, url_prefix="/api/tours")

# Khởi tạo bộ máy AI
recommender = TourRecommender()

# ==========================================
# HÀM HỖ TRỢ: Chuyển list ID thành list Tour data
# ==========================================
def format_tours_from_ids(tour_ids):
    print(f"--- DEBUG AI ---")
    print(f"1. Danh sách ID từ AI: {tour_ids}")
    
    if not tour_ids:
        return []
    
    # Lấy tất cả tour có ID trong list mà ĐÃ DUYỆT
    tours = Tour.query.filter(Tour.id.in_(tour_ids), Tour.status == 'approved').all()
    print(f"2. Số tour tìm thấy trong DB (đã duyệt): {len(tours)}")
    
    if len(tours) == 0:
        # Nếu không có tour nào đã duyệt trong list AI, lấy đại 3 tour đã duyệt bất kỳ để test
        print("3. CẢNH BÁO: AI gợi ý tour chưa duyệt. Đang lấy tour dự phòng...")
        tours = Tour.query.filter_by(status='approved').limit(3).all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "image": t.image,
            "start_date": t.start_date.isoformat() if t.start_date else None
        }
        for t in tours
    ]# ==========================================
# 1. API: CHO KHÁCH VÃNG LAI (Tour Phổ Biến)
# ==========================================
@tour_bp.route("/popular", methods=["GET"])
def get_popular_tours():
    # Lấy 6 tour mới nhất đã duyệt
    tours = Tour.query.filter_by(status='approved').order_by(Tour.created_at.desc()).limit(6).all()
    
    result = [{
        "id": t.id,
        "name": t.name,
        "price": t.price,
        "image": t.image,
        "start_date": t.start_date.isoformat() if t.start_date else None
    } for t in tours]
    
    print(f"API Popular trả về: {len(result)} tour")
    return jsonify(result), 200

# ==========================================
# 2. API: CHO KHÁCH ĐÃ LOGIN (Tour AI Gợi Ý)
# ==========================================
@tour_bp.route("/recommend", methods=["GET"])
@jwt_required()
def get_recommended_tours():
    user_id = int(get_jwt_identity())
    
    # 1. Gọi AI lấy gợi ý
    tour_ids = recommender.recommend(user_id=user_id, top_n=6)
    
    # 2. KIỂM TRA: Nếu AI trả về rỗng, lấy 6 tour mới nhất đã duyệt làm dự phòng
    if not tour_ids:
        print("CẢNH BÁO: AI trả về rỗng, đang dùng dữ liệu dự phòng (Popular)")
        fallback_tours = Tour.query.filter_by(status='approved').limit(6).all()
        tour_ids = [t.id for t in fallback_tours]
    
    # 3. Trả về dữ liệu
    result = format_tours_from_ids(tour_ids)
    return jsonify(result), 200
# ==========================================
# 3. API: Lấy danh sách tất cả tour (Public)
# ==========================================
@tour_bp.route("", methods=["GET"])
@tour_bp.route("/", methods=["GET"])
def get_public_tours():
    tours = Tour.query.filter_by(status="approved").all()
    return jsonify([
        {
            "id": t.id,
            "name": t.name,
            "price": t.price,
            "description": t.description or "",
            "image": t.image,
            "start_date": t.start_date.isoformat() if t.start_date else None,
            "end_date": t.end_date.isoformat() if t.end_date else None
        }
        for t in tours
    ]), 200

# ==========================================
# 4. API: Lấy chi tiết 1 Tour (Public)
# ==========================================
@tour_bp.route('/<int:tour_id>', methods=['GET'])
def get_tour_detail(tour_id):
    # Lấy tour theo ID, nếu không thấy sẽ trả về lỗi 404
    tour = Tour.query.get_or_404(tour_id)
    
    return jsonify({
        "id": tour.id,
        "name": tour.name,
        "description": tour.description or "",
        "price": tour.price,
        "image": tour.image,
        # ĐÃ SỬA: Dùng 'tour.start_date' thay vì 't.start_date'
        "start_date": tour.start_date.isoformat() if tour.start_date else None,
        "end_date": tour.end_date.isoformat() if tour.end_date else None,
        "status": tour.status,
        "itinerary": tour.itinerary or "", 
        "quantity": getattr(tour, 'quantity', 0),
        "supplier_id": getattr(tour, 'supplier_id', None)
    }), 200