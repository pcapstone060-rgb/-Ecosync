# 🌿 EcoSync Pro: Project Handover & Execution Document

> **Project Title**: EcoSync Pro - Intelligent Environmental Monitoring System  
> **Domain**: IoT, Cloud Computing, & Machine Learning  
> **Academic Year**: 2025-26  
> **Status**: Completed / Ready for Submission

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Hardware Architecture](#-hardware-architecture)
3. [Backend Infrastructure](#-backend-infrastructure)
4. [Frontend Application](#-frontend-application)
5. [Execution & Setup Guide](#-execution--setup-guide)
6. [Cloud Deployment](#-cloud-deployment)
7. [Critical Code Snippets](#-critical-code-snippets)
8. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Project Overview
**EcoSync Pro** is an end-to-end IoT platform designed for real-time environmental climate analysis. It utilizes an ESP32 microcontroller as an edge node to collect atmospheric data, which is then transmitted to a FastAPI cloud backend for processing, anomaly detection, and visualization.

### Key Features:
- **Real-Time Dashboards**: Live sensor streaming.
- **Predictive Analytics**: AI-powered weather forecasting and anomaly detection.
- **Smart Alerts**: Email notifications triggered by configurable thresholds.
- **Safe Mode**: Compliance logging for industrial safety audits.

---

## 🏗️ Hardware Architecture

### 1. Component List
| Component | Purpose | Pin connection (ESP32) |
|---|---|---|
| **ESP32 DevKit V1** | Main Microcontroller | N/A |
| **DHT11/22** | Temp & Humidity | GPIO 15 |
| **MQ-135 Gas** | Air Quality | GPIO 34 (Analog) |
| **Rain Sensor** | Precipitation | GPIO 35 (Analog) |
| **PIR (HC-SR501)** | Motion Detection | GPIO 27 |
| **IR Sensor** | Rotation/Speed | GPIO 18 |
| **LCD 16x2 I2C** | Local Readout | SDA (21), SCL (22) |

---

## 💻 Backend Infrastructure

### Tech Stack
- **Framework**: FastAPI (Python 3.9+)
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **ML Engine**: Scikit-Learn (Isolation Forest for Anomaly Detection)

### Database Schema (Models)
The system tracks Users, Devices, Sensor Data, and Alerts.

```python
# models.py excerpt
class SensorData(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True)
    device_id = Column(String, ForeignKey("devices.id"))
    timestamp = Column(DateTime, default=get_local_time)
    temperature = Column(Float)
    humidity = Column(Float)
    gas = Column(Float)
    rain = Column(Float)
    motion = Column(Integer)
    trust_score = Column(Float)
```

---

## 🌐 Frontend Application

### Tech Stack
- **Framework**: React 18+ (Vite)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Maps**: Leaflet.js

---

## 🚀 Execution & Setup Guide

### 1. Backend Setup
1. Navigate to `/backend`.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` (Copy from `.env.template`).
5. Run the server:
   ```bash
   python start.py
   ```

### 2. Frontend Setup
1. Navigate to `/frontend`.
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

### 3. Hardware Setup (Firmware Flashing)
1. Install **PlatformIO** extension in VS Code.
2. Connect ESP32 via USB.
3. Open the `/hardware` folder.
4. Update `config.h` with your WiFi SSID and Password.
5. Click **Upload** (Arrow icon in bottom status bar).

---

## ☁️ Cloud Deployment

- **Frontend**: Deployed on **Vercel**.
- **Backend**: Deployed on **Render** (via Docker).
- **Database**: Managed **PostgreSQL** (Neon/Supabase).

---

## 🛠️ Critical Code Snippets

### 1. ESP32 Sensor Reading Loop
```cpp
// main.cpp excerpt
void loop() {
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    float t = dht.readTemperature();
    int mqValue = analogRead(MQ_ANALOG_PIN);
    
    // Kalman Filter for Noise Reduction
    temp_kalman = kalman_filter(temp_kalman, t);
    
    // HTTP POST to Backend
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      // ... JSON serialization ...
      http.POST(jsonPayload);
      http.end();
    }
  }
}
```

### 2. Backend API Ingestion
```python
# main.py excerpt
@app.post("/iot/data")
async def receive_iot_data(data: IoTSensorData, db: Session = Depends(get_db)):
    # 1. Kalman Filtering & Cleaning
    filtered_temp, _ = kf_instance.filter_temperature(data.temperature)
    
    # 2. ML Anomaly Detection
    is_anomaly, score = anomaly_detector.update_and_predict([filtered_temp, ...])
    
    # 3. Persistence
    measurement = models.SensorData(...)
    db.add(measurement)
    db.commit()
```

---

## ❓ Troubleshooting & FAQs

- **Issue**: ESP32 not connecting to WiFi.
  - **Fix**: Ensure WiFi frequency is 2.4GHz (ESP32 does not support 5GHz).
- **Issue**: Sensor data not appearing on Dashboard.
  - **Fix**: Check `config.h` to ensure `SERVER_URL` points to the correct Backend IP/URL.
- **Issue**: "CORS Error" in browser.
  - **Fix**: Add the frontend URL to the `ALLOWED_ORIGINS` list in `backend/app/main.py`.

---
*Created for EcoSync Capstone Team S4 • 2026*
