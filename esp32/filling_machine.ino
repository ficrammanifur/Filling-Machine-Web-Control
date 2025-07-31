#include <WiFi.h>
#include <PubSubClient.h>

// WiFi configuration
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT configuration
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;
const char* clientId = "esp32_filling_relay";
const char* topic_sub = "filling/perintah";
const char* topic_pub = "filling/status";

// Relay pins
const int relayDingin = 5;
const int relayNormal = 18;
const int relayPanas = 19;

// Timeout untuk koneksi WiFi (dalam milidetik)
const unsigned long wifiTimeout = 10000; // 10 detik

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);

  // Setup relay pins
  pinMode(relayDingin, OUTPUT);
  pinMode(relayNormal, OUTPUT);
  pinMode(relayPanas, OUTPUT);

  // Pastikan semua relay mati di awal
  digitalWrite(relayDingin, LOW);
  digitalWrite(relayNormal, LOW);
  digitalWrite(relayPanas, LOW);

  // Koneksi WiFi
  Serial.println("Connecting to WiFi...");
  if (wifiConnect()) {
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Failed to connect to WiFi. Restarting...");
    ESP.restart();
  }

  // Setup MQTT
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);
}

bool wifiConnect() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < wifiTimeout) {
    delay(500);
    Serial.print(".");
  }
  return WiFi.status() == WL_CONNECTED;
}

void mqttReconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection with client ID: ");
    Serial.println(clientId);
    if (client.connect(clientId)) {
      Serial.println("connected");
      client.subscribe(topic_sub);
      Serial.print("Subscribed to: ");
      Serial.println(topic_sub);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void processRelay(String mode) {
  Serial.print("Processing mode: ");
  Serial.println(mode);

  // Matikan semua relay
  digitalWrite(relayDingin, LOW);
  digitalWrite(relayNormal, LOW);
  digitalWrite(relayPanas, LOW);
  Serial.println("All relays turned OFF");

  // Nyalakan relay sesuai mode
  if (mode == "dingin") {
    digitalWrite(relayDingin, HIGH);
    Serial.println("Relay Dingin ON");
  } else if (mode == "normal") {
    digitalWrite(relayNormal, HIGH);
    Serial.println("Relay Normal ON");
  } else if (mode == "panas") {
    digitalWrite(relayPanas, HIGH);
    Serial.println("Relay Panas ON");
  }

  // Simulasi proses pengisian (2 detik)
  delay(2000);

  // Matikan semua relay
  digitalWrite(relayDingin, LOW);
  digitalWrite(relayNormal, LOW);
  digitalWrite(relayPanas, LOW);
  Serial.println("All relays turned OFF after process");

  // Publish status selesai
  client.publish(topic_pub, "done");
  Serial.println("Status 'done' published to MQTT");
}

void callback(char* topic, byte* payload, unsigned int length) {
  // Batasi panjang pesan untuk keamanan
  if (length > 50) {
    Serial.println("Received message too long, ignoring!");
    return;
  }

  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  message.trim(); // Hapus spasi atau karakter tak diinginkan

  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  if (message == "dingin" || message == "normal" || message == "panas") {
    processRelay(message);
  } else {
    Serial.println("Unknown command received!");
    client.publish(topic_pub, "error: unknown command");
  }
}

void loop() {
  // Periksa koneksi WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, attempting to reconnect...");
    if (!wifiConnect()) {
      Serial.println("WiFi reconnection failed, restarting...");
      ESP.restart();
    }
  }

  // Periksa koneksi MQTT
  if (!client.connected()) {
    mqttReconnect();
  }
  client.loop();
  delay(100);
}
