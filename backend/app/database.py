from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

with open("boot_debug.txt", "a") as f:
    f.write(f"[{datetime.now()}] !!! DATABASE.PY INITIALIZING (PID: {os.getpid()}) !!!\n")

from dotenv import load_dotenv

# Production-ready Database Configuration
load_dotenv()

# First attempt to get the RENDER_DB_URL (if blueprint synced), then DATABASE_URL
SQLALCHEMY_DATABASE_URL = os.getenv("RENDER_DB_URL", os.getenv("DATABASE_URL", "sqlite:///./dev_database.db"))

# Sanitize the URL for SQLAlchemy 2.0 and Render SSL requirements
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_postgres = "postgresql" in SQLALCHEMY_DATABASE_URL

# Print sanitized URL for easier Render debugging
sanitized_url = SQLALCHEMY_DATABASE_URL.split("@")[-1] if "@" in SQLALCHEMY_DATABASE_URL else SQLALCHEMY_DATABASE_URL
print(f"DATABASE CONNECT START: Target host is {sanitized_url}")

connect_args = {}
if not is_postgres:
    connect_args["check_same_thread"] = False
else:
    # Explicitly enforce SSL mode for Render production
    connect_args["sslmode"] = "require"

# Create the engine with pooled connections for production reliability
engine_kwargs = {"pool_pre_ping": True}
if is_postgres:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

try:
    print(f"Attempting to create engine for {is_postgres and 'PostgreSQL' or 'SQLite'}...")
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args=connect_args,
        **engine_kwargs
    )
    # Test connection immediately
    with engine.connect() as conn:
        print("DATABASE CONNECTION: SUCCESS")
except Exception as e:
    print(f"DATABASE CONNECTION: FAILED with error: {str(e)}")
    print("EMERGENCY FALLBACK: Switching to local SQLite to keep server alive.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./emergency.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Resulting engine and session
# Models should be imported elsewhere to register with Base
