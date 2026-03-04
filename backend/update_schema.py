import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE alert_settings ADD COLUMN pm25_threshold FLOAT DEFAULT 150.0;"))
        conn.execute(text("ALTER TABLE alert_settings ADD COLUMN wind_threshold FLOAT DEFAULT 30.0;"))
        conn.commit()
        print("Schema updated successfully")
except Exception as e:
    print("Error:", e)
