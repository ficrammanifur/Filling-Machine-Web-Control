class MQTTBarcodeScanner {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.currentProgress = 0;
        this.progressInterval = null;
        
        // MQTT Configuration - Update these with your MQTT broker details
        this.mqttConfig = {
            host: 'broker.hivemq.com', // Replace with your MQTT broker
            port: 8000, // WebSocket port
            protocol: 'ws',
            clientId: 'barcode_scanner_' + Math.random().toString(16).substr(2, 8)
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.connectMQTT();
    }
    
    setupEventListeners() {
        const scanButtons = document.querySelectorAll('.scan-btn');
        scanButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                this.handleScanClick(type);
            });
        });
    }
    
    connectMQTT() {
        try {
            const brokerUrl = `${this.mqttConfig.protocol}://${this.mqttConfig.host}:${this.mqttConfig.port}`;
            this.client = mqtt.connect(brokerUrl, {
                clientId: this.mqttConfig.clientId,
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000,
            });
            
            this.client.on('connect', () => {
                console.log('Connected to MQTT broker');
                this.isConnected = true;
                this.updateConnectionStatus(true);
                
                // Subscribe to status topic
                this.client.subscribe('barcode/status', (err) => {
                    if (err) {
                        console.error('Failed to subscribe to status topic:', err);
                    }
                });
            });
            
            this.client.on('message', (topic, message) => {
                if (topic === 'barcode/status') {
                    const status = message.toString();
                    this.updateStatus(status);
                }
            });
            
            this.client.on('error', (error) => {
                console.error('MQTT connection error:', error);
                this.updateConnectionStatus(false);
            });
            
            this.client.on('close', () => {
                console.log('MQTT connection closed');
                this.isConnected = false;
                this.updateConnectionStatus(false);
            });
            
        } catch (error) {
            console.error('Failed to connect to MQTT broker:', error);
            this.updateConnectionStatus(false);
        }
    }
    
    handleScanClick(type) {
        if (!this.isConnected) {
            alert('Tidak terhubung ke MQTT broker. Silakan coba lagi.');
            return;
        }
        
        // Disable all buttons during scanning
        this.toggleButtons(false);
        
        // Send MQTT command
        this.sendMQTTCommand(type);
        
        // Start progress simulation
        this.startProgress();
        
        // Update status
        this.updateStatus('progress');
    }
    
    sendMQTTCommand(command) {
        if (this.client && this.isConnected) {
            const topic = 'barcode/command';
            this.client.publish(topic, command, { qos: 1 }, (error) => {
                if (error) {
                    console.error('Failed to send MQTT message:', error);
                    this.updateStatus('error');
                    this.toggleButtons(true);
                } else {
                    console.log(`Sent command: ${command}`);
                }
            });
        }
    }
    
    startProgress() {
        this.currentProgress = 0;
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressContainer.style.display = 'block';
        
        this.progressInterval = setInterval(() => {
            this.currentProgress += Math.random() * 15 + 5; // Random progress increment
            
            if (this.currentProgress >= 100) {
                this.currentProgress = 100;
                clearInterval(this.progressInterval);
                
                // Simulate completion after progress reaches 100%
                setTimeout(() => {
                    this.completeProcess();
                }, 500);
            }
            
            progressFill.style.width = this.currentProgress + '%';
            progressText.textContent = Math.round(this.currentProgress) + '%';
        }, 200);
    }
    
    completeProcess() {
        const progressContainer = document.getElementById('progressContainer');
        progressContainer.style.display = 'none';
        
        // Simulate random completion status
        const outcomes = ['done', 'nogelas'];
        const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        this.updateStatus(randomOutcome);
        this.toggleButtons(true);
        
        // Reset after 3 seconds
        setTimeout(() => {
            this.updateStatus('Siap');
        }, 3000);
    }
    
    updateStatus(status) {
        const statusValue = document.getElementById('statusValue');
        
        // Remove all status classes
        statusValue.classList.remove('progress', 'done', 'nogelas');
        
        switch(status.toLowerCase()) {
            case 'progress':
                statusValue.textContent = 'Sedang Memproses...';
                statusValue.classList.add('progress');
                break;
            case 'done':
                statusValue.textContent = 'Selesai';
                statusValue.classList.add('done');
                break;
            case 'nogelas':
                statusValue.textContent = 'Tidak Ada Gelas';
                statusValue.classList.add('nogelas');
                break;
            case 'error':
                statusValue.textContent = 'Error';
                statusValue.classList.add('nogelas');
                break;
            default:
                statusValue.textContent = status;
        }
    }
    
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connectionIndicator');
        const text = document.getElementById('connectionText');
        
        if (connected) {
            indicator.classList.add('connected');
            text.textContent = 'Terhubung ke MQTT';
        } else {
            indicator.classList.remove('connected');
            text.textContent = 'Tidak terhubung';
        }
    }
    
    toggleButtons(enabled) {
        const buttons = document.querySelectorAll('.scan-btn');
        buttons.forEach(button => {
            button.disabled = !enabled;
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MQTTBarcodeScanner();
});