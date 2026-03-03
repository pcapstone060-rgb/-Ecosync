#include <ArduinoJson.h> // Make sure to install ArduinoJson library
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

// --- USER CONFIGURATION (EDIT THESE) ---
const char *ssid = "YOUR_WIFI_NAME";
const char *password = "YOUR_WIFI_PASSWORD";
// REPLACE with your PC's IP address (Run 'ipconfig' in cmd to find it)
// Example: "http://192.168.1.15:8009/iot/data"
const char *serverUrl = "http://192.168.0.110:8001/iot/data";
const char *userEmail =
    "sreekar092004@gmail.com"; // Must match your login email for Pro Mode

// --- HARDWARE CONFIGURATION ---
#define DHTPIN 4
#define DHTTYPE DHT11
#define MQ_PIN 34
#define RAIN_PIN 35
#define PIR_PIN 27

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(MQ_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);

  // 1. Connect to WiFi
  Serial.println("\nPossible Ecosync WiFi Boot...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // 2. Read Sensors
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int mqRaw = analogRead(MQ_PIN);
  int rainVal = analogRead(RAIN_PIN);
  int motion = digitalRead(PIR_PIN);

  // Check for read failure
  if (isnan(h) || isnan(t)) {
    Serial.println("DHT Sensor Failed!");
    delay(2000);
    return;
  }

  // 3. Prepare JSON Payload
  String jsonPayload = "{";
  jsonPayload += "\"temperature\": " + String(t) + ",";
  jsonPayload += "\"humidity\": " + String(h) + ",";
  jsonPayload += "\"mq_raw\": " + String(mqRaw) + ",";
  jsonPayload += "\"rain\": " + String(rainVal) + ",";
  jsonPayload += "\"motion\": " + String(motion) + ",";
  jsonPayload += "\"user_email\": \"" + String(userEmail) + "\"";
  jsonPayload += "}";

  // 4. Send HTTP POST
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("Server Response: ");
      Serial.println(httpResponseCode);
      Serial.println(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  delay(5000); // Send data every 5 seconds
}
