import os
import sys
import random
from datetime import datetime, timedelta
import pytz

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Force SQLite URL for local development
os.environ["DATABASE_URL"] = "sqlite:///./dev_database.db"

from app import database, models
from app.core import security
from sqlalchemy.orm import Session

def get_local_time():
    local_tz = pytz.timezone('Asia/Kolkata')
    return datetime.now(local_tz).replace(tzinfo=None)

def seed_everything():
    print("🌱 Initializing Database and Seeding Data...")
    
    # 1. Create Tables
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    
    try:
        # 2. Seed User
        email = "test@ecosync.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print("👤 Creating test user...")
            user = models.User(
                email=email,
                hashed_password=security.get_password_hash("password123"),
                first_name="Eco",
                last_name="Tester",
                plan="pro",
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # 3. Seed Device
        device_id = "ESP32_DEV_001"
        device = db.query(models.Device).filter(models.Device.id == device_id).first()
        if not device:
            print(f"🔌 Creating device {device_id}...")
            device = models.Device(
                id=device_id,
                name="Main Workshop Sensor",
                connector_type="esp32",
                lat=17.3850,
                lon=78.4867,
                status="online",
                user_id=user.id
            )
            db.add(device)
            db.commit()
            db.refresh(device)

        # 4. Seed Sensor Data
        print(f"📊 Seeding 500 records of sensor data for {device_id}...")
        
        # Only seed if sparse or empty
        count = db.query(models.SensorData).filter(models.SensorData.device_id == device_id).count()
        if count < 100:
            base_time = get_local_time() - timedelta(days=2)
            new_records = []
            
            for i in range(500):
                # Normal behavior with occasional spikes
                is_anomaly = random.random() < 0.02
                
                temp = round(random.uniform(23.0, 27.0), 2)
                hum = round(random.uniform(40.0, 60.0), 2)
                gas = round(random.uniform(150.0, 300.0), 2)
                
                if is_anomaly:
                    # Randomly spike one metric
                    spike_type = random.choice(['temp', 'gas'])
                    if spike_type == 'temp': temp += random.uniform(15.0, 25.0)
                    else: gas += random.uniform(1000.0, 2000.0)
                
                record = models.SensorData(
                    device_id=device_id,
                    user_id=user.id,
                    timestamp=base_time + timedelta(minutes=i * 5),
                    temperature=temp,
                    humidity=hum,
                    gas=gas,
                    anomaly_label="ANOMALY" if is_anomaly else "NORMAL",
                    anomaly_score=-0.15 if is_anomaly else 0.1
                )
                new_records.append(record)
            
            db.bulk_save_objects(new_records)
            db.commit()
            print(f"✨ Successfully seeded {len(new_records)} records.")
        else:
            print(f"✅ Database already has {count} records for this device.")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_everything()
