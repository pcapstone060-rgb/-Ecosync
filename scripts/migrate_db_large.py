import os
import sys
from sqlalchemy import create_engine, MetaData, Table, inspect
from sqlalchemy.orm import sessionmaker

SOURCE_DB_URL = "postgresql://neondb_owner:npg_ICF8B4KdbmlV@ep-muddy-cake-a19mcgqz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
TARGET_DB_URL = "postgresql://capstone_88st_user:BBHknnCe3zprJfwFHvqC7QHrWer8vkmj@dpg-d6j5qccr85hc73fqfbhg-a.oregon-postgres.render.com/capstone_88st"

def migrate():
    print(f"Connecting to Source DB...")
    source_engine = create_engine(SOURCE_DB_URL)
    
    print(f"Connecting to Target DB...")
    try:
        target_engine = create_engine(TARGET_DB_URL)
        target_engine.connect()
    except Exception as e:
        print(f"Failed to connect to Target DB. Is the hostname and dbname correct? Error: {e}")
        sys.exit(1)

    # Reflect schema from source
    metadata = MetaData()
    metadata.reflect(bind=source_engine)
    
    # Create schema in target
    print("Creating tables in Target DB...")
    metadata.create_all(bind=target_engine)
    
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
                    tgt_conn.execute(table.insert(), dicts)
                    tgt_conn.commit()
                    
                print(f"Table {table_name} migrated successfully.")

    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
