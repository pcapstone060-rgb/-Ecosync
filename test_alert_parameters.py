import requests
import sys

BASE_URL = "http://localhost:8001/api/settings/alerts"
USER_EMAIL = "sreekar092004@gmail.com"

def verify_parameters():
    print(f"--- Verifying Alert Parameters for {USER_EMAIL} ---")
    
    # 1. Update settings with desired 4 parameters
    payload = {
        "user_email": USER_EMAIL,
        "temp_threshold": 35.5,
        "humidity_min": 25.0,
        "humidity_max": 75.0,
        "gas_threshold": 550.0,
        "rain_alert": True,
        "is_active": True
    }
    
    print(f"Posting updated settings...")
    r = requests.post(BASE_URL, json=payload)
    if r.status_code != 200:
        print(f"Post Error: {r.status_code} - {r.text}")
        return False
    
    # 2. Add extra (deprecated) parameters to verify they are ignored/rejected
    payload_extra = payload.copy()
    payload_extra["pm25_threshold"] = 200.0
    payload_extra["wind_threshold"] = 50.0
    payload_extra["motion_alert"] = False
    
    print(f"Posting settings with extra (illegal) parameters...")
    r = requests.post(BASE_URL, json=payload_extra)
    # Depending on Pydantic's 'extra' config, it might ignore or error. 
    # Usually it ignores if not specified in the schema.
    if r.status_code == 422:
        print("✅ SUCCESS: Server rejected extra parameters as expected.")
    elif r.status_code == 200:
        print("⚠️ NOTE: Server accepted but likely ignored extra parameters.")
    else:
        print(f"Unexpected status: {r.status_code}")

    # 3. Retrieve settings and check keys
    print(f"Retrieving settings and verifying keys...")
    r = requests.get(f"{BASE_URL}?email={USER_EMAIL}")
    if r.status_code != 200:
        print(f"Get Error: {r.status_code}")
        return False
        
    data = r.json()
    allowed_keys = {
        "user_email", "temp_threshold", "humidity_min", "humidity_max", 
        "gas_threshold", "rain_alert", "is_active", "created_at", "updated_at"
    }
    present_keys = set(data.keys())
    
    extra_keys = present_keys - allowed_keys
    forbidden_keys = {"pm25_threshold", "wind_threshold", "motion_alert"}
    found_forbidden = extra_keys.intersection(forbidden_keys)
    
    if found_forbidden:
        print(f"❌ FAILURE: Forbidden keys still present in response: {found_forbidden}")
        return False
    else:
        print(f"✅ SUCCESS: No forbidden keys found. Only desired parameters present.")
        print(f"Keys present: {list(present_keys)}")
        return True

if __name__ == "__main__":
    if verify_parameters():
        sys.exit(0)
    else:
        sys.exit(1)
