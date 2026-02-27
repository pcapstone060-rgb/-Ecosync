from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables with absolute path support
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # This is backend/app/
ROOT_DIR = os.path.dirname(BASE_DIR) # This is backend/
ENV_PATH = os.path.join(ROOT_DIR, ".env.local")

if os.path.exists(ENV_PATH):
    print(f"Loading environment from: {ENV_PATH}")
    load_dotenv(ENV_PATH, override=True)
else:
    print(f"No .env.local found at {ENV_PATH}, falling back to default dotenv")
    load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./iot_system.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"--- DATABASE INITIALIZATION ---")
print(f"URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

# Create engine
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False, "timeout": 30},
        echo=True
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require", "connect_timeout": 10},
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
        echo=True
    )

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base model
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Import models to make them available
from .models import User, Device, SensorData, Alert, AlertSettings
