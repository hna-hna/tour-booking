#backend/app/websockets/events.py
from app.extensions import socketio, db
from app.models import Message
from flask import request
from flask_socketio import emit, join_room

@socketio.on('join')
def on_join(data):

    room = str(data.get('room')) # Ép về chuỗi
    join_room(room)
    print(f" Xác nhận: User {request.sid} đã vào phòng: {room}")
    emit('join_ack', {'status': 'success', 'room': room})

@socketio.on('send_message')
def handle_send_message(data):
    receiver_room = f"user_{data['receiver_id']}"
    emit('receive_message', {
        'content': data['content'],
        'sender_id': data['sender_id']
    }, room=receiver_room)
    print(f"Socket đã gửi tin tới: {receiver_room}")

    """User join vào room chat riêng (ví dụ room theo user_id)"""
    room = data.get('room')
    if room: 
        join_room(room)
    print(f"User joined room: {room}")

@socketio.on('send_message')
def handle_send_message(data):
    """
    data = { 'sender_id': 1, 'receiver_id': 2, 'content': 'Alo' }
    """
    sender_id = data['sender_id']
    receiver_id = data['receiver_id']
    content = data['content']
    
    # 1. Lưu vào DB
    msg = Message(sender_id=sender_id, receiver_id=receiver_id, content=content)
    db.session.add(msg)
    db.session.commit()
    
    # 2. Gửi realtime tới người nhận (đang ở trong room của chính họ)
    # Ví dụ: Room tên là "user_2"
    emit('receive_message', {
        'content': content,
        'sender_id': sender_id
    }, room=f"user_{receiver_id}")

