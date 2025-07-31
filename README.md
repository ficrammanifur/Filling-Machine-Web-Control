<h1 align="center">🚰 FILLING MACHINE WEB CONTROL</h1> <p align="center"><em>Secure, Interactive, and Smart Water Filling System with ESP32 & MQTT</em></p> 
<p align="center"> 
  <img src="https://img.shields.io/badge/last%20commit-today-brightgreen" /> 
  <img src="https://img.shields.io/badge/html%2Fjs%2Fcss-100%25-blue" /> 
  <img src="https://img.shields.io/badge/languages-3-informational" /> 
</p> 
<p align="center"> <em>Built with the tools and technologies:</em></p>
<p align="center"> <a href="https://github.com/ficrammanifur/ficrammanifur/blob/main/LICENSE"> 
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT" /> </a> 
</p>


---

## 📑 Table of Contents
- [✨ Overview](#-overview)
- [🔧 Features](#-features)
- [📁 Project Structure](#-project-structure)
- [⚙️ Installation](#️-installation)
- [🚀 Usage](#-usage)
- [🧪 Testing](#-testing)
- [📦 Dependencies](#-dependencies)
- [📝 Notes](#-notes)
- [📄 License](#-license)

---

## ✨ Overview
A modern web interface to control a water filling machine powered by ESP32 and MQTT.  
Select a mode (cold, normal, hot) on the dashboard → a QR code appears → visitor scans with a phone → phone sends “OK” via MQTT → machine starts filling.

**Key idea:** commands are only executed after visitor confirmation, adding a secure, interactive layer.

---

## 🔧 Features
✅ **User-friendly Dashboard** – Monitor status & choose modes easily  
🔒 **QR Code Confirmation** – Scan to securely trigger filling  
📊 **Real-time Updates** – See progress and status changes instantly  
📱 **Responsive Design** – Optimized for desktop & mobile  
🛡️ **Robust Handling** – Auto-reconnect & DOM safety checks

---

## 📁 Project Structure
```text
Filling-Machine-Web-Control/
├── index.html        # Main dashboard page
├── confirm.html      # Mobile confirmation page
├── main.js           # Dashboard logic
├── confirm.js        # Confirmation logic
├── style.css         # Styles
├── dingin.gif        # QR code: cold
├── normal.gif        # QR code: normal
├── panas.gif         # QR code: hot
└── README.md
```
---

## ⚙️ Installation

### 🔍 Clone Repository
```bash
git clone https://github.com/ficrammanifur/Filling-Machine-Web-Control.git
cd Filling-Machine-Web-Control
```

🛠️ Generate QR Codes
Use TEC-IT Barcode Generator or qrencode CLI:

⚠️ Save the GIFs in the project root.
```bash
qrencode -o dingin.gif "https://ficrammanifur.github.io/Filling-Machine-Web-Control/confirm.html?cmd=dingin"
qrencode -o normal.gif "https://ficrammanifur.github.io/Filling-Machine-Web-Control/confirm.html?cmd=normal"
qrencode -o panas.gif "https://ficrammanifur.github.io/Filling-Machine-Web-Control/confirm.html?cmd=panas"
```

🌐 Host the Project
Option 1: GitHub Pages
```bash
git add .
git commit -m "Initial setup"
git push origin main
```
Enable GitHub Pages → main branch → root.
```Access dashboard at:
➡️ https://ficrammanifur.github.io/Filling-Machine-Web-Control
```

Option 2: Local server (e.g., http-server)
```bash
npm install -g http-server
http-server .
```
```Access at:
➡️ http://localhost:8080
```

---

🤖 Configure ESP32
Upload Arduino sketch connecting to MQTT broker (wss://broker.hivemq.com:8884/mqtt)
ESP32 subscribes: filling/perintah, filling/confirm
ESP32 publishes: filling/status

---

🚀 Usage
1️⃣ Open dashboard:
Access index.html via browser, GitHub Pages, or local server.

2️⃣ Choose mode:
Click "Dingin", "Normal", or "Panas" → QR code appears.

3️⃣ Scan QR code:
Use phone to open confirm.html?cmd=... → page sends "OK" via MQTT.

4️⃣ Machine fills:
See status updates: filling_started, progress:XX%, filling_completed.

5️⃣ Cancel if needed:
Close modal or click “Batal”.

---

🧪 Testing

✅ Confirm dashboard buttons show correct QR codes

✅ Scan QR codes & check "Konfirmasi OK terkirim!" message

✅ ESP32 receives commands & publishes status

✅ Dashboard shows live updates

---

💡 For local test, keep laptop & phone on the same Wi-Fi.

📦 Dependencies
MQTT.js – MQTT client
Font Awesome – Icons
Poppins – Font
TEC-IT Barcode Generator – For QR codes

```📝 Notes
Replace https://ficrammanifur.github.io/... in QR codes with your own domain or local IP (e.g., http://192.168.1.100).
```
Consider adding auth tokens to QR URLs for security.

If using TEC-IT QR codes publicly, keep the backlink per license.

<div align="center">

⚡ Built with ESP32, MQTT & curiosity

⭐ Star the repo if you like it!

<p><a href="#top">⬆ Kembali ke Atas</a></p>
</div>
