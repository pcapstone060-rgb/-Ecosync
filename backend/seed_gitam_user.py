import sys
import os
import sqlalchemy
from sqlalchemy.orm import Session

# Add the current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import database, models
from app.core import security

def seed_user():
    # Force SQLite for seeding
    os.environ["DATABASE_URL"] = "sqlite:///./iot_system.db"
    
    # Initialize DB schema
    models.Base.metadata.create_all(bind=database.engine)
    
    db = database.SessionLocal()
    try:
        email = "skunthal@gitam.in"
        password = "Admin123@#$" # Default guess
        
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            print(f"User {email} already exists in SQLite.")
        else:
            print(f"Seeding user: {email}")
            user = models.User(
                email=email,
                hashed_password=security.get_password_hash(password),
                first_name="Sreekar", # Guess based on the name in path
                last_name="K",
                is_verified=True,
                plan="pro"
            )
            db.add(user)
            db.commit()
            print(f"User {email} seeded successfully.")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed_user()
