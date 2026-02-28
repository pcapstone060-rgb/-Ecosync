import requests

try:
    response = requests.get("http://127.0.0.1:8000/api/ml/performance")
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(e)
