import os
from sqlalchemy import create_engine, MetaData, text
from dotenv import load_dotenv

# Load the database URL from .env
load_dotenv()
db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

print("Synchronizing PostgreSQL Sequences...")
engine = create_engine(db_url)
metadata = MetaData()
metadata.reflect(bind=engine)

with engine.connect() as conn:
    for table_name in metadata.tables:
        table = metadata.tables[table_name]
        
        # Look for the primary key column
        pk_cols = [c.name for c in table.primary_key.columns if str(c.type).startswith("INTEGER") or str(c.type) == "SERIAL"]
        if not pk_cols:
            continue
            
        pk_col = pk_cols[0]
        seq_name = f"{table_name}_{pk_col}_seq"
        
        try:
            # Check if sequence exists and current max id
            print(f"Syncing table: {table_name}, column: {pk_col}")
            query = f"SELECT setval(pg_get_serial_sequence('{table_name}', '{pk_col}'), COALESCE(MAX({pk_col}), 1)) FROM {table_name};"
            conn.execute(text(query))
            conn.commit()
            print(f"✅ Synced {table_name}")
        except Exception as e:
            conn.rollback()
            print(f"⚠️ Could not sync {table_name}: {e}")

print("Done synchronizing sequences!")
