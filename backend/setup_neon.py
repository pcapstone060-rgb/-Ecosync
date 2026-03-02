import os
from dotenv import load_dotenv
from app.database import engine
from app.models import Base

load_dotenv()
print("Creating tables in Neon...")
Base.metadata.create_all(bind=engine)
print("Tables initialized successfully.")
