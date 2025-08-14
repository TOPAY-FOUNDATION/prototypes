/**
 * TOPAY Validator Configuration Manager
 * Handles configuration loading, validation, and persistence
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ValidatorConfig {
    constructor(configPath = null) {
        this.configPath = configPath || this.getDefaultConfigPath();
        this.config = {};
        this.defaultConfig = this.getDefaultConfig();
        this.loaded = false;
    }

    getDefaultConfigPath() {
        const userDataPath = path.join(os.homedir(), 'TOPAY-Validator');
        return path.join(userDataPath, 'config.json');
    }

    getDefaultConfig() {
        return {
            // Validator Settings
            validatorId: null,
            validationInterval: parseInt(process.env.VALIDATION_INTERVAL) || 30000, // 30 seconds
            syncInterval: 60000, // 60 seconds
            
            // Network Settings
            rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545/rpc',
            apiPort: parseInt(process.env.VALIDATOR_API_PORT) || 8547,
            wsPort: 8548,
            maxPeers: 50,
            

            
            // Connection Settings
            networkTimeout: parseInt(process.env.NETWORK_TIMEOUT) || 10000,
            maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
            retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
            
            // Data Storage
            dataDirectory: process.env.STORAGE_PATH || path.join(os.homedir(), 'TOPAY-Validator', 'data'),
            blockchainDataPath: path.resolve(__dirname, '../../../blockchain/data/blockchain.json'),
            statsPath: path.join(os.homedir(), 'TOPAY-Validator', 'data', 'validation-stats.json'),
            logsPath: process.env.LOG_FILE ? path.dirname(process.env.LOG_FILE) : path.join(os.homedir(), 'TOPAY-Validator', 'logs'),
            
            // Backup Settings
            backupEnabled: process.env.BACKUP_ENABLED !== 'false',
            backupInterval: parseInt(process.env.BACKUP_INTERVAL) || 3600000, // 1 hour
            maxBackups: parseInt(process.env.MAX_BACKUPS) || 10,
            
            // Performance Settings
            maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
            maxCpuUsage: 80, // 80%
            enableOptimizations: true,
            
            // Security Settings
            enableTLS: false,
            tlsCertPath: null,
            tlsKeyPath: null,
            allowedOrigins: process.env.ALLOWED_ORIGINS ? 
                process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
                ['http://localhost:3000', 'http://localhost:8547'],
            enableCors: process.env.ENABLE_CORS !== 'false',
            apiRateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
            
            // UI Settings
            theme: 'dark',
            language: 'en',
            notifications: {
                enabled: true,
                validationErrors: true,
                networkEvents: true,
                systemAlerts: true
            },
            
            // Auto-update Settings
            autoUpdate: true,
            updateChannel: 'stable', // stable, beta, alpha
            
            // Logging Settings
            logLevel: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
            maxLogSize: 10 * 1024 * 1024, // 10MB
            maxLogFiles: 5,
            enableFileLogging: process.env.ENABLE_FILE_LOGGING !== 'false',
            
            // Metrics Settings
            enableMetrics: process.env.ENABLE_METRICS !== 'false',
            metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
            
            // Development Settings
            debugMode: process.env.DEBUG_MODE === 'true',
            
            // Advanced Settings
            experimental: {
                enableQuantumSafety: true,
                enableFragmentedBlocks: true,
                enableReversibleTransactions: false
            }
        };
    }

    async load() {
        try {
            // Ensure config directory exists
            const configDir = path.dirname(this.configPath);
            await fs.mkdir(configDir, { recursive: true });

            // Try to load existing config
            try {
                const configData = await fs.readFile(this.configPath, 'utf8');
                const loadedConfig = JSON.parse(configData);
                
                // Merge with defaults to ensure all keys exist
                this.config = { ...this.defaultConfig, ...loadedConfig };
                
                console.log('✅ Configuration loaded successfully');
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // Config file doesn't exist, create with defaults
                    console.log('📝 Creating default configuration file');
                    this.config = { ...this.defaultConfig };
                    await this.save();
                } else {
                    throw error;
                }
            }

            // Display environment configuration
            this.displayEnvironmentConfig();

            // Ensure data directories exist
            await this.ensureDirectories();
            
            this.loaded = true;
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
            // Fall back to defaults
            this.config = { ...this.defaultConfig };
            this.loaded = false;
            throw error;
        }
    }

    displayEnvironmentConfig() {
        console.log('🔧 Environment Configuration:');
        console.log(`   BLOCKCHAIN_RPC_URL: ${process.env.BLOCKCHAIN_RPC_URL || 'Not set (using default)'}`);
        console.log(`   VALIDATOR_API_PORT: ${process.env.VALIDATOR_API_PORT || 'Not set (using default)'}`);
        console.log(`   NETWORK_TIMEOUT: ${process.env.NETWORK_TIMEOUT || 'Not set (using default)'}`);
        

        console.log(`   LOG_LEVEL: ${process.env.LOG_LEVEL || 'Not set (using default)'}`);
        console.log(`   DEBUG_MODE: ${process.env.DEBUG_MODE || 'Not set (using default)'}`);
        console.log(`   BACKUP_ENABLED: ${process.env.BACKUP_ENABLED || 'Not set (using default)'}`);
    }

    async save() {
        try {
            const configDir = path.dirname(this.configPath);
            await fs.mkdir(configDir, { recursive: true });
            
            await fs.writeFile(
                this.configPath, 
                JSON.stringify(this.config, null, 2),
                'utf8'
            );
            
            console.log('✅ Configuration saved successfully');
        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
            throw error;
        }
    }

    async ensureDirectories() {
        const directories = [
            this.config.dataDirectory,
            this.config.logsPath,
            path.dirname(this.config.statsPath)
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.warn(`⚠️ Could not create directory ${dir}:`, error.message);
            }
        }
    }

    get(key, defaultValue = null) {
        if (!this.loaded) {
            console.warn('⚠️ Configuration not loaded, using default value');
            return this.defaultConfig[key] || defaultValue;
        }
        
        return this.config[key] !== undefined ? this.config[key] : defaultValue;
    }

    set(key, value) {
        this.config[key] = value;
    }

    async update(updates) {
        // Validate updates
        const validatedUpdates = this.validateConfig(updates);
        
        // Apply updates
        this.config = { ...this.config, ...validatedUpdates };
        
        // Save to disk
        await this.save();
        
        // Ensure directories exist for new paths
        await this.ensureDirectories();
        
        console.log('✅ Configuration updated successfully');
    }

    validateConfig(config) {
        const validated = {};
        
        // Validate each configuration option
        for (const [key, value] of Object.entries(config)) {
            switch (key) {
                case 'validationInterval':
                case 'syncInterval':
                    if (typeof value === 'number' && value >= 1000) {
                        validated[key] = value;
                    } else {
                        console.warn(`⚠️ Invalid ${key}: must be a number >= 1000ms`);
                    }
                    break;
                    
                case 'apiPort':
                case 'wsPort':
                    if (typeof value === 'number' && value >= 1024 && value <= 65535) {
                        validated[key] = value;
                    } else {
                        console.warn(`⚠️ Invalid ${key}: must be a number between 1024-65535`);
                    }
                    break;
                    
                case 'rpcUrl':
                    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
                        validated[key] = value;
                    } else {
                        console.warn(`⚠️ Invalid ${key}: must be a valid HTTP/HTTPS URL`);
                    }
                    break;
                    
                case 'maxPeers':
                    if (typeof value === 'number' && value >= 1 && value <= 1000) {
                        validated[key] = value;
                    } else {
                        console.warn(`⚠️ Invalid ${key}: must be a number between 1-1000`);
                    }
                    break;
                    
                case 'logLevel':
                    if (['debug', 'info', 'warn', 'error'].includes(value)) {
                        validated[key] = value;
                    } else {
                        console.warn(`⚠️ Invalid ${key}: must be debug, info, warn, or error`);
                    }
                    break;
                    
                case 'theme':
                    if (['light', 'dark', 'auto'].includes(value)) {
                        validated[key] = value;
                    } else {
                        console.warn(`⚠️ Invalid ${key}: must be light, dark, or auto`);
                    }
                    break;
                    
                case 'updateChannel':
                    if (['stable', 'beta', 'alpha'].includes(value)) {
                        validated[key] = value;
                    } else {
                        console.warn(`⚠️ Invalid ${key}: must be stable, beta, or alpha`);
                    }
                    break;
                    
                default:
                    // For other keys, accept the value as-is
                    validated[key] = value;
                    break;
            }
        }
        
        return validated;
    }

    getAll() {
        return { ...this.config };
    }

    reset() {
        this.config = { ...this.defaultConfig };
    }

    async resetToDefaults() {
        this.reset();
        await this.save();
        await this.ensureDirectories();
        console.log('✅ Configuration reset to defaults');
    }

    // Export configuration for backup
    async exportConfig(exportPath) {
        try {
            const exportData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                config: this.config
            };
            
            await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
            console.log(`✅ Configuration exported to ${exportPath}`);
        } catch (error) {
            console.error('❌ Failed to export configuration:', error);
            throw error;
        }
    }

    // Import configuration from backup
    async importConfig(importPath) {
        try {
            const importData = await fs.readFile(importPath, 'utf8');
            const parsed = JSON.parse(importData);
            
            if (parsed.config) {
                const validatedConfig = this.validateConfig(parsed.config);
                await this.update(validatedConfig);
                console.log(`✅ Configuration imported from ${importPath}`);
            } else {
                throw new Error('Invalid configuration file format');
            }
        } catch (error) {
            console.error('❌ Failed to import configuration:', error);
            throw error;
        }
    }

    // Get configuration schema for UI generation
    getSchema() {
        return {
            validator: {
                title: 'Validator Settings',
                fields: {
                    validationInterval: {
                        type: 'number',
                        title: 'Validation Interval (ms)',
                        min: 1000,
                        description: 'How often to validate the blockchain'
                    },
                    syncInterval: {
                        type: 'number',
                        title: 'Sync Interval (ms)',
                        min: 1000,
                        description: 'How often to sync with the network'
                    }
                }
            },
            network: {
                title: 'Network Settings',
                fields: {
                    rpcUrl: {
                        type: 'string',
                        title: 'RPC Server URL',
                        description: 'Blockchain RPC server endpoint'
                    },
                    apiPort: {
                        type: 'number',
                        title: 'API Port',
                        min: 1024,
                        max: 65535
                    },
                    wsPort: {
                        type: 'number',
                        title: 'WebSocket Port',
                        min: 1024,
                        max: 65535
                    },
                    maxPeers: {
                        type: 'number',
                        title: 'Maximum Peers',
                        min: 1,
                        max: 1000
                    }
                }
            },
            ui: {
                title: 'User Interface',
                fields: {
                    theme: {
                        type: 'select',
                        title: 'Theme',
                        options: ['light', 'dark', 'auto']
                    },
                    language: {
                        type: 'select',
                        title: 'Language',
                        options: ['en', 'es', 'fr', 'de', 'zh', 'ja']
                    }
                }
            },
            advanced: {
                title: 'Advanced Settings',
                fields: {
                    logLevel: {
                        type: 'select',
                        title: 'Log Level',
                        options: ['debug', 'info', 'warn', 'error']
                    },
                    autoUpdate: {
                        type: 'boolean',
                        title: 'Enable Auto-Updates'
                    },
                    updateChannel: {
                        type: 'select',
                        title: 'Update Channel',
                        options: ['stable', 'beta', 'alpha']
                    }
                }
            }
        };
    }
}

export default ValidatorConfig;