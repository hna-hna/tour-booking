import os
from dotenv import load_dotenv
load_dotenv()
from app import create_app
from app.extensions import socketio
from flask import Flask
from flask_cors import CORS

# 1. IMPORT BLUEPRINT THANH TOÁN
from app.api.payment_routes import payment_bp 

app = create_app()

# Cấu hình CORS - Cho phép Frontend (Next.js) truy cập
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
     supports_credentials=True)

# 2. ĐĂNG KÝ BLUEPRINT VÀO APP
# Dòng này sẽ kích hoạt các endpoint liên quan đến thanh toán (ví dụ: /api/create-payment-intent)
app.register_blueprint(payment_bp) 

# 👇 ĐẨY KHỐI IN DEBUG LÊN TRÊN ĐÂY ĐỂ NÓ CHẠY TRƯỚC KHI BẬT SERVER
print("--- DEBUG SUPABASE ---")
print("URL:", os.environ.get("SUPABASE_URL"))
# Lấy 30 ký tự đầu tiên để mình kiểm tra xem có đúng định dạng service_role hay không
print("KEY:", os.environ.get("SUPABASE_KEY")[:30] if os.environ.get("SUPABASE_KEY") else "Không tìm thấy Key!")
print("----------------------")

if __name__ == "__main__":
    # In ra để chắc chắn server đang chạy
    print(" Server đang khởi chạy tại http://127.0.0.1:5000") 
    socketio.run(app, debug=True, host="127.0.0.1", port=5000)
