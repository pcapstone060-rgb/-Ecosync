from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

with open("boot_debug.txt", "a") as f:
    f.write(f"[{datetime.now()}] !!! DATABASE.PY INITIALIZING !!!\n")

from dotenv import load_dotenv

load_dotenv()

# First attempt to get the DATABASE_URL from .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev_database.db")

with open("boot_debug.txt", "a") as f:
    f.write(f"[{datetime.now()}] SQLALCHEMY_DATABASE_URL: {SQLALCHEMY_DATABASE_URL}\n")

# Use slightly different args depending on if it's sqlite or postgres
connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

with open("boot_debug.txt", "a") as f:
    f.write(f"[{datetime.now()}] ENGINE DIALECT: {engine.name}\n")
    f.write(f"[{datetime.now()}] ENGINE URL: {engine.url}\n")

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
