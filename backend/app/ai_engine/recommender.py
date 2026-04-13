# backend/app/ai_engine/recommender.py
import pandas as pd
import numpy as np
import threading
from sklearn.metrics.pairwise import cosine_similarity
from app.models import Tour, Order, TourViewLog, Review
from app.extensions import db
from sqlalchemy import func, desc
from datetime import datetime

from app.services.recommendation_service import get_popular_tours

class TourRecommender:
    def __init__(self):
        self.similarity_matrix = None
        self.tour_ids = []
        self.last_trained = None
        self._training_lock = threading.Lock()   

    def train_model(self):
        with self._training_lock:
            print(" Đang train AI Recommender...")
            try:
                orders = Order.query.all()
                logs = TourViewLog.query.all()
                reviews = Review.query.all()

                interactions = []
                for o in orders:
                    interactions.append({'user_id': o.user_id, 'tour_id': o.tour_id, 'score': 5})
                for r in reviews:
                    interactions.append({'user_id': r.user_id, 'tour_id': r.tour_id, 'score': r.rating})
                for l in logs:
                    interactions.append({'user_id': l.user_id, 'tour_id': l.tour_id, 'score': 1})

                if not interactions:
                    print("Chưa có dữ liệu tương tác để train.")
                    return False

                df = pd.DataFrame(interactions).groupby(['user_id', 'tour_id'])['score'].sum().reset_index()
                user_item_matrix = df.pivot(index='user_id', columns='tour_id', values='score').fillna(0)
                item_user_matrix = user_item_matrix.T

                self.similarity_matrix = cosine_similarity(item_user_matrix)
                self.tour_ids = list(item_user_matrix.index)
                self.last_trained = datetime.utcnow()

                print(f"train AI thành công({len(self.tour_ids)} tours)")
                return True

            except Exception as e:
                print(f" Lỗi khi train AI: {e}")
                return False

    def recommend(self, user_id, top_n=6):
        if self.similarity_matrix is None:
            print(" Model chưa được train, đang train ngay...")
            self.train_model()

        #Lấy lịch sử tương tác của user
        user_history = set(t[0] for t in db.session.query(Order.tour_id).filter_by(user_id=user_id).all())
        user_views = set(t[0] for t in db.session.query(TourViewLog.tour_id).filter_by(user_id=user_id).all())
        interacted = user_history | user_views

        recommended = []

        #Xử lý COLD START 
        if not interacted:
            popular = get_popular_tours(top_n)
            return [t.id for t in popular]

        #Tính điểm Collaborative Filtering 
        scores = np.zeros(len(self.tour_ids))
        for idx, tour_id in enumerate(self.tour_ids):
            if tour_id in interacted:
                scores += self.similarity_matrix[idx]

        # Xếp hạng ID tour theo điểm từ cao xuống thấp
        sorted_indices = np.argsort(scores)[::-1]
        for idx in sorted_indices:
            t_id = self.tour_ids[idx]
            if t_id not in interacted:
                recommended.append(t_id)

        #KỸ THUẬT EXPLORATION-EXPLOITATION 
        # Giữ lại 4 tour đúng gu nhất từ AI
        ai_recommendations = recommended[:4] 
        
        # Lấy các tour MỚI ĐĂNG lên hệ thống và còn hạn 
        newest_tours = Tour.query.filter(
            Tour.status == 'approved', 
            Tour.start_date >= datetime.utcnow()
        ).order_by(Tour.created_at.desc()).limit(10).all()

        final_recommendations = list(ai_recommendations)
        
        # Trộn tour mới vào danh sách gợi ý để giúp Tour mới có lượt xem
        for new_tour in newest_tours:
            if new_tour.id not in final_recommendations and new_tour.id not in interacted:
                final_recommendations.append(new_tour.id)
            if len(final_recommendations) >= top_n:
                break

        # Nếu vẫn chưa đủ top_n, bù đắp bằng tour phổ biến nhất
        if len(final_recommendations) < top_n:
            popular = get_popular_tours(top_n)
            for p in popular:
                if p.id not in final_recommendations and p.id not in interacted:
                    final_recommendations.append(p.id)
                if len(final_recommendations) >= top_n:
                    break

        return final_recommendations