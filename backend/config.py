import os

class Config:
    SQLALCHEMY_DATABASE_URI = "postgresql+pg8000://postgres:123456@127.0.0.1:5433/tour_booking_db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "khoa-bi-mat"