#include <WiFi.h>
#include <PubSubClient.h>
#include <NewPing.h>

// WiFi Credentials
const char* ssid = "Modal ";
const char* password = "mauan lu";

// MQTT Configuration
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_client_id = "esp32_filling_relay";
const char* mqtt_topic_sub = "filling/perintah";
const char* mqtt_topic_status = "filling/status";
const char* mqtt_topic_confirm = "filling/confirm";

// Pin Definitions
#define TRIG_KANAN   14
#define ECHO_KANAN   27
#define TRIG_TENGAH  26
#define ECHO_TENGAH  25
#define TRIG_KIRI    33
#define ECHO_KIRI    32
#define RELAY_COOL   21
#define RELAY_NORMAL 19
#define RELAY_HOT    18
#define RELAY_MOTOR  12
#define RELAY_POMPA  13
#define FLOW_METER_PIN 5

// Ultrasonic Sensor Configuration
#define MAX_DISTANCE 50
#define DETEKSI_JARAK 10
NewPing sonarKiri(TRIG_KIRI, ECHO_KIRI, MAX_DISTANCE);
NewPing sonarTengah(TRIG_TENGAH, ECHO_TENGAH, MAX_DISTANCE);
NewPing sonarKanan(TRIG_KANAN, ECHO_KANAN, MAX_DISTANCE);

// Flow Meter Configuration
#define TARGET_PULSE 900000 // Adjusted for 365ml
volatile int flowPulseCount = 0;

// System State
String currentMode = "";
bool isFilling = false;
bool fillingCompleted = false;
String queuedCommand = "";
bool waitingForConfirm = false;

// WiFi and MQTT Clients
WiFiClient espClient;
PubSubClient client(espClient);

// Function to read stable distance from ultrasonic sensor
float readStableDistance(NewPing &sonar, const char* sensorName, int samples = 3) {
  float sum = 0;
  int validReadings = 0;
  for (int i = 0; i < samples; i++) {
    float distance = sonar.ping_cm();
    if (distance > 0) {
      sum += distance;
      validReadings++;
    }
    delay(10);
  }
  float result = validReadings > 0 ? sum / validReadings : 0;
  Serial.print("Stable distance for "); Serial.print(sensorName); 
  Serial.print(": "); Serial.print(result); Serial.println(" cm");
  return result;
}

// Flow Meter Interrupt
void IRAM_ATTR flowMeterISR() {
  flowPulseCount++;
}

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_COOL, OUTPUT);
  pinMode(RELAY_NORMAL, OUTPUT);
  pinMode(RELAY_HOT, OUTPUT);
  pinMode(RELAY_MOTOR, OUTPUT);
  pinMode(RELAY_POMPA, OUTPUT);
  pinMode(FLOW_METER_PIN, INPUT_PULLUP);

  stopAll();
  attachInterrupt(digitalPinToInterrupt(FLOW_METER_PIN), flowMeterISR, FALLING);

  wifiConnect();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) mqttReconnect();
  client.loop();

  if (!isFilling && !fillingCompleted && currentMode != "") {
    float jarakKanan = readStableDistance(sonarKanan, "Kanan");
    if (jarakKanan > 0 && jarakKanan < DETEKSI_JARAK) {
      Serial.println("Glass detected at right, starting motor...");
      client.publish(mqtt_topic_status, "motor_started");
      digitalWrite(RELAY_MOTOR, LOW);
      isFilling = true;
    }
  } 
  else if (isFilling) {
    float jarakTengah = readStableDistance(sonarTengah, "Tengah");
    if (jarakTengah > 0 && jarakTengah < DETEKSI_JARAK) {
      digitalWrite(RELAY_MOTOR, HIGH); // Stop motor
      Serial.println("Glass at middle, starting pump...");
      client.publish(mqtt_topic_status, "filling_waiting_for_flow");
      digitalWrite(RELAY_POMPA, LOW); // Start pump

      unsigned long startWait = millis();
      unsigned long maxWait = 3000;
      int startPulse = flowPulseCount;

      while (flowPulseCount == startPulse && millis() - startWait < maxWait) {
        delay(50);
        client.loop();
      }

      if (flowPulseCount == startPulse) {
        Serial.println("ERROR: Flow meter not detecting flow.");
        stopAll();
        client.publish(mqtt_topic_status, "error:no_flow_detected");
        isFilling = false;
        currentMode = "";
        return;
      }

      Serial.println("Filling started");
      client.publish(mqtt_topic_status, "filling_started");
      flowPulseCount = 0;

      // Filling loop
      while (flowPulseCount < TARGET_PULSE && jarakTengah > 0 && jarakTengah < DETEKSI_JARAK) {
        float progress = (float)flowPulseCount / TARGET_PULSE * 100;
        String progressMsg = "progress:" + String(progress, 1);
        client.publish(mqtt_topic_status, progressMsg.c_str());
        Serial.print("Progress: "); Serial.print(progress); Serial.println("%");
        Serial.print("jarakTengah: "); Serial.print(jarakTengah); Serial.println(" cm");

        if (flowPulseCount >= TARGET_PULSE * 0.9 && flowPulseCount < TARGET_PULSE) {
          digitalWrite(RELAY_POMPA, HIGH); delay(300);
          digitalWrite(RELAY_POMPA, LOW);
        }

        delay(100);
        client.loop();
        jarakTengah = readStableDistance(sonarTengah, "Tengah");
      }

      digitalWrite(RELAY_POMPA, HIGH); // Stop pump
      delay(500);

      if (flowPulseCount >= TARGET_PULSE) {
        Serial.println("Filling completed");
        client.publish(mqtt_topic_status, "filling_completed");
        digitalWrite(RELAY_MOTOR, LOW); // Move glass to left
        delay(1000); // beri waktu motor jalan
        isFilling = false;
        fillingCompleted = true;
      } else {
        Serial.println("ERROR: Glass moved during filling.");
        client.publish(mqtt_topic_status, "error:glass_moved");
        stopAll();
        isFilling = false;
        currentMode = "";
        return;
      }
    }
  }
  else if (fillingCompleted) {
    float jarakKiri = readStableDistance(sonarKiri, "Kiri");
    if (jarakKiri > 0 && jarakKiri < DETEKSI_JARAK) {
      stopAll();
      Serial.println("Process completed");
      client.publish(mqtt_topic_status, "process_completed");
      fillingCompleted = false;
      currentMode = "";
    }
  }

  delay(100);
}

void stopAll() {
  digitalWrite(RELAY_MOTOR, HIGH);
  digitalWrite(RELAY_POMPA, HIGH);
  digitalWrite(RELAY_COOL, HIGH);
  digitalWrite(RELAY_NORMAL, HIGH);
  digitalWrite(RELAY_HOT, HIGH);
}

void wifiConnect() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void mqttReconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect(mqtt_client_id)) {
      Serial.println("connected");
      client.subscribe(mqtt_topic_sub);
      client.subscribe(mqtt_topic_confirm);
      client.publish(mqtt_topic_status, "ready");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  Serial.print("Message arrived ["); Serial.print(topic); Serial.print("] "); Serial.println(message);

  if (String(topic) == mqtt_topic_sub) {
    if (isFilling || fillingCompleted) {
      client.publish(mqtt_topic_status, "error:process_active");
      return;
    }
    if (message == "dingin" || message == "normal" || message == "panas") {
      queuedCommand = message;
      waitingForConfirm = true;
      client.publish(mqtt_topic_status, "waiting_for_ok");
    } else {
      client.publish(mqtt_topic_status, "error:unknown_command");
    }
  } else if (String(topic) == mqtt_topic_confirm && message == "OK" && waitingForConfirm) {
    currentMode = queuedCommand;
    waitingForConfirm = false;
    String modeSetMsg = "mode_set:" + currentMode;
    client.publish(mqtt_topic_status, modeSetMsg.c_str());

    digitalWrite(RELAY_COOL, currentMode == "dingin" ? LOW : HIGH);
    digitalWrite(RELAY_NORMAL, currentMode == "normal" ? LOW : HIGH);
    digitalWrite(RELAY_HOT, currentMode == "panas" ? LOW : HIGH);
  }
}
