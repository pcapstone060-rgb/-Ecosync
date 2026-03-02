"""
Script to recreate database tables for local SQLite development
"""
import os
import sys

# Set SQLite database URL
os.environ["DATABASE_URL"] = "sqlite:///./dev_database.db"

from app.database import engine, Base
# Import all models here so they register with Base.metadata
from app import models
from app.models import User, Device, SensorData, Alert, AlertSettings, SafetyLog, MLLog

def recreate_tables():
    print("🔧 Recreating database tables...")
    
    # Drop all tables
    print("📦 Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables
    print("✨ Creating new tables...")
    Base.metadata.create_all(bind=engine)
    
    # Verify tables
    import sqlalchemy
    inspector = sqlalchemy.inspect(engine)
    tables = inspector.get_table_names()
    
    print(f"\n✅ Successfully created {len(tables)} tables:")
    for table in sorted(tables):
        print(f"   - {table}")
    
    # Check if alert_settings exists
    if 'alert_settings' in tables:
        print("\n✅ alert_settings table created successfully!")
    else:
        print("\n❌ WARNING: alert_settings table not found!")
    
    print("\n🎉 Database recreation complete!")

if __name__ == "__main__":
    recreate_tables()
