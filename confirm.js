// MQTT Configuration
const MQTT_BROKER = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC_CONFIRM = "filling/confirm";
let client = null;

// DOM Elements
const confirmStatus = document.getElementById("confirmStatus");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const command = urlParams.get("cmd");

  if (!command || !["dingin", "normal", "panas"].includes(command)) {
    if (confirmStatus) {
      confirmStatus.textContent = "Perintah tidak valid.";
    }
    console.error("Invalid command:", command);
    return;
  }

  if (confirmStatus) {
    confirmStatus.textContent = `Mengirim konfirmasi untuk ${command}...`;
  }
  connectToMQTT(command);
});

// Connect to MQTT Broker
function connectToMQTT(command) {
  try {
    const clientId = `confirm-client-${Math.random().toString(16).substr(2, 8)}`;
    client = mqtt.connect(MQTT_BROKER, {
      clientId: clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
      keepalive: 60,
      useSSL: true
    });

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      client.publish(MQTT_TOPIC_CONFIRM, "OK", { qos: 1 }, (err) => {
        if (err) {
          if (confirmStatus) {
            confirmStatus.textContent = "Gagal mengirim konfirmasi.";
          }
          console.error("Publish error:", err);
        } else {
          if (confirmStatus) {
            confirmStatus.textContent = "Konfirmasi OK terkirim!";
          }
          setTimeout(() => {
            window.close(); // Menutup tab setelah konfirmasi
          }, 2000);
        }
      });
    });

    client.on("error", (err) => {
      if (confirmStatus) {
        confirmStatus.textContent = "Gagal terhubung ke MQTT.";
      }
      console.error("Connection error:", err);
    });
  } catch (error) {
    if (confirmStatus) {
      confirmStatus.textContent = "Terjadi kesalahan.";
    }
    console.error("Initialization error:", error);
  }
}
