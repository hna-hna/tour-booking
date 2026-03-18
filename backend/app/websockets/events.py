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