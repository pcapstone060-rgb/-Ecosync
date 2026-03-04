from app.database import engine
from sqlalchemy import text

def inspect_ddl():
    print("--- Table DDL Inspection ---")
    with engine.connect() as conn:
        # Check columns for alert_settings
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'alert_settings'
            ORDER BY ordinal_position;
        """))
        for row in result:
            print(f"Column: {row[0]} | Type: {row[1]} | Nullable: {row[2]} | Default: {row[3]}")

if __name__ == "__main__":
    inspect_ddl()
