import os

class Config:
    # Mật khẩu mới là 123456
    SQLALCHEMY_DATABASE_URI = "postgresql+pg8000://postgres:thanhthu2401@127.0.0.1:5432/tour_booking_db"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "khoa-bi-mat"