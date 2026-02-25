import os
from typing import List, Dict
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
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
        # [temp, pressure, vibration, wind, uv, soil_temp, soil_moist, pm25, pm10, no2, solar]
        self.min_vals = [-10.0, 900.0, 0.0, 0.0, 0.0, -10.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        self.max_vals = [100.0, 1100.0, 20.0, 150.0, 15.0, 60.0, 1.0, 500.0, 500.0, 200.0, 1500.0]

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
        if reading.get('pm2_5', 0) < 0: score -= 20
        
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
    def __init__(self, contamination=0.05, n_estimators=100, random_state=42):
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.features = ['temperature', 'humidity', 'gas', 'pm2_5']

    def _extract_features(self, data: Dict) -> np.ndarray:
        """Extracts and orders features for model input."""
        # Map pm25 to pm2_5 for consistency with DB models if needed
        pm25_val = data.get('pm25') or data.get('pm2_5') or 0.0
        row = [
            data.get('temperature', 0.0),
            data.get('humidity', 0.0),
            data.get('gas', 0.0),
            pm25_val
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
                # Handle pm2_5/pm25 key discrepancy
                pm25 = entry.get('pm2_5') if entry.get('pm2_5') is not None else entry.get('pm25', 0.0)
                X.append([
                    entry.get('temperature', 0.0),
                    entry.get('humidity', 0.0),
                    entry.get('gas', 0.0),
                    pm25
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
            
            label = "ANOMALY" if prediction == -1 else "NORMAL"
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
                "pm2_5": r.pm2_5
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
            "WIND_MAX": 50.0,
            "UV_MAX": 10.0,
            "PM25_MAX": 150.0,
            "NO2_MAX": 100.0,
            "PH_MIN": 1.0,
            "PH_MAX": 14.0
        }

    def update_config(self, new_config: dict):
        self.config.update(new_config)

    def check_thresholds(self, data: dict):
        alerts = []
        precautions = []
        
        # Temperature
        if data['temperature'] > self.config['TEMP_MAX']:
            alerts.append(f"Temperature High (> {self.config['TEMP_MAX']}°C)")
            precautions.append("Hydrate immediately and avoid direct sunlight.")
            precautions.append("Check device cooling systems.")
        elif data['temperature'] < self.config['TEMP_MIN']:
            alerts.append(f"Temperature Low (< {self.config['TEMP_MIN']}°C)")
            precautions.append("Ensure thermal insulation is active.")

        # Vibration
        if data['vibration'] > self.config['VIBRATION_MAX']:
            alerts.append(f"Vibration Critical (> {self.config['VIBRATION_MAX']})")
            precautions.append("Inspect mounting integrity immediately.")
            precautions.append("Possible bearing failure - schedule maintenance.")

        # Pressure
        if data['pressure'] < self.config['PRESSURE_MIN']:
             alerts.append(f"Pressure Drop (< {self.config['PRESSURE_MIN']}hPa)")
             precautions.append("Check for vacuum leaks or seal breaches.")

        # Wind
        if data.get('wind_speed', 0) > self.config['WIND_MAX']:
            alerts.append(f"High Wind (> {self.config['WIND_MAX']}km/h)")
            precautions.append("Secure loose outdoor equipment.")
            precautions.append("Halt crane/aerial operations.")

        # UV
        if data.get('uv_index', 0) > self.config['UV_MAX']:
            alerts.append(f"Extreme UV (> {self.config['UV_MAX']})")
            precautions.append("Wear UV-protective gear and eye protection.")
            precautions.append("Limit exposure to < 10 minutes.")

        # Air Quality
        if data.get('pm2_5', 0) > self.config['PM25_MAX']:
            alerts.append(f"Hazardous Air Quality (PM2.5 > {self.config['PM25_MAX']})")
            precautions.append("Wear N95/N99 respirator masks.")
            precautions.append("Activate air filtration systems immediately.")
            
        # pH 
        if data.get('ph') is not None:
             if data['ph'] < self.config.get('PH_MIN', 0):
                  alerts.append(f"pH Critical Low (< {self.config.get('PH_MIN')})")
                  precautions.append("Neutralize acid immediately.")
             elif data['ph'] > self.config.get('PH_MAX', 14):
                  alerts.append(f"pH Critical High (> {self.config.get('PH_MAX')})")
                  precautions.append("Neutralize base immediately.")

        return alerts, precautions

    def update_and_predict(self, feature_vector):
        scaled_features = self.preprocessor.scale(feature_vector)
        self.buffer.append(scaled_features)
        
        if len(self.buffer) > 20: # Use rolling window for simple anomaly detection
            self.buffer.pop(0)
        
        if len(self.buffer) >= 10:
            # Simple Z-score like anomaly detection for PM2.5 (feature index 7)
            pm25_readings = [v[7] for v in self.buffer]
            avg = sum(pm25_readings) / len(pm25_readings)
            variance = sum((x - avg) ** 2 for x in pm25_readings) / len(pm25_readings)
            std_dev = math.sqrt(variance) if variance > 0 else 1.0
            
            current_pm25 = scaled_features[7]
            if abs(current_pm25 - avg) > 3 * std_dev:
                return True, -1.0 # Anomaly detected
        
        return False, 0.0

# Singleton Instances
anomaly_detector = IoTAnomalyDetector()
trust_calculator = TrustScoreCalculator()
insight_generator = SmartInsightGenerator()
if_detector = IsolationForestAnomalyDetector()
