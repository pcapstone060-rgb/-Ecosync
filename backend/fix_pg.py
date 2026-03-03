from sqlalchemy import create_engine, text
url = "postgresql://capstone_88_user:fMzaqkccbLxjcOVxJEkSYSjnuglLcWvL@dpg-d6jb43buibrs73ahp9m0-a.oregon-postgres.render.com:5432/capstone_88"
engine = create_engine(url)
with engine.begin() as conn:
    try:
        conn.execute(text('ALTER TABLE sensor_data ADD COLUMN pm2_5 FLOAT'))
        print("Added pm2_5")
    except Exception as e:
        print("Skipped pm2_5, likely exists")
    
    try:
        conn.execute(text('ALTER TABLE sensor_data ADD COLUMN wind_speed FLOAT'))
        print("Added wind_speed")
    except Exception as e:
        print("Skipped wind_speed, likely exists")
print("Done altering table!")
