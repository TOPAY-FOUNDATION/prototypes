/**
 * Electron Preload Script
 * Provides secure API bridge between renderer and main process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Validator operations
    getValidatorStatus: () => ipcRenderer.invoke('get-validator-status'),
    restartValidator: () => ipcRenderer.invoke('restart-validator'),
    
    // Configuration management
    getConfig: () => ipcRenderer.invoke('get-config'),
    updateConfig: (config) => ipcRenderer.invoke('update-config', config),
    
    // File operations
    exportLogs: () => ipcRenderer.invoke('export-logs'),
    
    // Window operations
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    
    // Event listeners
    onValidationUpdate: (callback) => {
        ipcRenderer.on('validation-update', callback);
        return () => ipcRenderer.removeListener('validation-update', callback);
    },
    
    onConfigUpdate: (callback) => {
        ipcRenderer.on('config-update', callback);
        return () => ipcRenderer.removeListener('config-update', callback);
    },
    
    onNetworkUpdate: (callback) => {
        ipcRenderer.on('network-update', callback);
        return () => ipcRenderer.removeListener('network-update', callback);
    },
    
    // Navigation
    navigateTo: (route) => ipcRenderer.send('navigate-to', route),
    
    // System info
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    
    // Notifications
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body)
});

// Version info
contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    app: () => ipcRenderer.invoke('get-app-version')
});

// Platform info
contextBridge.exposeInMainWorld('platform', {
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux'
});