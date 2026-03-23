from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from supabase import create_client, Client

# 1. Khởi tạo Database & SocketIO tiêu chuẩn
db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")

# 2. Khai báo thông tin Supabase (Không tự Import chính mình)
SUPABASE_URL = "https://ailvrqwpsjumhsszbnlw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHZycXdwc2p1bWhzc3pibmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODAyMDQsImV4cCI6MjA4Mzg1NjIwNH0.9kUNT1lgKH_rGWIdMD_ZLlyP6TR5YEkIRn1bmXcDqvA"

# Khởi tạo Client Supabase duy nhất cho toàn Backend
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)