from flask import Flask, jsonify
from flask_migrate import Migrate
from config import Config
from flask_cors import CORS


# 1. Import db và jwt từ file trung gian
from app.extensions import db, jwt

# Import Models (để migrate nhận diện)
from app.models import User, Order, Payment

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

#cor
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # 2. Gắn db và jwt vào app (Init App)
    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)

    # Khởi tạo Migrate (cái này vẫn để ở đây được)
    migrate = Migrate(app, db)

    # 3. Đăng ký các Blueprint
    from .api.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    from .api.profile import profile_bp
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    
    # Test route
    @app.route('/')
    def hello():
        return "Hello"
    
    # Import routes test phân quyền (nếu có)
    try:
        from decorators import role_required
        @app.route('/api/admin-only', methods=['GET'])
        @role_required(['admin'])
        def admin_only():
            return jsonify({"msg": "Chào Admin!"})
    except:
        pass
    from .websockets import events

    return app
