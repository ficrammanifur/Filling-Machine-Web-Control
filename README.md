# Filling Machine Web Control System

A complete IoT solution for controlling an automatic filling machine with web interface, ESP32 microcontroller, and MQTT communication.

## 🚀 Features

- **Web Interface**: Modern, responsive web UI with dark mode support
- **Temperature Control**: Select between cold, hot, and normal water temperature
- **Barcode Authorization**: Scan barcode for operation authorization
- **Real-time Monitoring**: Live progress tracking and status updates
- **MQTT Communication**: Reliable communication between web and ESP32
- **Sensor Integration**: 3 ultrasonic sensors for precise glass positioning
- **Safety Features**: Emergency stop and error handling

## 📋 System Requirements

### Hardware
- ESP32 development board
- 3x Ultrasonic sensors (HC-SR04 or similar)
- 3x Relay modules (for temperature control)
- DC motor for glass positioning
- Water pump
- Power supply (12V recommended)
- Jumper wires and breadboard/PCB

### Software
- Arduino IDE with ESP32 board support
- Modern web browser with camera access
- MQTT broker (EMQX, Mosquitto, or cloud service)

## 🛠 Installation

### 1. Hardware Setup

#### ESP32 Pin Connections:
\`\`\`
Ultrasonic Sensors:
- Sensor 1: Trigger Pin 2, Echo Pin 3
- Sensor 2: Trigger Pin 4, Echo Pin 5  
- Sensor 3: Trigger Pin 6, Echo Pin 7

Motor & Pump:
- DC Motor: Pin 8
- Water Pump: Pin 9

Temperature Relays:
- Cold Water: Pin 10
- Hot Water: Pin 11
- Normal Water: Pin 12
\`\`\`

#### Power Connections:
- ESP32: 5V/3.3V from USB or external supply
- Sensors: 5V VCC, GND
- Relays: 5V VCC, GND
- Motor/Pump: 12V through relay contacts

### 2. Arduino IDE Setup

1. Install ESP32 board support:
   - File → Preferences
   - Add to Additional Board Manager URLs: 
     \`https://dl.espressif.com/dl/package_esp32_index.json\`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

2. Install required libraries:
   \`\`\`
   Tools → Manage Libraries → Install:
   - PubSubClient by Nick O'Leary
   - NewPing by Tim Eckel
   - ArduinoJson by Benoit Blanchon
   \`\`\`

3. Configure the code:
   - Open \`filling-machine.ino\`
   - Update WiFi credentials:
     \`\`\`cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     \`\`\`
   - Update MQTT broker settings if needed

4. Upload to ESP32:
   - Select board: "ESP32 Dev Module"
   - Select correct COM port
   - Click Upload

### 3. Web Interface Setup

1. **Local Development**:
   \`\`\`bash
   # Clone or download the project files
   # Serve files using any local server
   
   # Using Python:
   python -m http.server 8000
   
   # Using Node.js:
   npx serve .
   
   # Using PHP:
   php -S localhost:8000
   \`\`\`

2. **Access the interface**:
   - Open browser to \`http://localhost:8000\`
   - Allow camera permissions for barcode scanning

### 4. MQTT Broker Setup

#### Option 1: Public Broker (Testing)
- Default: \`broker.emqx.io:8083\` (WebSocket)
- No configuration needed for testing

#### Option 2: Local Broker (Production)
1. Install Mosquitto:
   \`\`\`bash
   # Ubuntu/Debian:
   sudo apt install mosquitto mosquitto-clients
   
   # Windows: Download from mosquitto.org
   # macOS: brew install mosquitto
   \`\`\`

2. Enable WebSocket support:
   \`\`\`bash
   # Edit /etc/mosquitto/mosquitto.conf
   listener 1883
   listener 8083
   protocol websockets
   allow_anonymous true
   \`\`\`

3. Start broker:
   \`\`\`bash
   sudo systemctl start mosquitto
   # or
   mosquitto -c /etc/mosquitto/mosquitto.conf
   \`\`\`

## 🎯 Usage

### 1. System Startup
1. Power on ESP32 - wait for WiFi connection
2. Open web interface in browser
3. Connect to MQTT broker using the settings panel

### 2. Operating the Machine
1. **Select Temperature**: Choose cold, hot, or normal water
2. **Scan Barcode**: Click "Start Scanner" and scan authorization code
3. **Start Filling**: Click "Start Filling" button
4. **Monitor Progress**: Watch real-time status and progress bar

### 3. Process Flow
1. System waits for glass at sensor 1
2. Motor moves glass to filling position (sensor 2)
3. Pump fills glass for specified time
4. Motor moves glass to final position (sensor 3)
5. Process completes, system returns to idle

## 🔧 Configuration

### Sensor Calibration
Adjust thresholds in ESP32 code:
\`\`\`cpp
#define GLASS_THRESHOLD 10  // Distance in cm for glass detection
#define FILLING_TIME 5000   // Filling duration in milliseconds
\`\`\`

### MQTT Topics
- \`filling/mode\` - Send filling commands
- \`filling/status\` - Receive status updates  
- \`filling/stop\` - Emergency stop command

### Web Interface Settings
- MQTT broker and port configurable in UI
- Theme preference saved in localStorage
- Responsive design for mobile devices

## 🐛 Troubleshooting

### Common Issues

**ESP32 not connecting to WiFi:**
- Check SSID and password
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check signal strength

**MQTT connection failed:**
- Verify broker address and port
- Check firewall settings
- Try public broker for testing

**Sensors not working:**
- Check wiring connections
- Verify power supply (5V for sensors)
- Test individual sensors with simple code

**Camera not working:**
- Allow camera permissions in browser
- Use HTTPS for production (required for camera access)
- Try different browsers

**Motor/Pump not responding:**
- Check relay wiring and power
- Verify relay control voltage (5V signal)
- Test relays manually

### Debug Mode
Enable serial monitoring in Arduino IDE (115200 baud) to see:
- WiFi connection status
- MQTT messages
- Sensor readings
- State machine transitions

## 📡 API Reference

### MQTT Message Formats

#### Filling Command (\`filling/mode\`):
\`\`\`json
{
  "mode": "cold|hot|normal",
  "barcode": "scanned_barcode_value",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
\`\`\`

#### Status Updates (\`filling/status\`):
\`\`\`json
{
  "status": "idle|waiting_glass|sensor1|sensor2|filling|sensor3|done|nogelas",
  "step": "Human readable status description",
  "progress": 0-100,
  "timestamp": 1234567890
}
\`\`\`

## 🔒 Security Considerations

- Use secure MQTT broker with authentication in production
- Implement proper barcode validation
- Add user authentication for web interface
- Use HTTPS for web interface
- Regularly update ESP32 firmware

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test thoroughly
4. Submit pull request with detailed description

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For issues and questions:
- Check troubleshooting section
- Review Arduino IDE serial monitor output
- Test individual components separately
- Verify all connections and power supplies

---

**Happy Filling! 🚰**
\`\`\`
