import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))

# 2. Ghép đường dẫn đó với tên file .env
env_path = os.path.join(basedir, '.env')

class Config:
    SQLALCHEMY_DATABASE_URI = "postgresql+pg8000://postgres:123456@127.0.0.1:5432/tour_booking_db"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "khoa-bi-mat"
    