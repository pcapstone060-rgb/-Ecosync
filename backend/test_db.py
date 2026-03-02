import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")

try:
    print(f"Connecting to: {url.split('@')[-1] if url else 'None'}")
    conn = psycopg2.connect(url)
    print("SUCCESS: Connection established.")
    conn.close()
except Exception as e:
    print(f"FAILURE: {e}")
