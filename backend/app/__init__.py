from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import timedelta, datetime
import atexit

# Extensions
from .extensions import db, jwt, socketio

# Config
from config import Config

# Supabase Client
from supabase import create_client, Client

SUPABASE_URL = "https://ailvrqwpsjumhsszbnlw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHZycXdwc2p1bWhzc3pibmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODAyMDQsImV4cCI6MjA4Mzg1NjIwNH0.9kUNT1lgKH_rGWIdMD_ZLlyP6TR5YEkIRn1bmXcDqvA"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==================== AI RECOMMENDER (Global Instance) ====================
from app.ai_engine.recommender import TourRecommender

recommender = TourRecommender()   # Khởi tạo một lần duy nhất

def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(Config)
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

    # CORS
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # Init Extensions
    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)
    Migrate(app, db)

    # ====================== BLUEPRINTS ======================
    from .api.auth_routes import auth_bp
    from .api.profile_routes import profile_bp
    from .api.admin_routes import admin_bp
    from .api.log_routes import log_bp
    from .api.supplier import supplier_bp
    from .api.guide import guide_bp
    from .api.tour_routes import tour_bp
    from .api.customer import customer_bp
    from .api.chat_routes import chat_bp
    from .api.order_routes import order_bp
    from .api.review_routes import review_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(log_bp, url_prefix='/api/logs')
    app.register_blueprint(supplier_bp, url_prefix='/api/supplier')
    app.register_blueprint(guide_bp, url_prefix='/api/guide')
    app.register_blueprint(tour_bp, url_prefix='/api/tours')
    app.register_blueprint(customer_bp, url_prefix='/api/customer')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(order_bp, url_prefix='/api/orders')
    app.register_blueprint(review_bp, url_prefix='/api')

    # ====================== APSCHEDULER - TRAIN AI ======================
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler()

    def scheduled_train():
        """Wrapper để chạy train_model trong application context"""
        with app.app_context():
            print(" APScheduler: Training AI Recommender...")
            recommender.train_model()

    # Train mỗi 30 phút
    scheduler.add_job(
        func=scheduled_train,
        trigger='interval',
        minutes=30,
        id='periodic_train_ai'
    )

    # Train lần đầu sau khi app khởi động 10 giây
    scheduler.add_job(
        func=scheduled_train,
        trigger='date',
        run_date=datetime.now() + timedelta(seconds=10),
        id='initial_train_ai'
    )

    scheduler.start()
    atexit.register(lambda: scheduler.shutdown(wait=False))

    print(" Backend started successfully with AI Recommender + Scheduler")

    # Test route
    @app.route('/')
    def hello():
        return jsonify({"msg": "Hello from Tour Booking Backend! AI is ready."})

    return app