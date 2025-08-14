/**
 * TOPAY Validator Desktop Application
 * Preload script for secure renderer-main communication
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Validator control
    validator: {
        start: () => ipcRenderer.invoke('validator:start'),
        stop: () => ipcRenderer.invoke('validator:stop'),
        restart: () => ipcRenderer.invoke('validator:restart'),
        getStatus: () => ipcRenderer.invoke('validator:status'),
        

        
        // Event listeners
        onStatusChanged: (callback) => {
            ipcRenderer.on('validator:status-changed', callback);
            return () => ipcRenderer.removeListener('validator:status-changed', callback);
        },
        onError: (callback) => {
            ipcRenderer.on('validator:error', callback);
            return () => ipcRenderer.removeListener('validator:error', callback);
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