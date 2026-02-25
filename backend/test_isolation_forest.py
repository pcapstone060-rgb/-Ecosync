import sys
import os
import numpy as np

# Add backend to path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from ml_engine import IsolationForestAnomalyDetector, SmartInsightGenerator

def test_isolation_forest():
    print("--- Testing IsolationForestAnomalyDetector ---")
    detector = IsolationForestAnomalyDetector(contamination=0.1)
    
    # 1. Test Graceful Fallback (Untrained)
    label, score = detector.predict({"temperature": 25, "humidity": 50, "gas": 200, "pm2_5": 30})
    print(f"Untrained Prediction: {label}, Score: {score}")
    assert label == "NORMAL"
    
    # 2. Synthetic Training Data (Normal Patterns)
    # Normal: Temp 20-30, Hum 40-60, Gas 100-300, PM2.5 10-50
    np.random.seed(42)
    training_data = []
    for _ in range(200):
        training_data.append({
            "temperature": np.random.uniform(20, 30),
            "humidity": np.random.uniform(40, 60),
            "gas": np.random.uniform(100, 300),
            "pm2_5": np.random.uniform(10, 50)
        })
    
    print(f"Training on {len(training_data)} samples...")
    detector.train(training_data)
    assert detector.is_trained == True
    
    # 3. Test Normal Prediction
    normal_reading = {"temperature": 25, "humidity": 50, "gas": 200, "pm2_5": 25}
    label, score = detector.predict(normal_reading)
    print(f"Normal Reading: {label}, Score: {score:.4f}")
    assert label == "NORMAL"
    
    # 4. Test Anomaly Prediction (Multi-sensor spike)
    anomaly_reading = {"temperature": 55, "humidity": 10, "gas": 1200, "pm2_5": 400}
    label, score = detector.predict(anomaly_reading)
    print(f"Anomaly Reading: {label}, Score: {score:.4f}")
    assert label == "ANOMALY"
    
    # 5. Test Integration with SmartInsightGenerator
    print("\n--- Testing SmartInsightGenerator Integration ---")
    generator = SmartInsightGenerator()
    # Inject our trained detector into the generator's detector
    generator.if_detector = detector
    
    report = generator.generate_full_report(anomaly_reading, [])
    print(f"Insight: {report['insight']}")
    assert "Pattern Anomaly" in report['insight']
    print("Integration Test Passed!")

if __name__ == "__main__":
    try:
        test_isolation_forest()
        print("\nALL TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
