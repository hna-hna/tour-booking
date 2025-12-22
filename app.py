from flask import Flask, jsonify
from flask_migrate import Migrate
from config import Config

# 1. Import db và jwt từ file trung gian
from extensions import db, jwt

# Import Models (để migrate nhận diện)
from models import User, Order, Payment

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 2. Gắn db và jwt vào app (Init App)
    db.init_app(app)
    jwt.init_app(app)
    
    # Khởi tạo Migrate (cái này vẫn để ở đây được)
    migrate = Migrate(app, db)

    # 3. Đăng ký các Blueprint
    from auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

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

    return app

# Chạy App
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)