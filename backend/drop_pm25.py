import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found.")
    exit(1)

engine = create_engine(DATABASE_URL)

print("Dropping pm2_5 column from sensor_data...")
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE sensor_data DROP COLUMN IF EXISTS pm2_5;"))
        print("Dropped column: pm2_5")
except Exception as e:
    print(f"Failed to drop pm2_5: {e}")
