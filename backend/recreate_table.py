from app.database import engine
from sqlalchemy import text

def recreate_alert_settings():
    print("--- Recreating alert_settings Table ---")
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Drop existing table
            print("Dropping alert_settings...")
            conn.execute(text("DROP TABLE IF EXISTS alert_settings CASCADE;"))
            
            # 2. Recreate using SQL for maximum control over SERIAL
            print("Creating alert_settings with SERIAL ID...")
            conn.execute(text("""
                CREATE TABLE alert_settings (
                    id SERIAL PRIMARY KEY,
                    user_email VARCHAR(255) REFERENCES users(email),
                    temp_threshold FLOAT DEFAULT 45.0,
                    humidity_min FLOAT DEFAULT 20.0,
                    humidity_max FLOAT DEFAULT 80.0,
                    gas_threshold FLOAT DEFAULT 600.0,
                    pm25_threshold FLOAT DEFAULT 150.0,
                    wind_threshold FLOAT DEFAULT 30.0,
                    rain_alert BOOLEAN DEFAULT TRUE,
                    motion_alert BOOLEAN DEFAULT TRUE,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                );
            """))
            trans.commit()
            print("✅ SUCCESS: alert_settings table recreated.")
        except Exception as e:
            trans.rollback()
            print(f"❌ FAILURE: {e}")

if __name__ == "__main__":
    recreate_alert_settings()
