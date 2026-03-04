import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.email_service import email_notifier
from datetime import datetime

def test_new_ui():
    test_email = os.getenv("EMAIL_USER")
    if not test_email:
        print("EMAIL_USER not found in environment.")
        return

    alert_data = [
        {"metric": "Temperature", "value": "29.3°C", "limit": "45.0°C", "status": "SAFE"},
        {"metric": "Humidity", "value": "55.0%", "limit": "80.0%", "status": "SAFE"},
        {"metric": "Gas Level", "value": "764.8 ppm", "limit": "600.0 ppm", "status": "CRITICAL"},
        {"metric": "Rain Sensor", "value": "DRY", "limit": "DRY", "status": "SAFE"}
    ]
    
    ai_insight = "🔴 CRITICAL SAFETY RISK: Immediate Action Required. | ⚠️ Anomaly Detected: Air Quality Breach (> 600.0 ppm) behavior is unusual.\n\n⚠️ Recommended Precautions: Evacuate the area immediately | Open windows | Avoid ignition sources"
    
    historical_context = {
        "yesterday": {"temperature": 28.5, "humidity": 52.0, "gas": 450.0},
        "last_week": {"temperature": 27.2, "humidity": 50.0, "gas": 420.0},
        "week_averages": {"temperature": 27.8, "humidity": 51.5, "gas": 440.5},
        "time_str": "10:48 am"
    }
    
    print(f"Sending test email to {test_email}...")
    success = email_notifier.send_alert(
        recipients=[test_email],
        device_name="EcoSync Node-01",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        alert_data=alert_data,
        ai_insight=ai_insight,
        dashboard_link="http://127.0.0.1:5173/dashboard",
        title="Environmental threshold breach detected",
        historical_context=historical_context
    )
    
    if success:
        print("✅ Test email sent successfully!")
    else:
        print("❌ Failed to send test email.")

if __name__ == "__main__":
    test_new_ui()
