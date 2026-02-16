from app import create_app
from app.extensions import socketio
from flask import Flask
from flask_cors import CORS

# 1. IMPORT BLUEPRINT THANH TOÁN ### THÊM DÒNG NÀY ###
# (Giả sử file payment_route.py nằm cùng thư mục với run.py)
from app.api.payment_routes import payment_bp 

app = create_app()

# Cấu hình CORS (Đã OK)
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
     supports_credentials=True)

# 2. ĐĂNG KÝ BLUEPRINT VÀO APP ### THÊM DÒNG NÀY ###
# Dòng này sẽ kích hoạt đường dẫn /create-payment-intent
app.register_blueprint(payment_bp) 

if __name__ == "__main__":
    # In ra để chắc chắn server đang chạy
    print("Server đang chạy tại http://127.0.0.1:5000") 
    socketio.run(app, debug=True)