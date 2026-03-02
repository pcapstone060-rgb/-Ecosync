import os
from dotenv import load_dotenv

print("--- ENVIRONMENT DIAGNOSTIC ---")
print(f"Current Working Directory: {os.getcwd()}")

# Before load_dotenv
print(f"DATABASE_URL (before load_dotenv): {os.getenv('DATABASE_URL')}")

# Load .env
env_path = ".env"
if os.path.exists(env_path):
    print(f"Found .env at {env_path}")
    load_dotenv(env_path, override=True)
else:
    print(f".env NOT FOUND at {env_path}")

# After load_dotenv
print(f"DATABASE_URL (after load_dotenv): {os.getenv('DATABASE_URL')}")

from app import database
print(f"database.DATABASE_URL: {database.DATABASE_URL}")
print(f"database.engine.url: {database.engine.url}")
