const { ipcRenderer } = require('electron');

// Global state
let currentConfig = {};
let isServiceRunning = false;
let activityLog = [];
let analyticsData = {
    blocksStored: 0,
    transactionsStored: 0,
    stateUpdates: 0,
    totalRequests: 0,
    storageUsed: 0,
    uptime: 0,
    dailyStats: [],
    hourlyStats: []
};

// DOM elements
const elements = {
    // Status
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    
    // Service control
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    serviceStatus: document.getElementById('serviceStatus'),
    
    // Dashboard info
    currentPort: document.getElementById('currentPort'),
    usedStorage: document.getElementById('usedStorage'),
    maxStorage: document.getElementById('maxStorage'),
    connectedNodes: document.getElementById('connectedNodes'),
    storageProgress: document.getElementById('storageProgress'),
    storagePercentage: document.getElementById('storagePercentage'),
    blockchainUrl: document.getElementById('blockchainUrl'),
    localAddress: document.getElementById('localAddress'),
    dataDirectory: document.getElementById('dataDirectory'),
    activityList: document.getElementById('activityList'),
    
    // Configuration form
    configForm: document.getElementById('configForm'),
    portInput: document.getElementById('portInput'),
    blockchainUrlInput: document.getElementById('blockchainUrlInput'),
    dataPathInput: document.getElementById('dataPathInput'),
    maxStorageInput: document.getElementById('maxStorageInput'),
    autoStartInput: document.getElementById('autoStartInput'),
    minimizeToTrayInput: document.getElementById('minimizeToTrayInput'),
    selectDataDir: document.getElementById('selectDataDir'),
    resetConfigBtn: document.getElementById('resetConfigBtn'),
    
    // Logs
    logsContent: document.getElementById('logsContent'),
    clearLogsBtn: document.getElementById('clearLogsBtn'),
    exportLogsBtn: document.getElementById('exportLogsBtn'),
    
    // Other
    openDataDir: document.getElementById('openDataDir'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer')
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    setupTabNavigation();
    setupAnalyticsTab();
    updateServiceStatus();
});

// Initialize application
async function initializeApp() {
    try {
        showLoading(true);
        
        // Load configuration
        currentConfig = await ipcRenderer.invoke('get-config');
        updateUIFromConfig();
        
        // Check service status
        isServiceRunning = await ipcRenderer.invoke('get-storage-status');
        updateServiceControls();
        
        addActivity('Application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to initialize application', 'error');
    } finally {
        showLoading(false);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Service control
    elements.startBtn.addEventListener('click', startService);
    elements.stopBtn.addEventListener('click', stopService);
    
    // Configuration
    elements.configForm.addEventListener('submit', saveConfiguration);
    elements.selectDataDir.addEventListener('click', selectDataDirectory);
    elements.resetConfigBtn.addEventListener('click', resetConfiguration);
    
    // Logs
    elements.clearLogsBtn.addEventListener('click', clearLogs);
    elements.exportLogsBtn.addEventListener('click', exportLogs);
    
    // Other
    elements.openDataDir.addEventListener('click', openDataDirectory);
    
    // IPC listeners
    ipcRenderer.on('storage-started', () => {
        isServiceRunning = true;
        updateServiceControls();
        updateStatus('connected', 'Connected');
        addActivity('Storage service started successfully');
        showToast('Storage service started', 'success');
    });
    
    ipcRenderer.on('storage-stopped', (event, code) => {
        isServiceRunning = false;
        updateServiceControls();
        updateStatus('disconnected', 'Disconnected');
        addActivity(`Storage service stopped (exit code: ${code})`);
        showToast('Storage service stopped', 'warning');
    });
    
    ipcRenderer.on('storage-log', (event, data) => {
        addLogEntry(data, 'info');
        
        // Parse log data for activity updates
        if (data.includes('Server listening')) {
            addActivity('Server is listening for connections');
        } else if (data.includes('New connection')) {
            addActivity('New blockchain node connected');
            updateConnectedNodes(1);
        } else if (data.includes('Connection closed')) {
            addActivity('Blockchain node disconnected');
            updateConnectedNodes(-1);
        }
    });
    
    ipcRenderer.on('storage-error', (event, data) => {
        addLogEntry(data, 'error');
        addActivity('Service error occurred - check logs');
        showToast('Service error occurred', 'error');
    });
}

// Setup analytics tab
function setupAnalyticsTab() {
    const refreshAnalyticsBtn = document.getElementById('refreshAnalyticsBtn');
    const queryDataBtn = document.getElementById('queryDataBtn');
    const executeQueryBtn = document.getElementById('executeQueryBtn');
    const queryInput = document.getElementById('queryInput');
    
    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener('click', updateAnalytics);
    }
    
    if (queryDataBtn) {
        queryDataBtn.addEventListener('click', () => {
            const queryInput = document.getElementById('queryInput');
            if (queryInput) {
                queryInput.focus();
            }
        });
    }
    
    if (executeQueryBtn) {
        executeQueryBtn.addEventListener('click', executeBlockchainQuery);
    }
    
    if (queryInput) {
        queryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                executeBlockchainQuery();
            }
        });
    }
    
    // Initialize analytics display
    updateAnalyticsDisplay();
}

// Execute blockchain query
async function executeBlockchainQuery() {
    const queryInput = document.getElementById('queryInput');
    const queryResults = document.getElementById('queryResults');
    
    if (!queryInput || !queryResults) return;
    
    const query = queryInput.value.trim();
    if (!query) {
        showToast('Please enter a search query', 'warning');
        return;
    }
    
    try {
        showLoading();
        queryResults.innerHTML = '<div class="query-placeholder">Searching blockchain data across all nodes...</div>';
        
        const results = await queryBlockchainData(query);
        
        if (results && results.length > 0) {
            displayQueryResults(results);
        } else {
            queryResults.innerHTML = '<div class="query-placeholder">No results found for the specified query.</div>';
        }
    } catch (error) {
        console.error('Query execution failed:', error);
        queryResults.innerHTML = '<div class="query-placeholder">Error executing query. Please try again.</div>';
        showToast('Query failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Display query results
function displayQueryResults(results) {
    const queryResults = document.getElementById('queryResults');
    if (!queryResults) return;
    
    queryResults.innerHTML = '';
    
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'query-result-item';
        
        resultItem.innerHTML = `
            <div class="query-result-header">
                <span class="query-result-type">${result.type || 'Data'}</span>
                <span class="query-result-node">Node: ${result.node || 'Unknown'}</span>
            </div>
            <div class="query-result-content">${JSON.stringify(result.data, null, 2)}</div>
        `;
        
        queryResults.appendChild(resultItem);
    });
}

// Setup tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// Service control functions
async function startService() {
    try {
        showLoading(true);
        updateStatus('connecting', 'Starting...');
        
        await ipcRenderer.invoke('start-storage');
        
    } catch (error) {
        console.error('Failed to start service:', error);
        showToast('Failed to start service', 'error');
        updateStatus('disconnected', 'Disconnected');
    } finally {
        showLoading(false);
    }
}

async function stopService() {
    try {
        showLoading(true);
        updateStatus('connecting', 'Stopping...');
        
        await ipcRenderer.invoke('stop-storage');
        
    } catch (error) {
        console.error('Failed to stop service:', error);
        showToast('Failed to stop service', 'error');
    } finally {
        showLoading(false);
    }
}

// Configuration functions
async function saveConfiguration(event) {
    event.preventDefault();
    
    try {
        showLoading(true);
        
        const newConfig = {
            port: parseInt(elements.portInput.value),
            blockchainUrl: elements.blockchainUrlInput.value,
            dataPath: elements.dataPathInput.value,
            maxStorageSize: elements.maxStorageInput.value,
            autoStart: elements.autoStartInput.checked,
            minimizeToTray: elements.minimizeToTrayInput.checked
        };
        
        const success = await ipcRenderer.invoke('save-config', newConfig);
        
        if (success) {
            currentConfig = { ...currentConfig, ...newConfig };
            updateUIFromConfig();
            addActivity('Configuration saved successfully');
            showToast('Configuration saved successfully', 'success');
            
            // If service is running, suggest restart
            if (isServiceRunning) {
                showToast('Restart service to apply changes', 'warning');
            }
        } else {
            throw new Error('Failed to save configuration');
        }
        
    } catch (error) {
        console.error('Failed to save configuration:', error);
        showToast('Failed to save configuration', 'error');
    } finally {
        showLoading(false);
    }
}

async function selectDataDirectory() {
    try {
        const selectedPath = await ipcRenderer.invoke('select-directory');
        if (selectedPath) {
            elements.dataPathInput.value = selectedPath;
        }
    } catch (error) {
        console.error('Failed to select directory:', error);
        showToast('Failed to select directory', 'error');
    }
}

function resetConfiguration() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        elements.portInput.value = 3002;
        elements.blockchainUrlInput.value = 'http://localhost:3000';
        elements.dataPathInput.value = '';
        elements.maxStorageInput.value = '10GB';
        elements.autoStartInput.checked = false;
        elements.minimizeToTrayInput.checked = true;
        
        showToast('Configuration reset to defaults', 'success');
    }
}

// UI update functions
function updateUIFromConfig() {
    elements.portInput.value = currentConfig.port || 3002;
    elements.blockchainUrlInput.value = currentConfig.blockchainUrl || 'http://localhost:3000';
    elements.dataPathInput.value = currentConfig.dataPath || '';
    elements.maxStorageInput.value = currentConfig.maxStorageSize || '10GB';
    elements.autoStartInput.checked = currentConfig.autoStart || false;
    elements.minimizeToTrayInput.checked = currentConfig.minimizeToTray !== false;
    
    // Update dashboard info
    elements.currentPort.textContent = currentConfig.port || 3002;
    elements.maxStorage.textContent = currentConfig.maxStorageSize || '10GB';
    elements.blockchainUrl.textContent = currentConfig.blockchainUrl || 'http://localhost:3000';
    elements.localAddress.textContent = `http://localhost:${currentConfig.port || 3002}`;
    elements.dataDirectory.textContent = currentConfig.dataPath || '~/topay-storage-data';
}

function updateServiceControls() {
    elements.startBtn.disabled = isServiceRunning;
    elements.stopBtn.disabled = !isServiceRunning;
    elements.serviceStatus.textContent = isServiceRunning ? 'Running' : 'Stopped';
}

function updateStatus(status, text) {
    elements.statusDot.className = `status-dot ${status}`;
    elements.statusText.textContent = text;
}

function updateServiceStatus() {
    if (isServiceRunning) {
        updateStatus('connected', 'Connected');
    } else {
        updateStatus('disconnected', 'Disconnected');
    }
}

function updateConnectedNodes(change) {
    const current = parseInt(elements.connectedNodes.textContent) || 0;
    const newValue = Math.max(0, current + change);
    elements.connectedNodes.textContent = newValue;
}

function updateStorageUsage(used, max) {
    elements.usedStorage.textContent = used;
    const percentage = (parseFloat(used) / parseFloat(max)) * 100;
    elements.storageProgress.style.width = `${percentage}%`;
    elements.storagePercentage.textContent = `${percentage.toFixed(1)}%`;
}

// Activity and logging functions
function addActivity(message) {
    const timestamp = new Date().toLocaleTimeString();
    const activity = { timestamp, message };
    
    activityLog.unshift(activity);
    if (activityLog.length > 50) {
        activityLog.pop();
    }
    
    updateActivityList();
}

function updateActivityList() {
    elements.activityList.innerHTML = '';
    
    activityLog.slice(0, 10).forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-time">${activity.timestamp}</div>
            <div class="activity-message">${activity.message}</div>
        `;
        elements.activityList.appendChild(item);
    });
}

function addLogEntry(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        <span class="log-message">${message.trim()}</span>
    `;
    
    elements.logsContent.appendChild(entry);
    elements.logsContent.scrollTop = elements.logsContent.scrollHeight;
    
    // Limit log entries
    const entries = elements.logsContent.children;
    if (entries.length > 1000) {
        elements.logsContent.removeChild(entries[0]);
    }
}

function clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
        elements.logsContent.innerHTML = '';
        addLogEntry('Logs cleared', 'info');
        showToast('Logs cleared', 'success');
    }
}

function exportLogs() {
    const logs = Array.from(elements.logsContent.children)
        .map(entry => entry.textContent)
        .join('\n');
    
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topay-storage-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Logs exported successfully', 'success');
}

// Utility functions
function showLoading(show) {
    elements.loadingOverlay.classList.toggle('show', show);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

async function openDataDirectory() {
    try {
        await ipcRenderer.invoke('show-item-in-folder', currentConfig.dataPath || '');
    } catch (error) {
        console.error('Failed to open data directory:', error);
        showToast('Failed to open data directory', 'error');
    }
}

// Storage API functions
async function fetchStorageStats() {
    try {
        const port = currentConfig.port || 3002;
        const response = await fetch(`http://localhost:${port}/api/storage/stats`, {
            headers: {
                'Authorization': `Bearer ${await getStorageToken()}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.stats;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch storage stats:', error);
        return null;
    }
}

async function getStorageToken() {
    // Get auth token from main process or storage service
    try {
        return await ipcRenderer.invoke('get-storage-token');
    } catch (error) {
        return 'default-token';
    }
}

// Analytics functions
function updateAnalytics(stats) {
    if (!stats) return;
    
    analyticsData = {
        ...analyticsData,
        blocksStored: stats.blocksStored || 0,
        transactionsStored: stats.transactionsStored || 0,
        stateUpdates: stats.stateUpdates || 0,
        totalRequests: stats.totalRequests || 0,
        storageUsed: stats.storageUsed || 0,
        uptime: stats.uptime || 0
    };
    
    // Update analytics display if analytics tab is active
    updateAnalyticsDisplay();
    
    // Store hourly stats
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    
    const existingHourIndex = analyticsData.hourlyStats.findIndex(h => h.hour === hourKey);
    if (existingHourIndex >= 0) {
        analyticsData.hourlyStats[existingHourIndex] = { hour: hourKey, ...stats };
    } else {
        analyticsData.hourlyStats.push({ hour: hourKey, ...stats });
        // Keep only last 24 hours
        if (analyticsData.hourlyStats.length > 24) {
            analyticsData.hourlyStats.shift();
        }
    }
}

function updateAnalyticsDisplay() {
    // Update analytics elements if they exist
    const analyticsElements = {
        blocksCount: document.getElementById('blocksCount'),
        transactionsCount: document.getElementById('transactionsCount'),
        stateUpdatesCount: document.getElementById('stateUpdatesCount'),
        totalRequestsCount: document.getElementById('totalRequestsCount'),
        uptimeDisplay: document.getElementById('uptimeDisplay')
    };
    
    if (analyticsElements.blocksCount) {
        analyticsElements.blocksCount.textContent = analyticsData.blocksStored.toLocaleString();
    }
    if (analyticsElements.transactionsCount) {
        analyticsElements.transactionsCount.textContent = analyticsData.transactionsStored.toLocaleString();
    }
    if (analyticsElements.stateUpdatesCount) {
        analyticsElements.stateUpdatesCount.textContent = analyticsData.stateUpdates.toLocaleString();
    }
    if (analyticsElements.totalRequestsCount) {
        analyticsElements.totalRequestsCount.textContent = analyticsData.totalRequests.toLocaleString();
    }
    if (analyticsElements.uptimeDisplay) {
        const uptimeHours = Math.floor(analyticsData.uptime / (1000 * 60 * 60));
        const uptimeMinutes = Math.floor((analyticsData.uptime % (1000 * 60 * 60)) / (1000 * 60));
        analyticsElements.uptimeDisplay.textContent = `${uptimeHours}h ${uptimeMinutes}m`;
    }
}

// Reverse data read RPC function
async function queryBlockchainData(dataHash, dataType = 'any') {
    try {
        const port = currentConfig.port || 3002;
        const response = await fetch(`http://localhost:${port}/api/storage/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getStorageToken()}`
            },
            body: JSON.stringify({
                dataHash,
                dataType,
                queryAllNodes: true,
                timestamp: Date.now()
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            return result;
        }
        throw new Error(`Query failed: ${response.statusText}`);
    } catch (error) {
        console.error('Blockchain data query failed:', error);
        throw error;
    }
}

// Global functions for HTML onclick handlers
window.openExternal = async (url) => {
    try {
        await ipcRenderer.invoke('open-external', url);
    } catch (error) {
        console.error('Failed to open external URL:', error);
        showToast('Failed to open URL', 'error');
    }
};

// Global function for data queries
window.queryData = async (hash, type) => {
    try {
        showLoading(true);
        const result = await queryBlockchainData(hash, type);
        showToast(`Query completed: ${result.found ? 'Data found' : 'Data not found'}`, result.found ? 'success' : 'warning');
        return result;
    } catch (error) {
        showToast('Query failed', 'error');
        throw error;
    } finally {
        showLoading(false);
    }
};

// Periodic updates
setInterval(async () => {
    // Update storage usage with real data
    if (isServiceRunning) {
        try {
            const stats = await fetchStorageStats();
            if (stats) {
                updateStorageUsage(
                    `${(stats.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                    currentConfig.maxStorageSize || '10GB'
                );
                updateConnectedNodes(stats.connectedNodes || 0);
                updateAnalytics(stats);
            }
        } catch (error) {
            console.error('Failed to fetch real storage stats:', error);
            // Fallback to basic status check
            const isRunning = await ipcRenderer.invoke('get-storage-status');
            if (!isRunning) {
                isServiceRunning = false;
                updateServiceControls();
                updateStatus('disconnected', 'Disconnected');
            }
        }
    }
}, 10000);

// Handle window focus
window.addEventListener('focus', () => {
    // Refresh status when window gains focus
    updateServiceStatus();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey) {
        switch (event.key) {
            case '1':
                document.querySelector('[data-tab="dashboard"]').click();
                break;
            case '2':
                document.querySelector('[data-tab="configuration"]').click();
                break;
            case '3':
                document.querySelector('[data-tab="logs"]').click();
                break;
            case '4':
                document.querySelector('[data-tab="about"]').click();
                break;
        }
    }
});

// Initialize activity log with welcome message
addActivity('Welcome to TOPAY Storage Device');
addLogEntry('Application started successfully', 'info');

console.log('TOPAY Storage Device renderer initialized');