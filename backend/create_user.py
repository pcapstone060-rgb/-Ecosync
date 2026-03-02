import os
import sys
from passlib.context import CryptContext

# Add current dir to path
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_user():
    db = SessionLocal()
    try:
        email = "gsrujana456@gmail.com"
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            print(f"User {email} already exists.")
            return

        print(f"Creating test user: {email}")
        hashed_password = pwd_context.hash("123456") # Default password for testing
        new_user = models.User(
            email=email,
            hashed_password=hashed_password,
            is_verified=True,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        print("✅ Test user created successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
