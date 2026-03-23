import os
from dotenv import load_dotenv
load_dotenv()
from app import create_app
from app.extensions import socketio
from flask import Flask
from flask_cors import CORS
from app.api.payment_routes import payment_bp 

app = create_app()

# CORS cho các route API thông thường
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
     supports_credentials=True)

app.register_blueprint(payment_bp) 

# 👇 ĐẨY KHỐI IN DEBUG LÊN TRÊN ĐÂY ĐỂ NÓ CHẠY TRƯỚC KHI BẬT SERVER
print("--- DEBUG SUPABASE ---")
print("URL:", os.environ.get("SUPABASE_URL"))
# Lấy 30 ký tự đầu tiên để mình kiểm tra xem có đúng định dạng service_role hay không
print("KEY:", os.environ.get("SUPABASE_KEY")[:30] if os.environ.get("SUPABASE_KEY") else "Không tìm thấy Key!")
print("----------------------")

if __name__ == "__main__":
    print(" Server đang khởi chạy tại http://127.0.0.1:5000") 
    socketio.run(app, debug=True, host="127.0.0.1", port=5000)