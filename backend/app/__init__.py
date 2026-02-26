# backend/app/__init__.py

from .extensions import db, jwt, socketio 
from flask import Flask, jsonify
from flask_migrate import Migrate
from config import Config
from flask_cors import CORS
from datetime import timedelta

def create_app():
    app = Flask(__name__ , static_folder='static', static_url_path='/static')
    app.config.from_object(Config)
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

    # 1. Cấu hình CORS duy nhất và đầy đủ
    # Cho phép cả localhost và 127.0.0.1 để tránh lỗi khi trình duyệt nhận diện khác nhau
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        },
        r"/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "supports_credentials": True
        }
    })

    # 2. Init Extensions
    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)
    
    Migrate(app, db)

    # 3. Đăng ký các Blueprint (API Routes)
    from .api.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth') 

    from .api.profile_routes import profile_bp
    app.register_blueprint(profile_bp, url_prefix='/api/profile')

    from .api.admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    from .api.log_routes import log_bp
    app.register_blueprint(log_bp, url_prefix='/api/logs')

    from .api.supplier import supplier_bp
    app.register_blueprint(supplier_bp, url_prefix='/api/supplier')
    
    from .api.guide import guide_bp
    app.register_blueprint(guide_bp, url_prefix='/api/guide')
    
    from .api.tour_routes import tour_bp
    app.register_blueprint(tour_bp, url_prefix='/api/tours')

    from .api.customer import customer_bp
    app.register_blueprint(customer_bp, url_prefix='/api/customer')

    from .api.chat_routes import chat_bp
    app.register_blueprint(chat_bp, url_prefix='/api/chat')

    from .api.order_routes import order_bp
    app.register_blueprint(order_bp, url_prefix='/api/orders')

    # 4. Socket Events
    from app import websockets

    # Test route
    @app.route('/')
    def hello():
        return jsonify({"msg": "Hello from Backend!"})

    return app