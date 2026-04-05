import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found.")
    sys.exit(1)

print(f"Connecting to: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Connection successful.")

    tables = ["users", "devices", "sensor_data", "ml_logs", "alerts", "alert_settings", "safety_logs"]
    for t in tables:
        with engine.connect() as conn:
            try:
                res = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
                print(f"Table '{t}' exists, rows: {res}")
            except Exception as e:
                print(f"Table '{t}' query failed: {e}")
                
except Exception as e:
    print(f"Failed to connect: {e}")
    sys.exit(1)
