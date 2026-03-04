from app.database import SessionLocal, engine
from app import models
from sqlalchemy import inspect

def check_db():
    print("--- Database Diagnostics ---")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    
    if "users" in tables:
        db = SessionLocal()
        try:
            users = db.query(models.User).all()
            print(f"Users in DB ({len(users)}): {[u.email for u in users]}")
        except Exception as e:
            print(f"Error querying users: {e}")
        finally:
            db.close()
    else:
        print("CRITICAL: 'users' table is missing!")

if __name__ == "__main__":
    check_db()
