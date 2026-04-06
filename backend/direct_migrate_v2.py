import psycopg2
import os

# Direct connection (Session Mode)
DATABASE_URI = "postgresql://postgres:tourbooking2026@db.ailvrqwpsjumhsszbnlw.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(DATABASE_URI)
    cur = conn.cursor()
    # Check if column exists first
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='is_deleted';")
    if cur.fetchone():
        print("ALREADY EXISTS: is_deleted column already in users table")
    else:
        cur.execute("ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;")
        conn.commit()
        print("SUCCESS: is_deleted column added.")
    cur.close()
    conn.close()
except Exception as e:
    print("FAIL:", e)
