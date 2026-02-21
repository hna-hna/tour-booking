import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.models import Tour, Order, TourViewLog, Review
from app.extensions import db
from sqlalchemy import func

class TourRecommender:
    def __init__(self):
        self.similarity_matrix = None
        self.tour_ids = []

    def get_popular_tours(self, limit=6):
        """Hàm phụ: Lấy danh sách ID tour bán chạy nhất (dựa trên số đơn hàng đã thanh toán)"""
        try:
            top_tours = db.session.query(
                Order.tour_id
            ).filter(Order.status == 'paid') \
             .group_by(Order.tour_id) \
             .order_by(func.count(Order.id).desc()) \
             .limit(limit).all()
            
            # top_tours sẽ là dạng list các tuple: [(1,), (2,), (5,)]
            # Chuyển về list ID: [1, 2, 5]
            return [t[0] for t in top_tours]
        except Exception as e:
            print(f"Error getting popular tours: {e}")
            return []

    def train_model(self):
        """Huấn luyện mô hình Collaborative Filtering"""
        # Lấy dữ liệu từ DB
        orders = Order.query.all()
        reviews = Review.query.all()
        logs = TourViewLog.query.all()
        
        interactions = []
        
        # Gán trọng số
        for o in orders:
            interactions.append({'user_id': o.user_id, 'tour_id': o.tour_id, 'score': 5}) # Mua = 5 điểm
        for r in reviews:
            interactions.append({'user_id': r.user_id, 'tour_id': r.tour_id, 'score': r.rating}) # Review = Số sao
        for l in logs:
            interactions.append({'user_id': l.user_id, 'tour_id': l.tour_id, 'score': 1}) # Xem = 1 điểm
            
        # Nếu chưa có dữ liệu tương tác nào trong toàn hệ thống
        if not interactions:
            print("⚠️ Chưa có dữ liệu tương tác để train AI.")
            return False
            
        df = pd.DataFrame(interactions)
        
        # Cộng dồn điểm (Ví dụ: Vừa xem vừa mua = 1 + 5 = 6 điểm)
        df = df.groupby(['user_id', 'tour_id'])['score'].sum().reset_index()
        
        # Tạo ma trận User-Item
        user_item_matrix = df.pivot(index='user_id', columns='tour_id', values='score').fillna(0)
        
        # Item-based Collaborative Filtering (Tìm độ tương đồng giữa các Tour)
        item_user_matrix = user_item_matrix.T
        self.similarity_matrix = cosine_similarity(item_user_matrix)
        self.tour_ids = list(item_user_matrix.index)
        
        print("✅ AI Model retrained successfully!")
        return True

    def recommend(self, user_id, top_n=6):
        """
        Logic gợi ý thông minh:
        1. Nếu AI chưa train xong -> Trả về Popular.
        2. Nếu User chưa có lịch sử (người mới) -> Trả về Popular.
        3. Nếu User có lịch sử -> Trả về Collaborative Filtering.
        """
        
        # 1. Kiểm tra mô hình
        if self.similarity_matrix is None:
            success = self.train_model()
            # Nếu train thất bại (do DB trống trơn) -> Trả về Popular ngay
            if not success:
                print("Model chưa train được, trả về Popular Tours.")
                return self.get_popular_tours(top_n)

        # 2. Lấy lịch sử user hiện tại
        user_history = db.session.query(Order.tour_id).filter_by(user_id=user_id).all()
        # Thêm cả lịch sử xem vào nữa cho chính xác hơn
        user_view_history = db.session.query(TourViewLog.tour_id).filter_by(user_id=user_id).all()
        
        # Gom lại thành set các ID tour user đã tương tác
        user_interacted_ids = set([t[0] for t in user_history] + [t[0] for t in user_view_history])
        
        # --- QUAN TRỌNG: NẾU USER MỚI (CHƯA CÓ TƯƠNG TÁC) ---
        if not user_interacted_ids:
            print(f"User {user_id} là người mới (Cold Start). Trả về Popular Tours.")
            return self.get_popular_tours(top_n)

        # 3. Tính toán gợi ý (Collaborative Filtering)
        scores = np.zeros(len(self.tour_ids))
        
        for tour_idx, tour_id in enumerate(self.tour_ids):
            # Nếu user đã tương tác với tour này, dùng nó để tìm các tour giống nó
            if tour_id in user_interacted_ids:
                scores += self.similarity_matrix[tour_idx]

        # Sắp xếp điểm giảm dần
        recommended_indices = np.argsort(scores)[::-1]
        recommendations = []
        
        for idx in recommended_indices:
            t_id = self.tour_ids[idx]
            # Chỉ gợi ý những tour user CHƯA tương tác (hoặc có thể gợi ý lại tùy logic)
            # Ở đây mình sẽ lọc bỏ những tour đã mua, nhưng giữ lại tour mới xem
            if t_id not in user_interacted_ids: 
                recommendations.append(t_id)
                if len(recommendations) >= top_n:
                    break
        
        # Nếu AI tính ra nhưng không đủ số lượng (ví dụ data ít quá), bù thêm bằng Popular
        if len(recommendations) < top_n:
            populars = self.get_popular_tours(top_n)
            for p_id in populars:
                if p_id not in recommendations and p_id not in user_interacted_ids:
                    recommendations.append(p_id)
                    if len(recommendations) >= top_n:
                        break
                    
        return recommendations