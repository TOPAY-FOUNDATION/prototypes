/**
 * TOPAY Miner Desktop Application
 * Renderer process JavaScript for UI interactions
 */

// Import the ManualConnection component
import ManualConnection from './components/ManualConnection.js';

class MinerUI {
    constructor() {
        this.currentPage = 'dashboard';
        this.minerStatus = {
            running: false,
            uptime: 0,
            minerId: null,
            rpcConnected: false,
            wsConnected: false,
            stats: null
        };
        this.config = {};
        this.statusUpdateInterval = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupWindowControls();
        this.setupMinerControls();
        this.setupSettings();
        
        // Load initial data
        await this.loadConfig();
        await this.updateMinerStatus();
        
        // Start status updates
        this.startStatusUpdates();
        
        // Setup IPC listeners
        this.setupIpcListeners();
        
        // Initialize the manual connection component
        this.initializeManualConnection();
        
        this.addLog('info', 'TOPAY Miner UI initialized');
    }
    
    initializeManualConnection() {
        const container = document.getElementById('manual-connection-container');
        if (container) {
            // Pass the miner service reference through the window.electronAPI
            this.manualConnection = new ManualConnection(container, {
                getStatus: () => this.minerStatus
            });
            
            // Listen for refresh-status event
            window.addEventListener('refresh-status', () => {
                this.updateMinerStatus();
            });
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    setupNavigation() {
        // Handle navigation from main process
        window.electronAPI.navigation.onNavigate((event, page) => {
            this.navigateToPage(page);
        });
    }

    setupWindowControls() {
        document.getElementById('minimize-btn').addEventListener('click', () => {
            window.electronAPI.window.minimize();
        });

        document.getElementById('maximize-btn').addEventListener('click', () => {
            window.electronAPI.window.maximize();
        });

        document.getElementById('close-btn').addEventListener('click', () => {
            window.electronAPI.window.close();
        });
    }

    setupMinerControls() {
        // Dashboard controls
        document.getElementById('start-miner-btn').addEventListener('click', () => {
            this.startMiner();
        });

        document.getElementById('stop-miner-btn').addEventListener('click', () => {
            this.stopMiner();
        });

        document.getElementById('restart-miner-btn').addEventListener('click', () => {
            this.restartMiner();
        });



        // Control page controls
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startMiner();
        });

        document.getElementById('stop-btn').addEventListener('click', () => {
            this.stopMiner();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartMiner();
        });

        // Logs controls
        document.getElementById('clear-logs-btn').addEventListener('click', () => {
            this.clearLogs();
        });
    }

    setupSettings() {
        document.getElementById('save-settings-btn').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('reset-settings-btn').addEventListener('click', () => {
            this.resetSettings();
        });
    }

    setupIpcListeners() {
        // Miner status changes
        window.electronAPI.miner.onStatusChanged((event, status) => {
            this.minerStatus = { ...this.minerStatus, ...status };
            this.updateUI();
        });

        // Miner errors
        window.electronAPI.miner.onError((event, error) => {
            this.showNotification('Miner Error', error, 'error');
            this.addLog('error', error);
        });

        // Notifications
        window.electronAPI.notifications.onNotification((event, notification) => {
            this.showNotification(notification.title, notification.body);
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

        this.currentPage = page;

        // Load page-specific data
        if (page === 'settings') {
            this.loadSettingsUI();
        }
    }

    async startMiner() {
        this.showLoading(true);
        try {
            const result = await window.electronAPI.miner.start();
            if (result.success) {
                this.showNotification('Success', result.message, 'success');
                this.addLog('info', 'Miner started successfully');
                // Update status after successful start
                await this.updateMinerStatus();
            } else {
                this.showNotification('Error', result.message, 'error');
                this.addLog('error', `Failed to start miner: ${result.message}`);
            }
        } catch (error) {
            this.showNotification('Error', 'Failed to start miner', 'error');
            this.addLog('error', `Failed to start miner: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async stopMiner() {
        this.showLoading(true);
        try {
            const result = await window.electronAPI.miner.stop();
            if (result.success) {
                this.showNotification('Success', result.message, 'success');
                this.addLog('info', 'Miner stopped successfully');
                // Update status after successful stop
                await this.updateMinerStatus();
            } else {
                this.showNotification('Error', result.message, 'error');
                this.addLog('error', `Failed to stop miner: ${result.message}`);
            }
        } catch (error) {
            this.showNotification('Error', 'Failed to stop miner', 'error');
            this.addLog('error', `Failed to stop miner: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async restartMiner() {
        this.showLoading(true);
        try {
            const result = await window.electronAPI.miner.restart();
            if (result.success) {
                this.showNotification('Success', result.message, 'success');
                this.addLog('info', 'Miner restarted successfully');
                // Update status after successful restart
                await this.updateMinerStatus();
            } else {
                this.showNotification('Error', result.message, 'error');
                this.addLog('error', `Failed to restart miner: ${result.message}`);
            }
        } catch (error) {
            this.showNotification('Error', 'Failed to restart miner', 'error');
            this.addLog('error', `Failed to restart miner: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }



    async updateMinerStatus() {
        try {
            const status = await window.electronAPI.miner.getStatus();
            
            this.minerStatus = {
                ...this.minerStatus,
                ...status
            };
            
            this.updateUI();
        } catch (error) {
            console.error('Error fetching miner status:', error);
            this.addLog('error', `Error fetching miner status: ${error.message}`);
        }
    }

    updateUI() {
        const { 
            isRunning: running, 
            uptime, 
            minerId, 
            rpcConnected, 
            wsConnected, 
            miningStats: stats,
            connection
        } = this.minerStatus;
        
        // Extract connection information
        const blockchainUrl = connection ? connection.blockchainUrl : null;
        const lastConnectionAttempt = connection ? connection.lastConnectionAttempt : null;
        const connectionStatus = connection ? connection.connectionStatus : 'disconnected';

        // Update status badges
        const statusBadges = document.querySelectorAll('#miner-status');
        statusBadges.forEach(badge => {
            badge.textContent = running ? 'Running' : 'Stopped';
            badge.className = `status-badge ${running ? 'running' : 'stopped'}`;
        });

        // Update status text
        const statusTexts = document.querySelectorAll('#status-text, #control-status');
        statusTexts.forEach(text => {
            text.textContent = running ? 'Running' : 'Stopped';
        });

        // Update uptime
        const uptimeTexts = document.querySelectorAll('#uptime-text, #control-uptime');
        uptimeTexts.forEach(text => {
            text.textContent = this.formatUptime(uptime);
        });

        // Update miner ID
        const minerIdTexts = document.querySelectorAll('#miner-id, #control-miner-id');
        minerIdTexts.forEach(text => {
            text.textContent = minerId || 'Not Set';
        });

        // Update connection status
        document.getElementById('rpc-status').textContent = rpcConnected ? 'Connected' : 'Disconnected';
        document.getElementById('ws-status').textContent = wsConnected ? 'Connected' : 'Disconnected';
        
        // Update blockchain connection information
        if (document.getElementById('rpc-endpoint')) {
            document.getElementById('rpc-endpoint').textContent = blockchainUrl || 'Not Set';
        }
        
        if (document.getElementById('last-connection-attempt')) {
            document.getElementById('last-connection-attempt').textContent = 
                lastConnectionAttempt ? new Date(lastConnectionAttempt).toLocaleString() : 'Never';
        }
        
        if (document.getElementById('connection-status-value')) {
            document.getElementById('connection-status-value').textContent = connectionStatus || 'Unknown';
            
            // Update connection status class
            const connectionStatusElement = document.getElementById('connection-status-value');
            if (connectionStatusElement) {
                connectionStatusElement.className = 'connection-value';
                if (connectionStatus === 'connected') {
                    connectionStatusElement.classList.add('connected');
                } else if (connectionStatus === 'failed') {
                    connectionStatusElement.classList.add('failed');
                } else if (connectionStatus === 'connecting') {
                    connectionStatusElement.classList.add('connecting');
                }
            }
        }



        // Update performance stats with real data
        if (stats) {
            document.getElementById('blocks-mined').textContent = stats.blocksMined || 0;
            document.getElementById('transactions-processed').textContent = stats.transactionsProcessed || 0;
            document.getElementById('mining-errors').textContent = stats.miningErrors || 0;
        } else {
            // Show zeros when no stats available
            document.getElementById('blocks-mined').textContent = '0';
            document.getElementById('transactions-processed').textContent = '0';
            document.getElementById('mining-errors').textContent = '0';
        }

        // Update button states
        this.updateButtonStates(running);

        // Update network endpoints (only update ws-endpoint as rpc-endpoint is already updated above)
        document.getElementById('ws-endpoint').textContent = wsConnected ? 'Connected' : 'Not Connected';
    }

    updateButtonStates(running) {
        // Dashboard buttons
        document.getElementById('start-miner-btn').disabled = running;
        document.getElementById('stop-miner-btn').disabled = !running;
        document.getElementById('restart-miner-btn').disabled = !running;

        // Control page buttons
        document.getElementById('start-btn').disabled = running;
        document.getElementById('stop-btn').disabled = !running;
        document.getElementById('restart-btn').disabled = !running;
    }

    formatUptime(uptime) {
        if (!uptime) return '0s';
        
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    async loadConfig() {
        try {
            this.config = await window.electronAPI.config.get();
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    async loadSettingsUI() {
        document.getElementById('rpc-url').value = this.config.rpcUrl || '';
        document.getElementById('api-port').value = this.config.apiPort || '';
        document.getElementById('mining-interval').value = this.config.miningInterval || '';
        
        // Load auto-start setting
        try {
            const autoStart = await window.electronAPI.config.getAutoStart();
            document.getElementById('auto-start-miner').checked = autoStart;
        } catch (error) {
            console.error('Failed to load auto-start setting:', error);
        }
    }

    async saveSettings() {
        try {
            const rpcUrl = document.getElementById('rpc-url').value;
            const apiPort = parseInt(document.getElementById('api-port').value);
            const miningInterval = parseInt(document.getElementById('mining-interval').value);
            const autoStartMiner = document.getElementById('auto-start-miner').checked;

            await window.electronAPI.config.set('rpcUrl', rpcUrl);
            await window.electronAPI.config.set('apiPort', apiPort);
            await window.electronAPI.config.set('miningInterval', miningInterval);
            await window.electronAPI.config.setAutoStart(autoStartMiner);

            this.config.rpcUrl = rpcUrl;
            this.config.apiPort = apiPort;
            this.config.miningInterval = miningInterval;

            this.showNotification('Success', 'Settings saved successfully', 'success');
            this.addLog('info', 'Settings saved');
        } catch (error) {
            this.showNotification('Error', 'Failed to save settings', 'error');
            this.addLog('error', `Failed to save settings: ${error.message}`);
        }
    }

    async resetSettings() {
        try {
            // Reset to default values
            document.getElementById('rpc-url').value = 'http://localhost:3001';
            document.getElementById('api-port').value = '8547';
            document.getElementById('mining-interval').value = '5000';

            this.showNotification('Success', 'Settings reset to defaults', 'success');
        } catch (error) {
            this.showNotification('Error', 'Failed to reset settings', 'error');
        }
    }

    startStatusUpdates() {
        this.statusUpdateInterval = setInterval(() => {
            this.updateMinerStatus();
        }, 2000);
    }

    stopStatusUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    addLog(level, message) {
        const logsContent = document.getElementById('logs-content');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
        
        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-level ${level}">${level.toUpperCase()}</span>
            <span class="log-message">${message}</span>
        `;

        logsContent.appendChild(logEntry);
        logsContent.scrollTop = logsContent.scrollHeight;

        // Keep only last 100 log entries
        const entries = logsContent.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }

    clearLogs() {
        const logsContent = document.getElementById('logs-content');
        logsContent.innerHTML = `
            <div class="log-entry info">
                <span class="log-time">[${new Date().toISOString().replace('T', ' ').substr(0, 19)}]</span>
                <span class="log-level info">INFO</span>
                <span class="log-message">Logs cleared</span>
            </div>
        `;
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Initialize the UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MinerUI();
});