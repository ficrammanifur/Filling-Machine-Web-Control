#define FLOW_SENSOR 14

volatile unsigned long pulseCount = 0;

void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  pinMode(FLOW_SENSOR, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR),
                  pulseCounter,
                  FALLING);
}

void loop() {

  static unsigned long lastTime = 0;

  if (millis() - lastTime >= 1000) {

    noInterrupts();
    unsigned long pulse = pulseCount;
    pulseCount = 0;          // <-- reset setiap 1 detik
    interrupts();

    Serial.print("Pulse/1s = ");
    Serial.println(pulse);

    lastTime = millis();
  }
}
