#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Backend Configuration
#ifdef VERCEL_DEPLOYMENT
#define SERVER_URL "https://your-vercel-deployment.vercel.app/iot/data"
#define MQTT_SERVER "your-vercel-deployment.vercel.app"
#else
#define SERVER_URL "http://192.168.0.110:8001/iot/data"
#define MQTT_SERVER "192.168.0.110"
#endif

// MQTT Configuration
#define MQTT_PORT 443 // Use 443 for Vercel deployment
#define MQTT_USER ""
#define MQTT_PASSWORD ""

#endif