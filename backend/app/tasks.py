# backend/app/tasks.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging

from app.ai_engine.recommender import TourRecommender
from app.extensions import db

recommender = TourRecommender()
scheduler = BackgroundScheduler()

def train_recommender_model():
    try:
        print(f"[{datetime.now()}] Đang train lại AI Recommender Model...")
        success = recommender.train_model()
        if success:
            print(f"[{datetime.now()}] ✅ Train model thành công!")
        else:
            print(f"[{datetime.now()}] ⚠️ Train model không có dữ liệu mới.")
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Lỗi train model: {e}")

def start_scheduler():
    # Train ngay khi khởi động
    scheduler.add_job(train_recommender_model, 'date', next_run_time=datetime.now())
    
    # Train định kỳ mỗi 30 phút
    scheduler.add_job(
        train_recommender_model,
        trigger=IntervalTrigger(minutes=30),
        id='train_model_job',
        replace_existing=True
    )
    
    scheduler.start()
    logging.info("Background scheduler started - AI Recommender training every 30 minutes")