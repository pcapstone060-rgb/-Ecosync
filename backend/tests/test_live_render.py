import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url or "render" not in db_url:
    print(f"Error: DATABASE_URL is not pointing to Render. Current URL: {db_url}")
    sys.exit(1)

print(f"Testing active connection to: {db_url.split('@')[1]}")

try:
    engine = create_engine(db_url)
    connection = engine.connect()
    print("✅ Connection stable.")
    
    from app.models import Base, Device
    import uuid
    from sqlalchemy.orm import sessionmaker
    
    # Create explicit Session bounds to exactly the URL we tested
    SessionLocalTest = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocalTest()
    
    # 1. Count devices before
    count_before = db.query(Device).count()
    print(f"📊 Initial device count: {count_before}")
    
    # 2. Insert a test device
    test_id = str(uuid.uuid4())[:8]
    test_device = Device(
        id=f"test_device_{test_id}",
        name="Render Connection Test Device",
        connector_type="test",
        lat=0.0,
        lon=0.0,
        status="created"
    )
    db.add(test_device)
    db.commit()
    print("✅ Successfully wrote data to Render database!")
    
    # 3. Read it back
    count_after = db.query(Device).count()
    print(f"📊 New device count: {count_after}")
    
    verify_device = db.query(Device).filter(Device.id == f"test_device_{test_id}").first()
    if verify_device:
        print(f"✅ Successfully read data back: '{verify_device.name}'")
    else:
        print("❌ Failed to read data back!")
        
    # 4. Clean up the test device
    db.delete(verify_device)
    db.commit()
    print("🧹 Cleaned up test data.")
    
    print("\n🎉 ALL TESTS PASSED: Render Database is fully operational for R/W.")
    
except Exception as e:
    print(f"❌ Error during specific database operation: {e}")

