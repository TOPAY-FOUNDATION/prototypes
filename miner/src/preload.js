/**
 * TOPAY Miner Desktop Application
 * Preload script for secure renderer-main communication
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Miner control
    miner: {
        start: () => ipcRenderer.invoke('miner:start'),
        stop: () => ipcRenderer.invoke('miner:stop'),
        restart: () => ipcRenderer.invoke('miner:restart'),
        getStatus: () => ipcRenderer.invoke('miner:status'),
        

        
        // Event listeners
        onStatusChanged: (callback) => {
            ipcRenderer.on('miner:status-changed', callback);
            return () => ipcRenderer.removeListener('miner:status-changed', callback);
        },
        onError: (callback) => {
            ipcRenderer.on('miner:error', callback);
            return () => ipcRenderer.removeListener('miner:error', callback);
        }
    },

    // Configuration management
    config: {
        get: () => ipcRenderer.invoke('config:get'),
        set: (key, value) => ipcRenderer.invoke('config:set', key, value),
        getAutoStart: () => ipcRenderer.invoke('config:get-autostart'),
        setAutoStart: (enabled) => ipcRenderer.invoke('config:set-autostart', enabled)
    },

    // Window operations
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        close: () => ipcRenderer.invoke('window:close'),
        maximize: () => ipcRenderer.invoke('window:maximize')
    },

    // Navigation
    navigation: {
        onNavigate: (callback) => {
            ipcRenderer.on('navigate-to', callback);
            return () => ipcRenderer.removeListener('navigate-to', callback);
        }
    },

    // Notifications
    notifications: {
        onNotification: (callback) => {
            ipcRenderer.on('notification', callback);
            return () => ipcRenderer.removeListener('notification', callback);
        }
    }
});