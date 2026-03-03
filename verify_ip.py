import psycopg2
conn = psycopg2.connect('postgresql://capstone_88_user:fMzaqkccbLxjcOVxJEkSYSjnuglLcWvL@dpg-d6jb43buibrs73ahp9m0-a.oregon-postgres.render.com:5432/capstone_88')
cur = conn.cursor()
cur.execute("SELECT inet_server_addr()")
ip = cur.fetchone()[0]
print(f"Verification Script Server IP: {ip}")
cur.execute("SELECT COUNT(*) FROM sensor_data")
count = cur.fetchone()[0]
print(f"Total Rows: {count}")
conn.close()
