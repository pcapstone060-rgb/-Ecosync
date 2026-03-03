from app.database import engine, Base
from app import models
import os
from dotenv import load_dotenv

load_dotenv()

def create_tables():
    print("Creating tables in database...")
    # This will create any table defined in models.py that doesn't exist
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully.")

if __name__ == "__main__":
    create_tables()
