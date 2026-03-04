import requests

BASE_URL = "http://localhost:8001/api/settings/alerts"
USER_A = "sreekar092004@gmail.com"
USER_B = "gsrujana456@gmail.com"

def test_isolation():
    print(f"--- Testing Alert Isolation for {USER_A} and {USER_B} ---")
    
    # 1. Set User A Threshold
    print(f"Setting {USER_A} temp threshold to 31.0...")
    r = requests.post(BASE_URL, json={
        "user_email": USER_A,
        "temp_threshold": 31.0,
        "is_active": True
    })
    print(f"User A Post Status: {r.status_code}")
    if r.status_code != 200:
        print(f"ERROR: {r.text}")
        return
    
    # 2. Set User B Threshold
    print(f"Setting {USER_B} temp threshold to 51.0...")
    r = requests.post(BASE_URL, json={
        "user_email": USER_B,
        "temp_threshold": 51.0,
        "is_active": True
    })
    print(f"User B Post Status: {r.status_code}")
    if r.status_code != 200:
        print(f"ERROR: {r.text}")
        return
    
    # 3. Verify User A
    print(f"Retrieving {USER_A} settings...")
    r = requests.get(f"{BASE_URL}?email={USER_A}")
    print(f"User A Get Status: {r.status_code}")
    if r.status_code != 200:
        print(f"ERROR: {r.text}")
        return
    data = r.json()
    print(f"User A Temp Threshold: {data.get('temp_threshold')} (Expected: 31.0)")
    
    # 4. Verify User B
    print(f"Retrieving {USER_B} settings...")
    r = requests.get(f"{BASE_URL}?email={USER_B}")
    print(f"User B Get Status: {r.status_code}")
    if r.status_code != 200:
        print(f"ERROR: {r.text}")
        return
    data = r.json()
    print(f"User B Temp Threshold: {data.get('temp_threshold')} (Expected: 51.0)")
    
    if data.get('temp_threshold') == 51.0:
        print("✅ SUCCESS: Alert settings are correctly isolated per user.")
    else:
        print("❌ FAILURE: Isolation check failed.")

if __name__ == "__main__":
    test_isolation()
