import requests

url = "http://127.0.0.1:8000/token"
data = {
    "username": "cv@gmail.com",
    "password": "testpassword123"
}
headers = {
    "Origin": "http://localhost:5173",
}

try:
    response = requests.post(url, data=data, headers=headers)
    print("STATUS:", response.status_code)
    try:
        print("JSON:", response.json())
    except:
        print("TEXT:", response.text)
except Exception as e:
    print("ERROR:", e)
