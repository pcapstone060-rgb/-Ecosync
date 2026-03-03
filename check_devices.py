import psycopg2
conn = psycopg2.connect('postgresql://capstone_88_user:fMzaqkccbLxjcOVxJEkSYSjnuglLcWvL@dpg-d6jb43buibrs73ahp9m0-a.oregon-postgres.render.com:5432/capstone_88')
cur = conn.cursor()
cur.execute("SELECT id, user_id FROM devices")
rows = cur.fetchall()
print("DEVICES FOUND:", rows)
conn.close()
