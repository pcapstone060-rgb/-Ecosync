import sqlalchemy
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:7Ppc6dkM1Ob98LHZ@db.moulkspffuxigvwlflho.supabase.co:5432/postgres"

print(f"Attempting to connect to: {DATABASE_URL.split('@')[1]}")

try:
    engine = sqlalchemy.create_engine(DATABASE_URL, connect_args={'connect_timeout': 5})
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print(f"Connection SUCCESS: {result.fetchone()}")
except Exception as e:
    print(f"Connection FAILED: {e}")

# Try with pooler port 6543
DATABASE_URL_POOLER = "postgresql://postgres:7Ppc6dkM1Ob98LHZ@db.moulkspffuxigvwlflho.supabase.co:6543/postgres"
print(f"\nAttempting to connect to POOLER: {DATABASE_URL_POOLER.split('@')[1]}")
try:
    engine = sqlalchemy.create_engine(DATABASE_URL_POOLER, connect_args={'connect_timeout': 5})
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print(f"Pooler Connection SUCCESS: {result.fetchone()}")
except Exception as e:
    print(f"Pooler Connection FAILED: {e}")
