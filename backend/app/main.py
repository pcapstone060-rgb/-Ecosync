import asyncio
import logging
import os
from datetime import datetime as dt, timedelta, datetime
from typing import List, Optional, Dict
import math
import pytz

def get_local_time():
    local_tz = pytz.timezone('Asia/Kolkata')
    return dt.now(local_tz).replace(tzinfo=None)

# Global State for Alerts and Demo
alert_cooldowns = {}
DEMO_MODE = False

# Persistent Alert Logger
ALERT_LOG_FILE = os.path.join(os.path.dirname(__file__), "alert_system.log")
def log_alert_activity(message: str):
    try:
        with open(ALERT_LOG_FILE, "a", encoding="utf-8") as f:
            ts = get_local_time().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"[{ts}] {message}\n")
    except: pass

log_alert_activity("--- ALERT SYSTEM REBOOTED ---")
# print(f"LOADING MAIN FROM {__file__}")


from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from . import schemas, database, admin_setup, models
from .connectors.open_meteo import OpenMeteoConnector
from .connectors.thingspeak import ThingSpeakConnector
from .connectors.waqi import WAQIConnector
from .connectors.openaq import OpenAQConnector
from .connectors.esp32_stub import ESP32StubConnector

from .routers import assistant, auth_v2 as auth, map as map_router, pro_api, push_notifications, devices
from .routers.push_notifications import send_push_notification_to_user
from .services import (
    kalman_filter as kf_instance,
    aqi_calculator,
    external_apis,
    fusion_engine,
    weather_service
)
from . import ml_engine

# Initialize ML components
anomaly_detector = ml_engine.IoTAnomalyDetector()
trust_calculator = ml_engine.TrustScoreCalculator()
insight_generator = ml_engine.SmartInsightGenerator()

from .services.websocket_manager import manager
from .services.api_cache import refresh_map_cache, get_cached_markers

# --- Logging Configuration ---
# --- Logging Configuration ---
import sys
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("app.main")
logger.setLevel(logging.INFO)

# --- App Initialization ---
app = FastAPI(
    title="Environmental IoT Command Center",
    description="Backend API for Real-time Environmental Monitoring System",
    version="2.0.0"
)

@app.get("/health")
def health_check():
    return {"status": "active", "service": "IoT Backend", "timestamp": get_local_time()}

# --- Database Initialization & Startup Tasks ---
@app.on_event("startup")
async def startup_event():
    """Unified startup handler for database initialization and background services"""
    try:
        # 1. Database Schema
        # Enabled for local SQLite
        models.Base.metadata.create_all(bind=database.engine)
        
        # 2. Admin Seeding
        admin_setup.create_admin_user()
        
        # 3. Start Background Tasks
        logger.info("Skipping background services for debugging...")
        # asyncio.create_task(poll_devices()) 
        # asyncio.create_task(refresh_map_cache())
        
        # 4. Train anomaly detection model
        logger.info("Training Isolation Forest on historical data (with synthetic fallback)...")
        from .ml_engine import load_historical_data, if_detector
        historical_data = load_historical_data(limit=1000, use_synthetic_fallback=True)
        if historical_data:
            if_detector.train(historical_data)
            logger.info(f"Isolation Forest trained successfully on {len(historical_data)} samples.")
        else:
            logger.warning("No historical data found to train Isolation Forest.")

        logger.info("EcoSync Backend Initialized Successfully.")
        logger.info("Startup: Background tasks initiated (Polling Enabled)")
    except Exception as e:
        logger.error(f"Startup execution failed: {e}")





# --- CORS Configuration ---
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ecosync-six.vercel.app",
]
# Render / Vercel / custom frontends: set CORS_EXTRA_ORIGINS=https://a.com,https://b.com in the service Environment
_cors_extra = os.getenv("CORS_EXTRA_ORIGINS", "").strip()
if _cors_extra:
    ALLOWED_ORIGINS.extend([o.strip() for o in _cors_extra.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = traceback.format_exc()
    print(f"GLOBAL EXCEPTION CAUGHT: {error_detail}")
    with open("crash.log", "a") as f:
        f.write(f"\n--- {dt.now()} ---\n{error_detail}\n")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "traceback": error_detail},
    )

# --- Security Headers ---
# app.add_middleware(
#     TrustedHostMiddleware, 
#     allowed_hosts=["localhost", "127.0.0.1", "your-production-domain.com"]
# )

# Redirect to HTTPS in production
if ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# --- Dependency Injection ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ML API Endpoints are imported below ---

from .routers import ml_api

# --- Router Registration ---
app.include_router(assistant.router, tags=["AI Assistant"])
app.include_router(auth.router, tags=["Authentication"])
app.include_router(map_router.router, tags=["Map"])
app.include_router(pro_api.router, tags=["Pro Mode"])
app.include_router(push_notifications.router, tags=["Push Notifications"])
app.include_router(devices.router, tags=["Devices"])
app.include_router(ml_api.router)

# --- Helper Functions ---
def get_connector(device: models.Device):
    config = {"lat": device.lat, "lon": device.lon}
    
    if device.connector_type == "public_api":
        return OpenMeteoConnector(device.id, config)
    elif device.connector_type == "thingspeak":
        channel_id = "12397"
        if "Channel:" in device.name:
            try:
                channel_id = device.name.split("Channel:")[1].strip()
            except IndexError:
                pass
        config["channel_id"] = channel_id
        return ThingSpeakConnector(device.id, config)
    elif device.connector_type == "waqi":
        config["token"] = "demo"
        return WAQIConnector(device.id, config)
    elif device.connector_type == "openaq":
        return OpenAQConnector(device.id, config)
    elif device.connector_type == "esp32":
        return ESP32StubConnector(device.id, config)
    return None

async def poll_devices():
    """Background task to poll external APIs"""
    while True:
        try:
            # 1. Prefetch device IDs
            db = database.SessionLocal()
            try:
                devices_idx = db.query(models.Device).filter(models.Device.connector_type == "public_api").all()
                device_ids = [d.id for d in devices_idx]
            finally:
                db.close()
            
            for dev_id in device_ids:
                try:
                    # 2. Get device config (Short Session)
                    db = database.SessionLocal()
                    connector = None
                    dev_name = "Unknown"
                    try:
                        dev = db.query(models.Device).get(dev_id)
                        if dev:
                            dev_name = dev.name
                            connector = get_connector(dev)
                    finally:
                        db.close()

                    if connector:
                        # 3. Fetch Data (NO DB SESSION HELD)
                        data = await asyncio.to_thread(connector.fetch_data)
                        
                        # 4. Save Data (Short Session)
                        db = database.SessionLocal()
                        try:
                            # Re-fetch dev in this session to update
                            dev = db.query(models.Device).get(dev_id)
                            if dev:
                                dev.last_seen = get_local_time()
                                dev.status = data.get("status", "offline")
                                
                                metrics = data.get("metrics", {})
                                if metrics:
                                    measurement = models.SensorData(
                                        device_id=dev.id,
                                        timestamp=get_local_time(),
                                        temperature=metrics.get("temperatureC"),
                                        humidity=metrics.get("humidityPct"),
                                        pressure=metrics.get("pressureHPa"),
                                        # pm2_5 and wind_speed removed for PostgreSQL compatibility
                                        # Set gas to None if not present to avoid 0.0 alerts
                                        gas=metrics.get("gas") 
                                    )
                                    db.add(measurement)
                                    db.commit() 
                                    db.refresh(measurement)
                                    
                                    # Offload alerts - Pass None for user_email here, check_alerts will handle it
                                    await asyncio.to_thread(check_alerts_wrapper, dev.id, measurement.id)
                        finally:
                            db.close()

                except Exception as e:
                    logger.error(f"Error polling device {dev_id}: {e}")
                    
        except Exception as e:
            logger.error(f"Polling cycle error: {e}")
        
        await asyncio.sleep(60)

def check_alerts_wrapper(dev_id, measurement_id, user_email: Optional[str] = None):
    """Wrapper to run check_alerts in a new thread with its own DB session"""
    db = database.SessionLocal()
    try:
        dev = db.query(models.Device).get(dev_id)
        meas = db.query(models.SensorData).get(measurement_id)
        if dev and meas:
             check_alerts(db, dev, meas, user_email)
             db.commit() # Save alerts if any
    except Exception as e:
        logger.error(f"Async Alert Error: {e}")
    finally:
        db.close()

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- Alerting Service ---
def send_email_alert(subject: str, body: str, recipient: str = None):
    """Sends an email alert using SMTP (e.g., Gmail) with enhanced error handling"""
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")
    receiver_email = recipient or os.getenv("ALERT_RECEIVER_EMAIL", sender_email)

    if not sender_email or not sender_password:
        logger.warning("⚠️ Email Alert Skipped: EMAIL_USER or EMAIL_PASS not configured in .env")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = f"🚨 EcoSync Alert: {subject}"

        msg.attach(MIMEText(body, 'plain'))

        # Connect to Gmail SMTP with timeout
        logger.info(f"📧 Connecting to Gmail SMTP for {receiver_email}...")
        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
        server.starttls()
        
        # Login
        logger.info(f"🔐 Authenticating as {sender_email}...")
        server.login(sender_email, sender_password)
        
        # Send email
        logger.info(f"📤 Sending alert email...")
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        
        logger.info(f"Email Alert SENT successfully to {receiver_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ SMTP Authentication Failed: {e}")
        logger.error(f"💡 Solution: Generate new App Password at https://myaccount.google.com/apppasswords")
        return False
        
    except smtplib.SMTPException as e:
        error_msg = str(e)
        logger.error(f"❌ SMTP Error: {error_msg}")
        
        # Specific error handling
        if "550" in error_msg:
            logger.error(f"💡 Gmail blocked the email. Possible reasons:")
            logger.error(f"   - Daily sending quota exceeded")
            logger.error(f"   - Suspicious activity detected")
            logger.error(f"   - Recipient email invalid or blocked")
            logger.error(f"   - Try again in a few hours or use a different Gmail account")
        elif "535" in error_msg:
            logger.error(f"💡 Invalid credentials. Check EMAIL_USER and EMAIL_PASS in .env")
        
        return False
        
    except Exception as e:
        logger.error(f"❌ Unexpected error sending email: {type(e).__name__}: {e}")
        return False


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) using Haversine formula.
    """
    if not all([lat1, lon1, lat2, lon2]):
        return float('inf') # Return infinite distance if coords missing

    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles
    return c * r


def check_alerts(db: Session, device: models.Device, measurement: models.SensorData, user_email: Optional[str] = None, extra_data: dict = None):
    """Rule-based alerting with Email Notification (User-Aware)"""
    
    current_ts = get_local_time()
    
    # CRITICAL: Do NOT default None to 0.0 here. Keep as None to skip checks.
    temp = float(measurement.temperature) if measurement.temperature is not None else None
    hum = float(measurement.humidity) if measurement.humidity is not None else None
    gas = float(measurement.gas) if measurement.gas is not None else None
    rain = float(measurement.rain) if measurement.rain is not None else None
    
    risk_level = getattr(measurement, 'risk_level', 'SAFE')
    smart_insight = getattr(measurement, 'smart_insight', 'Normal environment detected.')

    log_alert_activity(f"CHECK: {device.id} | T:{temp}, H:{hum}, G:{gas}, Risk:{risk_level}")

    # 1. Fetch Alert Settings - Limiting to the intended user only
    try:
        query = db.query(models.AlertSettings).filter(models.AlertSettings.is_active == True)
        
        # If user_email is provided, only alert THAT user.
        # Otherwise, if it's a polled device, alert the owner.
        if user_email:
            query = query.filter(models.AlertSettings.user_email == user_email)
        elif device.user_id:
            user = db.query(models.User).get(device.user_id)
            if user:
                query = query.filter(models.AlertSettings.user_email == user.email)
        else:
            # If no user context at all, skip alerting to avoid spamming the first active user
            log_alert_activity(f"SKIP Alert: No user context for device {device.id}")
            return {"status": "skipped", "reason": "no_user_context"}

        all_settings = query.all()
        log_alert_activity(f"Found {len(all_settings)} applicable alert configs.")
    except Exception as e:
        log_alert_activity(f"DB Error fetching settings: {e}")
        return {"status": "error", "message": "DB Error"}

    for settings in all_settings:
        target_email = settings.user_email
        if not target_email: continue

        # Thresholds
        T_MAX = settings.temp_threshold or 45.0
        H_MIN = settings.humidity_min or 20.0
        H_MAX = settings.humidity_max or 80.0
        G_MAX = settings.gas_threshold or 600.0
        
        breaches = []
        # Only check if the metric exists (Prevent 0.0 false alerts)
        if temp is not None and temp > T_MAX: breaches.append(f"Temperature Breach ({temp}°C > {T_MAX}°C)")
        if gas is not None and gas > G_MAX: breaches.append(f"Air Quality Breach ({gas} > {G_MAX})")
        if hum is not None and (hum > H_MAX or hum < H_MIN): breaches.append(f"Humidity Out of Range ({hum}%)")
        
        # Rain alert logic
        rain_alert_triggered = False
        if rain is not None and rain < 1000 and settings.rain_alert:
            rain_alert_triggered = True
            breaches.append("Rain Detected")

        # Only alert on ACTUAL threshold breaches
        should_alert = len(breaches) > 0
        
        if should_alert:
            # --- NEW: Persist Alert Records to Neon Database ---
            # ALWAYS store alerts for history, even during email cooldown
            for breach_msg in breaches:
                # Parse metric name from breach message if possible, else use 'Environment'
                metric_name = "Environment"
                if "Temperature" in breach_msg: metric_name = "Temperature"
                elif "Gas" in breach_msg or "Air Quality" in breach_msg: metric_name = "Air Quality"
                elif "Humidity" in breach_msg: metric_name = "Humidity"
                elif "Rain" in breach_msg: metric_name = "Rain"

                # Determine specific value for this metric
                metric_value = None
                if metric_name == "Temperature": metric_value = temp
                elif metric_name == "Humidity": metric_value = hum
                elif metric_name == "Air Quality": metric_value = gas
                
                # Get recipient name from user model if available
                full_name = "Unknown User"
                if settings.user:
                    fname = settings.user.first_name or ""
                    lname = settings.user.last_name or ""
                    full_name = f"{fname} {lname}".strip() or target_email

                new_db_alert = models.Alert(
                    metric=metric_name,
                    value=metric_value,
                    message=breach_msg,
                    recipient_email=target_email,
                    recipient_name=full_name,
                    user_id=device.user_id,
                    timestamp=current_ts
                )
                db.add(new_db_alert)
            
            # Commit alerts
            db.commit()

            # --- Now Check Cooldown for Emailing ---
            cooldown_key = f"{device.id}_{target_email}"
            last_sent = alert_cooldowns.get(cooldown_key)
            
            if last_sent and (current_ts - last_sent) < timedelta(minutes=10):
                remaining = int(10 - (current_ts - last_sent).total_seconds() / 60)
                log_alert_activity(f"SKIP Email (Cooldown): {target_email} — next email in {remaining} min.")
                continue

            log_alert_activity(f"🔥 TRIGGERING EMAIL to {target_email} | Breaches: {breaches}")
            
            try:
                # Determine rain status from sensor value (lower = wetter)
                rain_status = "N/A"
                rain_severity = "SAFE"
                if rain is not None:
                    rain_status = "RAINING" if rain < 1000 else ("DAMP" if rain < 2000 else "DRY")
                    rain_severity = "MODERATE" if rain < 1000 else "SAFE"

                alert_payload = [
                    {"metric": "Temperature", "value": f"{round(temp, 1)}°C" if temp is not None else "N/A", "limit": f"{T_MAX}°C", "status": "CRITICAL" if (temp is not None and temp > T_MAX) else "SAFE"},
                    {"metric": "Humidity", "value": f"{round(hum, 1)}%" if hum is not None else "N/A", "limit": f"{H_MAX}%", "status": "CRITICAL" if (hum is not None and (hum > H_MAX or hum < H_MIN)) else "SAFE"},
                    {"metric": "Gas Level", "value": f"{round(gas, 1)} ppm" if gas is not None else "N/A", "limit": f"{G_MAX} ppm", "status": "CRITICAL" if (gas is not None and gas > G_MAX) else "SAFE"},
                    {"metric": "Rain Sensor", "value": rain_status, "limit": "DRY", "status": rain_severity},
                ]

                # --- Fetch Historical Context from DB ---
                def _hist_snap(rows):
                    if not rows: return None
                    r = rows[0]
                    return {
                        "temperature": round(r.temperature, 1) if r.temperature is not None else None,
                        "humidity": round(r.humidity, 1) if r.humidity is not None else None,
                        "gas": round(r.gas, 1) if r.gas is not None else None,
                        "anomaly_label": r.anomaly_label or "Normal",
                        "smart_insight": r.smart_insight or "",
                        "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M") if r.timestamp else "",
                    }

                lw_rows = db.query(models.SensorData).filter(
                    models.SensorData.device_id == device.id,
                    models.SensorData.timestamp >= current_ts - timedelta(days=7, minutes=30),
                    models.SensorData.timestamp <= current_ts - timedelta(days=7) + timedelta(minutes=30)
                ).order_by(models.SensorData.timestamp.desc()).limit(3).all()

                yd_rows = db.query(models.SensorData).filter(
                    models.SensorData.device_id == device.id,
                    models.SensorData.timestamp >= current_ts - timedelta(days=1, minutes=30),
                    models.SensorData.timestamp <= current_ts - timedelta(days=1) + timedelta(minutes=30)
                ).order_by(models.SensorData.timestamp.desc()).limit(3).all()

                week_rows = db.query(models.SensorData).filter(
                    models.SensorData.device_id == device.id,
                    models.SensorData.timestamp >= current_ts - timedelta(days=7)
                ).all()

                def _avg(rows, field):
                    vals = [getattr(r, field) for r in rows if getattr(r, field) is not None]
                    return round(sum(vals) / len(vals), 1) if vals else None

                lw_snap = _hist_snap(lw_rows)
                yd_snap = _hist_snap(yd_rows)
                week_avg = {
                    "temperature": _avg(week_rows, "temperature"),
                    "humidity": _avg(week_rows, "humidity"),
                    "gas": _avg(week_rows, "gas"),
                }
                last_week_day = (current_ts - timedelta(days=7)).strftime("%A")
                time_str = current_ts.strftime("%I:%M %p")

                historical_context = {
                    "last_week": lw_snap,
                    "yesterday": yd_snap,
                    "week_averages": week_avg,
                    "last_week_day": last_week_day,
                    "time_str": time_str,
                }

                # Build AI Precautions with historical context
                precautions = []
                if temp is not None and temp > T_MAX:
                    lw_note = f" Last {last_week_day} at this time it was {lw_snap['temperature']}°C." if lw_snap and lw_snap.get("temperature") else ""
                    precautions.append(f"🌡️ High Temperature ({round(temp,1)}°C): Increase ventilation, avoid direct sun exposure, check cooling systems.{lw_note}")
                if gas is not None and gas > G_MAX:
                    lw_note = f" Last week gas was {lw_snap['gas']} ppm." if lw_snap and lw_snap.get("gas") else ""
                    precautions.append(f"💨 Elevated Gas ({round(gas,1)} ppm): Evacuate the area immediately, open windows, avoid ignition sources.{lw_note}")
                if hum is not None and hum > H_MAX:
                    precautions.append(f"💧 High Humidity ({round(hum,1)}%): Run dehumidifiers, check for water leaks, prevent mold growth.")
                elif hum is not None and hum < H_MIN:
                    precautions.append(f"🏜️ Low Humidity ({round(hum,1)}%): Use a humidifier, stay hydrated, protect sensitive equipment.")
                if rain is not None and rain < 1000:
                    precautions.append(f"🌧️ Rain Detected: Secure outdoor equipment, check drainage systems, avoid electrical hazards near water.")

                precaution_text = " | ".join(precautions) if precautions else "No immediate action required."
                full_insight = f"{smart_insight or 'AI Analysis complete.'}\n\n⚠️ Recommended Precautions: {precaution_text}"

                from .services.email_service import email_notifier
                success = email_notifier.send_alert(
                    recipients=[target_email],
                    device_name=device.name,
                    timestamp=current_ts.strftime("%Y-%m-%d %H:%M:%S UTC"),
                    alert_data=alert_payload,
                    ai_insight=full_insight,
                    historical_context=historical_context,
                    dashboard_link="http://localhost:5173/dashboard",
                    title="🛡️ Sreekar092004 S4 Alert"
                )
                
                if success:
                    alert_cooldowns[cooldown_key] = current_ts
                    log_alert_activity(f"📧 SUCCESS: Email delivered to {target_email}")
                else:
                    log_alert_activity(f"❌ SMTP FAILURE for {target_email}")
            except Exception as smtp_err:
                log_alert_activity(f"❌ SMTP CRASH for {target_email}: {smtp_err}")
    
    return {"status": "success"}


# --- Alert Debug Endpoints ---

@app.post("/api/debug/toggle-demo-mode", tags=["Debug"])
def toggle_demo_mode():
    """Toggles Demo Mode to simulate abnormal sensor data."""
    global DEMO_MODE
    DEMO_MODE = not DEMO_MODE
    log_alert_activity(f"🔄 Demo Mode changed to {DEMO_MODE}")
    return {"demo_mode": DEMO_MODE, "message": f"Demo mode is now {'ON' if DEMO_MODE else 'OFF'}"}

@app.post("/api/debug/reset-cooldowns", tags=["Debug"])
def reset_alert_cooldowns():
    """Clears the in-memory alert cooldown dict so alerts can fire immediately."""
    count = len(alert_cooldowns)
    alert_cooldowns.clear()
    log_alert_activity(f"🔄 Cooldowns manually reset ({count} entries cleared)")
    return {"status": "ok", "cleared": count, "message": "Alert cooldowns cleared. Next threshold breach will trigger an email immediately."}

@app.get("/api/debug/cooldown-status", tags=["Debug"])
def get_cooldown_status():
    """Shows current cooldown state for all devices."""
    now = get_local_time()
    status = {}
    for key, last_sent in alert_cooldowns.items():
        elapsed = (now - last_sent).total_seconds() / 60
        remaining = max(0, 10 - elapsed)
        status[key] = {
            "last_sent": last_sent.isoformat(),
            "elapsed_min": round(elapsed, 1),
            "remaining_min": round(remaining, 1),
            "blocked": remaining > 0
        }
    return {"cooldowns": status, "total": len(status)}


# --- Compliance Log API ---

class ViolationReport(BaseModel):
    task_id: int
    verifier_name: str

@app.get("/api/compliance/logs", tags=["Compliance"])
def get_compliance_logs(history: bool = False, db: Session = Depends(get_db)):
    today_str = dt.now().strftime("%Y-%m-%d")

    if history:
        # Return last 50 logs ordered by date desc
        return db.query(models.SafetyLog).order_by(models.SafetyLog.date.desc(), models.SafetyLog.id).limit(50).all()
    
    # 1. Check if logs exist for today
    logs = db.query(models.SafetyLog).filter(models.SafetyLog.date == today_str).all()
    
    # 2. If not, generate defaults
    if not logs:
        default_tasks = [
            "Morning Grounding Check",
            "Mixing Room Humidity Audit",
            "Chemical Waste Disposal",
            "Fire Extinguisher Pressure",
            "End-of-Shift Inventory Lock"
        ]
        new_logs = []
        for task in default_tasks:
            log = models.SafetyLog(
                task_name=task,
                date=today_str,
                status="PENDING",
                shift="A" # Simplification for now
            )
            db.add(log)
            new_logs.append(log)
        db.commit()
        logs = new_logs
        # Refresh to get IDs
        for log in logs: db.refresh(log)

    return logs

@app.post("/api/compliance/verify", tags=["Compliance"])
def verify_compliance_task(report: ViolationReport, db: Session = Depends(get_db)):
    log = db.query(models.SafetyLog).filter(models.SafetyLog.id == report.task_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Toggle Logic
    if log.status == "PENDING":
        log.status = "COMPLETED"
        log.verified_by = report.verifier_name
        log.verified_at = dt.now()
    else:
        log.status = "PENDING"
        log.verified_by = None
        log.verified_at = None
        
    db.commit()
    return {"status": "success", "task_id": log.id, "new_status": log.status}



@app.get("/debug/db")
def debug_db(db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        res = db.execute(text("SELECT current_database(), current_user, inet_server_addr()")).fetchone()
        row_counts = {}
        for table in ['users', 'devices', 'sensor_data', 'alerts']:
            try:
                row_counts[table] = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            except: row_counts[table] = "Error"
        return {
            "database": res[0],
            "user": res[1],
            "server_ip": str(res[2]),
            "row_counts": row_counts,
            "sqlalchemy_url": str(database.engine.url).split("@")[-1] # hide password
        }
    except Exception as e:
        return {"error": str(e)}

# --- IoT Ingestion Endpoint ---
class IoTSensorData(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: float = 1013.0
    mq_raw: float = 0.0
    wind_speed: float = 0.0
    rain: float = 0.0
    motion: int = 0
    gas: Optional[float] = None
    pm25: Optional[float] = None
    user_email: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    ph: float = 7.0
    # Backward compatibility
    mq_value: Optional[float] = None
    rain_value: Optional[float] = None
    motion_detected: Optional[bool] = None




@app.post("/iot/data", tags=["IoT"])
async def receive_iot_data(data: IoTSensorData, db: Session = Depends(get_db)):
    """Receives data from ESP32, applies Kalman filter, checks anomalies and alerts."""
    log_alert_activity(f"RECEIVE_IOT_DATA ENTRY - Email: {data.user_email}")
    try:
        current_ts = get_local_time()
        
        # DEMO MODE MUTATION
        global DEMO_MODE
        if DEMO_MODE:
            import random
            data.temperature = (data.temperature or 25.0) + random.uniform(20.0, 30.0)
            data.humidity = max((data.humidity or 50.0) - random.uniform(30.0, 40.0), 0)
            data.gas = (data.gas or 400.0) + random.uniform(1500.0, 3000.0)
            data.mq_raw = data.mq_raw + random.uniform(500.0, 1000.0)
        
        # 0. Compatibility Handle
        if data.mq_value is not None and data.mq_raw == 0.0: data.mq_raw = data.mq_value
        if data.rain_value is not None and data.rain == 0.0: data.rain = data.rain_value
        if data.motion_detected is not None and data.motion == 0: data.motion = 1 if data.motion_detected else 0

        # 1. Kalman Filtering & Cleaning
        temp_val = data.temperature if data.temperature is not None else 0.0
        hum_val = data.humidity if data.humidity is not None else 0.0
        
        filtered_temp, temp_conf = kf_instance.filter_temperature(temp_val)
        filtered_hum, hum_conf = kf_instance.filter_humidity(hum_val)
        
        # Smooth gas readings as well
        gas_val = data.gas if data.gas is not None else data.mq_raw
        filtered_gas, _ = kf_instance.filter_gas(gas_val)
        
        mq_cleaned = kf_instance.clean_mq_data(data.mq_raw)

        # Fetch User's SPECIFIC Alert Thresholds
        user_config_dict = None
        if data.user_email:
            settings_obj = db.query(models.AlertSettings).filter(models.AlertSettings.user_email == data.user_email).first()
            if settings_obj:
                user_config_dict = {
                     "temp_threshold": settings_obj.temp_threshold,
                     "humidity_min": settings_obj.humidity_min,
                     "humidity_max": settings_obj.humidity_max,
                     "gas_threshold": settings_obj.gas_threshold,
                     "pm25_threshold": settings_obj.pm25_threshold
                }
                
        # 1b. Trust Score & Anomaly Detection
        current_data = {
            "temperature": filtered_temp,
            "humidity": filtered_hum,
            "gas": filtered_gas,
            "wind_speed": data.wind_speed,
            "pm2_5": data.pm25
        }
        
        trust_score = trust_calculator.calculate_score(current_data)
        is_anomaly, anomaly_score = anomaly_detector.update_and_predict([
            filtered_temp, filtered_hum, current_data["gas"]
        ])
        
        anomalies_list, precautions = anomaly_detector.check_thresholds(current_data, user_config=user_config_dict)
        smart_insight = insight_generator.generate_insight(current_data, anomalies_list)
        
        if is_anomaly:
            anomalies_list.append("Statistical Outlier")
        
        # 2. Get/Create Device (Unique per User for localized geofencing)
        if data.user_email:
             id_sanitized = data.user_email.replace("@", "_").replace(".", "_")
             device_id = f"DASHBOARD_{id_sanitized}"
        else:
             device_id = "ESP32_MAIN"
        
        log_alert_activity(f"Target Device: {device_id}")
        
        device = db.query(models.Device).filter(models.Device.id == device_id).first()
        log_alert_activity(f"Device query done. Found={device is not None}")
        if not device:
            # Find the actual user record to link
            user = db.query(models.User).filter(models.User.email == data.user_email).first()
            device = models.Device(
                id=device_id, name="EcoSync Node", 
                connector_type="esp32",
                lat=data.lat or 0.0, lon=data.lon or 0.0, 
                status="online", last_seen=current_ts,
                user_id=user.id if user else None
            )
            db.add(device)
            db.commit()
            db.refresh(device)
        else:
            device.last_seen = current_ts
            device.status = "online"
            # Link user if not already linked
            if not device.user_id and data.user_email:
                user = db.query(models.User).filter(models.User.email == data.user_email).first()
                if user:
                    device.user_id = user.id
            if data.lat and data.lon:
                device.lat = data.lat
                device.lon = data.lon
            db.commit()

        # New Smart Alert Logic (Phase 2) - Calculated for EVERY request
        log_alert_activity(f"Calling generate_full_report for {data.user_email}")
        full_data_for_report = current_data.copy()
        
        smart_report = insight_generator.generate_full_report(
            full_data_for_report,
            anomalies_list
        )
        
        smart_insight = smart_report["insight"]
        anomaly_score = smart_report.get("if_score", 0.0)
        trust_score = trust_calculator.calculate_score({
            "temperature": data.temperature,
            "humidity": data.humidity
        })

        # 3. Store Filtered Data with proper transaction handling
        try:
            mq_norm = float(min(100, max(0, (mq_cleaned["smoothed"] - 200) / 6)))
            measurement = models.SensorData(
                device_id=device.id,
                user_id=device.user_id,
                timestamp=current_ts,
                temperature=float(filtered_temp),
                humidity=float(filtered_hum),
                gas=float(data.gas) if data.gas is not None else float(mq_cleaned["smoothed"]),
                rain=float(data.rain),
                motion=int(data.motion),
                # pm2_5 and wind_speed removed for PostgreSQL compatibility
                trust_score=float(trust_score),
                anomaly_label=",".join(anomalies_list) if anomalies_list else "Normal",
                anomaly_score=float(anomaly_score),
                smart_insight=smart_insight
            )
            
            # Add extra metrics to object for immediate response (not stored in DB yet)
            measurement.risk_level = smart_report["risk_level"]
            measurement.prediction = smart_report["prediction"]
            measurement.sensor_health = smart_report["sensor_health"]
            measurement.baseline = smart_report["baseline"]
            db.add(measurement)
            db.commit()

            # 4. Alert Check with proper session management
            try:
                # Ensure objects are fresh after first commit
                db.refresh(device)
                db.refresh(measurement)
                
                check_alerts(db, device, measurement, data.user_email)
                db.commit()
            except Exception as alert_error:
                log_alert_activity(f"⚠️ Alert check CRASH: {alert_error}")
                logger.error(f"Alert check failed: {alert_error}")

            # 5. WebSocket Broadcast with error handling
            try:
                payload = {
                    "deviceId": device_id,
                    "timestamp": current_ts.isoformat(),
                    "raw": {
                        "temperature": data.temperature,
                        "humidity": data.humidity,
                        "mq_raw": data.mq_raw
                    },
                    "filtered": {
                        "temperature": round(filtered_temp, 2),
                        "humidity": round(filtered_hum, 2),
                        "mq_smoothed": mq_cleaned["smoothed"]
                    },
                    "confidence": {
                        "temperature": round(temp_conf, 3),
                        "humidity": round(hum_conf, 3)
                    },
                    "mq_quality": {
                        "is_outlier": mq_cleaned["is_outlier"],
                        "z_score": mq_cleaned["z_score"]
                    },
                    "mq_index": mq_norm,
                    "smart_metrics": {
                        "trust_score": round(trust_score, 1),
                        "is_anomaly": is_anomaly,
                        "anomaly_score": round(anomaly_score, 3),
                        "insight": smart_insight
                    }
                }
                await manager.broadcast(payload, "ESP32_MAIN")
            except Exception as ws_error:
                logger.error(f"WebSocket broadcast failed: {ws_error}")
                # Don't fail the entire request due to WebSocket issues

            return {"status": "ok", "message": "Data processed successfully", "device_id": device_id}

        except Exception as e:
            log_alert_activity(f"❌ IoT Data Error: {e}")
            logger.error(f"IoT Data Error: {e}")
            return {"status": "error", "detail": str(e)}
            
    except Exception as e:
        log_alert_activity(f"❌ IoT Processing Error: {e}")
        logger.error(f"IoT Processing Error: {e}")
        return {"status": "error", "detail": str(e)}


@app.get("/api/data", tags=["Analytics"])
def get_historical_data(limit: int = 100, db: Session = Depends(get_db)):
    """
    Returns historical sensor data for analytics visualization.
    """
    data = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).limit(limit).all()
    return data


@app.get("/api/historical-context", tags=["Analytics"])
def get_historical_context(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns AI historical context: same-time last week readings, 7-day averages,
    and a generated narrative comparing current vs historical conditions.
    """
    now = get_local_time()
    
    # Build device filter
    device_id = None
    if user_email:
        id_sanitized = user_email.replace("@", "_").replace(".", "_")
        device_id = f"DASHBOARD_{id_sanitized}"

    def base_query():
        q = db.query(models.SensorData)
        if device_id:
            q = q.filter(models.SensorData.device_id == device_id)
        return q

    # 1. Same time last week (±30 min window)
    last_week_center = now - timedelta(days=7)
    last_week_start = last_week_center - timedelta(minutes=30)
    last_week_end = last_week_center + timedelta(minutes=30)
    last_week_rows = base_query().filter(
        models.SensorData.timestamp >= last_week_start,
        models.SensorData.timestamp <= last_week_end
    ).order_by(models.SensorData.timestamp.desc()).limit(5).all()

    # 2. Same time yesterday (±30 min window)
    yesterday_center = now - timedelta(days=1)
    yesterday_start = yesterday_center - timedelta(minutes=30)
    yesterday_end = yesterday_center + timedelta(minutes=30)
    yesterday_rows = base_query().filter(
        models.SensorData.timestamp >= yesterday_start,
        models.SensorData.timestamp <= yesterday_end
    ).order_by(models.SensorData.timestamp.desc()).limit(5).all()

    # 3. 7-day averages
    week_ago = now - timedelta(days=7)
    week_rows = base_query().filter(
        models.SensorData.timestamp >= week_ago
    ).all()

    def avg(rows, field):
        vals = [getattr(r, field) for r in rows if getattr(r, field) is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    week_avg = {
        "temperature": avg(week_rows, "temperature"),
        "humidity": avg(week_rows, "humidity"),
        "gas": avg(week_rows, "gas"),
    }

    # 4. Build snapshot helper
    def snapshot(rows):
        if not rows:
            return None
        r = rows[0]
        return {
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "temperature": round(r.temperature, 1) if r.temperature is not None else None,
            "humidity": round(r.humidity, 1) if r.humidity is not None else None,
            "gas": round(r.gas, 1) if r.gas is not None else None,
            "rain": r.rain,
            "anomaly_label": r.anomaly_label,
            "smart_insight": r.smart_insight,
        }

    last_week_snap = snapshot(last_week_rows)
    yesterday_snap = snapshot(yesterday_rows)

    # 5. Generate AI narrative
    def generate_narrative(last_week_snap, yesterday_snap, week_avg, now):
        lines = []
        day_name = (now - timedelta(days=7)).strftime("%A")
        time_str = now.strftime("%I:%M %p")

        if last_week_snap and last_week_snap.get("temperature") is not None:
            lw_temp = last_week_snap["temperature"]
            lw_hum = last_week_snap.get("humidity", "N/A")
            lw_gas = last_week_snap.get("gas", "N/A")
            lw_anomaly = last_week_snap.get("anomaly_label") or "Normal"
            lw_insight = last_week_snap.get("smart_insight") or ""
            lines.append(
                f"📅 Last {day_name} at {time_str}: Temperature was {lw_temp}°C, "
                f"Humidity {lw_hum}%, Gas {lw_gas} ppm. "
                f"Status: {lw_anomaly}."
                + (f" AI noted: {lw_insight}" if lw_insight else "")
            )
        else:
            lines.append(f"📅 No data recorded last {day_name} at this time.")

        if yesterday_snap and yesterday_snap.get("temperature") is not None:
            yd_temp = yesterday_snap["temperature"]
            yd_hum = yesterday_snap.get("humidity", "N/A")
            yd_anomaly = yesterday_snap.get("anomaly_label") or "Normal"
            lines.append(
                f"🕐 Yesterday at {time_str}: Temperature was {yd_temp}°C, "
                f"Humidity {yd_hum}%. Status: {yd_anomaly}."
            )
        else:
            lines.append(f"🕐 No data recorded yesterday at this time.")

        if week_avg.get("temperature") is not None:
            lines.append(
                f"📊 7-Day Averages: Temperature {week_avg['temperature']}°C, "
                f"Humidity {week_avg['humidity']}%, Gas {week_avg['gas']} ppm."
            )

        return " | ".join(lines)

    narrative = generate_narrative(last_week_snap, yesterday_snap, week_avg, now)

    return {
        "last_week": last_week_snap,
        "yesterday": yesterday_snap,
        "week_averages": week_avg,
        "narrative": narrative,
        "generated_at": now.isoformat(),
    }


@app.get("/api/filtered/latest", tags=["IoT"])
async def get_filtered_iot_data(user_email: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns latest Kalman-filtered data with user-aware thresholds."""
    
    # User-aware device lookup
    target_device_id = "ESP32_MAIN" # Logical default
    if user_email:
        id_sanitized = user_email.replace("@", "_").replace(".", "_")
        target_device_id = f"DASHBOARD_{id_sanitized}"
        
    reading = db.query(models.SensorData).filter(
        models.SensorData.device_id == target_device_id
    ).order_by(models.SensorData.timestamp.desc()).first()
    
    if not reading:
        # Fallback to general main if user-specific not found
        reading = db.query(models.SensorData).filter(
            models.SensorData.device_id == "ESP32_MAIN"
        ).order_by(models.SensorData.timestamp.desc()).first()
        
    if not reading:
        # Debug: Try ANY device
        last_any = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).first()
        if last_any:
             reading = last_any
        else:
             return {"status": "no_data", "message": "No sensor data available"}
    
    # Calculate AQI (Use Gas as proxy or 0 for PM if missing)
    aqi_result = aqi_calculator.calculate_overall_aqi({"pm25": 0.0})
    health_recs = aqi_calculator.get_health_recommendations(
        aqi_result.get("aqi"), aqi_result.get("dominant_pollutant_key")
    )
    
    # Calculate Rainfall Prediction
    prediction = weather_service.calculate_rainfall_prediction(
        reading.humidity, 
        0.0, # wind_speed missing in schema
        1013.0 # pressure missing in schema
    )

    # User-Specific Threshold Breaches
    user_breaches = []
    if user_email:
        settings = db.query(models.AlertSettings).filter(
            models.AlertSettings.user_email == user_email,
            models.AlertSettings.is_active == True
        ).first()
        if settings:
            temp = reading.temperature or 0.0
            gas = reading.gas or 0.0
            hum = reading.humidity or 0.0
            rain = reading.rain or 4095
            
            if temp > (settings.temp_threshold or 45.0):
                user_breaches.append(f"Temperature exceeds your limit ({temp}°C > {settings.temp_threshold}°C)")
            if gas > (settings.gas_threshold or 600.0):
                user_breaches.append(f"Gas level exceeds your limit ({gas} > {settings.gas_threshold})")
            if hum > (settings.humidity_max or 80.0):
                user_breaches.append(f"Humidity too high ({hum}% > {settings.humidity_max}%)")
            if hum < (settings.humidity_min or 20.0):
                user_breaches.append(f"Humidity too low ({hum}% < {settings.humidity_min}%)")
            if rain < 1000 and settings.rain_alert:
                user_breaches.append("Active Rain Detected (Alert Enabled)")
            
            # Use gas as proxy for PM2.5 in checks if pm25 sensor is missing
            pm25_proxy = reading.gas or 0.0
            if pm25_proxy > (settings.pm25_threshold or 150.0):
                user_breaches.append(f"Air Quality (PM2.5) exceeds your limit ({pm25_proxy} > {settings.pm25_threshold})")
    
    return {
        "status": "ok",
        "timestamp": reading.timestamp.isoformat(),
        "deviceId": reading.device_id,
        "filtered": {
            "temperature": reading.temperature,
            "humidity": reading.humidity,
            "pm25": 0.0,
            "mq_smoothed": reading.gas,
            "pressure": 1013.0,
            "wind_speed": 0.0
        },
        "air_quality": {
            "aqi": aqi_result.get("aqi"),
            "category": aqi_result.get("category"),
            "color": aqi_result.get("color"),
            "dominant_pollutant": aqi_result.get("dominant_pollutant")
        },
        "health": health_recs,
        "weather": prediction,
        "smart_metrics": {
            "trust_score": reading.trust_score,
            "anomaly_label": reading.anomaly_label,
            "anomaly_score": reading.anomaly_score,
            "insight": reading.smart_insight,
            "ph": 7.0, # Default pH if not in schema
            "risk_level": "CRITICAL" if len(user_breaches) > 0 else "SAFE",
            "user_breaches": user_breaches
        }
    }


# --- WebSocket Endpoint with proper error handling and cleanup ---
@app.websocket("/ws/stream/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    # Validate device_id
    if not device_id or not isinstance(device_id, str):
        await websocket.close(code=4000, reason="Invalid device_id")
        return

    # Authenticate the connection
    try:
        # Get token from query parameters
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4001, reason="Authentication required")
            return

        # Verify token
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        # Get user from database
        db = database.SessionLocal()
        try:
            user = db.query(models.User).filter(models.User.email == username).first()
            if user is None:
                raise credentials_exception
        finally:
            db.close()

        # Store user in WebSocket manager
        await manager.connect(websocket, device_id, user)
        logger.info(f"WebSocket connected for device {device_id} (user: {user.email})")
    except Exception as auth_error:
        logger.error(f"WebSocket auth failed: {auth_error}")
        await websocket.close(code=4001, reason="Authentication failed")
        return

    # Connect to WebSocket manager
    try:
        await manager.connect(websocket, device_id)
        logger.info(f"WebSocket connected for device {device_id} (user: {user.email})")

        try:
            while True:
                try:
                    # Receive and process messages
                    data = await websocket.receive_text()
                    # Process incoming data if needed
                    logger.debug(f"WebSocket message from {device_id}: {data}")
                except WebSocketDisconnect:
                    logger.info(f"WebSocket disconnected for device {device_id}")
                    break
                except Exception as receive_error:
                    logger.error(f"WebSocket receive error: {receive_error}")
                    break
        finally:
            # Always clean up the connection
            try:
                await manager.disconnect(websocket, device_id)
                logger.info(f"WebSocket cleanup complete for device {device_id}")
            except Exception as cleanup_error:
                logger.error(f"WebSocket cleanup error: {cleanup_error}")

    except Exception as connect_error:
        logger.error(f"WebSocket connection failed: {connect_error}")
        await websocket.close(code=4002, reason="Connection failed")

# --- Standard Device Endpoints ---
@app.post("/api/devices", response_model=schemas.DeviceResponse, tags=["Devices"])
def create_device(device: schemas.DeviceCreate, db: Session = Depends(get_db)):
    db_device = models.Device(
        name=device.deviceName,
        connector_type=device.connectorType,
        lat=device.location.lat,
        lon=device.location.lon,
        status="created"
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@app.get("/api/devices", response_model=List[schemas.DeviceResponse], tags=["Devices"])
def list_devices(db: Session = Depends(get_db)):
    return db.query(models.Device).all()

# --- Pro Mode ---
@app.get("/api/pro-data", tags=["Pro Mode"])
async def get_pro_data(lat: float = 17.3850, lon: float = 78.4867, city: str = None, db: Session = Depends(get_db)):
    """Aggregates External API + Local Sensor Data + Kalman Fusion"""
    current_lat, current_lon = lat, lon
    location_name = "Custom Location"

    if city:
        coords = await external_apis.get_location_coordinates(city)
        if coords:
            current_lat, current_lon, location_name = coords["lat"], coords["lon"], f"{coords['name']}, {coords.get('country', '')}"

    # 1. Fetch External
    external_data = await external_apis.get_pro_dashboard_data(current_lat, current_lon)
    external_data["location"]["name"] = location_name
    
    # 2. Fetch Local
    latest = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).first()
    local_data = {"temp": latest.temperature, "humidity": latest.humidity, "pm25": latest.pm2_5} if latest else {}
    
    # 3. Fuse
    ext_simple = {
        "temp": external_data["weather"]["temp"],
        "humidity": external_data["weather"]["humidity"],
        "pm25": external_data["air_quality"]["pm25"]
    }
    external_data["fusion"] = fusion_engine.fuse_environmental_data(local_data, ext_simple)
    
    return external_data

# --- Alert Settings API ---
@app.get("/api/settings/alerts", response_model=schemas.AlertSettingsResponse, tags=["Settings"])
def get_alert_settings(email: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns user-specific settings or creates default if not found."""
    if not email:
        raise HTTPException(status_code=400, detail="Email is required to fetch settings")
        
    settings = db.query(models.AlertSettings).filter(models.AlertSettings.user_email == email).first()
    
    if not settings:
        # Create absolute default if DB empty for this user
        settings = models.AlertSettings(
            user_email=email,
            temp_threshold=45.0,
            humidity_min=20.0,
            humidity_max=80.0,
            gas_threshold=600.0,
            rain_alert=True,
            pm25_threshold=150.0,
            is_active=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    return settings

@app.post("/api/settings/alerts", response_model=schemas.AlertSettingsResponse, tags=["Settings"])
def update_alert_settings(settings: schemas.AlertSettingsCreate, db: Session = Depends(get_db)):
    """Update existing for this user or create new."""
    logger.info(f"Settings update request for {settings.user_email}")
    if not settings.user_email:
        raise HTTPException(status_code=400, detail="User email is required")

    try:
        db_settings = db.query(models.AlertSettings).filter(
            models.AlertSettings.user_email == settings.user_email
        ).first()
        
        update_data = settings.dict(exclude_unset=True)
        
        if not db_settings:
            logger.info(f"Creating new settings for {settings.user_email}")
            db_settings = models.AlertSettings(**update_data)
            db.add(db_settings)
        else:
            for key, value in update_data.items():
                setattr(db_settings, key, value)
        
        db.commit()
        # db.refresh(db_settings) # Optimized: Skip refresh to reduce roundtrip
        logger.info(f"Settings successfully saved for {settings.user_email}")
        return db_settings
    except Exception as e:
        logger.error(f"Failed to update settings for {settings.user_email}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/alerts", tags=["IoT"])
def get_historical_alerts(user_email: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns historical safety alerts for the user.
    """
    query = db.query(models.Alert)
    if user_email:
        query = query.filter(models.Alert.recipient_email == user_email)
    
    alerts = query.order_by(models.Alert.timestamp.desc()).limit(limit).all()
    return alerts


@app.get("/realtime/map", tags=["Map"])
async def get_realtime_map_data():
    markers = get_cached_markers()
    return {"count": len(markers), "markers": markers, "cache_status": "active"}

# --- Static File Serving (Frontend) ---
# MUST BE AT THE END TO PREVENT INTERCEPTING API ROUTES
FRONTEND_DIST_DIR = os.getenv("FRONTEND_DIST_DIR", "../frontend/dist")

if os.path.exists(FRONTEND_DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))
else:
    logger.warning(f"Frontend dist directory not found at {FRONTEND_DIST_DIR}. Frontend will not be served.")