import os
import sys
from sqlalchemy import create_engine, MetaData, Table, inspect
from sqlalchemy.orm import sessionmaker

from dotenv import load_dotenv

load_dotenv()

SOURCE_DB_URL = "sqlite:///dev_database.db"
TARGET_DB_URL = os.getenv("DATABASE_URL")

if not TARGET_DB_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

def migrate():
    print(f"Connecting to Source SQLite DB...")
    source_engine = create_engine(SOURCE_DB_URL)
    
    print(f"Connecting to Target Render Postgres DB...")
    try:
        target_engine = create_engine(TARGET_DB_URL)
        target_engine.connect()
    except Exception as e:
        print(f"Failed to connect to Target DB. Error: {e}")
        sys.exit(1)

    # Import backend models to create correct PostgreSQL schema instead of reflecting SQLite
    from app.models import Base
    
    # Create schema in target
    print("Creating tables in Target DB using application models...")
    Base.metadata.create_all(bind=target_engine)
    
    # Reflect schema from source only for data extraction
    metadata = MetaData()
    metadata.reflect(bind=source_engine)
    
    # Migrate data
    for table_name in metadata.tables:
        table = metadata.tables[table_name]
        print(f"Migrating table {table_name}...")
        
        with source_engine.connect() as src_conn:
            with target_engine.connect() as tgt_conn:
                # Use chunking for large tables
                result = src_conn.execute(table.select())
                
                chunk_size = 10000
                while True:
                    rows = result.fetchmany(chunk_size)
                    if not rows:
                        break
                    
                    # Convert rows to dicts
                    dicts = [dict(row._mapping) for row in rows]
                    
                    # Insert in chunks
                    try:
                        tgt_conn.execute(table.insert(), dicts)
                        tgt_conn.commit()
                    except Exception as e:
                        print(f"Error migrating table {table_name}: {e}")
                        tgt_conn.rollback()
                        
                print(f"Table {table_name} migrated successfully.")

    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
