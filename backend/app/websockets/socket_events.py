# socket_events.py
from extensions import socketio
from flask import request

# Hàm xử lý khi client kết nối
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")
    # Sau này bạn sẽ thêm logic xác thực user ở đây (VD: lấy user_id từ token)

# Hàm xử lý khi client ngắt kết nối
@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")