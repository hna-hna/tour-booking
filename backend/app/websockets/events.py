from app.extensions import socketio, db
from app.models import Message
from flask_socketio import emit, join_room

@socketio.on('join')
def on_join(data):
    """User join vào room chat riêng (ví dụ room theo user_id)"""
    room = data['room']
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