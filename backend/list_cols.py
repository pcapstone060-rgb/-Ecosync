from app.database import engine
from sqlalchemy import text

def list_cols():
    print("--- alert_settings Column List ---")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM alert_settings LIMIT 0;"))
        print(f"Columns: {result.keys()}")

if __name__ == "__main__":
    list_cols()
