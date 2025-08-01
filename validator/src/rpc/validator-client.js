/**
 * Validator Client for Self-Registration with Blockchain
 * Generates codes and registers with blockchain via RPC calls
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ValidatorClient {
    constructor(options = {}) {
        this.blockchainUrl = options.blockchainUrl || 'http://localhost:3000';
        this.validatorPort = options.validatorPort || 8547;
        this.validatorName = options.validatorName || `Validator-${Date.now()}`;
        this.region = options.region || 'local';
        this.tier = options.tier || 'secondary';
        this.capabilities = options.capabilities || ['storage', 'validation'];
        this.registryFile = options.registryFile || path.join(__dirname, '../../validator-info.json');
        
        this.validatorCode = null;
        this.isRegistered = false;
        this.registrationInfo = null;
        
        console.log('🔧 Validator Client initialized');
        console.log(`🌐 Blockchain URL: ${this.blockchainUrl}`);
        console.log(`🔌 Validator Port: ${this.validatorPort}`);
    }

    /**
     * Generate a unique validator code
     */
    generateValidatorCode() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        const port = this.validatorPort.toString();
        
        return `TOPAY-VAL-${port}-${timestamp}-${random}`.toUpperCase();
    }

    /**
     * Load existing validator info from file
     */
    loadValidatorInfo() {
        try {
            if (fs.existsSync(this.registryFile)) {
                const data = fs.readFileSync(this.registryFile, 'utf8');
                const info = JSON.parse(data);
                
                this.validatorCode = info.code;
                this.isRegistered = info.isRegistered || false;
                this.registrationInfo = info.registrationInfo;
                
                console.log(`📥 Loaded validator info: ${this.validatorCode}`);
                return true;
            }
        } catch (error) {
            console.error('❌ Error loading validator info:', error.message);
        }
        return false;
    }

    /**
     * Save validator info to file
     */
    saveValidatorInfo() {
        try {
            const info = {
                code: this.validatorCode,
                name: this.validatorName,
                port: this.validatorPort,
                region: this.region,
                tier: this.tier,
                capabilities: this.capabilities,
                isRegistered: this.isRegistered,
                registrationInfo: this.registrationInfo,
                lastUpdated: new Date().toISOString()
            };

            // Ensure directory exists
            const dir = path.dirname(this.registryFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(this.registryFile, JSON.stringify(info, null, 2));
            console.log(`💾 Saved validator info: ${this.validatorCode}`);
        } catch (error) {
            console.error('❌ Error saving validator info:', error.message);
        }
    }

    /**
     * Register validator with blockchain
     */
    async registerWithBlockchain() {
        try {
            // Generate code if not exists
            if (!this.validatorCode) {
                this.validatorCode = this.generateValidatorCode();
                console.log(`🔑 Generated validator code: ${this.validatorCode}`);
            }

            const registrationData = {
                code: this.validatorCode,
                name: this.validatorName,
                port: this.validatorPort,
                region: this.region,
                tier: this.tier,
                capabilities: this.capabilities,
                metadata: {
                    version: '1.0.0',
                    startTime: new Date().toISOString(),
                    nodeType: 'validator'
                }
            };

            console.log(`📞 Registering with blockchain: ${this.blockchainUrl}/rpc/validator/register`);

            const response = await fetch(`${this.blockchainUrl}/rpc/validator/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `TopayValidator/${this.validatorCode}`
                },
                body: JSON.stringify(registrationData)
            });

            const result = await response.json();

            if (result.success) {
                this.isRegistered = true;
                this.registrationInfo = result.validator;
                this.saveValidatorInfo();
                
                console.log('✅ Successfully registered with blockchain!');
                console.log(`📋 Validator URL: ${result.validator.url}`);
                console.log(`🆔 Validator Code: ${result.validator.code}`);
                
                return result;
            } else {
                console.error('❌ Registration failed:', result.error);
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ Error registering with blockchain:', error.message);
            throw error;
        }
    }

    /**
     * Update validator status with blockchain
     */
    async updateStatus(status = 'active', healthScore = 100, metadata = {}) {
        try {
            if (!this.isRegistered || !this.validatorCode) {
                throw new Error('Validator not registered');
            }

            const updateData = {
                code: this.validatorCode,
                status: status,
                healthScore: healthScore,
                metadata: {
                    ...metadata,
                    lastUpdate: new Date().toISOString()
                }
            };

            const response = await fetch(`${this.blockchainUrl}/rpc/validator/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `TopayValidator/${this.validatorCode}`
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (result.success) {
                console.log(`📊 Status updated: ${status} (Health: ${healthScore})`);
                return result;
            } else {
                console.error('❌ Status update failed:', result.error);
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ Error updating status:', error.message);
            throw error;
        }
    }

    /**
     * Unregister validator from blockchain
     */
    async unregisterFromBlockchain() {
        try {
            if (!this.isRegistered || !this.validatorCode) {
                throw new Error('Validator not registered');
            }

            const response = await fetch(`${this.blockchainUrl}/rpc/validator/unregister`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `TopayValidator/${this.validatorCode}`
                },
                body: JSON.stringify({
                    code: this.validatorCode
                })
            });

            const result = await response.json();

            if (result.success) {
                this.isRegistered = false;
                this.registrationInfo = null;
                this.saveValidatorInfo();
                
                console.log('✅ Successfully unregistered from blockchain');
                return result;
            } else {
                console.error('❌ Unregistration failed:', result.error);
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ Error unregistering from blockchain:', error.message);
            throw error;
        }
    }

    /**
     * Start periodic status updates
     */
    startStatusUpdates(intervalMs = 30000) {
        if (!this.isRegistered) {
            console.warn('⚠️ Cannot start status updates: validator not registered');
            return;
        }

        console.log(`⏰ Starting status updates every ${intervalMs}ms`);

        this.statusInterval = setInterval(async () => {
            try {
                await this.updateStatus('active', this.calculateHealthScore());
            } catch (error) {
                console.error('❌ Status update failed:', error.message);
            }
        }, intervalMs);
    }

    /**
     * Stop periodic status updates
     */
    stopStatusUpdates() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
            console.log('⏹️ Status updates stopped');
        }
    }

    /**
     * Calculate health score based on validator performance
     */
    calculateHealthScore() {
        // Simple health calculation - can be enhanced
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const memoryPercent = (memoryUsage.used / memoryUsage.total) * 100;
        
        let score = 100;
        
        // Reduce score based on memory usage
        if (memoryPercent > 80) score -= 20;
        else if (memoryPercent > 60) score -= 10;
        
        // Increase score for longer uptime
        if (uptime > 3600) score += 5; // 1 hour
        if (uptime > 86400) score += 10; // 1 day
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get validator information
     */
    getValidatorInfo() {
        return {
            code: this.validatorCode,
            name: this.validatorName,
            port: this.validatorPort,
            region: this.region,
            tier: this.tier,
            capabilities: this.capabilities,
            isRegistered: this.isRegistered,
            registrationInfo: this.registrationInfo,
            blockchainUrl: this.blockchainUrl
        };
    }

    /**
     * Initialize validator client
     */
    async initialize() {
        console.log('🚀 Initializing Validator Client...');
        
        // Load existing info
        this.loadValidatorInfo();
        
        // Register if not already registered
        if (!this.isRegistered) {
            await this.registerWithBlockchain();
        } else {
            console.log(`✅ Validator already registered: ${this.validatorCode}`);
            // Update status to indicate we're online
            await this.updateStatus('active', this.calculateHealthScore());
        }
        
        // Start periodic status updates
        this.startStatusUpdates();
        
        console.log('🎉 Validator Client initialized successfully!');
        return this.getValidatorInfo();
    }

    /**
     * Shutdown validator client
     */
    async shutdown() {
        console.log('🛑 Shutting down Validator Client...');
        
        this.stopStatusUpdates();
        
        if (this.isRegistered) {
            await this.updateStatus('offline', 0);
        }
        
        console.log('✅ Validator Client shutdown complete');
    }
}