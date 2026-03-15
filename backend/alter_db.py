import sqlite3

try:
    conn = sqlite3.connect('instance/tour_booking.db')
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE users ADD COLUMN balance FLOAT DEFAULT 0.0')
    conn.commit()
    print("Added balance column successfully.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column balance already exists.")
    else:
        print("Error:", e)
finally:
    conn.close()
