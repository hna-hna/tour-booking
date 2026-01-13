import os

class Config:
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:123@127.0.0.1:5432/tour_booking_db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "khoa-bi-mat"