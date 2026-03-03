import os
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

# Load the database URL from .env
load_dotenv()
db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

print(f"Connecting to Database...\n")
engine = create_engine(db_url)
inspector = inspect(engine)

# Get all table names
tables = inspector.get_table_names()
print(f"📌 Found {len(tables)} tables: {', '.join(tables)}\n")

with engine.connect() as conn:
    for table_name in tables:
        print(f"{'='*60}")
        print(f" 🗃️ TABLE: {table_name.upper()} (Showing top 5 rows)")
        print(f"{'='*60}")
        
        # Get column names
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        header = " | ".join(name.ljust(15)[:15] for name in columns)
        print(header)
        print("-" * len(header))
        
        try:
            # Query the first 5 rows
            result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 5"))
            rows = result.fetchall()
            
            if not rows:
                print("(Table is empty)")
            else:
                for row in rows:
                    # Format each value to have a fixed width of 15 characters
                    row_str = " | ".join(str(val).ljust(15)[:15].replace('\n', ' ') for val in row)
                    print(row_str)
        except Exception as e:
            print(f"Error reading table: {e}")
        print("\n")
