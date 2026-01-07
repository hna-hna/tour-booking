from flask import Flask
from app.extensions import socketio, db, jwt # Thêm jwt vào đây
from flask_cors import CORS
from app.api.auth_routes import auth_bp 

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Cấu hình Database và JWT
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db' # Đường dẫn file db
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'your-secret-key' # Bắt buộc phải có để chạy Login

    # Khởi tạo extensions với app
    db.init_app(app)
    socketio.init_app(app)
    jwt.init_app(app)

    # Đăng ký Blueprint
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app