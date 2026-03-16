#back/app/ai_engine/recommender.py
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.models import Tour, Order, TourViewLog, Review
from app.extensions import db
from sqlalchemy import func, desc
from datetime import datetime


class TourRecommender:
    def __init__(self):
        self.similarity_matrix = None
        self.tour_ids = []

    # ================================
    # 🔥 POPULAR TOUR (CHỈ TOUR SẮP ĐI)
    # ================================
    def get_popular_tours(self, limit=6):
        """
        1. Đếm số lượng từ bảng Orders (status='paid' hoặc 'completed').
        2. Tour phải SẮP DIỄN RA (start_date > hiện tại).
        3. Tour phải được duyệt (status='approved').        """
        try:
            now = datetime.utcnow()

            top_tours = db.session.query(
                Tour.id,
                func.count(Order.id).label('total_sales')
            ).join(Order, Tour.id == Order.tour_id) \
             .filter(Order.status.in_(['paid', 'completed'])) \
             .filter(Tour.start_date >= now) \
             .filter(Tour.status == 'approved') \
             .group_by(Tour.id) \
             .order_by(desc('total_sales')) \
             .limit(limit).all()

            tour_ids = [t[0] for t in top_tours]

            # Nếu chưa đủ số lượng thì bù thêm tour mới sắp đi
            if len(tour_ids) < limit:
                needed = limit - len(tour_ids)

                if tour_ids:
                    extra_tours = Tour.query.filter(
                        Tour.status == 'approved',
                        #Tour.start_date >= now,
                        ~Tour.id.in_(tour_ids)
                    )
                else:
                    extra_tours = Tour.query.filter(
                        Tour.status == 'approved',
                        Tour.start_date >= now
                    )

                extra_tours = extra_tours.order_by(
                        Tour.created_at.desc()
                ).limit(needed).all()

                tour_ids.extend([t.id for t in extra_tours])
            return tour_ids

        except Exception as e:
            print(f"Error getting popular tours: {e}")
            return []

    # ================================
    # TRAIN MODEL (Collaborative Filtering)
    # ================================
    def train_model(self):
        orders = Order.query.all()
        logs = TourViewLog.query.all()

        interactions = []

        # Gán trọng số
        for o in orders:
            interactions.append({'user_id': o.user_id, 'tour_id': o.tour_id, 'score': 5})

        reviews = Review.query.all()

        for r in reviews:
            interactions.append({
               'user_id': r.user_id,
               'tour_id': r.tour_id,
               'score': r.rating
    })

        for l in logs:
            interactions.append({'user_id': l.user_id, 'tour_id': l.tour_id, 'score': 1})

        if not interactions:
            print("⚠️ Chưa có dữ liệu tương tác để train AI.")
            return False

        df = pd.DataFrame(interactions)

        df = df.groupby(['user_id', 'tour_id'])['score'].sum().reset_index()

        user_item_matrix = df.pivot(index='user_id', columns='tour_id', values='score').fillna(0)

        item_user_matrix = user_item_matrix.T
        self.similarity_matrix = cosine_similarity(item_user_matrix)
        self.tour_ids = list(item_user_matrix.index)

        print(" AI Model retrained successfully!")
        return True

    # ================================
    # RECOMMEND
    # ================================
    def recommend(self, user_id, top_n=6):

        #  Nếu chưa train
        if self.similarity_matrix is None:
            success = self.train_model()
            if not success:
                print("Model chưa train được, trả về Popular Tours.")
                return self.get_popular_tours(top_n)

        #  Lấy lịch sử user
        user_history = db.session.query(Order.tour_id).filter_by(user_id=user_id).all()
        user_view_history = db.session.query(TourViewLog.tour_id).filter_by(user_id=user_id).all()

        user_interacted_ids = set(
            [t[0] for t in user_history] +
            [t[0] for t in user_view_history]
        )

        #  Cold Start
        if not user_interacted_ids:
            print(f"User {user_id} là người mới (Cold Start). Trả về Popular Tours.")
            return self.get_popular_tours(top_n)

        # Collaborative Filtering
        scores = np.zeros(len(self.tour_ids))

        for tour_idx, tour_id in enumerate(self.tour_ids):
            if tour_id in user_interacted_ids:
                scores += self.similarity_matrix[tour_idx]

        recommended_indices = np.argsort(scores)[::-1]
        recommendations = []

        for idx in recommended_indices:
            t_id = self.tour_ids[idx]
            if t_id not in user_interacted_ids:
                recommendations.append(t_id)
                if len(recommendations) >= top_n:
                    break

        # Nếu không đủ -> bù Popular
        if len(recommendations) < top_n:
            populars = self.get_popular_tours(top_n)
            for p_id in populars:
                if p_id not in recommendations and p_id not in user_interacted_ids:
                    recommendations.append(p_id)
                    if len(recommendations) >= top_n:
                        break

        return recommendations