import psycopg2
conn = psycopg2.connect('postgresql://capstone_88_user:fMzaqkccbLxjcOVxJEkSYSjnuglLcWvL@dpg-d6jb43buibrs73ahp9m0-a.oregon-postgres.render.com:5432/capstone_88')
cur = conn.cursor()
tables = ['users', 'devices', 'sensor_data', 'alerts', 'alert_settings', 'safety_logs']
print("ROW COUNTS:")
for t in tables:
    try:
        cur.execute(f'SELECT COUNT(*) FROM {t}')
        count = cur.fetchone()[0]
        print(f" - {t}: {count}")
    except Exception as e:
        print(f" - {t}: ERROR ({e})")
        conn.rollback()
conn.close()
