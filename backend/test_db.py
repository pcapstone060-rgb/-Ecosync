import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import SensorData, Device
from datetime import datetime

db = SessionLocal()
try:
    print("Testing DB connection...")
    
    device = db.query(Device).filter(Device.id == "ESP32_MAIN").first()
    if not device:
        print("Device not found! Creating one...")
        device = Device(id="ESP32_MAIN", name="Test Device", user_id=1, connector_type="esp32")
        db.add(device)
        db.commit()
    
    print("Creating SensorData...")
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
        smart_insight="Safe"
    )
    
    db.add(measurement)
    db.commit()
    print("Successfully committed to database!")
    
except Exception as e:
    print(f"FAILED TO COMMIT: {e}")
finally:
    db.close()
