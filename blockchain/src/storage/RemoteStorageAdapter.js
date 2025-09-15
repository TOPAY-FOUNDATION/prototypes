/**
 * Remote Storage Adapter for TOPAY Blockchain
 * 
 * This adapter allows the blockchain to use remote storage clients
 * instead of local storage, enabling deployment on services like Render
 * that don't provide persistent storage.
 */

import axios from 'axios';
import crypto from 'crypto';
import { EventEmitter } from 'events';

class RemoteStorageAdapter extends EventEmitter {
    constructor(options = {}) {
        super();
        this.apiKey = options.apiKey || 'blockchain-server-key';
        this.timeout = options.timeout || 30000;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        // Cache for frequently accessed data
        this.cache = new Map();
        this.cacheSize = options.cacheSize || 1000;
        
        // Storage device registry
        this.registeredDevices = new Map();
        this.deviceHealthStatus = new Map();
        this.currentDeviceIndex = 0;
        
        // Device management settings (from environment or defaults)
        this.healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || options.healthCheckInterval || 30000; // 30 seconds
        this.maxDeviceErrors = parseInt(process.env.MAX_DEVICE_ERRORS) || options.maxDeviceErrors || 5;
        this.deviceTimeout = parseInt(process.env.DEVICE_TIMEOUT) || options.deviceTimeout || 10000;
        this.loadBalancingStrategy = process.env.LOAD_BALANCING || options.loadBalancingStrategy || 'round-robin'; // 'round-robin', 'least-loaded', 'random'
        
        // Callback/webhook settings
        this.enableCallbacks = process.env.ENABLE_CALLBACKS !== 'false' && options.enableCallbacks !== false; // Default to true
        this.callbackTimeout = parseInt(process.env.CALLBACK_TIMEOUT) || options.callbackTimeout || 15000;
        this.maxCallbackRetries = parseInt(process.env.MAX_CALLBACK_RETRIES) || options.maxCallbackRetries || 2;
        
        // Health check timer
        this.healthCheckTimer = null;
        
        this.stats = {
            requests: 0,
            errors: 0,
            cacheHits: 0,
            totalResponseTime: 0,
            deviceHealthChecks: 0,
            failedHealthChecks: 0
        };
    }

    /**
     * Initialize the storage adapter
     */
    async initialize() {
        console.log('🔗 Initializing Remote Storage Adapter...');
        console.log('📋 Waiting for storage devices to register...');
        
        // Start periodic health checks
        this.startHealthCheckSystem();
        
        return true;
    }

    /**
     * Start the health check system for registered devices
     */
    startHealthCheckSystem() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        
        this.healthCheckTimer = setInterval(async () => {
            await this.performHealthChecks();
        }, this.healthCheckInterval);
        
        console.log(`💓 Health check system started (interval: ${this.healthCheckInterval}ms)`);
    }

    /**
     * Perform health checks on all registered devices
     */
    async performHealthChecks() {
        const devices = Array.from(this.registeredDevices.values());
        
        if (devices.length === 0) {
            return;
        }
        
        console.log(`💓 Performing health checks on ${devices.length} devices...`);
        
        const healthCheckPromises = devices.map(async (device) => {
            try {
                this.stats.deviceHealthChecks++;
                
                const response = await axios.get(`${device.url}/health`, {
                    timeout: this.deviceTimeout,
                    headers: {
                        'X-API-Key': this.apiKey
                    }
                });
                
                if (response.status === 200) {
                    this.updateDeviceHealth(device.id, true);
                    device.lastHealthCheck = new Date().toISOString();
                    device.consecutiveErrors = 0;
                } else {
                    throw new Error(`Health check failed with status: ${response.status}`);
                }
            } catch (error) {
                this.stats.failedHealthChecks++;
                device.consecutiveErrors = (device.consecutiveErrors || 0) + 1;
                device.lastError = error.message;
                device.lastHealthCheck = new Date().toISOString();
                
                // Mark device as unhealthy if it has too many consecutive errors
                if (device.consecutiveErrors >= this.maxDeviceErrors) {
                    this.updateDeviceHealth(device.id, false);
                    console.warn(`⚠️ Device ${device.id} marked as unhealthy after ${device.consecutiveErrors} consecutive errors`);
                }
            }
        });
        
        await Promise.allSettled(healthCheckPromises);
    }

    /**
     * Register a storage device
     */
    registerDevice(deviceInfo) {
        const { deviceId, url, capabilities, metadata } = deviceInfo;
        
        if (!deviceId || !url) {
            throw new Error('Device ID and URL are required');
        }

        const device = {
            id: deviceId,
            url: url,
            capabilities: capabilities || ['blocks', 'transactions', 'state'],
            metadata: metadata || {},
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            isHealthy: true,
            requestCount: 0,
            errorCount: 0
        };

        this.registeredDevices.set(deviceId, device);
        this.deviceHealthStatus.set(deviceId, true);
        
        console.log(`📱 Storage device registered: ${deviceId} at ${url}`);
        return device;
    }

    /**
     * Unregister a storage device
     */
    unregisterDevice(deviceId) {
        if (this.registeredDevices.has(deviceId)) {
            this.registeredDevices.delete(deviceId);
            this.deviceHealthStatus.delete(deviceId);
            console.log(`📱 Storage device unregistered: ${deviceId}`);
            return true;
        }
        return false;
    }

    /**
     * Get a healthy storage device using the configured load balancing strategy
     */
    getAvailableDevice(capability = null) {
        const devices = Array.from(this.registeredDevices.values())
            .filter(device => {
                const isHealthy = this.deviceHealthStatus.get(device.id);
                const hasCapability = !capability || device.capabilities.includes(capability);
                return isHealthy && hasCapability;
            });

        if (devices.length === 0) {
            throw new Error(`No healthy storage devices available${capability ? ` with capability: ${capability}` : ''}`);
        }

        let selectedDevice;
        
        switch (this.loadBalancingStrategy) {
            case 'least-loaded':
                selectedDevice = this.selectLeastLoadedDevice(devices);
                break;
            case 'random':
                selectedDevice = this.selectRandomDevice(devices);
                break;
            case 'round-robin':
            default:
                selectedDevice = this.selectRoundRobinDevice(devices);
                break;
        }
        
        // Update device usage statistics
        selectedDevice.requestCount++;
        selectedDevice.lastUsed = new Date().toISOString();
        
        return selectedDevice;
    }

    /**
     * Select device using round-robin strategy
     */
    selectRoundRobinDevice(devices) {
        const device = devices[this.currentDeviceIndex % devices.length];
        this.currentDeviceIndex++;
        return device;
    }

    /**
     * Select device with least load (fewest requests)
     */
    selectLeastLoadedDevice(devices) {
        return devices.reduce((least, current) => {
            const leastLoad = least.requestCount || 0;
            const currentLoad = current.requestCount || 0;
            return currentLoad < leastLoad ? current : least;
        });
    }

    /**
     * Select random device
     */
    selectRandomDevice(devices) {
        const randomIndex = Math.floor(Math.random() * devices.length);
        return devices[randomIndex];
    }

    /**
      * Update device health status
      */
     updateDeviceHealth(deviceId, isHealthy) {
         if (this.registeredDevices.has(deviceId)) {
             this.deviceHealthStatus.set(deviceId, isHealthy);
             const device = this.registeredDevices.get(deviceId);
             device.lastSeen = new Date().toISOString();
             device.isHealthy = isHealthy;
             
             if (!isHealthy) {
                 device.errorCount++;
                 console.warn(`⚠️ Device ${deviceId} marked as unhealthy`);
             }
         }
     }

     /**
      * Make a request to a specific storage device
      */
     async makeDeviceRequest(device, method, endpoint, data = null) {
         const client = axios.create({
             baseURL: device.url,
             timeout: this.timeout,
             headers: {
                 'Content-Type': 'application/json',
                 'X-API-Key': this.apiKey
             }
         });

         try {
             const config = { method, url: endpoint };
             if (data) config.data = data;
             
             const response = await client(config);
             this.updateDeviceHealth(device.id, true);
             return response;
         } catch (error) {
             this.updateDeviceHealth(device.id, false);
             throw error;
         }
     }

    async authenticate() {
        try {
            const timestamp = Date.now();
            const signature = crypto
                .createHash('sha256')
                .update(`${this.blockchainId}:${timestamp}`)
                .digest('hex');

            const response = await axios.post(`${this.storageUrl}/api/auth/register`, {
                blockchainId: this.blockchainId,
                signature,
                timestamp
            }, {
                timeout: 10000
            });

            if (response.data.success) {
                this.authToken = response.data.token;
                console.log('🔐 Authentication successful');
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error(`Storage service not available at ${this.storageUrl}`);
            }
            throw error;
        }
    }

    async testConnection() {
        try {
            const response = await axios.get(`${this.storageUrl}/health`, {
                timeout: 5000
            });
            
            if (response.data.status !== 'healthy') {
                throw new Error('Storage service is not healthy');
            }
        } catch (error) {
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };
    }

    async withRetry(operation, context = '') {
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                this.stats.networkErrors++;
                
                if (attempt === this.maxRetries) {
                    console.error(`❌ ${context} failed after ${this.maxRetries} attempts:`, error.message);
                    throw error;
                }
                
                console.warn(`⚠️ ${context} attempt ${attempt + 1} failed, retrying in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                
                // Exponential backoff
                this.retryDelay *= 1.5;
            }
        }
    }

    // Block storage methods
    async storeBlock(block) {
        const startTime = Date.now();
        
        try {
            this.stats.requests++;
            
            const device = this.getAvailableDevice('blocks');
            const response = await this.makeDeviceRequest(device, 'POST', '/api/storage/block', {
                block: block
            });
            
            // Cache the block
            this.addToCache(`block:${block.hash}`, block);
            
            this.stats.totalResponseTime += Date.now() - startTime;
            device.requestCount++;
            
            console.log(`📦 Block stored on device ${device.id}: ${block.hash}`);
            this.emit('blockStored', block);
            return response.data;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Failed to store block:', error.message);
            throw error;
        }
    }

    async getBlock(hash) {
        // Check cache first
        const cacheKey = `block:${hash}`;
        if (this.cache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.cache.get(cacheKey);
        }
        
        this.stats.cacheMisses++;
        
        return await this.withRetry(async () => {
            const response = await axios.get(
                `${this.storageUrl}/api/storage/block/${hash}`,
                { 
                    headers: this.getAuthHeaders(),
                    timeout: 10000
                }
            );
            
            if (response.data.success) {
                const block = response.data.block;
                this.addToCache(cacheKey, block);
                return block;
            }
            
            return null;
        }, 'Block retrieval');
    }

    // Transaction storage methods
    async storeTransaction(transaction) {
        const startTime = Date.now();
        
        try {
            this.stats.requests++;
            
            const device = this.getAvailableDevice('transactions');
            const response = await this.makeDeviceRequest(device, 'POST', '/api/storage/transaction', {
                transaction: transaction
            });
            
            // Cache the transaction
            this.cache.set(`tx_${transaction.hash}`, transaction);
            
            this.stats.totalResponseTime += Date.now() - startTime;
            device.requestCount++;
            
            console.log(`💳 Transaction stored on device ${device.id}: ${transaction.hash}`);
            this.emit('transactionStored', transaction);
            return response.data;
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Failed to store transaction:', error.message);
            throw error;
        }
    }

    async getTransaction(hash) {
        // Check cache first
        const cacheKey = `tx:${hash}`;
        if (this.cache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.cache.get(cacheKey);
        }
        
        this.stats.cacheMisses++;
        
        return await this.withRetry(async () => {
            const response = await axios.get(
                `${this.storageUrl}/api/storage/transaction/${hash}`,
                { 
                    headers: this.getAuthHeaders(),
                    timeout: 10000
                }
            );
            
            if (response.data.success) {
                const transaction = response.data.transaction;
                this.addToCache(cacheKey, transaction);
                return transaction;
            }
            
            return null;
        }, 'Transaction retrieval');
    }

    // State storage methods
    async storeState(stateData) {
        return await this.withRetry(async () => {
            const response = await axios.post(
                `${this.storageUrl}/api/storage/state`,
                { stateData },
                { 
                    headers: this.getAuthHeaders(),
                    timeout: 20000
                }
            );
            
            if (response.data.success) {
                console.log('🔄 State stored remotely');
                this.emit('stateStored', stateData);
                return true;
            }
            
            throw new Error('State storage failed');
        }, 'State storage');
    }

    // Cache management
    addToCache(key, value) {
        if (this.cache.size >= this.cacheSize) {
            // Remove oldest entry (LRU)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, value);
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }

    // Backup methods
    async createBackup() {
        return await this.withRetry(async () => {
            const response = await axios.post(
                `${this.storageUrl}/api/storage/backup`,
                {},
                { 
                    headers: this.getAuthHeaders(),
                    timeout: 60000
                }
            );
            
            if (response.data.success) {
                console.log('💾 Remote backup created');
                return response.data.backupPath;
            }
            
            throw new Error('Backup creation failed');
        }, 'Backup creation');
    }

    // Statistics and monitoring
    async getStorageStats() {
        try {
            const response = await axios.get(
                `${this.storageUrl}/api/storage/stats`,
                { 
                    headers: this.getAuthHeaders(),
                    timeout: 5000
                }
            );
            
            return {
                local: this.stats,
                remote: response.data.stats,
                connection: {
                    connected: this.isConnected,
                    storageUrl: this.storageUrl,
                    cacheSize: this.cache.size
                }
            };
        } catch (error) {
            return {
                local: this.stats,
                remote: null,
                connection: {
                    connected: false,
                    error: error.message
                }
            };
        }
    }

    /**
     * Get storage statistics including device information
     */
    getStats() {
        const avgResponseTime = this.stats.requests > 0 
            ? this.stats.totalResponseTime / this.stats.requests 
            : 0;

        const deviceStats = Array.from(this.registeredDevices.values()).map(device => ({
            id: device.id,
            url: device.url,
            capabilities: device.capabilities,
            isHealthy: this.deviceHealthStatus.get(device.id),
            requestCount: device.requestCount,
            errorCount: device.errorCount,
            registeredAt: device.registeredAt,
            lastSeen: device.lastSeen
        }));

        return {
            ...this.stats,
            averageResponseTime: Math.round(avgResponseTime),
            cacheSize: this.cache.size,
            registeredDevices: deviceStats.length,
            healthyDevices: deviceStats.filter(d => d.isHealthy).length,
            devices: deviceStats
        };
    }

    /**
     * Get list of registered devices
     */
    getRegisteredDevices() {
        return Array.from(this.registeredDevices.values());
    }

    // Health check
    async healthCheck() {
        try {
            const response = await axios.get(`${this.storageUrl}/health`, {
                timeout: 5000
            });
            
            return {
                status: 'healthy',
                remote: response.data,
                connection: this.isConnected,
                cache: {
                    size: this.cache.size,
                    hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                connection: false
            };
        }
    }

    /**
     * Get device monitoring information
     */
    getDeviceMonitoring() {
        const devices = Array.from(this.registeredDevices.values());
        
        return {
            totalDevices: devices.length,
            healthyDevices: devices.filter(d => this.deviceHealthStatus.get(d.id)).length,
            unhealthyDevices: devices.filter(d => !this.deviceHealthStatus.get(d.id)).length,
            totalRequests: devices.reduce((sum, d) => sum + (d.requestCount || 0), 0),
            totalErrors: devices.reduce((sum, d) => sum + (d.errorCount || 0), 0),
            loadBalancingStrategy: this.loadBalancingStrategy,
            healthCheckStats: {
                totalChecks: this.stats.deviceHealthChecks,
                failedChecks: this.stats.failedHealthChecks,
                successRate: this.stats.deviceHealthChecks > 0 
                    ? ((this.stats.deviceHealthChecks - this.stats.failedHealthChecks) / this.stats.deviceHealthChecks * 100).toFixed(2) + '%'
                    : '0%'
            },
            devices: devices.map(device => ({
                id: device.id,
                url: device.url,
                isHealthy: this.deviceHealthStatus.get(device.id),
                requestCount: device.requestCount || 0,
                errorCount: device.errorCount || 0,
                consecutiveErrors: device.consecutiveErrors || 0,
                lastSeen: device.lastSeen,
                lastUsed: device.lastUsed,
                lastHealthCheck: device.lastHealthCheck,
                lastError: device.lastError,
                registeredAt: device.registeredAt,
                capabilities: device.capabilities,
                metadata: device.metadata
            }))
        };
    }

    /**
     * Force health check on a specific device
     */
    async forceHealthCheck(deviceId) {
        const device = this.registeredDevices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        
        try {
            const response = await axios.get(`${device.url}/health`, {
                timeout: this.deviceTimeout,
                headers: {
                    'X-API-Key': this.apiKey
                }
            });
            
            if (response.status === 200) {
                this.updateDeviceHealth(device.id, true);
                device.lastHealthCheck = new Date().toISOString();
                device.consecutiveErrors = 0;
                return { success: true, status: 'healthy' };
            } else {
                throw new Error(`Health check failed with status: ${response.status}`);
            }
        } catch (error) {
            device.consecutiveErrors = (device.consecutiveErrors || 0) + 1;
            device.lastError = error.message;
            device.lastHealthCheck = new Date().toISOString();
            
            if (device.consecutiveErrors >= this.maxDeviceErrors) {
                this.updateDeviceHealth(device.id, false);
            }
            
            return { success: false, status: 'unhealthy', error: error.message };
        }
    }

    /**
     * Request storage operation from a specific device via callback
     */
    async requestStorageOperation(deviceId, operation, data, retryCount = 0) {
        const device = this.registeredDevices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        
        if (!this.enableCallbacks) {
            throw new Error('Callback system is disabled');
        }
        
        try {
            const endpoint = this.getOperationEndpoint(operation);
            const method = this.getOperationMethod(operation);
            
            const response = await axios({
                method,
                url: `${device.url}${endpoint}`,
                data: data,
                timeout: this.callbackTimeout,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                    'X-Callback-Request': 'true'
                }
            });
            
            // Update device statistics
            device.requestCount++;
            device.lastUsed = new Date().toISOString();
            
            return {
                success: true,
                data: response.data,
                deviceId: device.id,
                operation
            };
        } catch (error) {
            device.errorCount = (device.errorCount || 0) + 1;
            device.lastError = error.message;
            
            // Retry logic
            if (retryCount < this.maxCallbackRetries) {
                console.warn(`⚠️ Callback failed for device ${deviceId}, retrying... (${retryCount + 1}/${this.maxCallbackRetries})`);
                return await this.requestStorageOperation(deviceId, operation, data, retryCount + 1);
            }
            
            // Mark device as unhealthy if too many errors
            if (device.errorCount >= this.maxDeviceErrors) {
                this.updateDeviceHealth(device.id, false);
            }
            
            throw new Error(`Callback failed for device ${deviceId}: ${error.message}`);
        }
    }

    /**
     * Broadcast storage operation to all healthy devices with capability
     */
    async broadcastStorageOperation(operation, data, capability = null) {
        const devices = Array.from(this.registeredDevices.values())
            .filter(device => {
                const isHealthy = this.deviceHealthStatus.get(device.id);
                const hasCapability = !capability || device.capabilities.includes(capability);
                return isHealthy && hasCapability;
            });
        
        if (devices.length === 0) {
            throw new Error(`No healthy devices available for operation: ${operation}`);
        }
        
        const results = await Promise.allSettled(
            devices.map(device => 
                this.requestStorageOperation(device.id, operation, data)
            )
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        const failed = results.filter(r => r.status === 'rejected').map(r => r.reason.message);
        
        return {
            success: successful.length > 0,
            totalDevices: devices.length,
            successful: successful.length,
            failed: failed.length,
            results: successful,
            errors: failed
        };
    }

    /**
     * Get the appropriate endpoint for a storage operation
     */
    getOperationEndpoint(operation) {
        const endpoints = {
            'store-block': '/api/storage/block',
            'get-block': '/api/storage/block',
            'store-transaction': '/api/storage/transaction',
            'get-transaction': '/api/storage/transaction',
            'store-state': '/api/storage/state',
            'get-state': '/api/storage/state',
            'backup': '/backup',
            'stats': '/stats'
        };
        
        return endpoints[operation] || '/api/storage/generic';
    }

    /**
     * Get the appropriate HTTP method for a storage operation
     */
    getOperationMethod(operation) {
        const methods = {
            'store-block': 'POST',
            'get-block': 'GET',
            'store-transaction': 'POST',
            'get-transaction': 'GET',
            'store-state': 'POST',
            'get-state': 'GET',
            'backup': 'POST',
            'stats': 'GET'
        };
        
        return methods[operation] || 'POST';
    }

    /**
     * Request storage operation with automatic device selection
     */
    async requestStorageOperationAuto(operation, data, capability = null) {
        try {
            const device = this.getAvailableDevice(capability);
            return await this.requestStorageOperation(device.id, operation, data);
        } catch (error) {
            // If primary device fails, try broadcast as fallback
            console.warn(`⚠️ Primary device failed, attempting broadcast for operation: ${operation}`);
            return await this.broadcastStorageOperation(operation, data, capability);
        }
    }

    // Cleanup
    async disconnect() {
        // Stop health check system
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
            console.log('💓 Health check system stopped');
        }
        
        this.clearCache();
        this.registeredDevices.clear();
        this.deviceHealthStatus.clear();
        console.log('🔌 Disconnected from remote storage');
        this.emit('disconnected');
    }
}

export default RemoteStorageAdapter;