import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.app import database
from backend.app import models

print(f"database.__file__: {database.__file__}")
print("--- DATABASE DIAGNOSTIC ---")
print(f"DATABASE_URL: {database.DATABASE_URL}")
print(f"Engine Type: {type(database.engine)}")
print(f"Engine Dialect: {database.engine.name}")

# Try a simple query
db = database.SessionLocal()
try:
    print("Testing User query...")
    count = db.query(models.User).count()
    print(f"User count: {count}")
except Exception as e:
    print(f"Query Failed: {e}")
    import traceback
    print(traceback.format_exc())
finally:
    db.close()
