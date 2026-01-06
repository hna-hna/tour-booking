from flask import Flask
from .extensions import socketio

def create_app():
    app = Flask(__name__)

    # config
    app.config['SECRET_KEY'] = 'secret'

    # init extensions
    socketio.init_app(app)

    return app
