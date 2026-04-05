import psycopg2
import os

DATABASE_URI = "postgresql://postgres.ailvrqwpsjumhsszbnlw:tourbooking2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(DATABASE_URI)
    cur = conn.cursor()
    cur.execute("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;")
    conn.commit()
    print("SUCCESS: is_deleted column added.")
    cur.close()
    conn.close()
except Exception as e:
    print("FAIL:", e)
