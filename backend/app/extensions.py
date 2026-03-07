# backend/app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

# Khởi tạo Database
db = SQLAlchemy()

# Khởi tạo JWT (Xác thực đăng nhập)
jwt = JWTManager()

# Khởi tạo SocketIO (Chat realtime)
socketio = SocketIO(cors_allowed_origins="*")