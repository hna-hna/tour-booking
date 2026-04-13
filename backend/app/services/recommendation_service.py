# backend/app/ai_engine/recommender.py
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.models import Tour, Order, TourViewLog, Review
from app.extensions import db
from sqlalchemy import func, desc
from datetime import datetime
import threading
import time
 # backend/app/services/recommendation_service.py
from app.models.tour import Tour
from app.models.order import Order


class TourRecommender:
    def __init__(self):
        self.similarity_matrix = None
        self.tour_ids = []
        self.last_trained = None
        self._training_lock = threading.Lock()
        self._train_in_background() 

    def _train_in_background(self):
        def train_job():
            time.sleep(5)  
            self.train_model()
        threading.Thread(target=train_job, daemon=True).start()

    def train_model(self):
        with self._training_lock:
            print(" Đang train AI Recommender...")
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
                print(" Chưa có dữ liệu tương tác.")
                return False

            df = pd.DataFrame(interactions).groupby(['user_id', 'tour_id'])['score'].sum().reset_index()
            user_item_matrix = df.pivot(index='user_id', columns='tour_id', values='score').fillna(0)
            item_user_matrix = user_item_matrix.T

            self.similarity_matrix = cosine_similarity(item_user_matrix)
            self.tour_ids = list(item_user_matrix.index)
            self.last_trained = datetime.utcnow()
            print(f" AI Model trained successfully! ({len(self.tour_ids)} tours)")
            return True

   
def get_popular_tours(limit=6):
    """Hàm lấy tour phổ biến - Dùng cho AI Chat fallback"""
    try:
        now = datetime.utcnow()
        return db.session.query(Tour)\
            .join(Order, Order.tour_id == Tour.id)\
            .filter(Tour.status == 'approved')\
            .filter(Tour.start_date >= now)\
            .group_by(Tour.id)\
            .order_by(desc(func.count(Order.id)))\
            .limit(limit)\
            .all()
    except Exception as e:
        print(f"Lỗi get_popular_tours: {e}")
        return Tour.query.filter(
            Tour.status == 'approved',
            Tour.start_date >= now
        ).order_by(Tour.created_at.desc()).limit(limit).all()