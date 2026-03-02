"""
Script to seed a test user in the SQLite database.
"""
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Force SQLite URL
os.environ["DATABASE_URL"] = "sqlite:///./dev_database.db"

from backend.app import database, models, schemas
from backend.app.core import security
from sqlalchemy.orm import Session

def seed_user():
    print("🌱 Seeding test user...")
    db = database.SessionLocal()
    try:
        # Check if user already exists
        email = "gsrujana456@gmail.com"
        existing = db.query(models.User).filter(models.User.email == email).first()
        
        if existing:
            print(f"✅ User {email} already exists.")
            return

        # Create user
        hashed_password = security.get_password_hash("123456")
        new_user = models.User(
            email=email,
            hashed_password=hashed_password,
            first_name="Srujana",
            last_name="G",
            plan="pro",
            location_name="Hyderabad",
            is_verified=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"✨ Successfully seeded user: {email}")
        
    except Exception as e:
        print(f"❌ Error seeding user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_user()
