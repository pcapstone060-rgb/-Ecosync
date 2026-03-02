import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found.")
    exit(1)

engine = create_engine(DATABASE_URL)

columns_to_drop = [
    "pressure",
    "wind_speed",
    "pm10",
    "mq_raw",
    "ph"
]

print("Dropping unused columns from sensor_data...")
try:
    with engine.begin() as conn:
        for col in columns_to_drop:
            try:
                # Add IF EXISTS to handle cases where it might already be dropped
                conn.execute(text(f"ALTER TABLE sensor_data DROP COLUMN IF EXISTS {col};"))
                print(f"Dropped column: {col}")
            except Exception as e:
                print(f"Failed to drop {col}: {e}")
                
    print("\nColumn removal complete.")
except Exception as e:
    print(f"Failed to connect to database: {e}")
