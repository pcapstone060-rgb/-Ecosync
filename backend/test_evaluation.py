import sys
import os
import numpy as np
from datetime import datetime

# Add the current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ml_engine import (
    IsolationForestAnomalyDetector, 
    IoTAnomalyDetector, 
    ModelEvaluationEngine,
    compare_models,
    plot_roc_curve
)

def run_evaluation_demo():
    print("====================================================")
    print("   EcoSync AI: Model Evaluation & Comparison demo")
    print("====================================================\n")

    # 1. Generate Synthetic Training Data (Normal behavior)
    # 500 samples of normal environment
    train_data = []
    for _ in range(500):
        train_data.append({
            "temperature": 25 + np.random.normal(0, 2),
            "humidity": 50 + np.random.normal(0, 5),
            "gas": 200 + np.random.normal(0, 20),
            "pm2_5": 20 + np.random.normal(0, 5)
        })

    # 2. Train Isolation Forest
    iso_detector = IsolationForestAnomalyDetector(contamination=0.1)
    iso_detector.train(train_data)

    # 3. Generate Test Data with Ground Truth
    # 100 samples: 80 Normal, 20 Anomaly
    test_data = []
    y_true = []

    # Normal samples
    for _ in range(80):
        test_data.append({
            "temperature": 25 + np.random.normal(0, 2),
            "humidity": 50 + np.random.normal(0, 5),
            "gas": 200 + np.random.normal(0, 20),
            "pm2_5": 20 + np.random.normal(0, 5)
        })
        y_true.append(0)

    # Anomaly samples (Spikes)
    for _ in range(20):
        test_data.append({
            "temperature": 55 + np.random.normal(0, 10), # High heat
            "humidity": 15 + np.random.normal(0, 5),     # Bone dry
            "gas": 1500 + np.random.normal(0, 300),      # Gas leak
            "pm2_5": 300 + np.random.normal(0, 50)       # Heavy smoke
        })
        y_true.append(1)

    # 4. Run Predictions
    print("Running predictions on test set...")
    iso_preds = []
    iso_scores = []
    zscore_preds = []
    
    z_detector = IoTAnomalyDetector()
    
    for d in test_data:
        # IF Prediction
        label, score = iso_detector.predict(d)
        # Convert "ANOMALY"/"NORMAL" back to IF format (-1/1) for the evaluator
        iso_preds.append(-1 if label == "ANOMALY" else 1)
        iso_scores.append(score)
        
        # Z-Score Prediction (simplified)
        # Note: IoTAnomalyDetector.update_and_predict uses a specific vector format
        # [temp, pressure, vibration, wind, uv, soil_temp, soil_moist, pm25, pm10, no2, solar]
        # We simulate its response for illustration
        feat_vector = [d['temperature'], 1013, 0.1, 5, 2, 25, 0.5, d['pm2_5'], 30, 10, 500]
        is_z_anomaly, _ = z_detector.update_and_predict(feat_vector)
        zscore_preds.append(1 if is_z_anomaly else 0)

    # 5. Evaluate
    evaluator = ModelEvaluationEngine()
    eval_results = evaluator.evaluate_anomaly_models(y_true, iso_preds, zscore_preds, iso_scores)

    print("\n[DONE] Evaluation Complete.")
    print("\n--- MODEL COMPARISON TABLE ---")
    print(compare_models(eval_results))

    # 6. Plot ROC Curve
    roc_path = plot_roc_curve(y_true, iso_scores)
    print(f"\n[DONE] ROC Curve saved to: {roc_path}")

    # 7. Prediction Engine Evaluation (Regression)
    print("\n--- PREDICTION ACCURACY (REGRESSION) ---")
    y_true_temp = [25.0, 26.5, 28.0, 30.2, 32.1]
    y_pred_temp = [25.2, 26.0, 28.5, 31.0, 32.0]
    
    pred_metrics = evaluator.evaluate_prediction(y_true_temp, y_pred_temp)
    print(f"Mean Absolute Error (MAE): {pred_metrics['mae']:.4f}")
    print(f"Root Mean Square Error (RMSE): {pred_metrics['rmse']:.4f}")
    print(f"Mean Absolute Percentage Error (MAPE): {pred_metrics['mape']:.2f}%")

    print("\n====================================================")
    print("   End of Evaluation Report")
    print("====================================================")

if __name__ == "__main__":
    run_evaluation_demo()
