import psycopg2
try:
    conn = psycopg2.connect('postgresql://capstone_88_user:fMzaqkccbLxjcOVxJEkSYSjnuglLcWvL@dpg-d6jb43buibrs73ahp9m0-a.oregon-postgres.render.com:5432/capstone_88')
    cur = conn.cursor()
    print("Inserting test row...")
    cur.execute("INSERT INTO sensor_data (device_id, temperature, timestamp) VALUES ('VERIFY_EXTERNAL', 99.9, '2026-03-03 12:00:00')")
    conn.commit()
    print("COMMIT DONE.")
    cur.execute("SELECT COUNT(*) FROM sensor_data WHERE device_id='VERIFY_EXTERNAL'")
    count = cur.fetchone()[0]
    print(f"VERIFY_EXTERNAL Count: {count}")
    conn.close()
except Exception as e:
    print(f"WRITE ERROR: {e}")
