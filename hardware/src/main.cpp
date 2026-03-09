#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <Wire.h>

#include "config.h"

// --- WiFi Configuration ---
// Note: We use unique names to avoid conflicts with config.h macros
const char *my_ssid = "xanax";
const char *my_pass = "123456789";

// Powerbank "Stay-Alive"
#define STAYALIVE_PIN 2 // Build-in LED or any unused pin

// Backend URL
const char *SERVER_URL = "https://ecosync-phi.vercel.app/api/iot/data";

// --- MQTT Configuration ---
const char *MQTT_SERVER = MQTT_SERVER;
const int MQTT_PORT = MQTT_PORT;
const char *MQTT_USER = MQTT_USER;
const char *MQTT_PASSWORD = MQTT_PASSWORD;

WiFiClient espClient;
PubSubClient client(espClient);

// --- Hardware Configuration ---
LiquidCrystal_I2C lcd(0x27, 16, 2);

// --- PIN DEFINITIONS ---
#define DHTPIN 15
#define MQ_ANALOG_PIN 34
#define RAIN_ANALOG_PIN 35
#define PIR_PIN 27
#define IR_PIN 18 // Pin 18 for IR

#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Thresholds
#define GAS_THRESHOLD 2000
#define RAIN_THRESHOLD 1500

// --- Kalman Filter Variables ---
float temp_kalman = 0.0;
float hum_kalman = 0.0;
float pm25_kalman = 0.0;

// Kalman Filter Function
float kalman_filter(float prev_estimate, float measurement) {
  // Simple Kalman filter implementation
  float Q = 0.01; // Process noise covariance
  float R = 0.1;  // Measurement noise covariance
  float K = 0.0;  // Kalman gain

  // Prediction step
  float prediction = prev_estimate;

  // Update step
  K = Q / (Q + R);
  float estimate = prediction + K * (measurement - prediction);

  return estimate;
}

// --- Global Variables ---
float t = 0.0;
float h = 0.0;
int mqValue = 0;
int rainValue = 0;
int pirValue = 0;
int irValue = 0;
// Speed Counter Variables
volatile unsigned long pulseCount = 0;
int lastIrState = HIGH;

void reconnect() {
  static unsigned long lastMqttAttempt = 0;
  if (millis() - lastMqttAttempt > 5000) {
    lastMqttAttempt = millis();
    if (client.connect("ESP32EcoSync", MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("MQTT Connected");
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("EcoSync Pro - Starting up...");

  // Print system information
  Serial.printf("ESP32 Chip ID: %08X\n", (uint32_t)ESP.getEfuseMac());
  Serial.printf("Flash Size: %u bytes\n", ESP.getFlashChipSize());
  Serial.printf("Free Heap: %u bytes\n", ESP.getFreeHeap());

  pinMode(MQ_ANALOG_PIN, INPUT);
  pinMode(RAIN_ANALOG_PIN, INPUT);
  pinMode(PIR_PIN, INPUT_PULLDOWN);
  pinMode(IR_PIN, INPUT);
  pinMode(STAYALIVE_PIN, OUTPUT); // For Powerbank Stay-Alive

  dht.begin();
  client.setServer(MQTT_SERVER, MQTT_PORT);

  // Initialize LCD with error handling
  bool lcdInitialized = false;
  int lcdInitAttempts = 0;
  const int maxLcdAttempts = 3;

  while (!lcdInitialized && lcdInitAttempts < maxLcdAttempts) {
    lcdInitAttempts++;

    // Try different I2C addresses
    uint8_t addresses[] = {0x27, 0x3F, 0x20};
    for (int i = 0; i < 3; i++) {
      Wire.beginTransmission(addresses[i]);
      if (Wire.endTransmission() == 0) {
        lcd = LiquidCrystal_I2C(addresses[i], 16, 2);
        lcd.init(); // Most LiquidCrystal_I2C libraries use init() instead of
                    // begin() returning bool
        lcdInitialized = true;
        Serial.printf("LCD initialized at address 0x%02X\n", addresses[i]);
        break;
      }
    }

    if (!lcdInitialized) {
      Serial.println("LCD initialization failed, retrying...");
      delay(500);
    }
  }

  if (lcdInitialized) {
    Wire.setClock(10000); // Lower I2C speed to 10kHz for stability
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("EcoSync Pro");
    delay(1000);
  } else {
    Serial.println("ERROR: LCD initialization failed after 3 attempts");
    // Continue without LCD
  }

  // Connect to WiFi
  lcd.setCursor(0, 1);
  lcd.print("Connecting...");
  WiFi.begin(my_ssid, my_pass);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    lcd.setCursor(0, 1);
    lcd.print("WiFi Connected ");
  } else {
    lcd.setCursor(0, 1);
    lcd.print("Offline Mode   ");
  }
  delay(1000);
  lcd.clear();
}

void loop() {
  // --- TIMERS ---
  static unsigned long lastSensorRead = 0;
  static unsigned long lastPageSwitch = 0;
  static int pageIndex = 0;
  static unsigned long lastWiFiCheck = 0;

  // Scoped Variables
  bool dhtError = false;

  // Debug information
  static unsigned long loopCounter = 0;
  loopCounter++;
  if (loopCounter % 100 == 0) {
    Serial.printf("Loop iteration: %lu, Free Heap: %u bytes\n", loopCounter,
                  ESP.getFreeHeap());
  }

  // 1. WiFi & MQTT Handling (Non-Blocking)
  if (millis() - lastWiFiCheck > 5000) {
    lastWiFiCheck = millis();

    // Pulse LED/Pin to keep high-capacity powerbanks from sleeping
    digitalWrite(STAYALIVE_PIN, HIGH);
    delay(50); // Short pulse
    digitalWrite(STAYALIVE_PIN, LOW);

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi disconnected, attempting to reconnect...");
      WiFi.disconnect();
      WiFi.reconnect();

      // Try to reconnect with timeout
      int wifiAttempts = 0;
      while (WiFi.status() != WL_CONNECTED && wifiAttempts < 10) {
        delay(500);
        wifiAttempts++;
        Serial.print(".");
      }

      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("WiFi reconnected successfully");
        lcd.setCursor(0, 1);
        lcd.print("WiFi Connected ");
      } else {
        Serial.println("WiFi reconnection failed");
        lcd.setCursor(0, 1);
        lcd.print("Offline Mode   ");
      }
    } else {
      if (!client.connected()) {
        reconnect();
      }
      client.loop();
    }
  }

  unsigned long runSec = millis() / 1000;
  unsigned long runMin = runSec / 60;
  runSec = runSec % 60;

  // 2. Read Sensors (Every 2 Seconds)
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();

    // Read DHT sensor with error handling
    // bool dhtError = false; // Moved to top of loop
    dhtError = false; // Reset error state
    float newH = dht.readHumidity();
    float newT = dht.readTemperature();
    if (!isnan(newH) && !isnan(newT)) {
      h = newH;
      t = newT;
    } else {
      dhtError = true;
      Serial.println("Warning: DHT Read Failed! Using old values.");
    }

    // Read analog sensors with validation
    int mqRaw = analogRead(MQ_ANALOG_PIN);
    int rainRaw = analogRead(RAIN_ANALOG_PIN);

    // Validate sensor readings
    if (mqRaw >= 0 && mqRaw <= 4095) {
      mqValue = mqRaw;
    } else {
      Serial.println("MQ sensor read error, using previous value");
    }

    if (rainRaw >= 0 && rainRaw <= 4095) {
      rainValue = rainRaw;
    } else {
      Serial.println("Rain sensor read error, using previous value");
    }

    // Read digital sensors with debouncing
    int newPir = digitalRead(PIR_PIN);
    delay(10); // Short debounce delay
    int newPir2 = digitalRead(PIR_PIN);
    if (newPir == newPir2) {
      pirValue = newPir;
    } else {
      Serial.println("PIR sensor debounce error, using previous value");
    }

    irValue = digitalRead(IR_PIN);

    // Software Debounce for Motion (Check twice 50ms apart)
    int p1 = digitalRead(PIR_PIN);
    delay(50);
    int p2 = digitalRead(PIR_PIN);
    // Store exact read. If Active Low, IDLE=High, DETECT=Low.
    pirValue = (p1 == p2)
                   ? p1
                   : p1; // Simple debounce, just take p1 if match, else p1.
    // Actually, let's just read it.
    pirValue = p2;

    irValue = digitalRead(IR_PIN);

    // Apply Kalman Filter to sensor data
    temp_kalman = kalman_filter(temp_kalman, t);
    hum_kalman = kalman_filter(hum_kalman, h);
    pm25_kalman = kalman_filter(pm25_kalman, map(mqValue, 0, 4095, 0, 500));

    // Determine Status for Serial Match
    const char *gasStatus = (mqValue > GAS_THRESHOLD) ? "Alert" : "Safe";
    // Rain: Low (0-2000) = Wet. High (4095) = Dry.
    const char *rainStatus = (rainValue < 2000) ? "Rain" : "Clear";
    // Motion: High = Detected.
    const char *motStatus = (pirValue == HIGH) ? "Detected" : "Clear";
    const char *spdStatus = (irValue == LOW) ? "Detected" : "Clear";

    // Serial Debug (Synced with LCD)
    // Serial Debug (Structured Block)
    Serial.println("\n--- 🌿 EcoSync Sensor Data 🌿 ---");
    Serial.printf("⏱️  Time   : %02lu:%02lu\n", runMin, runSec);
    Serial.printf("🌡️  Temp   : %.1f °C %s\n", t,
                  dhtError ? "⚠️ (READ ERROR)" : "");
    Serial.printf("💧  Hum    : %.1f %% %s\n", h,
                  dhtError ? "⚠️ (READ ERROR)" : "");
    Serial.printf("💨  Gas    : %d (%s)\n", mqValue, gasStatus);
    Serial.printf("🌧️  Rain   : %d (%s)\n", rainValue, rainStatus);
    Serial.printf("🏃  Motion : %s\n", motStatus);
    Serial.printf("🏎️  Rotations: %lu\n", pulseCount);
    Serial.println("--------------------------------");

    // HTTP Post (Only if Connected)
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      JsonDocument doc;
      doc["temperature"] = temp_kalman;
      doc["humidity"] = hum_kalman;
      doc["mq_raw"] = mqValue;
      doc["rain"] = rainValue;
      // CALIBRATED: Active High Motion (Idle=0)
      doc["motion"] = (pirValue == HIGH) ? 1 : 0;
      doc["ir_detected"] = (irValue == LOW);
      doc["pm25"] = pm25_kalman;
      doc["user_email"] = "sreekar092004@gmail.com"; 
      // doc["pressure"] = 1013; // Hardcoded standard sea-level pressure
      String jsonPayload;
      serializeJson(doc, jsonPayload);
      http.POST(jsonPayload);
      http.end();

      // MQTT Publish
      if (client.connected()) {
        client.publish("ecosync/temperature", String(temp_kalman, 2).c_str());
        client.publish("ecosync/humidity", String(hum_kalman, 2).c_str());
        client.publish("ecosync/gas", String(mqValue).c_str());
        client.publish("ecosync/rain", String(rainValue).c_str());
        // CALIBRATED: 1 if HIGH
        client.publish("ecosync/motion", (pirValue == HIGH) ? "1" : "0");
        client.publish("ecosync/ir", String(pulseCount).c_str());
      }
    }
  }

  // 2. Dynamic LCD Logic (Every 2.0s as requested)
  if (millis() - lastPageSwitch > 2000) {
    lastPageSwitch = millis();

    // Soft Reset Removed for stability

    lcd.clear();

    // Identify Counts/Status
    bool gasAlert = (mqValue > GAS_THRESHOLD);
    // CALIBRATED RAIN: 0=Wet, 4095=Dry
    bool rainAlert = (rainValue < 2000);
    // CALIBRATED MOTION: High = Detected
    bool motionDetected = (pirValue == HIGH);
    // Speed is just count now

    // Cycle 4 screens now
    pageIndex = (pageIndex + 1) % 4;

    char line1[17];
    char line2[17];

    if (pageIndex == 0) {
      // Screen 0: Time (Padded to 16)
      snprintf(line1, 17, "Time: %02lu:%02lu     ", runMin, runSec);
      snprintf(line2, 17, "EcoSync Pro     ");
    } else if (pageIndex == 1) {
      // Screen 1: Temp/Hum (Padded to 16)
      // If error, show "Err" instead of space
      char errInd = dhtError ? 'E' : ' ';
      snprintf(line1, 17, "Temp: %.1f%c C   ", temp_kalman, errInd);
      snprintf(line2, 17, "Hum : %.0f %%      ", hum_kalman);
    } else if (pageIndex == 2) {
      // Screen 2: Gas & Rain
      const char *gasStatus = gasAlert ? "Alert" : "Safe ";
      const char *rainStatus = rainAlert ? "Rain " : "Clear";

      snprintf(line1, 17, "Gas : %s %-4d", gasStatus, mqValue);
      // Padded manually if needed, but %-4d helps.
      // Ensure specific length
      snprintf(line2, 17, "Rain : %s %-4d", rainStatus, rainValue);
    } else if (pageIndex == 3) {
      // Screen 3: Motion & Rotations
      const char *motStatus = motionDetected ? "Detected" : "Clear   ";

      snprintf(line1, 17, "Motion: %-8s", motStatus);
      snprintf(line2, 17, "Rotations: %-5lu", pulseCount);
    }

    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    lcd.print(line2);
  }
}