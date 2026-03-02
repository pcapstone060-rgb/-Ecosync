from app.database import engine
from sqlalchemy import text

def run_migration():
    # Use raw SQL to add columns safely without needing full Alembic setup
    queries = [
        "ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS pm25_threshold FLOAT DEFAULT 150.0;",
        "ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS wind_threshold FLOAT DEFAULT 30.0;"
    ]
    with engine.connect() as conn:
        for query in queries:
            try:
                conn.execute(text(query))
                print(f"Executed: {query}")
            except Exception as e:
                print(f"Skipped/Error on {query}: {e}")
        conn.commit()
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
