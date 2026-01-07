import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

class TourRecommender:
    def __init__(self):
        # Khởi tạo vectorizer hoặc load model đã train
        self.tfidf = TfidfVectorizer(stop_words='english')
        self.tour_data = None # Sẽ chứa DataFrame tour

    def load_data(self, tours_list):
        # Chuyển đổi dữ liệu tour từ Database thành DataFrame để training
        # tours_list: List các object Tour hoặc dict
        self.tour_data = pd.DataFrame(tours_list)
        # Setup dữ liệu ban đầu...
        print("Data loaded for Recommender")

    def suggest_tours(self, user_id, user_history):
        # Logic Collaborative Filtering hoặc Content-based filtering sẽ viết ở đây
        # Tạm thời trả về list rỗng
        return []