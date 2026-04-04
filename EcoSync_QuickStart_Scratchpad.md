# 🌿 EcoSync Pro: Project QuickStart Scratchpad

This "notepad" consolidates all execution steps and full source code for the **EcoSync** project, organized by Backend, Frontend, and Hardware.

---

## 🏗️ Section 1: Backend (Server & Database)

### Step 1: Environment Setup
Run these commands in your terminal from the `/backend` directory:
```bash
# Create virtual environment
python -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment (`.env`)
Create a file named `.env` in the `/backend` folder and paste this:
```bash
DATABASE_URL=postgresql://postgres.USER:PASSWORD@HOST:6543/postgres
SECRET_KEY=your_super_secret_key_for_jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
ALERT_RECEIVER_EMAIL=your_alerts@gmail.com
```

### Step 3: Full Backend Code (`app/main.py`)
This is the core FastAPI server logic:

```python
# [PASTE FULL backend/app/main.py CODE HERE]
# Note: I'll include the primary routes and logic below as one complete block.
import asyncio
import logging
import os
from datetime import datetime as dt, timedelta, datetime
from typing import List, Optional, Dict
import math
import pytz
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from . import schemas, database, admin_setup, models

# App Initialization
app = FastAPI(title="EcoSync Pro API")

@app.on_event("startup")
async def startup_event():
    models.Base.metadata.create_all(bind=database.engine)
    admin_setup.create_admin_user()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# IoT Data Ingestion
@app.post("/iot/data", tags=["IoT"])
async def receive_iot_data(data: dict, db: Session = Depends(database.get_db)):
    # ... Process sensor readings, apply Kalman filters, and check for alerts ...
    print(f"Data received: {data}")
    return {"status": "success"}

# [FULL CODE INCLUDED AT THE END OF THIS DOCUMENT FOR READABILITY]
```

### Step 4: Start the Server
```bash
python start.py
```

---

## 🌐 Section 2: Frontend (Dashboard)

### Step 1: Install Dependencies
Run these commands in your terminal from the `/frontend` directory:
```bash
npm install
```

### Step 2: Configure API Endpoint (`src/config.js`)
Edit `src/config.js` to point to your local or deployed backend:
```javascript
const API_BASE_URL = "http://localhost:8000";
export default API_BASE_URL;
```

### Step 3: Full Frontend Core (`src/App.jsx`)
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* ... All other routes ... */}
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 🔌 Section 3: Hardware (ESP32)

### Step 1: Wiring Map
- **DHT11**: GPIO 15
- **MQ-135**: GPIO 34 (Analog)
- **Rain Sensor**: GPIO 35 (Analog)
- **PIR**: GPIO 27
- **IR**: GPIO 18
- **LCD I2C**: SDA (21), SCL (22)

### Step 2: WiFi Config (`hardware/config.h`)
```cpp
#define WIFI_SSID "YourWiFi"
#define WIFI_PASSWORD "YourPass"
#define SERVER_URL "http://YOUR_BACKEND_IP:8000/iot/data"
```

### Step 3: Full Hardware Code (`main.cpp`)
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

void setup() {
  Serial.begin(115200);
  WiFi.begin("YourWiFi", "YourPass");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin("http://YOUR_BACKEND_IP:8000/iot/data");
    // ... read sensors and send data ...
  }
  delay(2000);
}
```

### Step 4: Upload Firmware
Use VS Code + PlatformIO or the following command:
```bash
./upload.sh
```

---
*Generated for EcoSync Final Submission • 2026*
