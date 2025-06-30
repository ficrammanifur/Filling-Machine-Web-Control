// MQTT Configuration
const MQTT_BROKER = "wss://broker.hivemq.com:8884/mqtt";
const MQTT_TOPIC_SUB = "filling/status";
const MQTT_TOPIC_PUB = "filling/perintah";
const MQTT_TOPIC_CONFIRM = "filling/confirm";
let client = null;
let messageCount = 0;
let selectedCommand = null;

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
const barcodeModal = document.getElementById("barcodeModal");
const scanStatus = document.getElementById("scanStatus");
const btnCancel = document.getElementById("btnCancel");
const modalClose = document.getElementById("modalClose");
const qrcodeDiv = document.getElementById("qrcode");

// Check DOM elements
if (!statusElement || !connectionStatus || !machineStatus || !messageLog || !btnDingin || !btnNormal || !btnPanas || !progressContainer || !progressBarFill || !progressText || !barcodeModal || !scanStatus || !btnCancel || !modalClose || !qrcodeDiv) {
  console.error("DOM elements not found");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing MQTT...");
  connectToMQTT();
  addLogMessage("System", "Menginisialisasi koneksi MQTT...");

  btnDingin.addEventListener("click", () => showQRCodeModal("dingin"));
  btnNormal.addEventListener("click", () => showQRCodeModal("normal"));
  btnPanas.addEventListener("click", () => showQRCodeModal("panas"));
  btnCancel.addEventListener("click", closeQRCodeModal);
  modalClose.addEventListener("click", closeQRCodeModal);
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
      console.log("Connected to MQTT broker");
      updateConnectionStatus("connected");
      addLogMessage("MQTT", "Terhubung berhasil!");
      client.subscribe(MQTT_TOPIC_SUB, { qos: 1 }, (err) => {
        if (!err) {
          addLogMessage("MQTT", `Berlangganan ke ${MQTT_TOPIC_SUB}`);
        } else {
          addLogMessage("Error", `Gagal berlangganan: ${err.message}`);
        }
      });
    });

    client.on("error", (err) => {
      updateConnectionStatus("error");
      addLogMessage("Error", `Koneksi gagal: ${err.message}`);
    });

    client.on("reconnect", () => {
      updateConnectionStatus("connecting");
      addLogMessage("MQTT", "Mencoba menyambung kembali...");
    });

    client.on("offline", () => {
      updateConnectionStatus("error");
      addLogMessage("MQTT", "Koneksi terputus");
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();
      messageCount++;
      addLogMessage("Diterima", `${payload} (dari ESP32)`);
      updateMachineStatus(payload);
    });
  } catch (error) {
    updateConnectionStatus("error");
    addLogMessage("Error", `Gagal menginisialisasi: ${error.message}`);
  }
}

// Show QR code modal
function showQRCodeModal(command) {
  selectedCommand = command;
  scanStatus.textContent = "Silakan scan QR code dengan ponsel Anda";
  barcodeModal.style.display = "flex";
  
  // Generate QR code
  qrcodeDiv.innerHTML = ""; // Clear previous QR code
  const qr = new QRCode(qrcodeDiv, {
    text: `https://yourdomain.com/confirm?cmd=${command}`,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff"
  });

  // Send command to ESP32
  if (client && client.connected) {
    client.publish(MQTT_TOPIC_PUB, command, { qos: 1 }, (err) => {
      if (err) {
        addLogMessage("Error", `Gagal mengirim ${command}: ${err.message}`);
        alert("Gagal mengirim perintah.");
      } else {
        addLogMessage("Terkirim", `Perintah ${command} ke ESP32`);
      }
    });
  } else {
    addLogMessage("Error", "Tidak terhubung ke MQTT");
    alert("Harap tunggu koneksi terjalin.");
  }

  // Timeout after 30 seconds
  setTimeout(() => {
    if (barcodeModal.style.display === "flex") {
      addLogMessage("Error", "Timeout: QR code tidak discan dalam 30 detik");
      closeQRCodeModal();
    }
  }, 30000);
}

// Close QR code modal
function closeQRCodeModal() {
  barcodeModal.style.display = "none";
  scanStatus.textContent = "Silakan scan QR code dengan ponsel Anda";
  qrcodeDiv.innerHTML = "";
  selectedCommand = null;
}

// Update connection status
function updateConnectionStatus(status) {
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
  }
}

// Update machine status (sama seperti versi awal)
function updateMachineStatus(status) {
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
  } else if (status === "error:process_active") {
    indicator.className = "status-indicator error";
    statusText.textContent = "Status: Proses Sedang Berjalan";
    machineStatus.style.background = "rgba(239, 68, 68, 0.1)";
    machineStatus.style.border = "1px solid #ef4444";
    progressContainer.style.display = "none";
  } else if (status === "error:unknown_command") {
    indicator.className = "status-indicator error";
    statusText.textContent = "Status: Perintah Tidak Dikenal";
    machineStatus.style.background = "rgba(239, 68, 68, 0.1)";
    machineStatus.style.border = "1px solid #ef4444";
    progressContainer.style.display = "none";
  } else if (status === "waiting_for_ok") {
    indicator.className = "status-indicator progress";
    statusText.textContent = "Status: Menunggu Konfirmasi OK";
    machineStatus.style.background = "rgba(251, 191, 36, 0.1)";
    machineStatus.style.border = "1px solid #fbbf24";
    progressContainer.style.display = "none";
  }
}

// Add message to log
function addLogMessage(type, message) {
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

// Retry connection
function retryConnection() {
  if (client) {
    client.end();
  }
  setTimeout(connectToMQTT, 1000);
}

// Auto-retry
setInterval(() => {
  if (!client || !client.connected) {
    retryConnection();
  }
}, 10000);
