# backend/app/ai_engine/recommender.py
import pandas as pd
import numpy as np
import threading
from sklearn.metrics.pairwise import cosine_similarity
from app.models import Tour, Order, TourViewLog, Review
from app.extensions import db
from sqlalchemy import func, desc
from datetime import datetime

# Import hàm chung từ services
from app.services.recommendation_service import get_popular_tours


class TourRecommender:
    def __init__(self):
        self.similarity_matrix = None
        self.tour_ids = []
        self.last_trained = None
        self._training_lock = threading.Lock()   # Giữ lock để tránh train đồng thời

    def train_model(self):
        """Train model - Được gọi từ APScheduler (đã có app_context)"""
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
                    print(" Chưa có dữ liệu tương tác để train.")
                    return False

                df = pd.DataFrame(interactions).groupby(['user_id', 'tour_id'])['score'].sum().reset_index()
                user_item_matrix = df.pivot(index='user_id', columns='tour_id', values='score').fillna(0)
                item_user_matrix = user_item_matrix.T

                self.similarity_matrix = cosine_similarity(item_user_matrix)
                self.tour_ids = list(item_user_matrix.index)
                self.last_trained = datetime.utcnow()

                print(f" AI Model trained successfully! ({len(self.tour_ids)} tours)")
                return True

            except Exception as e:
                print(f" Lỗi khi train AI: {e}")
                return False

    def recommend(self, user_id, top_n=6):
        if self.similarity_matrix is None:
            print(" Model chưa được train, đang train ngay...")
            self.train_model()

        # Cold start
        user_history = set(t[0] for t in db.session.query(Order.tour_id).filter_by(user_id=user_id).all())
        user_views = set(t[0] for t in db.session.query(TourViewLog.tour_id).filter_by(user_id=user_id).all())
        interacted = user_history | user_views

        if not interacted:
            popular = get_popular_tours(top_n)
            return [t.id for t in popular]

        scores = np.zeros(len(self.tour_ids))
        for idx, tour_id in enumerate(self.tour_ids):
            if tour_id in interacted:
                scores += self.similarity_matrix[idx]

        
        recommended = recommended[:top_n]

        # Fallback popular tours
        if len(recommended) < top_n:
            popular = get_popular_tours(top_n)
            popular_ids = [t.id for t in popular]
            for p_id in popular_ids:
                if p_id not in recommended and p_id not in interacted:
                    recommended.append(p_id)
                if len(recommended) >= top_n:
                    break

        return recommended