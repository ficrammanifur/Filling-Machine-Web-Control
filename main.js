// MQTT Configuration
const MQTT_BROKER = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC_SUB = "filling/status";
const MQTT_TOPIC_PUB = "filling/perintah";
let client = null;
let messageCount = 0;

// DOM Elements
const statusElement = document.getElementById("statusText");
const connectionStatus = document.getElementById("connectionStatus");
const machineStatus = document.getElementById("machineStatus");
const messageLog = document.getElementById("messageLog");
const btnDingin = document.getElementById("btnDingin");
const btnNormal = document.getElementById("btnNormal");
const btnPanas = document.getElementById("btnPanas");
const progressContainer = document.getElementById("progressContainer");
const progressBarFill = document.getElementById("progressBarFill");
const progressText = document.getElementById("progressText");

// Check if DOM elements exist
if (!statusElement || !connectionStatus || !machineStatus || !messageLog || !btnDingin || !btnNormal || !btnPanas || !progressContainer || !progressBarFill || !progressText) {
  console.error("DOM elements not found:", { statusElement, connectionStatus, machineStatus, messageLog, btnDingin, btnNormal, btnPanas, progressContainer, progressBarFill, progressText });
}

// Initialize connection and event listeners when page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing MQTT...");
  connectToMQTT();
  addLogMessage("System", "Menginisialisasi koneksi MQTT...");

  // Add event listeners for buttons
  btnDingin.addEventListener("click", () => sendCommand("dingin"));
  btnNormal.addEventListener("click", () => sendCommand("normal"));
  btnPanas.addEventListener("click", () => sendCommand("panas"));
});

// Connect to MQTT Broker
function connectToMQTT() {
  try {
    updateConnectionStatus("connecting");
    addLogMessage("System", "Menghubungkan ke broker MQTT...");

    const clientId = `web-client-${Math.random().toString(16).substr(2, 8)}`;

    client = mqtt.connect(MQTT_BROKER, {
      clientId: clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
      keepalive: 60,
      useSSL: true
    });

    client.on("connect", () => {
      console.log("Connected to MQTT broker at:", new Date().toLocaleTimeString());
      updateConnectionStatus("connected");
      addLogMessage("MQTT", "Terhubung berhasil!");

      client.subscribe(MQTT_TOPIC_SUB, { qos: 1 }, (err) => {
        if (!err) {
          console.log(`Subscribed to ${MQTT_TOPIC_SUB}`);
          addLogMessage("MQTT", `Berlangganan ke topic: ${MQTT_TOPIC_SUB}`);
        } else {
          console.error("Subscription error:", err);
          addLogMessage("Error", `Gagal berlangganan: ${err.message}`);
        }
      });
    });

    client.on("error", (err) => {
      console.error("Connection error details:", err);
      updateConnectionStatus("error");
      addLogMessage("Error", `Koneksi gagal: ${err.message}`);
    });

    client.on("reconnect", () => {
      console.log("Reconnecting...");
      updateConnectionStatus("connecting");
      addLogMessage("MQTT", "Mencoba menyambung kembali...");
    });

    client.on("offline", () => {
      console.log("Client offline");
      updateConnectionStatus("error");
      addLogMessage("MQTT", "Koneksi terputus - klien offline");
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();
      console.log("Received message:", payload, "on topic:", topic);
      messageCount++;
      addLogMessage("Diterima", `${payload} (dari ESP32)`);
      updateMachineStatus(payload);
    });
  } catch (error) {
    console.error("Failed to connect:", error);
    updateConnectionStatus("error");
    addLogMessage("Error", `Gagal menginisialisasi: ${error.message}`);
  }
}

// Send command to ESP32
function sendCommand(command) {
  if (client && client.connected) {
    try {
      client.publish(MQTT_TOPIC_PUB, command, { qos: 1 }, (err) => {
        if (err) {
          console.error("Publish error:", err);
          addLogMessage("Error", `Gagal mengirim ${command}: ${err.message}`);
        } else {
          console.log("Published:", command);
          addLogMessage("Terkirim", `Perintah ${command} ke ESP32`);
        }
      });

      const button = command === "dingin" ? btnDingin : command === "normal" ? btnNormal : btnPanas;
      button.style.transform = "scale(0.95)";
      setTimeout(() => {
        button.style.transform = "";
      }, 150);
    } catch (error) {
      console.error("Failed to send command:", error);
      addLogMessage("Error", `Gagal mengirim ${command}: ${error.message}`);
    }
  } else {
    addLogMessage("Error", "Tidak terhubung ke broker MQTT");
    alert("Harap tunggu koneksi terjalin sebelum mengirim perintah.");
  }
}

// Update connection status display
function updateConnectionStatus(status) {
  if (!connectionStatus || !statusElement) {
    console.error("Cannot update connection status: elements missing");
    return;
  }
  connectionStatus.className = `connection-status ${status}`;
  switch (status) {
    case "connected":
      statusElement.textContent = "Terhubung";
      connectionStatus.innerHTML = '<i class="fas fa-wifi"></i><span>Terhubung</span>';
      btnDingin.disabled = false;
      btnNormal.disabled = false;
      btnPanas.disabled = false;
      break;
    case "connecting":
      statusElement.textContent = "Menghubungkan...";
      connectionStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Menghubungkan...</span>';
      btnDingin.disabled = true;
      btnNormal.disabled = true;
      btnPanas.disabled = true;
      break;
    case "error":
      statusElement.textContent = "Error Koneksi";
      connectionStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Error</span>';
      btnDingin.disabled = true;
      btnNormal.disabled = true;
      btnPanas.disabled = true;
      break;
    default:
      statusElement.textContent = "Tidak Terhubung";
      connectionStatus.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Tidak Terhubung</span>';
      btnDingin.disabled = true;
      btnNormal.disabled = true;
      btnPanas.disabled = true;
  }
}

// Update machine status and progress bar
function updateMachineStatus(status) {
  if (!machineStatus || !progressContainer || !progressBarFill || !progressText) {
    console.error("machineStatus or progress elements not found");
    return;
  }
  const indicator = machineStatus.querySelector(".status-indicator");
  const statusText = machineStatus.querySelector("span");

  if (status === "ready") {
    indicator.className = "status-indicator ready";
    statusText.textContent = "Status: Siap";
    machineStatus.style.background = "rgba(59, 130, 246, 0.1)";
    machineStatus.style.border = "1px solid #3b82f6";
    progressContainer.style.display = "none";
    progressBarFill.style.width = "0%";
    progressText.textContent = "0%";
  } else if (status === "motor_started") {
    indicator.className = "status-indicator progress";
    statusText.textContent = "Status: Motor Berjalan";
    machineStatus.style.background = "rgba(251, 191, 36, 0.1)";
    machineStatus.style.border = "1px solid #fbbf24";
    progressContainer.style.display = "none";
    progressBarFill.style.width = "0%";
    progressText.textContent = "0%";
  } else if (status === "filling_started") {
    indicator.className = "status-indicator progress";
    statusText.textContent = "Status: Sedang Mengisi";
    machineStatus.style.background = "rgba(251, 191, 36, 0.1)";
    machineStatus.style.border = "1px solid #fbbf24";
    progressContainer.style.display = "block";
    progressBarFill.style.width = "0%";
    progressText.textContent = "0%";
  } else if (status.startsWith("progress:")) {
    const percentage = parseFloat(status.split(":")[1]);
    indicator.className = "status-indicator progress";
    statusText.textContent = `Status: Mengisi (${percentage.toFixed(1)}%)`;
    machineStatus.style.background = "rgba(251, 191, 36, 0.1)";
    machineStatus.style.border = "1px solid #fbbf24";
    progressContainer.style.display = "block";
    progressBarFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage.toFixed(1)}%`;
  } else if (status === "filling_completed") {
    indicator.className = "status-indicator done";
    statusText.textContent = "Status: Pengisian Selesai";
    machineStatus.style.background = "rgba(74, 222, 128, 0.1)";
    machineStatus.style.border = "1px solid #4ade80";
    progressContainer.style.display = "block";
    progressBarFill.style.width = "100%";
    progressText.textContent = "100%";
  } else if (status === "process_completed") {
    indicator.className = "status-indicator done";
    statusText.textContent = "Status: Proses Selesai";
    machineStatus.style.background = "rgba(74, 222, 128, 0.1)";
    machineStatus.style.border = "1px solid #4ade80";
    setTimeout(() => {
      indicator.className = "status-indicator ready";
      statusText.textContent = "Status: Siap";
      machineStatus.style.background = "rgba(59, 130, 246, 0.1)";
      machineStatus.style.border = "1px solid #3b82f6";
      progressContainer.style.display = "none";
      progressBarFill.style.width = "0%";
      progressText.textContent = "0%";
    }, 3000);
  } else if (status.startsWith("mode_set:")) {
    const mode = status.split(":")[1];
    indicator.className = "status-indicator ready";
    statusText.textContent = `Status: Mode ${mode} Dipilih`;
    machineStatus.style.background = "rgba(59, 130, 246, 0.1)";
    machineStatus.style.border = "1px solid #3b82f6";
    progressContainer.style.display = "none";
    progressBarFill.style.width = "0%";
    progressText.textContent = "0%";
  } else if (status === "error:process_active") {
    indicator.className = "status-indicator error";
    statusText.textContent = "Status: Proses Sedang Berjalan";
    machineStatus.style.background = "rgba(239, 68, 68, 0.1)";
    machineStatus.style.border = "1px solid #ef4444";
    progressContainer.style.display = "none";
    progressBarFill.style.width = "0%";
    progressText.textContent = "0%";
  } else if (status === "error:unknown_command") {
    indicator.className = "status-indicator error";
    statusText.textContent = "Status: Perintah Tidak Dikenal";
    machineStatus.style.background = "rgba(239, 68, 68, 0.1)";
    machineStatus.style.border = "1px solid #ef4444";
    progressContainer.style.display = "none";
    progressBarFill.style.width = "0%";
    progressText.textContent = "0%";
  } else {
    indicator.className = "status-indicator ready";
    statusText.textContent = "Status: Siap";
    machineStatus.style.background = "rgba(59, 130, 246, 0.1)";
    machineStatus.style.border = "1px solid #3b82f6";
    progressContainer.style.display = "none";
    progressBarFill.style.width = "0%";
    progressText.textContent = "0%";
  }
}

// Add message to log
function addLogMessage(type, message) {
  if (!messageLog) {
    console.error("messageLog element not found");
    return;
  }
  const timestamp = new Date().toLocaleTimeString();
  const logItem = document.createElement("div");
  logItem.className = "log-item";
  logItem.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="message">[${type}] ${message}</span>
  `;
  messageLog.appendChild(logItem);
  while (messageLog.children.length > 50) {
    messageLog.removeChild(messageLog.firstChild);
  }
  messageLog.scrollTop = messageLog.scrollHeight;
}

// Retry connection function
function retryConnection() {
  if (client) {
    client.end();
  }
  setTimeout(() => {
    connectToMQTT();
  }, 1000);
}

// Auto-retry on connection failure
setInterval(() => {
  if (!client || !client.connected) {
    console.log("Auto-retry connection...");
    retryConnection();
  }
}, 10000);

// Add visual effects
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.style.scrollBehavior = "smooth";
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("Page hidden - maintaining connection");
  } else {
    console.log("Page visible - checking connection");
    if (!client || !client.connected) {
      addLogMessage("System", "Halaman kembali - menyambung kembali...");
      retryConnection();
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case "1":
        event.preventDefault();
        sendCommand("dingin");
        break;
      case "2":
        event.preventDefault();
        sendCommand("normal");
        break;
      case "3":
        event.preventDefault();
        sendCommand("panas");
        break;
    }
  }
});

btnDingin.title = "Klik untuk isi air dingin (Ctrl+1)";
btnNormal.title = "Klik untuk isi air normal (Ctrl+2)";
btnPanas.title = "Klik untuk isi air panas (Ctrl+3)";
