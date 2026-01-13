from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.tour import Tour, TourGuideAssignment

supplier_bp = Blueprint('supplier_bp', __name__)


# 1. CREATE: Tạo Tour mới
@supplier_bp.route('/tours', methods=['POST'])
def create_tour():
    data = request.get_json()
    
    try:
        new_tour = Tour(
            name=data.get('name'),
            description=data.get('description'),
            itinerary=data.get('itinerary'),   # Nhập lịch trình
            price=data.get('price'),           # Giá
            quantity=data.get('quantity'),     # Số lượng
            supplier_id=data.get('supplier_id'),
            status='pending'                   # Mặc định trạng thái Chờ duyệt
        )
        
        db.session.add(new_tour)
        db.session.flush() # Để lấy tour_id phục vụ việc phân công HDV

        # Phân công Hướng dẫn viên (HDV) nếu có truyền guide_id
        if data.get('guide_id'):
            assignment = TourGuideAssignment(
                tour_id=new_tour.id,
                guide_id=data.get('guide_id')
            )
            db.session.add(assignment)

        db.session.commit()
        return jsonify({"message": "Tạo tour thành công, đang chờ duyệt"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 2. UPDATE: Chỉnh sửa Tour
@supplier_bp.route('/tours/<int:tour_id>', methods=['PUT'])
def update_tour(tour_id):
    tour = Tour.query.get_or_404(tour_id)
    data = request.get_json()

    #  Chỉ chỉnh sửa khi Tour ở trạng thái Chờ duyệt hoặc Bị từ chối
    if tour.status not in ['pending', 'rejected']:
        return jsonify({
            "message": "Không thể chỉnh sửa tour đã được duyệt hoặc đang hoạt động"
        }), 403

    tour.name = data.get('name', tour.name)
    tour.description = data.get('description', tour.description)
    tour.itinerary = data.get('itinerary', tour.itinerary)
    tour.price = data.get('price', tour.price)
    tour.quantity = data.get('quantity', tour.quantity)
    
    # Sau khi sửa, trạng thái đưa về Chờ duyệt để Admin kiểm tra lại
    tour.status = 'pending'
    
    db.session.commit()
    return jsonify({"message": "Cập nhật tour thành công"}), 200


# 3. DELETE: Xóa Tour
@supplier_bp.route('/tours/<int:tour_id>', methods=['DELETE'])
def delete_tour(tour_id):
    tour = Tour.query.get_or_404(tour_id)

    #  Chỉ xóa khi Tour ở trạng thái Chờ duyệt hoặc Bị từ chối
    if tour.status not in ['pending', 'rejected']:
        return jsonify({
            "message": "Không thể xóa tour đã được duyệt hoặc đang hoạt động"
        }), 403

    try:
        # Xóa các bản ghi liên quan trong bảng phân công HDV trước
        TourGuideAssignment.query.filter_by(tour_id=tour_id).delete()
        db.session.delete(tour)
        db.session.commit()
        return jsonify({"message": "Đã xóa tour thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500