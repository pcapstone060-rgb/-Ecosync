import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

from app.ml_engine import calculate_isolation_forest_performance

if __name__ == "__main__":
    import json
    results = calculate_isolation_forest_performance()
    print("RESULTS:")
    print(json.dumps(results, indent=2))
