from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager

# Khởi tạo các instance
db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*") # Cho phép kết nối realtime từ mọi nơi
jwt = JWTManager()