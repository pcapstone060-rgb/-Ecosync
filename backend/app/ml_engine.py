import os
from typing import List, Dict
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score, accuracy_score, 
    roc_auc_score, confusion_matrix, mean_absolute_error, 
    mean_squared_error, roc_curve, auc
)
import matplotlib.pyplot as plt
import numpy as np

from datetime import datetime

# Shared Alert Logger (same as main.py)
ALERT_LOG_FILE = os.path.join(os.path.dirname(__file__), "alert_system.log")
def log_ml_activity(message: str):
    try:
        with open(ALERT_LOG_FILE, "a", encoding="utf-8") as f:
            ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"[{ts}] [ML] {message}\n")
    except: pass

import math

class AdaptiveKalmanFilter:
    """
    Lightweight 1D Kalman Filter (Scalar) to replace filterpy.
    Reduces dependency size for Vercel.
    """
    def __init__(self, initial_value=0.0):
        self.x = initial_value  # State estimate
        self.p = 1.0           # Estimate error covariance
        self.q = 0.01          # Process noise covariance
        self.r = 5.0           # Measurement noise covariance (smoothing)

    def update(self, measurement):
        # Predict
        self.p = self.p + self.q
        
        # Adaptive Logic: If residual is high, increase Q to track faster
        residual = abs(measurement - self.x)
        current_q = 1.0 if residual > 2.0 else 0.01
        
        # Update
        k = (self.p) / (self.p + self.r) # Kalman Gain
        self.x = self.x + k * (measurement - self.x)
        self.p = (1 - k) * self.p
        
        return float(self.x)

    def predict_future(self, steps=10):
        """Simple persistence prediction for lightweight version"""
        return [float(self.x)] * steps

class Preprocessor:
    def __init__(self):
        # [temp, humidity, gas]
        self.min_vals = [-10.0, 0.0, 0.0]
        self.max_vals = [100.0, 100.0, 10000.0]

    def scale(self, features):
        scaled = []
        for i in range(len(features)):
            s = (features[i] - self.min_vals[i]) / (self.max_vals[i] - self.min_vals[i])
            scaled.append(s)
        return scaled

class TrustScoreCalculator:
    def __init__(self):
        self.history = []

    def calculate_score(self, reading: dict):
        """
        Calculate trust score (0-100) based on:
        1. Range Validity (Physics check)
        2. Signal Stability (Variance check)
        3. Battery/Power (Simulated)
        """
        score = 100.0
        
        # 1. Physics Range Check
        if not (-50 <= reading.get('temperature', 0) <= 100): score -= 30
        if not (0 <= reading.get('humidity', 0) <= 100): score -= 20
        
        # 2. Stability Check (Simulated for single reading)
        if len(self.history) > 5:
            temps = [x['temperature'] for x in self.history[-5:]]
            avg = sum(temps) / len(temps)
            if abs(reading.get('temperature', 0) - avg) > 10: 
                score -= 15 # Sudden spike penalty

        self.history.append(reading)
        if len(self.history) > 20: self.history.pop(0)
            
        return float(max(0.0, min(100.0, score)))


class RiskLevelCalculator:
    def calculate_risk(self, data: dict, anomalies: list) -> str:
        """
        Determines risk level based on fire-cracker industry standards.
        Output: 'SAFE', 'MODERATE', 'CRITICAL'
        """
        score = 0
        temp = data.get('temperature', 0)
        gas = data.get('gas', 0)
        humidity = data.get('humidity', 50)
        
        # 1. Temperature Risks
        if temp > 50: score += 3 # Critical
        elif temp > 40: score += 1 # Moderate
        
        # 2. Gas Risks
        if gas > 1000: score += 3 # Critical
        elif gas > 500: score += 1 # Moderate
        
        # 3. Humidity Risks (Dryness = Static Electricity Risk)
        if humidity < 30: score += 2 # Moderate-High
        
        # 4. Anomaly Boost
        if anomalies: score += 2
        
        if score >= 3: return "CRITICAL"
        if score >= 1: return "MODERATE"
        return "SAFE"

class PredictionEngine:
    def predict_next_10_mins(self, history: list) -> dict:
        """
        Simple linear projection for short-term trends.
        """
        if len(history) < 5:
            return {"temperature": "Stable", "gas": "Stable"}
            
        # Get last 5 temps
        temps = [x.get('temperature', 0) for x in history[-5:]]
        gases = [x.get('gas', 0) for x in history[-5:]]
        
        # Calculate slope (simple last - first)
        temp_slope = temps[-1] - temps[0]
        gas_slope = gases[-1] - gases[0]
        
        t_trend = "Rising" if temp_slope > 0.5 else ("Falling" if temp_slope < -0.5 else "Stable")
        g_trend = "Rising" if gas_slope > 10 else ("Falling" if gas_slope < -10 else "Stable")
        
        return {"temperature": t_trend, "gas": g_trend}

class SensorHealthMonitor:
    def check_health(self, history: list) -> dict:
        """
        Detects sensor faults like 'Stuck Value' or 'Noisy/Spiky'.
        """
        health = {"temperature": "OK", "gas": "OK", "humidity": "OK"}
        
        if len(history) < 10: return health
        
        for sensor in ["temperature", "gas", "humidity"]:
            readings = [x.get(sensor, 0) for x in history[-10:]]
            if len(set(readings)) == 1:
                health[sensor] = "Stuck/Frozen"
            else:
                avg = sum(readings) / len(readings)
                variance = sum((x - avg) ** 2 for x in readings) / len(readings)
                std_dev = math.sqrt(variance)
                if std_dev > 20: 
                    health[sensor] = "Unstable/Noisy"
                
        return health

class SmartInsightGenerator:
    """
    Generates human-readable insights, precautions, and now Risk/Health metrics.
    Acts as a deterministic 'AI' expert system.
    """
    def __init__(self):
        self.risk_calc = RiskLevelCalculator()
        self.predictor = PredictionEngine()
        self.health_mon = SensorHealthMonitor()
        self.if_detector = IsolationForestAnomalyDetector()
        self.history_buffer = []

    def generate_full_report(self, reading: dict, anomalies: list):
        log_ml_activity(f"Starting report for {reading.get('temp', 'N/A')}")
        # Update history
        self.history_buffer.append(reading)
        if len(self.history_buffer) > 20: self.history_buffer.pop(0)
        
        # Calculate Metrics
        try:
            risk = self.risk_calc.calculate_risk(reading, anomalies)
            log_ml_activity(f"Risk calc: {risk}")
            health = self.health_mon.check_health(self.history_buffer)
            log_ml_activity("Health check done")
            prediction = self.predictor.predict_next_10_mins(self.history_buffer)
            log_ml_activity("Prediction done")

            # Deep Anomaly Detection (Isolation Forest)
            if_label, if_score = self.if_detector.predict(reading)
            if if_label == "ANOMALY":
                 log_ml_activity(f"Isolation Forest DETECTED ANOMALY (Score: {if_score:.4f})")
                 anomalies.append(f"Pattern Anomaly (Confidence: {abs(if_score):.2f})")
            
            # Generate Text Insight
            insight_text = self._generate_text(reading, anomalies, risk)
            log_ml_activity("Text generation done")
            
            return {
                "insight": insight_text,
                "risk_level": risk,
                "sensor_health": health,
                "prediction": prediction,
                "baseline": self._get_mock_baseline(reading),
                "if_label": if_label,
                "if_score": if_score
            }
        except Exception as e:
            log_ml_activity(f"❌ ML ENGINE ERROR: {e}")
            raise e

    def _get_mock_baseline(self, reading):
        # Returns a 'normal' value slightly different from current for demo
        return {
            "temperature": max(20, reading.get('temperature', 25) - 5),
            "gas": max(100, reading.get('gas', 200) - 50)
        }

    def _generate_text(self, reading: dict, anomalies: list, risk: str):
        insights = []
        
        # High Level Risk Override
        if risk == "CRITICAL":
            insights.append("🔴 CRITICAL SAFETY RISK: Immediate Action Required.")
        
        # Temperature Insights
        temp = reading.get('temperature', 0)
        if temp > 45:
            insights.append("🔥 High Temperature: Fire risk elevated. Ensure cooling systems are active.")
        elif temp < 10:
             insights.append("❄️ Low Temperature: Check heating systems.")
             
        # Gas/Fire Insights
        gas = reading.get('gas', 0)
        if gas > 1500:
             insights.append("☠️ Hazardous Gas Levels: Evacuate area immediately.")
        elif gas > 800:
             insights.append("⚠️ Elevated Gas Levels: Inspect for leaks.")

        # pH Insights
        ph = reading.get('ph', 7.0)
        if ph is not None:
            if ph < 6.0:
                insights.append("🧪 Acidic pH Detected: Check chemical storage.")
            elif ph > 8.5:
                insights.append("🧪 Alkaline pH Detected: Check neutralization.")

        # new: Humidity & Rain Insights (User Requested)
        hum = reading.get('humidity', 0)
        rain = reading.get('rain', 0)
        
        if hum > 70 and temp > 30:
             insights.append("😓 Heat Stress Risk: High Humidity + Temp reduces body cooling. Stay hydrated.")
        elif hum > 85:
             insights.append("💧 High Humidity: Mold risk and equipment corrosion potential.")
             
        if rain > 500: # Analog value usually
             insights.append("🌧️ Heavy Rain Detected: Flood risk in low-lying areas. Secure electricals.")
        elif rain > 0: # Digital or low analog
             insights.append("☔ Rain Detected: Slippery surfaces possible.")
        
        if anomalies:
             insights.append(f"⚠️ Anomaly Detected: {', '.join(anomalies)} behavior is unusual.")
             
        return " | ".join(insights) if insights else "System operating within normal parameters."
        
    # Legacy method compatibility
    def generate_insight(self, reading: dict, anomalies: list):
        return self._generate_text(reading, anomalies, "SAFE")

class IsolationForestAnomalyDetector:
    """
    Advanced multi-sensor anomaly detection using Isolation Forest.
    Learns patterns across Temperature, Humidity, Gas, and PM2.5.
    """
    def __init__(self, contamination=0.005, n_estimators=100, random_state=42):
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.features = ['temperature', 'humidity', 'gas']

    def _extract_features(self, data: Dict) -> np.ndarray:
        """Extracts and orders features for model input."""
        row = [
            data.get('temperature', 0.0),
            data.get('humidity', 0.0),
            data.get('gas', 0.0)
        ]
        return np.array(row).reshape(1, -1)

    def train(self, historical_data: List[Dict]):
        """Trains the model on a list of historical sensor packets."""
        if not historical_data:
            log_ml_activity("Training failed: No historical data provided.")
            return

        try:
            X = []
            for entry in historical_data:
                X.append([
                    entry.get('temperature', 0.0),
                    entry.get('humidity', 0.0),
                    entry.get('gas', 0.0)
                ])
            
            X_array = np.array(X)
            # Scaling is important for Isolation Forest distance-based logic
            X_scaled = self.scaler.fit_transform(X_array)
            self.model.fit(X_scaled)
            self.is_trained = True
            log_ml_activity(f"Isolation Forest trained successfully on {len(X)} samples.")
        except Exception as e:
            log_ml_activity(f"Training error: {e}")
            self.is_trained = False

    def predict(self, sensor_data: Dict):
        """
        Returns anomaly label and score.
        1 = Normal, -1 = Anomaly
        """
        if not self.is_trained:
            return "NORMAL", 0.0  # Graceful fallback

        try:
            X = self._extract_features(sensor_data)
            X_scaled = self.scaler.transform(X)
            
            prediction = self.model.predict(X_scaled)[0]
            # anomaly_score: higher is more normal, lower is more anomalous
            # scikit-learn's decision_function returns signed distance to hyperplane
            score = self.model.decision_function(X_scaled)[0]
            
            # Anomaly logic: Ensure it's not just a slight deviation.
            # Only trigger Anomaly if prediction is -1 AND the confidence score is a strong negative
            label = "ANOMALY" if prediction == -1 and score < -0.10 else "NORMAL"
            return label, float(score)
        except Exception as e:
            log_ml_activity(f"Prediction error: {e}")
            return "NORMAL", 0.0

def load_historical_data(limit: int = 1000) -> List[Dict]:
    """
    Helper function to load historical sensor data from PostgreSQL/SQLite 
    via SQLAlchemy for model training.
    """
    from .database import SessionLocal
    from .models import SensorData
    
    db = SessionLocal()
    try:
        # Fetch records with essential features, excluding nulls if possible
        records = db.query(SensorData).filter(
            SensorData.temperature.isnot(None),
            SensorData.humidity.isnot(None)
        ).order_by(SensorData.timestamp.desc()).limit(limit).all()
        
        return [
            {
                "temperature": r.temperature,
                "humidity": r.humidity,
                "gas": r.gas,
                "timestamp": r.timestamp
            } for r in records
        ]
    except Exception as e:
        log_ml_activity(f"DB Load error: {e}")
        return []
    finally:
        db.close()

class IoTAnomalyDetector:
    def __init__(self):
        self.buffer = []
        self.preprocessor = Preprocessor()
        
        self.config = {
            "TEMP_MAX": 80.0,
            "TEMP_MIN": -10.0,
            "VIBRATION_MAX": 5.0,
            "PRESSURE_MIN": 900.0,
            "PH_MIN": 1.0,
            "PH_MAX": 14.0
        }

    def update_config(self, new_config: dict):
        self.config.update(new_config)

    def check_thresholds(self, data: dict, user_config: dict = None):
        alerts = []
        precautions = []
        
        # Default fallback if no user config exists (should be rare)
        if not user_config:
            user_config = {
                "temp_threshold": 45.0,
                "humidity_min": 20.0,
                "humidity_max": 80.0,
                "gas_threshold": 600.0,
                "pm25_threshold": 150.0
            }
            
        t_max = user_config.get("temp_threshold") or 45.0
        h_min = user_config.get("humidity_min") or 20.0
        h_max = user_config.get("humidity_max") or 80.0
        g_max = user_config.get("gas_threshold") or 600.0
        pm25_max = user_config.get("pm25_threshold") or 150.0
        
        # Temperature
        if data.get('temperature') is not None:
             if data['temperature'] > t_max:
                 alerts.append(f"Temperature High (> {t_max}°C)")
                 precautions.append("Hydrate immediately and avoid direct sunlight. Check device cooling systems.")
                 
        # Humidity
        if data.get('humidity') is not None:
             if data['humidity'] > h_max:
                 alerts.append(f"Humidity High (> {h_max}%)")
                 precautions.append("Run dehumidifiers, check for water leaks.")
             elif data['humidity'] < h_min:
                 alerts.append(f"Humidity Low (< {h_min}%)")
                 precautions.append("Use a humidifier, protect sensitive equipment.")
                 
        # Gas
        if data.get('gas') is not None:
             if data['gas'] > g_max:
                 alerts.append(f"Air Quality Breach (> {g_max} ppm)")
                 precautions.append("Evacuate the area immediately, open windows, avoid ignition sources.")
                 
        # PM2.5
        if data.get('pm2_5') is not None:
             if data['pm2_5'] > pm25_max:
                 alerts.append(f"PM2.5 High (> {pm25_max} µg/m³)")
                 precautions.append("Wear masks, turn on air purifiers immediately.")

        return alerts, precautions

    def update_and_predict(self, feature_vector):
        scaled_features = self.preprocessor.scale(feature_vector)
        self.buffer.append(scaled_features)
        
        if len(self.buffer) > 20: 
            self.buffer.pop(0)
        
        if len(self.buffer) >= 10:
            # Simple Z-score like anomaly detection for Gas (now index 2)
            gas_readings = [v[2] for v in self.buffer]
            avg = sum(gas_readings) / len(gas_readings)
            variance = sum((x - avg) ** 2 for x in gas_readings) / len(gas_readings)
            std_dev = math.sqrt(variance) if variance > 0 else 1.0
            
            current_gas = scaled_features[2]
            if abs(current_gas - avg) > 3 * std_dev:
                return True, -1.0 
        
        return False, 0.0

# Singleton Instances
anomaly_detector = IoTAnomalyDetector()
trust_calculator = TrustScoreCalculator()
insight_generator = SmartInsightGenerator()
if_detector = IsolationForestAnomalyDetector()

class ModelEvaluationEngine:
    """
    Evaluates and compares anomaly detection and prediction models.
    Provides metrics like F1-score, Precision, Recall, MAE, and RMSE.
    """
    
    @staticmethod
    def evaluate_anomaly_models(y_true, iso_pred_labels, zscore_pred_labels, iso_scores=None):
        """
        Calculates metrics for Anomaly Detection.
        y_true: 0 (Normal), 1 (Anomaly)
        iso_pred_labels: 1 (Normal), -1 (Anomaly) from sklearn
        zscore_pred_labels: True/False or 0/1 from IoTAnomalyDetector
        """
        # 1. Convert Isolation Forest Labels: (-1 -> 1, 1 -> 0)
        iso_binary = [1 if p == -1 else 0 for p in iso_pred_labels]
        
        # 2. Convert Z-Score Labels: (True/1 -> 1, False/0 -> 0)
        zscore_binary = [1 if p in [True, 1, -1.0] else 0 for p in zscore_pred_labels]
        
        results = {
            "isolation_forest": ModelEvaluationEngine._get_clf_metrics(y_true, iso_binary, iso_scores),
            "zscore_detector": ModelEvaluationEngine._get_clf_metrics(y_true, zscore_binary)
        }
        return results

    @staticmethod
    def _get_clf_metrics(y_true, y_pred, scores=None):
        metrics = {
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, zero_division=0)),
            "accuracy": float(accuracy_score(y_true, y_pred))
        }
        if scores is not None:
            # Note: Decision function scores for IF are 'higher = normal'. 
            # roc_auc_score expects 'higher = anomaly' or probabilities.
            # We invert the scores for AUC calculation.
            try:
                metrics["roc_auc"] = float(roc_auc_score(y_true, [-s for s in scores]))
            except:
                metrics["roc_auc"] = 0.0
        
        metrics["confusion_matrix"] = confusion_matrix(y_true, y_pred).tolist()
        return metrics

    @staticmethod
    def evaluate_prediction(y_true_values, predicted_values):
        """Calculates regression metrics for PredictionEngine."""
        y_true = np.array(y_true_values)
        y_pred = np.array(predicted_values)
        
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        
        # MAPE (Mean Absolute Percentage Error) - Avoid division by zero
        non_zero = y_true != 0
        mape = np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100 if np.any(non_zero) else 0.0
        
        return {
            "mae": float(mae),
            "rmse": float(rmse),
            "mape": float(mape)
        }

def compare_models(results_dict):
    """Generates a formatted ASCII table for report printing."""
    header = f"{'Model':<20} | {'Precision':<10} | {'Recall':<10} | {'F1 Score':<10} | {'Accuracy':<10}"
    separator = "-" * len(header)
    rows = [header, separator]
    
    for model_name, m in results_dict.items():
        row = f"{model_name:<20} | {m['precision']:<10.4f} | {m['recall']:<10.4f} | {m['f1']:<10.4f} | {m['accuracy']:<10.4f}"
        rows.append(row)
    
    return "\n".join(rows)

def plot_roc_curve(y_true, scores, model_name="Isolation Forest"):
    """Helper to plot and save ROC curve."""
    # Invert scores for IF: higher should be more anomalous for ROC
    fpr, tpr, _ = roc_curve(y_true, [-s for s in scores])
    roc_auc = auc(fpr, tpr)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:0.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title(f'Receiver Operating Characteristic - {model_name}')
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    
    save_path = "roc_curve_latest.png"
    plt.savefig(save_path)
    plt.close()
    return save_path

# ====================================================
# Dynamic AI Model Evaluation (Supabase Integration)
# ====================================================

def fetch_historical_data_from_db(limit=200):
    """Fetches historical sensor data from PostgreSQL using SQLAlchemy."""
    return load_historical_data(limit=limit)

def generate_ground_truth(data):
    """
    Generate ground truth labels using safety thresholds:
    Anomaly = 1 if:
    - temperature > 50 OR gas > 2000 OR pm25 > 150
    Otherwise:
    Normal = 0
    """
    temp = float(data.get('temperature') or 0.0)
    gas = float(data.get('gas') or 0.0)
    
    if temp > 50 or gas > 2000:
        return 1
    return 0

def calculate_isolation_forest_performance():
    """
    Compute model performance metrics for Isolation Forest using historical sensor data from DB.
    """
    data = fetch_historical_data_from_db(limit=200)
    
    if not data:
        log_ml_activity("No historical data available for performance calculation.")
        return {
            "model": "Isolation Forest",
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "accuracy": 0.0,
            "total_samples": 0,
            "data_source": "synthetic"
        }
    
    # Check data source freshness based on the most recent record (index 0)
    data_source = "historical"
    latest_record_time = data[0].get("timestamp")
    if latest_record_time:
        import pytz
        # Assume naive datetime from DB is UTC or local depending on your setup. 
        # Using the same get_local_time logic from main.py
        local_tz = pytz.timezone('Asia/Kolkata')
        now_local = datetime.now(local_tz).replace(tzinfo=None)
        
        time_diff = (now_local - latest_record_time).total_seconds()
        if time_diff <= 30:
            data_source = "live"
        else:
            data_source = "historical"
    else:
        # Fallback if somehow timestamp is missing
        data_source = "synthetic"
        
    y_true = []
    iso_pred_labels = []
    
    anomalies_detected = 0
    
    # Use the global if_detector instance
    for row in data:
        truth = generate_ground_truth(row)
        y_true.append(truth)
        
        # Isolation Forest prediction
        pred_label, _ = if_detector.predict(row)
        
        # Convert output for ModelEvaluationEngine: 1 (Normal), -1 (Anomaly)
        iso_val = -1 if pred_label == "ANOMALY" else 1
        iso_pred_labels.append(iso_val)
        
        if iso_val == -1:
            anomalies_detected += 1
            
    log_ml_activity(f"Number of records fetched from DB: {len(data)}")
    log_ml_activity(f"Number of anomalies detected: {anomalies_detected}")
            
    # Calculate metrics using ModelEvaluationEngine
    # evaluate_anomaly_models handles converting (-1, 1) and true (0, 1) properly
    try:
        results = ModelEvaluationEngine.evaluate_anomaly_models(
            y_true=y_true, 
            iso_pred_labels=iso_pred_labels, 
            zscore_pred_labels=[False]*len(data) # Dummy values for Z-Score
        )
        metrics = results["isolation_forest"]
    except Exception as e:
        log_ml_activity(f"Failed to evaluate metrics: {e}")
        return {
            "model": "Isolation Forest",
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "accuracy": 0.0,
            "total_samples": len(data)
        }
    
    cm = metrics.get("confusion_matrix", [])
    log_ml_activity(f"Confusion Matrix values: {cm}")
    
    return {
        "model": "Isolation Forest",
        "precision": metrics.get("precision", 0.0),
        "recall": metrics.get("recall", 0.0),
        "f1_score": metrics.get("f1", 0.0),
        "accuracy": metrics.get("accuracy", 0.0),
        "total_samples": len(data),
        "confusion_matrix": cm,
        "data_source": data_source
    }
