import psycopg2
conn = psycopg2.connect('postgresql://capstone_88_user:fMzaqkccbLxjcOVxJEkSYSjnuglLcWvL@dpg-d6jb43buibrs73ahp9m0-a.oregon-postgres.render.com:5432/capstone_88')
cur = conn.cursor()
cur.execute("SELECT 'sensor_data'::regclass::oid, current_database(), inet_server_addr()")
oid, dbname, ip = cur.fetchone()
print(f"DB: {dbname} | IP: {ip} | Table OID: {oid}")
cur.execute("SELECT COUNT(*) FROM sensor_data")
print(f"Row count: {cur.fetchone()[0]}")
conn.close()
