# 🌿 EcoSync Pro: Project Execution & Technical Manual

> **Project Title**: EcoSync Pro - Intelligent Environmental Monitoring System  
> **Documentation Type**: Consolidated Execution & Code Reference  
> **Generation Date**: 2026-04-02  
> **Target Audience**: Final Year Project Evaluation / Technical Handover  

---

## 📋 Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Database Schema (SQL Full)](#2-database-schema-sql-full)
3. [Backend Execution Guide](#3-backend-execution-guide)
4. [Frontend Execution Guide](#4-frontend-execution-guide)
5. [Hardware (ESP32) Execution & Wiring](#5-hardware-esp32-execution--wiring)
6. [Cloud Deployment Strategy](#6-cloud-deployment-strategy)
7. [Core Code Repository (Critical Snippets)](#7-core-code-repository-critical-snippets)
8. [Supporting Scripts Reference](#8-supporting-scripts-reference)

---

## 1. System Architecture
EcoSync Pro uses a **Triple-Tiered IoT Architecture**:
- **Edge Layer**: ESP32 with sensors (DHT11, MQ-135, PIR, IR) performing local Kalman filtering.
- **Service Layer**: FastAPI (Python) backend providing real-time data ingestion, ML-based anomaly detection (Isolation Forest), and unified alerting.
- **Client Layer**: React (Vite) dashboard with real-time visualization, predictive analytics, and global node mapping.

---

## 2. Database Schema (SQL Full)
The following SQL defines the complete PostgreSQL schema for EcoSync Pro.

```sql
-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    plan VARCHAR(20) DEFAULT 'lite',
    location_name VARCHAR(255),
    location_lat FLOAT,
    location_lon FLOAT,
    mobile VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    otp_secret VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')
);

-- 2. Devices Table
CREATE TABLE devices (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    connector_type VARCHAR(50) NOT NULL,
    lat FLOAT,
    lon FLOAT,
    status VARCHAR(20) DEFAULT 'created',
    last_seen TIMESTAMP WITHOUT TIME ZONE,
    user_id INTEGER REFERENCES users(id)
);

-- 3. Sensor Data Table (The Core Ingestion Hub)
CREATE TABLE sensor_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) REFERENCES devices(id),
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'Asia/Kolkata'),
    temperature FLOAT,
    humidity FLOAT,
    gas FLOAT,
    rain FLOAT,
    motion INTEGER,
    trust_score FLOAT,
    anomaly_label VARCHAR(50),
    anomaly_score FLOAT,
    smart_insight TEXT
);

-- 4. Alerts History Table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    metric VARCHAR(50) NOT NULL,
    value FLOAT,
    message TEXT NOT NULL,
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(255),
    email_sent BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')
);

-- 5. Alert Settings Table (User Preferences)
CREATE TABLE alert_settings (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) REFERENCES users(email),
    temp_threshold FLOAT DEFAULT 45.0,
    humidity_min FLOAT DEFAULT 20.0,
    humidity_max FLOAT DEFAULT 80.0,
    gas_threshold FLOAT DEFAULT 600.0,
    rain_alert BOOLEAN DEFAULT TRUE,
    pm25_threshold FLOAT DEFAULT 150.0,
    wind_threshold FLOAT DEFAULT 30.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')
);

-- 6. Compliance/Safety Logs
CREATE TABLE safety_logs (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITHOUT TIME ZONE,
    shift VARCHAR(10) DEFAULT 'A',
    date VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')
);
```

---

## 3. Backend Execution Guide

### Prerequisites
- Python 3.9+ installed.
- PostgreSQL database (Local or Cloud like Neon/Supabase).

### Setup Steps
1.  **Navigate to Directory**: `cd backend`
2.  **Environment Isolation**: 
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
3.  **Install Dependencies**: 
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure `.env`**: Create a `.env` file from the following template:
    ```ini
    DATABASE_URL=postgresql://user:pass@host:5432/dbname
    SECRET_KEY=generate_a_random_hex_string
    EMAIL_USER=your_gmail@gmail.com
    EMAIL_PASS=your_app_password
    ```
5.  **Initialize & Run**:
    ```bash
    python start.py
    ```
    *Note: The script auto-detects if tables exist and creates them on the first run.*

---

## 4. Frontend Execution Guide

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn

### Setup Steps
1.  **Navigate to Directory**: `cd frontend`
2.  **Install Packages**: 
    ```bash
    npm install
    ```
3.  **Environment Config**: Ensure `.env` is set correctly:
    ```ini
    VITE_API_URL=http://localhost:8000
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    *Access the dashboard at `http://localhost:5173`*

---

## 5. Hardware (ESP32) Execution & Wiring

### Component Connections
| Sensor | ESP32 Pin | Logic |
|---|---|---|
| DHT11/22 | GPIO 15 | Data (I/O) |
| MQ-135 Gas | GPIO 34 | Analog Output |
| Rain Sensor | GPIO 35 | Analog Output |
| PIR Motion | GPIO 27 | Digital Out (Active High) |
| IR Speed | GPIO 18 | Digital Out |
| LCD 16x2 | SDA: 21, SCL: 22 | I2C Protocol |

### Setup Steps
1.  **Open Project**: Open `/hardware` in VS Code with PlatformIO.
2.  **WiFi Config**: Edit `config.h` (Template provided below).
3.  **Flash Firmware**: Click **Build** then **Upload** (Serial monitor at 115200 baud).

---

## 6. Cloud Deployment Strategy

### Backend (Render / HF Spaces)
- **Engine**: Docker-based deployment.
- **Config**: Use `render.yaml` for infrastructure-as-code.
- **Port**: 10000 (standard).

### Frontend (Vercel)
- **Deployment**: Automatic via GitHub Integration.
- **Rewrites**: `vercel.json` ensures SPA routing works correctly.

### Database (Neon/Supabase)
- **Managed Postgres**: Always use the Connection Pooling URL (Port 6543) for high-frequency IoT data.

---

## 7. Core Code Repository (Critical Snippets)

### 7.1 Backend: Main Ingestion Logic (`backend/app/main.py`)
```python
@app.post("/iot/data")
async def receive_iot_data(data: IoTSensorData, db: Session = Depends(get_db)):
    # 1. Kalman Filtering
    filtered_temp, _ = kf_instance.filter_temperature(data.temperature)
    
    # 2. ML Anomaly Detection
    is_anomaly, score = anomaly_detector.update_and_predict([filtered_temp, ...])
    
    # 3. Persistence
    measurement = models.SensorData(
        device_id=data.device_id,
        temperature=filtered_temp,
        anomaly_label="ANOMALY" if is_anomaly else "NORMAL",
        trust_score=trust_calculator.calculate_score(...)
    )
    db.add(measurement)
    db.commit()
    
    # 4. Asynchronous Alert Check
    await asyncio.to_thread(check_alerts, db, device, measurement)
```

### 7.2 Hardware: Kalman Filter & POST (`hardware/src/main.cpp`)
```cpp
float kalman_filter(float prev_estimate, float measurement) {
  float Q = 0.01; // Process noise
  float R = 0.1;  // Measurement noise
  float K = Q / (Q + R);
  return prev_estimate + K * (measurement - prev_estimate);
}

void loop() {
  if (millis() - lastRead > 2000) {
    float t = dht.readTemperature();
    temp_kf = kalman_filter(temp_kf, t);
    
    HTTPClient http;
    http.begin(SERVER_URL);
    serializeJson(doc, jsonString);
    http.POST(jsonString);
    http.end();
  }
}
```

---

## 8. Supporting Scripts Reference

- **`upload.sh`**: One-click firmware build and deploy script.
- **`start_local.bat`**: Windows batch file to launch both Backend and Frontend in separate terminals.
- **`seed_db.py`**: Useful for injecting 1-month of historical data for testing the ML models.
- **`verify_api.py`**: Health-check script to validate REST endpoints post-deployment.

---
*Document produced by EcoSync Intelligence Engine. Verified for Project Submission 2026.*
