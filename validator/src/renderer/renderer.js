/**
 * TOPAY Validator - Renderer Process
 * Handles UI interactions and communication with main process
 */

class ValidatorUI {
    constructor() {
        this.charts = {};
        this.updateInterval = null;
        this.validatorData = {
            status: 'initializing',
            blockHeight: 0,
            peerCount: 0,
            uptime: 0,
            validationCount: 0,
            validatorId: '',
            lastValidation: 'Never',
            successRate: 0,
            validations: [],
            peers: [],
            logs: []
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupCharts();
        await this.loadInitialData();
        this.startUpdateLoop();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Window controls
        document.getElementById('minimizeBtn').addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        document.getElementById('closeBtn').addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        // Validator controls
        document.getElementById('restartBtn').addEventListener('click', async () => {
            await this.restartValidator();
        });

        // Settings
        document.getElementById('saveConfigBtn').addEventListener('click', async () => {
            await this.saveConfig();
        });

        document.getElementById('exportConfigBtn').addEventListener('click', async () => {
            await this.exportConfig();
        });

        // Logs
        document.getElementById('exportLogsBtn').addEventListener('click', async () => {
            await this.exportLogs();
        });

        document.getElementById('clearLogsBtn').addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('refreshLogsBtn').addEventListener('click', () => {
            this.refreshLogs();
        });

        document.getElementById('logLevel').addEventListener('change', (e) => {
            this.filterLogs(e.target.value);
        });

        // Listen for updates from main process
        window.electronAPI.onValidationUpdate((event, data) => {
            this.updateValidationData(data);
        });

        window.electronAPI.onNetworkUpdate((event, data) => {
            this.updateNetworkData(data);
        });

        window.electronAPI.onConfigUpdate((event, config) => {
            this.updateConfigUI(config);
        });
    }

    navigateToPage(page) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(page).classList.add('active');

        // Load page-specific data
        this.loadPageData(page);
    }

    async loadPageData(page) {
        switch (page) {
            case 'dashboard':
                await this.updateDashboard();
                break;
            case 'validation':
                await this.updateValidationPage();
                break;
            case 'network':
                await this.updateNetworkPage();
                break;
            case 'settings':
                await this.loadSettings();
                break;
            case 'logs':
                await this.loadLogs();
                break;
        }
    }

    async loadInitialData() {
        try {
            const status = await window.electronAPI.getValidatorStatus();
            this.updateValidatorStatus(status);

            const config = await window.electronAPI.getConfig();
            this.updateConfigUI(config);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Error', 'Failed to load validator data');
        }
    }

    startUpdateLoop() {
        this.updateInterval = setInterval(async () => {
            try {
                const status = await window.electronAPI.getValidatorStatus();
                this.updateValidatorStatus(status);
                this.updateCharts();
            } catch (error) {
                console.error('Update loop error:', error);
            }
        }, 5000); // Update every 5 seconds
    }

    updateValidatorStatus(status) {
        this.validatorData = { ...this.validatorData, ...status };

        // Update status indicator
        const statusIndicator = document.getElementById('statusIndicator');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');

        statusDot.className = 'status-dot';
        if (status.isRunning) {
            statusDot.classList.add('online');
            statusText.textContent = 'Online';
        } else {
            statusDot.classList.add('offline');
            statusText.textContent = 'Offline';
        }

        // Update dashboard stats
        this.updateDashboardStats();
    }

    updateDashboardStats() {
        document.getElementById('blockHeight').textContent = this.validatorData.blockHeight || 0;
        document.getElementById('peerCount').textContent = this.validatorData.peerCount || 0;
        document.getElementById('uptime').textContent = this.formatUptime(this.validatorData.uptime || 0);
        document.getElementById('validationCount').textContent = this.validatorData.validationCount || 0;
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    async updateDashboard() {
        this.updateDashboardStats();
        this.updateCharts();
    }

    async updateValidationPage() {
        document.getElementById('validatorId').textContent = this.validatorData.validatorId || 'Loading...';
        
        const statusBadge = document.getElementById('validatorStatus');
        statusBadge.textContent = this.validatorData.status || 'Unknown';
        statusBadge.className = `status-badge ${this.validatorData.isRunning ? 'online' : 'offline'}`;
        
        document.getElementById('lastValidation').textContent = this.validatorData.lastValidation || 'Never';
        document.getElementById('successRate').textContent = `${this.validatorData.successRate || 0}%`;

        // Update validation list
        const validationList = document.getElementById('validationList');
        if (this.validatorData.validations && this.validatorData.validations.length > 0) {
            validationList.innerHTML = this.validatorData.validations.map(validation => `
                <div class="validation-item">
                    <span class="validation-time">[${new Date(validation.timestamp).toLocaleString()}]</span>
                    <span class="validation-result ${validation.success ? 'success' : 'error'}">
                        ${validation.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                    <span class="validation-details">${validation.details}</span>
                </div>
            `).join('');
        } else {
            validationList.innerHTML = '<div class="validation-item"><span class="validation-time">No validations yet</span></div>';
        }
    }

    async updateNetworkPage() {
        // Update connection status
        document.getElementById('rpcStatus').textContent = this.validatorData.rpcConnected ? 'Connected' : 'Disconnected';
        document.getElementById('rpcStatus').className = `status-badge ${this.validatorData.rpcConnected ? 'online' : 'offline'}`;
        
        document.getElementById('wsStatus').textContent = this.validatorData.wsConnected ? 'Connected' : 'Disconnected';
        document.getElementById('wsStatus').className = `status-badge ${this.validatorData.wsConnected ? 'online' : 'offline'}`;
        
        document.getElementById('syncStatus').textContent = this.validatorData.syncStatus || 'Unknown';
        document.getElementById('syncStatus').className = `status-badge ${this.validatorData.syncStatus === 'synced' ? 'online' : 'syncing'}`;

        // Update peer list
        const peerList = document.getElementById('peerList');
        if (this.validatorData.peers && this.validatorData.peers.length > 0) {
            peerList.innerHTML = this.validatorData.peers.map(peer => `
                <div class="peer-item">
                    <span class="peer-address">${peer.address}</span>
                    <span class="peer-status ${peer.connected ? 'online' : 'offline'}">
                        ${peer.connected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            `).join('');
        } else {
            peerList.innerHTML = '<div class="peer-item"><span>No peers connected</span></div>';
        }
    }

    async loadSettings() {
        try {
            const config = await window.electronAPI.getConfig();
            this.updateConfigUI(config);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    updateConfigUI(config) {
        if (!config) return;

        document.getElementById('validatorName').value = config.validator?.name || '';
        document.getElementById('rpcUrl').value = config.network?.rpcUrl || '';
        document.getElementById('rpcPort').value = config.network?.rpcPort || '';
        document.getElementById('maxPeers').value = config.network?.maxPeers || '';
        document.getElementById('syncInterval').value = config.network?.syncInterval || '';
        document.getElementById('validationThreads').value = config.performance?.validationThreads || '';
        document.getElementById('cacheSize').value = config.performance?.cacheSize || '';
    }

    async saveConfig() {
        try {
            const config = {
                validator: {
                    name: document.getElementById('validatorName').value
                },
                network: {
                    rpcUrl: document.getElementById('rpcUrl').value,
                    rpcPort: parseInt(document.getElementById('rpcPort').value),
                    maxPeers: parseInt(document.getElementById('maxPeers').value),
                    syncInterval: parseInt(document.getElementById('syncInterval').value)
                },
                performance: {
                    validationThreads: parseInt(document.getElementById('validationThreads').value),
                    cacheSize: parseInt(document.getElementById('cacheSize').value)
                }
            };

            await window.electronAPI.updateConfig(config);
            this.showNotification('Success', 'Configuration saved successfully');
        } catch (error) {
            console.error('Failed to save config:', error);
            this.showNotification('Error', 'Failed to save configuration');
        }
    }

    async exportConfig() {
        try {
            // This would trigger a file save dialog in the main process
            await window.electronAPI.exportConfig();
            this.showNotification('Success', 'Configuration exported successfully');
        } catch (error) {
            console.error('Failed to export config:', error);
            this.showNotification('Error', 'Failed to export configuration');
        }
    }

    async loadLogs() {
        try {
            // Load logs from main process
            const logs = await window.electronAPI.getLogs();
            this.displayLogs(logs);
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }

    displayLogs(logs) {
        const logsContent = document.getElementById('logsContent');
        if (logs && logs.length > 0) {
            logsContent.innerHTML = logs.map(log => `
                <div class="log-entry">
                    <span class="log-time">[${new Date(log.timestamp).toLocaleString()}]</span>
                    <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                    <span class="log-message">${log.message}</span>
                </div>
            `).join('');
        } else {
            logsContent.innerHTML = '<div class="log-entry"><span class="log-message">No logs available</span></div>';
        }
    }

    filterLogs(level) {
        const logEntries = document.querySelectorAll('.log-entry');
        logEntries.forEach(entry => {
            const logLevel = entry.querySelector('.log-level');
            if (level === 'all' || logLevel.textContent.toLowerCase() === level) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    clearLogs() {
        document.getElementById('logsContent').innerHTML = '<div class="log-entry"><span class="log-message">Logs cleared</span></div>';
    }

    refreshLogs() {
        this.loadLogs();
    }

    async exportLogs() {
        try {
            await window.electronAPI.exportLogs();
            this.showNotification('Success', 'Logs exported successfully');
        } catch (error) {
            console.error('Failed to export logs:', error);
            this.showNotification('Error', 'Failed to export logs');
        }
    }

    async restartValidator() {
        try {
            await window.electronAPI.restartValidator();
            this.showNotification('Info', 'Validator is restarting...');
        } catch (error) {
            console.error('Failed to restart validator:', error);
            this.showNotification('Error', 'Failed to restart validator');
        }
    }

    setupCharts() {
        // Validation Performance Chart
        const validationCtx = document.getElementById('validationChart').getContext('2d');
        this.charts.validation = new Chart(validationCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Validations per minute',
                    data: [],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Network Activity Chart
        const networkCtx = document.getElementById('networkChart').getContext('2d');
        this.charts.network = new Chart(networkCtx, {
            type: 'doughnut',
            data: {
                labels: ['Connected Peers', 'Disconnected'],
                datasets: [{
                    data: [0, 1],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateCharts() {
        // Update validation chart
        const now = new Date().toLocaleTimeString();
        const validationChart = this.charts.validation;
        
        if (validationChart.data.labels.length > 10) {
            validationChart.data.labels.shift();
            validationChart.data.datasets[0].data.shift();
        }
        
        validationChart.data.labels.push(now);
        validationChart.data.datasets[0].data.push(this.validatorData.validationCount || 0);
        validationChart.update();

        // Update network chart
        const networkChart = this.charts.network;
        const peerCount = this.validatorData.peerCount || 0;
        networkChart.data.datasets[0].data = [peerCount, Math.max(1, 10 - peerCount)];
        networkChart.update();
    }

    updateValidationData(data) {
        this.validatorData.validations = data.validations || [];
        this.validatorData.validationCount = data.validationCount || 0;
        this.validatorData.successRate = data.successRate || 0;
        this.validatorData.lastValidation = data.lastValidation || 'Never';
        
        if (document.getElementById('validation').classList.contains('active')) {
            this.updateValidationPage();
        }
    }

    updateNetworkData(data) {
        this.validatorData.peers = data.peers || [];
        this.validatorData.peerCount = data.peerCount || 0;
        this.validatorData.rpcConnected = data.rpcConnected || false;
        this.validatorData.wsConnected = data.wsConnected || false;
        this.validatorData.syncStatus = data.syncStatus || 'unknown';
        
        if (document.getElementById('network').classList.contains('active')) {
            this.updateNetworkPage();
        }
    }

    showNotification(title, message) {
        window.electronAPI.showNotification(title, message);
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ValidatorUI();
});

// Handle app version display
window.versions.app().then(version => {
    console.log(`TOPAY Validator v${version}`);
});