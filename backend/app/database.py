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

# First attempt to get the DATABASE_URL from .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev_database.db")

# Use slightly different args depending on if it's sqlite or postgres
# Note: CockroachDB uses the postgresql protocol
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
