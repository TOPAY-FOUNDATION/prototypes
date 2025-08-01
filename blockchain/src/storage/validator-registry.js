/**
 * TOPAY Validator Registry System
 * Manages validator connections through codes instead of direct URLs
 */

import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { ValidatorRegistrationRPC } from '../rpc/validator-registration-rpc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ValidatorRegistry {
    constructor(options = {}) {
        this.validators = new Map(); // code -> validator info
        this.activeValidators = new Set();
        this.failedValidators = new Set();
        this.options = {
            timeout: options.timeout || 10000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            healthCheckInterval: options.healthCheckInterval || 30000,
            enableRPC: options.enableRPC !== false, // Default to true
            ...options
        };
        
        // Initialize RPC registration system
        if (this.options.enableRPC) {
            this.rpcSystem = new ValidatorRegistrationRPC({
                registryFile: path.join(__dirname, '../../validator-registry.json'),
                ...options.rpcOptions
            });
            console.log('🌐 RPC registration system enabled');
        }
        
        // Load default validators
        this.loadDefaultValidators();
        
        // Start health check
        this.startHealthCheck();
        
        console.log('🏛️ Validator Registry initialized');
    }

    /**
     * Load default validator configurations
     */
    loadDefaultValidators() {
        // Get base host and protocol from environment
        const baseHost = process.env.VALIDATOR_HOST || 'localhost';
        const protocol = process.env.VALIDATOR_PROTOCOL || 'http';
        
        const defaultValidators = [
            {
                code: 'TOPAY-VAL-LOCAL-001',
                name: 'Local Validator 1',
                port: 8547,
                region: 'local',
                tier: 'primary'
            },
            {
                code: 'TOPAY-VAL-LOCAL-002', 
                name: 'Local Validator 2',
                port: 8548,
                region: 'local',
                tier: 'secondary'
            }
        ];

        // Load from environment if available
        if (process.env.VALIDATOR_CODES && process.env.VALIDATOR_PORTS) {
            const codes = process.env.VALIDATOR_CODES.split(',');
            const ports = process.env.VALIDATOR_PORTS.split(',').map(p => parseInt(p.trim()));
            
            codes.forEach((code, index) => {
                const port = ports[index] || (8547 + index);
                this.registerValidator({
                    code: code.trim(),
                    name: `Validator ${index + 1}`,
                    url: this.buildValidatorUrl(protocol, baseHost, port, code.trim()),
                    port: port,
                    region: process.env.VALIDATOR_REGION || 'local',
                    tier: index === 0 ? 'primary' : 'secondary'
                });
            });
        } else {
            // Use defaults
            defaultValidators.forEach(validator => {
                validator.url = this.buildValidatorUrl(protocol, baseHost, validator.port, validator.code);
                this.registerValidator(validator);
            });
        }
    }

    /**
     * Build validator URL with port and /code structure
     */
    buildValidatorUrl(protocol, host, port, code) {
        return `${protocol}://${host}:${port}/code/${code}`;
    }

    /**
     * Register a new validator
     */
    registerValidator(validatorInfo) {
        const {
            code,
            name,
            url,
            region = 'unknown',
            tier = 'secondary',
            capabilities = ['storage', 'validation'],
            metadata = {}
        } = validatorInfo;

        if (!code || !url) {
            throw new Error('Validator code and URL are required');
        }

        const validator = {
            code,
            name: name || `Validator ${code}`,
            url,
            region,
            tier,
            capabilities,
            metadata,
            status: 'unknown',
            lastSeen: null,
            registeredAt: new Date().toISOString(),
            healthScore: 100,
            responseTime: null,
            errorCount: 0
        };

        this.validators.set(code, validator);
        console.log(`✅ Registered validator: ${code} (${name}) at ${url}`);
        
        return validator;
    }

    /**
     * Get validator by code
     */
    getValidator(code) {
        return this.validators.get(code);
    }

    /**
     * Get validator URL for a specific code
     */
    getValidatorUrl(code) {
        const validator = this.getValidator(code);
        return validator ? validator.url : null;
    }

    /**
     * Get root URL from validator URL
     */
    getRootUrlFromValidator(code) {
        const validator = this.getValidator(code);
        if (!validator) return null;
        
        // Extract root URL by removing /code/{CODE} part
        return validator.url.replace(/\/code\/[^\/]+$/, '');
    }

    /**
     * Get all validators
     */
    getAllValidators() {
        return Array.from(this.validators.values());
    }

    /**
     * Get active validators
     */
    getActiveValidators() {
        // Sync with RPC system if enabled
        if (this.options.enableRPC) {
            this.syncWithRPCSystem();
        }
        
        return this.getAllValidators().filter(v => this.activeValidators.has(v.code));
    }

    /**
     * Sync validators from RPC registration system
     */
    syncWithRPCSystem() {
        if (!this.rpcSystem) return;
        
        try {
            const rpcValidators = this.rpcSystem.getActiveValidators();
            
            rpcValidators.forEach(rpcValidator => {
                // Convert RPC validator format to registry format
                const validator = {
                    code: rpcValidator.code,
                    name: rpcValidator.name,
                    url: rpcValidator.url,
                    ip: rpcValidator.ip,
                    port: rpcValidator.port,
                    region: rpcValidator.region,
                    tier: rpcValidator.tier,
                    capabilities: rpcValidator.capabilities,
                    status: rpcValidator.status,
                    healthScore: rpcValidator.healthScore,
                    responseTime: 0,
                    lastCheck: rpcValidator.lastSeen,
                    registeredAt: rpcValidator.registeredAt,
                    source: 'rpc' // Mark as RPC-registered
                };
                
                // Add or update validator in main registry
                this.validators.set(rpcValidator.code, validator);
            });
            
            console.log(`🔄 Synced ${rpcValidators.length} RPC validators`);
        } catch (error) {
            console.error('❌ Error syncing with RPC system:', error.message);
        }
    }

    /**
     * Get RPC registration system
     */
    getRPCSystem() {
        return this.rpcSystem;
    }

    /**
     * Setup RPC routes on Express app
     */
    setupRPCRoutes(app) {
        if (this.rpcSystem) {
            this.rpcSystem.setupRoutes(app);
            console.log('🌐 RPC routes setup complete');
        } else {
            console.warn('⚠️ RPC system not enabled');
        }
    }

    /**
     * Get validators by tier
     */
    getValidatorsByTier(tier) {
        return this.getAllValidators().filter(v => v.tier === tier);
    }

    /**
     * Get validators by region
     */
    getValidatorsByRegion(region) {
        return this.getAllValidators().filter(v => v.region === region);
    }

    /**
     * Get best validators for operation
     */
    getBestValidators(count = 2, criteria = 'health') {
        let validators = this.getActiveValidators();
        
        switch (criteria) {
            case 'health':
                validators.sort((a, b) => b.healthScore - a.healthScore);
                break;
            case 'response':
                validators.sort((a, b) => (a.responseTime || Infinity) - (b.responseTime || Infinity));
                break;
            case 'tier':
                validators.sort((a, b) => {
                    const tierOrder = { primary: 0, secondary: 1, tertiary: 2 };
                    return (tierOrder[a.tier] || 3) - (tierOrder[b.tier] || 3);
                });
                break;
        }
        
        return validators.slice(0, count);
    }

    /**
     * Connect to validators using codes
     */
    async connectToValidators(codes) {
        if (!Array.isArray(codes)) {
            codes = [codes];
        }

        const results = [];
        
        for (const code of codes) {
            try {
                const result = await this.connectToValidator(code);
                results.push(result);
            } catch (error) {
                console.error(`❌ Failed to connect to validator ${code}:`, error.message);
                results.push({ code, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Connect to a specific validator
     */
    async connectToValidator(code) {
        const validator = this.getValidator(code);
        if (!validator) {
            throw new Error(`Validator with code ${code} not found`);
        }

        const startTime = Date.now();
        
        try {
            // Test connection
            const response = await this.makeRequest(validator.url, '/api/status', 'GET');
            const responseTime = Date.now() - startTime;
            
            // Update validator status
            validator.status = 'active';
            validator.lastSeen = new Date().toISOString();
            validator.responseTime = responseTime;
            validator.errorCount = 0;
            validator.healthScore = Math.min(100, validator.healthScore + 5);
            
            this.activeValidators.add(code);
            this.failedValidators.delete(code);
            
            console.log(`✅ Connected to validator ${code} (${responseTime}ms)`);
            
            return {
                code,
                success: true,
                url: validator.url,
                responseTime,
                status: response
            };
            
        } catch (error) {
            // Update validator status
            validator.status = 'failed';
            validator.errorCount++;
            validator.healthScore = Math.max(0, validator.healthScore - 10);
            
            this.activeValidators.delete(code);
            this.failedValidators.add(code);
            
            throw error;
        }
    }

    /**
     * Make HTTP request to validator
     */
    async makeRequest(validatorUrl, endpoint, method = 'GET', data = null) {
        // validatorUrl already includes /code/{CODE}, just append endpoint
        const url = `${validatorUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'TOPAY-Blockchain/1.0',
                'X-Validator-Code': this.extractCodeFromUrl(validatorUrl)
            },
            timeout: this.options.timeout
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * Extract validator code from URL
     */
    extractCodeFromUrl(url) {
        const match = url.match(/\/code\/([^\/]+)/);
        return match ? match[1] : 'unknown';
    }

    /**
     * Save data to validators using codes
     */
    async saveToValidators(codes, endpoint, data) {
        const validators = codes.map(code => this.getValidator(code)).filter(Boolean);
        
        if (validators.length === 0) {
            throw new Error('No valid validators found for the provided codes');
        }

        const results = [];
        
        for (const validator of validators) {
            try {
                const result = await this.makeRequest(validator.url, endpoint, 'POST', data);
                results.push({
                    code: validator.code,
                    success: true,
                    result
                });
                
                console.log(`✅ Data saved to validator ${validator.code}`);
            } catch (error) {
                console.error(`❌ Failed to save to validator ${validator.code}:`, error.message);
                results.push({
                    code: validator.code,
                    success: false,
                    error: error.message
                });
                
                // Update validator health
                validator.errorCount++;
                validator.healthScore = Math.max(0, validator.healthScore - 5);
            }
        }
        
        return results;
    }

    /**
     * Load data from validators using codes
     */
    async loadFromValidators(codes, endpoint) {
        const validators = codes.map(code => this.getValidator(code)).filter(Boolean);
        
        if (validators.length === 0) {
            throw new Error('No valid validators found for the provided codes');
        }

        // Try validators in order of health score
        validators.sort((a, b) => b.healthScore - a.healthScore);
        
        for (const validator of validators) {
            try {
                const result = await this.makeRequest(validator.url, endpoint, 'GET');
                console.log(`✅ Data loaded from validator ${validator.code}`);
                return result;
            } catch (error) {
                console.error(`❌ Failed to load from validator ${validator.code}:`, error.message);
                
                // Update validator health
                validator.errorCount++;
                validator.healthScore = Math.max(0, validator.healthScore - 5);
                
                continue; // Try next validator
            }
        }
        
        throw new Error('Failed to load data from any validator');
    }

    /**
     * Start health check for all validators
     */
    startHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            console.log('🔍 Running validator health check...');
            
            for (const [code, validator] of this.validators) {
                try {
                    await this.connectToValidator(code);
                } catch (error) {
                    // Health check failure is already handled in connectToValidator
                }
            }
            
            this.displayHealthStatus();
        }, this.options.healthCheckInterval);
    }

    /**
     * Stop health check
     */
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Display health status
     */
    displayHealthStatus() {
        const active = this.activeValidators.size;
        const total = this.validators.size;
        const failed = this.failedValidators.size;
        
        console.log(`📊 Validator Health: ${active}/${total} active, ${failed} failed`);
        
        if (this.options.debugMode) {
            for (const validator of this.getAllValidators()) {
                const status = this.activeValidators.has(validator.code) ? '🟢' : '🔴';
                console.log(`   ${status} ${validator.code}: ${validator.healthScore}% (${validator.responseTime || 'N/A'}ms)`);
            }
        }
    }

    /**
     * Generate new validator code
     */
    generateValidatorCode(prefix = 'TOPAY-VAL') {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Export registry configuration
     */
    exportConfig() {
        return {
            validators: Array.from(this.validators.values()),
            activeValidators: Array.from(this.activeValidators),
            failedValidators: Array.from(this.failedValidators),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import registry configuration
     */
    importConfig(config) {
        this.validators.clear();
        this.activeValidators.clear();
        this.failedValidators.clear();
        
        if (config.validators) {
            config.validators.forEach(validator => {
                this.validators.set(validator.code, validator);
            });
        }
        
        if (config.activeValidators) {
            config.activeValidators.forEach(code => {
                this.activeValidators.add(code);
            });
        }
        
        if (config.failedValidators) {
            config.failedValidators.forEach(code => {
                this.failedValidators.add(code);
            });
        }
        
        console.log(`📥 Imported ${this.validators.size} validators from configuration`);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopHealthCheck();
        this.validators.clear();
        this.activeValidators.clear();
        this.failedValidators.clear();
        console.log('🧹 Validator registry destroyed');
    }
}

export default ValidatorRegistry;