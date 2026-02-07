import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))

env_path = os.path.join(basedir, '.env')

class Config:
    SQLALCHEMY_DATABASE_URI = ("postgresql://postgres.ailvrqwpsjumhsszbnlw:tourbooking2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres")

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "khoa-bi-mat"
    