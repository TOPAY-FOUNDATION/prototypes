/**
 * TOPAY Miner Configuration Manager (CommonJS)
 * Handles configuration loading, validation, and persistence
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class MinerConfig {
    constructor(configPath = null) {
        this.configPath = configPath || this.getDefaultConfigPath();
        this.config = {};
        this.defaultConfig = this.getDefaultConfig();
        this.loaded = false;
    }

    getDefaultConfigPath() {
        const userDataPath = path.join(os.homedir(), 'TOPAY-Miner');
        return path.join(userDataPath, 'config.json');
    }

    getDefaultConfig() {
        return {
            // Miner Settings
            minerId: null,
            miningInterval: parseInt(process.env.MINING_INTERVAL) || 30000, // 30 seconds
            syncInterval: 60000, // 60 seconds
            
            // Network Settings
            rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545/rpc',
            apiPort: parseInt(process.env.MINER_API_PORT) || 8547,
            wsPort: 8548,
            maxPeers: 50,
            
            // Connection Settings
            networkTimeout: parseInt(process.env.NETWORK_TIMEOUT) || 10000,
            maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
            retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
            
            // Data Storage
            dataDirectory: process.env.STORAGE_PATH || path.join(os.homedir(), 'TOPAY-Miner', 'data'),
            blockchainDataPath: path.resolve(__dirname, '../../../blockchain/data/blockchain.json'),
            statsPath: path.join(os.homedir(), 'TOPAY-Miner', 'data', 'mining-stats.json'),
            logsPath: process.env.LOG_FILE ? path.dirname(process.env.LOG_FILE) : path.join(os.homedir(), 'TOPAY-Miner', 'logs'),
            
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
            
            // State Persistence Settings
            autoStartValidator: false, // Whether to auto-start validator on app launch
            lastValidatorState: {
                wasRunning: false,
                lastStartTime: null,
                lastStopTime: null
            },
            
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

        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        
        return value !== undefined ? value : defaultValue;
    }

    set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    async update(updates) {
        Object.assign(this.config, updates);
        await this.save();
    }

    getAll() {
        return { ...this.config };
    }

    reset() {
        this.config = { ...this.defaultConfig };
    }

    validate() {
        const errors = [];
        
        // Validate required fields
        if (!this.config.rpcUrl) {
            errors.push('RPC URL is required');
        }
        
        if (!this.config.dataDirectory) {
            errors.push('Data directory is required');
        }
        
        // Validate port numbers
        if (this.config.apiPort < 1 || this.config.apiPort > 65535) {
            errors.push('API port must be between 1 and 65535');
        }
        
        if (this.config.wsPort < 1 || this.config.wsPort > 65535) {
            errors.push('WebSocket port must be between 1 and 65535');
        }
        
        // Validate intervals
        if (this.config.validationInterval < 1000) {
            errors.push('Validation interval must be at least 1000ms');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    getConfigSummary() {
        return {
            minerId: this.config.minerId,
            rpcUrl: this.config.rpcUrl,
            apiPort: this.config.apiPort,
            dataDirectory: this.config.dataDirectory,
            logLevel: this.config.logLevel,
            debugMode: this.config.debugMode,
            loaded: this.loaded
        };
    }
}

module.exports = MinerConfig;