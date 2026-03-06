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

if "postgresql" in SQLALCHEMY_DATABASE_URL and "sslmode" not in SQLALCHEMY_DATABASE_URL:
    separator = "&" if "?" in SQLALCHEMY_DATABASE_URL else "?"
    SQLALCHEMY_DATABASE_URL += f"{separator}sslmode=require"

# Emergency fallback: If the stale CockroachDB URL is still present in Render's dashboard,
# it will cause a crash loop due to missing SSL certs. Fall back to SQLite temporarily so
# the backend can at least start and serve the frontend until Render Sync completes.
if "cockroachlabs" in SQLALCHEMY_DATABASE_URL:
    print("WARNING: Stale CockroachDB URL detected. Falling back to SQLite to prevent backend crash loop.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./dev_database.db"

# Use slightly different args depending on if it's sqlite or postgres
# Note: CockroachDB uses the postgresql protocol (but we filter it out above)
is_postgres = SQLALCHEMY_DATABASE_URL.startswith("postgresql") or SQLALCHEMY_DATABASE_URL.startswith("postgres")

connect_args = {}
if not is_postgres:
    connect_args["check_same_thread"] = False

# Create the engine with pooled connections for production reliability
engine_kwargs = {"pool_pre_ping": True}
if is_postgres:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

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
