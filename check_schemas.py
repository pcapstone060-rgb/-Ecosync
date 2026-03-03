import psycopg2
conn = psycopg2.connect('postgresql://capstone_88_user:fMzaqkccbLxjcOVxJEkSYSjnuglLcWvL@dpg-d6jb43buibrs73ahp9m0-a.oregon-postgres.render.com:5432/capstone_88')
cur = conn.cursor()
cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')")
rows = cur.fetchall()
print("TABLES FOUND:")
for schema, table in rows:
    cur.execute(f'SELECT COUNT(*) FROM "{schema}"."{table}"')
    count = cur.fetchone()[0]
    print(f" - {schema}.{table}: {count} rows")
conn.close()
