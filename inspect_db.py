from app.database import SessionLocal
from app import models

db = SessionLocal()
try:
    readings = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).limit(10).all()
    print("--- Latest 10 Sensor Readings ---")
    for r in readings:
        print(f"ID: {r.id} | Device: {r.device_id} | Time: {r.timestamp} | Temp: {r.temperature} | Hum: {r.humidity} | Gas: {r.pm10}")
finally:
    db.close()
