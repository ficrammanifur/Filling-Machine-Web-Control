class FillingMachineControl {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.currentProgress = 0;
        this.progressInterval = null;

        this.mqttConfig = {
            host: 'broker.hivemq.com',
            port: 8000,
            protocol: 'ws',
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
            reconnectPeriod: 1000
        });

        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.client.subscribe('filling/status');
        });

        this.client.on('message', (topic, message) => {
            if (topic === 'filling/status') {
                const status = message.toString();
                this.updateStatus(status);
            }
        });

        this.client.on('error', () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        this.client.on('close', () => {
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
                    this.toggleButtons(true);
                }
            });
        }
    }

    startProgress() {
        this.currentProgress = 0;
        document.getElementById('progressContainer').style.display = 'block';

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        this.progressInterval = setInterval(() => {
            this.currentProgress += Math.random() * 20 + 5;
            if (this.currentProgress >= 100) {
                this.currentProgress = 100;
                clearInterval(this.progressInterval);
                setTimeout(() => this.completeProcess(), 500);
            }
            progressFill.style.width = this.currentProgress + '%';
            progressText.textContent = Math.round(this.currentProgress) + '%';
        }, 300);
    }

    completeProcess() {
        document.getElementById('progressContainer').style.display = 'none';
        this.toggleButtons(true);
        setTimeout(() => this.updateStatus('Siap'), 3000);
    }

    updateStatus(status) {
        const statusValue = document.getElementById('statusValue');
        statusValue.classList.remove('progress', 'done', 'nogelas');

        if (status === 'progress') {
            statusValue.textContent = 'Sedang Memproses...';
            statusValue.classList.add('progress');
        } else if (status === 'done') {
            statusValue.textContent = 'Selesai';
            statusValue.classList.add('done');
        } else if (status === 'nogelas') {
            statusValue.textContent = 'Tidak Ada Gelas';
            statusValue.classList.add('nogelas');
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
