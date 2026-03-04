from app.database import engine
from app import models
from sqlalchemy import text

def recreate_with_metadata():
    print("--- Recreating alert_settings with Metadata ---")
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            print("Dropping alert_settings table...")
            conn.execute(text("DROP TABLE IF EXISTS alert_settings CASCADE;"))
            trans.commit()
            print("Recreating all tables using metadata...")
            models.Base.metadata.create_all(bind=engine)
            print("✅ SUCCESS: alert_settings recreated via SQLAlchemy.")
        except Exception as e:
            trans.rollback()
            print(f"❌ FAILURE: {e}")

if __name__ == "__main__":
    recreate_with_metadata()
