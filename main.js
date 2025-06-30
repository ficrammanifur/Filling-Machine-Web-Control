class FillingMachineControl {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.currentProgress = 0;
        this.progressInterval = null;

        this.mqttConfig = {
            host: 'broker.hivemq.com',
            port: 8884, // Gunakan port WebSocket SSL untuk HiveMQ
            protocol: 'wss', // Gunakan WebSocket Secure
            clientId: 'filling_web_' + Math.random().toString(16).substr(2, 8)
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.connectMQTT();
    }

    setupEventListeners() {
        document.querySelectorAll('.scan-btn').forEach(button => {
            button.addEventListener('click', () => {
                const type = button.getAttribute('data-type');
                this.handleScanClick(type);
            });
        });
    }

    connectMQTT() {
        const brokerUrl = `${this.mqttConfig.protocol}://${this.mqttConfig.host}:${this.mqttConfig.port}`;
        this.client = mqtt.connect(brokerUrl, {
            clientId: this.mqttConfig.clientId,
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
            // Tambahkan opsi SSL
            useSSL: true
        });

        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.client.subscribe('filling/status', { qos: 1 }, (err) => {
                if (err) {
                    console.error('Failed to subscribe:', err);
                } else {
                    console.log('Subscribed to filling/status');
                }
            });
        });

        this.client.on('message', (topic, message) => {
            if (topic === 'filling/status') {
                const status = message.toString();
                console.log('Received status:', status);
                this.updateStatus(status);
            }
        });

        this.client.on('error', (err) => {
            console.error('MQTT error:', err);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.updateStatus('error');
        });

        this.client.on('close', () => {
            console.log('MQTT connection closed');
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });
    }

    handleScanClick(type) {
        if (!this.isConnected) {
            alert('Tidak terhubung ke MQTT broker.');
            return;
        }

        this.toggleButtons(false);
        this.sendMQTTCommand(type);
        this.startProgress();
        this.updateStatus('progress');
    }

    sendMQTTCommand(command) {
        if (this.client && this.isConnected) {
            this.client.publish('filling/perintah', command, { qos: 1 }, (err) => {
                if (err) {
                    console.error('Failed to send command:', err);
                    this.updateStatus('error');
                    this.stopProgress();
                    this.toggleButtons(true);
                } else {
                    console.log(`Command ${command} sent successfully`);
                }
            });
        }
    }

    startProgress() {
        this.currentProgress = 0;
        document.getElementById('progressContainer').style.display = 'block';
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        // Progres naik secara linear (2 detik = 2000ms, update setiap 100ms)
        const increment = 100 / (2000 / 100); // Target 2 detik
        this.progressInterval = setInterval(() => {
            this.currentProgress += increment;
            if (this.currentProgress >= 100) {
                this.currentProgress = 100;
                clearInterval(this.progressInterval);
            }
            progressFill.style.width = this.currentProgress + '%';
            progressText.textContent = Math.round(this.currentProgress) + '%';
        }, 100);
    }

    stopProgress() {
        clearInterval(this.progressInterval);
        document.getElementById('progressContainer').style.display = 'none';
    }

    completeProcess() {
        this.stopProgress();
        this.toggleButtons(true);
        setTimeout(() => this.updateStatus('Siap'), 3000);
    }

    updateStatus(status) {
        const statusValue = document.getElementById('statusValue');
        statusValue.classList.remove('progress', 'done', 'nogelas', 'error');

        if (status === 'progress') {
            statusValue.textContent = 'Sedang Memproses...';
            statusValue.classList.add('progress');
        } else if (status === 'done') {
            statusValue.textContent = 'Selesai';
            statusValue.classList.add('done');
            this.completeProcess();
        } else if (status === 'nogelas') {
            statusValue.textContent = 'Tidak Ada Gelas';
            statusValue.classList.add('nogelas');
            this.stopProgress();
            this.toggleButtons(true);
        } else if (status === 'error') {
            statusValue.textContent = 'Error';
            statusValue.classList.add('error');
            this.stopProgress();
            this.toggleButtons(true);
        } else {
            statusValue.textContent = status;
        }
    }

    updateConnectionStatus(connected) {
        document.getElementById('connectionIndicator').classList.toggle('connected', connected);
        document.getElementById('connectionText').textContent = connected ? 'Terhubung ke MQTT' : 'Tidak terhubung';
    }

    toggleButtons(enabled) {
        document.querySelectorAll('.scan-btn').forEach(btn => btn.disabled = !enabled);
    }
}

document.addEventListener('DOMContentLoaded', () => new FillingMachineControl());
