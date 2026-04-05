import psycopg2
import sys

# Thử kết nối trực tiếp với các thông số từ .env của bạn
DB_URL = "postgresql://postgres.ailvrqwpsjumhsszbnlw:tourbooking2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

def migrate():
    try:
        print("Connecting to Supabase...")
        conn = psycopg2.connect(DB_URL, connect_timeout=10)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Executing ALTER TABLE...")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;")
        
        print("Checking results...")
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='is_deleted';")
        res = cur.fetchone()
        if res:
            print("SUCCESS: is_deleted column is now in the database.")
        else:
            print("FAILED: Column still not found.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    migrate()
