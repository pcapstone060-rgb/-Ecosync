import sys
import os
import traceback
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal, engine
from app.models import SensorData, Device, User
from datetime import datetime
from sqlalchemy import text

print(f"Engine URL: {engine.url}")

db = SessionLocal()
try:
    print("Checking database connectivity with raw SQL...")
    result = db.execute(text("SELECT current_database(), current_user")).fetchone()
    print(f"Connected to: {result}")

    print("Checking for user with id=1...")
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        print("User 1 not found! Creating...")
        user = User(id=1, email="test@example.com", hashed_password="pw")
        db.add(user)
        db.commit()
    
    print("Checking for device ESP32_MAIN...")
    device = db.query(Device).filter(Device.id == "ESP32_MAIN").first()
    if not device:
        print("Device not found! Creating...")
        device = Device(id="ESP32_MAIN", name="Test Device", user_id=user.id, connector_type="esp32")
        db.add(device)
        db.commit()
        print("Device created successfully.")
    
    print("Attempting to insert SensorData...")
    measurement = SensorData(
        device_id="ESP32_MAIN",
        timestamp=datetime.now(),
        temperature=25.5,
        humidity=60.1,
        gas=450.0,
        rain=4095.0,
        motion=0,
        trust_score=99.9,
        anomaly_label="Normal",
        anomaly_score=0.01,
        smart_insight="Safe",
        user_id=user.id
    )
    
    db.add(measurement)
    print("Committing...")
    db.commit()
    print("SUCCESS: Data committed to database.")
    
    # Verify count immediately
    count = db.query(SensorData).count()
    print(f"Verification: sensor_data count is now {count}")

except Exception:
    print("\n--- DATABASE ERROR TRACEBACK ---")
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
