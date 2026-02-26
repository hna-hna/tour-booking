#backend/run.py 
from app import create_app
from app.extensions import socketio
from flask import Flask
from flask_cors import CORS

app = create_app()


if __name__ == "__main__":
    socketio.run(app, debug=True)
