import requests
import json

base_url = "http://localhost:8000"

def test_health():
    print("Testing /health...")
    try:
        r = requests.get(f"{base_url}/health")
        print(f"Health: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_login():
    print("\nTesting /token (Login)...")
    payload = {
        "username": "gsrujana456@gmail.com",
        "password": "123456"
    }
    try:
        r = requests.post(f"{base_url}/token", data=payload)
        print(f"Login: {r.status_code}")
        if r.status_code == 200:
            print("✅ Login Successful!")
            print(f"Token: {r.json().get('access_token')[:20]}...")
        else:
            print(f"❌ Login Failed: {r.text}")
    except Exception as e:
        print(f"Login Test Failed: {e}")

if __name__ == "__main__":
    test_health()
    test_login()
