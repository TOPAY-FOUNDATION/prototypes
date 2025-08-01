/**
 * Validator Registration RPC System
 * Allows validators to register themselves with the blockchain by sending their codes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ValidatorRegistrationRPC {
    constructor(options = {}) {
        this.registryFile = options.registryFile || path.join(__dirname, '../../validator-registry.json');
        this.validators = new Map();
        this.options = {
            allowedIPs: options.allowedIPs || [], // Empty means allow all
            requireAuth: options.requireAuth || false,
            maxValidators: options.maxValidators || 100,
            ...options
        };
        
        // Load existing registry
        this.loadRegistry();
        
        console.log('🔧 Validator Registration RPC initialized');
        console.log(`📁 Registry file: ${this.registryFile}`);
    }

    /**
     * Load existing validator registry from file
     */
    loadRegistry() {
        try {
            if (fs.existsSync(this.registryFile)) {
                const data = fs.readFileSync(this.registryFile, 'utf8');
                const registry = JSON.parse(data);
                
                // Convert to Map
                if (registry.validators) {
                    Object.entries(registry.validators).forEach(([code, validator]) => {
                        this.validators.set(code, {
                            ...validator,
                            lastSeen: new Date(validator.lastSeen),
                            registeredAt: new Date(validator.registeredAt)
                        });
                    });
                }
                
                console.log(`📥 Loaded ${this.validators.size} validators from registry`);
            } else {
                console.log('📝 Creating new validator registry');
                this.saveRegistry();
            }
        } catch (error) {
            console.error('❌ Error loading validator registry:', error.message);
            this.validators = new Map();
        }
    }

    /**
     * Save validator registry to file
     */
    saveRegistry() {
        try {
            const registry = {
                lastUpdated: new Date().toISOString(),
                totalValidators: this.validators.size,
                validators: Object.fromEntries(
                    Array.from(this.validators.entries()).map(([code, validator]) => [
                        code,
                        {
                            ...validator,
                            lastSeen: validator.lastSeen.toISOString(),
                            registeredAt: validator.registeredAt.toISOString()
                        }
                    ])
                )
            };

            fs.writeFileSync(this.registryFile, JSON.stringify(registry, null, 2));
            console.log(`💾 Saved ${this.validators.size} validators to registry`);
        } catch (error) {
            console.error('❌ Error saving validator registry:', error.message);
        }
    }

    /**
     * Extract IP address from request
     */
    extractIPFromRequest(req) {
        return req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               'unknown';
    }

    /**
     * Validate IP address
     */
    isIPAllowed(ip) {
        if (this.options.allowedIPs.length === 0) {
            return true; // Allow all if no restrictions
        }
        return this.options.allowedIPs.includes(ip);
    }

    /**
     * Generate validator code (if not provided)
     */
    generateValidatorCode(ip, port) {
        const timestamp = Date.now().toString(36);
        const ipHash = ip.replace(/\./g, '');
        return `TOPAY-VAL-${ipHash}-${port}-${timestamp}`.toUpperCase();
    }

    /**
     * RPC Method: Register Validator
     */
    async registerValidator(req, res) {
        try {
            const clientIP = this.extractIPFromRequest(req);
            const { code, name, port, region, tier, capabilities, metadata } = req.body;

            console.log(`📞 Validator registration request from ${clientIP}`);

            // Validate IP
            if (!this.isIPAllowed(clientIP)) {
                return res.status(403).json({
                    success: false,
                    error: 'IP address not allowed',
                    ip: clientIP
                });
            }

            // Check max validators limit
            if (this.validators.size >= this.options.maxValidators) {
                return res.status(429).json({
                    success: false,
                    error: 'Maximum validators limit reached',
                    limit: this.options.maxValidators
                });
            }

            // Generate code if not provided
            const validatorCode = code || this.generateValidatorCode(clientIP, port || 8547);

            // Check if code already exists
            if (this.validators.has(validatorCode)) {
                return res.status(409).json({
                    success: false,
                    error: 'Validator code already exists',
                    code: validatorCode
                });
            }

            // Create validator entry
            const validator = {
                code: validatorCode,
                name: name || `Validator ${validatorCode}`,
                ip: clientIP,
                port: port || 8547,
                url: `http://${clientIP}:${port || 8547}/code/${validatorCode}`,
                region: region || 'unknown',
                tier: tier || 'secondary',
                capabilities: capabilities || ['storage', 'validation'],
                metadata: metadata || {},
                status: 'active',
                registeredAt: new Date(),
                lastSeen: new Date(),
                healthScore: 100,
                requestCount: 0
            };

            // Add to registry
            this.validators.set(validatorCode, validator);
            
            // Save to file
            this.saveRegistry();

            console.log(`✅ Validator registered: ${validatorCode} from ${clientIP}:${port}`);

            return res.json({
                success: true,
                message: 'Validator registered successfully',
                validator: {
                    code: validatorCode,
                    name: validator.name,
                    url: validator.url,
                    status: validator.status,
                    registeredAt: validator.registeredAt
                }
            });

        } catch (error) {
            console.error('❌ Error registering validator:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * RPC Method: Update Validator Status
     */
    async updateValidatorStatus(req, res) {
        try {
            const clientIP = this.extractIPFromRequest(req);
            const { code, status, healthScore, metadata } = req.body;

            console.log(`📞 Validator status update from ${clientIP} for code: ${code}`);

            const validator = this.validators.get(code);
            if (!validator) {
                return res.status(404).json({
                    success: false,
                    error: 'Validator not found',
                    code: code
                });
            }

            // Verify IP matches
            if (validator.ip !== clientIP) {
                return res.status(403).json({
                    success: false,
                    error: 'IP address mismatch',
                    expected: validator.ip,
                    actual: clientIP
                });
            }

            // Update validator
            validator.lastSeen = new Date();
            validator.requestCount++;
            
            if (status) validator.status = status;
            if (healthScore !== undefined) validator.healthScore = healthScore;
            if (metadata) validator.metadata = { ...validator.metadata, ...metadata };

            // Save to file
            this.saveRegistry();

            return res.json({
                success: true,
                message: 'Validator status updated',
                validator: {
                    code: validator.code,
                    status: validator.status,
                    healthScore: validator.healthScore,
                    lastSeen: validator.lastSeen
                }
            });

        } catch (error) {
            console.error('❌ Error updating validator status:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * RPC Method: Get All Validators
     */
    async getAllValidators(req, res) {
        try {
            const validators = Array.from(this.validators.values()).map(v => ({
                code: v.code,
                name: v.name,
                ip: v.ip,
                port: v.port,
                url: v.url,
                region: v.region,
                tier: v.tier,
                status: v.status,
                healthScore: v.healthScore,
                lastSeen: v.lastSeen,
                registeredAt: v.registeredAt
            }));

            return res.json({
                success: true,
                totalValidators: validators.length,
                validators: validators
            });

        } catch (error) {
            console.error('❌ Error getting validators:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * RPC Method: Unregister Validator
     */
    async unregisterValidator(req, res) {
        try {
            const clientIP = this.extractIPFromRequest(req);
            const { code } = req.body;

            console.log(`📞 Validator unregistration request from ${clientIP} for code: ${code}`);

            const validator = this.validators.get(code);
            if (!validator) {
                return res.status(404).json({
                    success: false,
                    error: 'Validator not found',
                    code: code
                });
            }

            // Verify IP matches
            if (validator.ip !== clientIP) {
                return res.status(403).json({
                    success: false,
                    error: 'IP address mismatch',
                    expected: validator.ip,
                    actual: clientIP
                });
            }

            // Remove validator
            this.validators.delete(code);
            
            // Save to file
            this.saveRegistry();

            console.log(`🗑️ Validator unregistered: ${code} from ${clientIP}`);

            return res.json({
                success: true,
                message: 'Validator unregistered successfully',
                code: code
            });

        } catch (error) {
            console.error('❌ Error unregistering validator:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message
            });
        }
    }

    /**
     * Get validator by code
     */
    getValidator(code) {
        return this.validators.get(code);
    }

    /**
     * Get all active validators
     */
    getActiveValidators() {
        return Array.from(this.validators.values()).filter(v => v.status === 'active');
    }

    /**
     * Setup Express routes
     */
    setupRoutes(app) {
        // Validator registration endpoint
        app.post('/rpc/validator/register', (req, res) => this.registerValidator(req, res));
        
        // Validator status update endpoint
        app.post('/rpc/validator/status', (req, res) => this.updateValidatorStatus(req, res));
        
        // Get all validators endpoint
        app.get('/rpc/validator/list', (req, res) => this.getAllValidators(req, res));
        
        // Unregister validator endpoint
        app.post('/rpc/validator/unregister', (req, res) => this.unregisterValidator(req, res));

        console.log('🌐 Validator Registration RPC routes setup:');
        console.log('   POST /rpc/validator/register   - Register validator');
        console.log('   POST /rpc/validator/status     - Update validator status');
        console.log('   GET  /rpc/validator/list       - Get all validators');
        console.log('   POST /rpc/validator/unregister - Unregister validator');
    }
}