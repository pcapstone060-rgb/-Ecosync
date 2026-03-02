import requests
import time
import random

URL = "http://localhost:8000/iot/data"

print("Sending 3 simulated sensor readings to the local FastAPI server...")

for i in range(3):
    payload = {
        "temperature": 25.0 + random.uniform(-2, 2),
        "humidity": 50.0 + random.uniform(-5, 5),
        "mq_raw": 300.0 + random.uniform(-10, 10),
        "rain": 4095.0,
        "motion": 0,
        "gas": 400.0,
        "user_email": "demo_sensor@ecosync.local"
    }
    
    try:
        response = requests.post(URL, json=payload, timeout=5)
        print(f"Data {i+1} sent! Status Code: {response.status_code}")
    except Exception as e:
        print(f"Error sending data: {e}")
        
    time.sleep(1)

print("\nFinished sending data. You can now check the database row counts.")
