from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# Tạo biến db và jwt ở đây, nhưng chưa gắn vào app vội
db = SQLAlchemy()
jwt = JWTManager()