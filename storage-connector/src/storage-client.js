#!/usr/bin/env node
/**
 * TOPAY Blockchain Storage Client
 * 
 * This script runs on a separate device/server to provide remote storage
 * for blockchain data. The blockchain connects to this storage client via RPC
 * to persist blocks, transactions, and state data.
 * 
 * Usage:
 * node storage-client.js --port 3002 --blockchain-rpc http://blockchain-server:3000
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Configuration
const DEFAULT_PORT = process.env.STORAGE_PORT || 3002;
const DEFAULT_BLOCKCHAIN_URL = process.env.BLOCKCHAIN_URL || 'http://localhost:3000';
const DEFAULT_DATA_DIR = process.env.STORAGE_DATA_DIR || './storage-data';
const DEFAULT_MAX_STORAGE = process.env.MAX_STORAGE_SIZE || 10 * 1024 * 1024 * 1024; // 10GB
const DEFAULT_CAPABILITIES = process.env.STORAGE_CAPABILITIES ? process.env.STORAGE_CAPABILITIES.split(',') : ['store', 'retrieve', 'backup'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class StorageClient {
    constructor(options = {}) {
        this.port = options.port || DEFAULT_PORT;
        this.host = options.host || 'localhost';
        this.dataPath = options.dataPath || DEFAULT_DATA_DIR;
        this.dataDir = this.dataPath;
        this.apiKey = options.apiKey || 'storage-device-key';
        this.deviceId = options.deviceId || `storage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.maxStorageSize = options.maxStorageSize || DEFAULT_MAX_STORAGE;
        
        // Blockchain server connection settings
        this.blockchainUrl = options.blockchainUrl || DEFAULT_BLOCKCHAIN_URL;
        this.registrationInterval = options.registrationInterval || 30000; // 30 seconds
        this.isRegistered = false;
        this.registrationTimer = null;
        
        this.app = express();
        this.server = null;
        this.stats = {
            blocksStored: 0,
            transactionsStored: 0,
            stateUpdates: 0,
            totalRequests: 0,
            storageUsed: 0,
            uptime: 0,
            lastBackup: null
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeStorage();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request counter middleware
        this.app.use((req, res, next) => {
            this.stats.totalRequests++;
            next();
        });
        
        // Authentication middleware
        this.app.use('/api/storage', (req, res, next) => {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!this.isAuthorized || token !== this.authToken) {
                return res.status(401).json({ error: 'Unauthorized storage access' });
            }
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'TOPAY Storage Client',
                version: '1.0.0',
                authorized: this.isAuthorized,
                uptime: Date.now() - this.stats.uptime,
                stats: this.stats
            });
        });

        // Authorization endpoint
        this.app.post('/api/auth/register', async (req, res) => {
            try {
                const { blockchainId, signature, timestamp } = req.body;
                
                // Verify the blockchain's identity and signature
                const isValid = await this.verifyBlockchainAuth(blockchainId, signature, timestamp);
                
                if (isValid) {
                    this.authToken = crypto.randomBytes(32).toString('hex');
                    this.isAuthorized = true;
                    
                    console.log(`✅ Blockchain authorized: ${blockchainId}`);
                    res.json({ 
                        success: true, 
                        token: this.authToken,
                        storageEndpoint: `http://localhost:${this.port}/api/storage`
                    });
                } else {
                    res.status(403).json({ error: 'Invalid blockchain credentials' });
                }
            } catch (error) {
                console.error('Authorization error:', error);
                res.status(500).json({ error: 'Authorization failed' });
            }
        });

        // Storage endpoints
        this.app.post('/api/storage/block', async (req, res) => {
            try {
                const { block } = req.body;
                await this.storeBlock(block);
                this.stats.blocksStored++;
                res.json({ success: true, blockHash: block.hash });
            } catch (error) {
                console.error('Block storage error:', error);
                res.status(500).json({ error: 'Failed to store block' });
            }
        });

        this.app.post('/api/storage/transaction', async (req, res) => {
            try {
                const { transaction } = req.body;
                await this.storeTransaction(transaction);
                this.stats.transactionsStored++;
                res.json({ success: true, txHash: transaction.hash });
            } catch (error) {
                console.error('Transaction storage error:', error);
                res.status(500).json({ error: 'Failed to store transaction' });
            }
        });

        this.app.post('/api/storage/state', async (req, res) => {
            try {
                const { stateData } = req.body;
                await this.storeState(stateData);
                this.stats.stateUpdates++;
                res.json({ success: true });
            } catch (error) {
                console.error('State storage error:', error);
                res.status(500).json({ error: 'Failed to store state' });
            }
        });

        this.app.get('/api/storage/block/:hash', async (req, res) => {
            try {
                const block = await this.getBlock(req.params.hash);
                if (block) {
                    res.json({ success: true, block });
                } else {
                    res.status(404).json({ error: 'Block not found' });
                }
            } catch (error) {
                console.error('Block retrieval error:', error);
                res.status(500).json({ error: 'Failed to retrieve block' });
            }
        });

        this.app.get('/api/storage/transaction/:hash', async (req, res) => {
            try {
                const transaction = await this.getTransaction(req.params.hash);
                if (transaction) {
                    res.json({ success: true, transaction });
                } else {
                    res.status(404).json({ error: 'Transaction not found' });
                }
            } catch (error) {
                console.error('Transaction retrieval error:', error);
                res.status(500).json({ error: 'Failed to retrieve transaction' });
            }
        });

        this.app.get('/api/storage/stats', (req, res) => {
            res.json({
                success: true,
                stats: {
                    ...this.stats,
                    uptime: Date.now() - this.stats.uptime,
                    dataDirectory: this.dataDir,
                    authorized: this.isAuthorized
                }
            });
        });

        // Backup endpoints
        this.app.post('/api/storage/backup', async (req, res) => {
            try {
                const backupPath = await this.createBackup();
                res.json({ success: true, backupPath });
            } catch (error) {
                console.error('Backup error:', error);
                res.status(500).json({ error: 'Backup failed' });
            }
        });
    }

    async initializeStorage() {
        try {
            // Create storage directories
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'blocks'), { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'transactions'), { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'state'), { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'backups'), { recursive: true });
            
            console.log(`📁 Storage initialized at: ${this.dataDir}`);
        } catch (error) {
            console.error('Storage initialization failed:', error);
            throw error;
        }
    }

    async verifyBlockchainAuth(blockchainId, signature, timestamp) {
        // Simple verification - in production, use proper cryptographic verification
        const now = Date.now();
        const timeDiff = Math.abs(now - timestamp);
        
        // Allow 5 minute time window
        if (timeDiff > 5 * 60 * 1000) {
            return false;
        }
        
        // Verify signature (simplified)
        const expectedSignature = crypto
            .createHash('sha256')
            .update(`${blockchainId}:${timestamp}`)
            .digest('hex');
            
        return signature === expectedSignature;
    }

    async storeBlock(block) {
        const blockPath = path.join(this.dataDir, 'blocks', `${block.hash}.json`);
        await fs.writeFile(blockPath, JSON.stringify(block, null, 2));
        
        // Update index
        await this.updateBlockIndex(block);
        
        this.stats.lastSync = Date.now();
        console.log(`📦 Block stored: ${block.hash}`);
    }

    async storeTransaction(transaction) {
        const txPath = path.join(this.dataDir, 'transactions', `${transaction.hash}.json`);
        await fs.writeFile(txPath, JSON.stringify(transaction, null, 2));
        
        // Update index
        await this.updateTransactionIndex(transaction);
        
        console.log(`💳 Transaction stored: ${transaction.hash}`);
    }

    async storeState(stateData) {
        const statePath = path.join(this.dataDir, 'state', 'current.json');
        await fs.writeFile(statePath, JSON.stringify(stateData, null, 2));
        
        // Keep state history
        const historyPath = path.join(this.dataDir, 'state', `state-${Date.now()}.json`);
        await fs.writeFile(historyPath, JSON.stringify(stateData, null, 2));
        
        console.log('🔄 State updated');
    }

    async getBlock(hash) {
        try {
            const blockPath = path.join(this.dataDir, 'blocks', `${hash}.json`);
            const blockData = await fs.readFile(blockPath, 'utf8');
            return JSON.parse(blockData);
        } catch (error) {
            return null;
        }
    }

    async getTransaction(hash) {
        try {
            const txPath = path.join(this.dataDir, 'transactions', `${hash}.json`);
            const txData = await fs.readFile(txPath, 'utf8');
            return JSON.parse(txData);
        } catch (error) {
            return null;
        }
    }

    async updateBlockIndex(block) {
        const indexPath = path.join(this.dataDir, 'block-index.json');
        let index = {};
        
        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            index = JSON.parse(indexData);
        } catch (error) {
            // Index doesn't exist yet
        }
        
        index[block.hash] = {
            height: block.index,
            timestamp: block.timestamp,
            size: JSON.stringify(block).length
        };
        
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    }

    async updateTransactionIndex(transaction) {
        const indexPath = path.join(this.dataDir, 'transaction-index.json');
        let index = {};
        
        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            index = JSON.parse(indexData);
        } catch (error) {
            // Index doesn't exist yet
        }
        
        index[transaction.hash] = {
            blockHash: transaction.blockHash,
            timestamp: transaction.timestamp,
            from: transaction.from,
            to: transaction.to,
            amount: transaction.amount
        };
        
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.dataDir, 'backups', `backup-${timestamp}`);
        
        await fs.mkdir(backupDir, { recursive: true });
        
        // Copy all data
        const copyDir = async (src, dest) => {
            await fs.mkdir(dest, { recursive: true });
            const entries = await fs.readdir(src, { withFileTypes: true });
            
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                
                if (entry.isDirectory()) {
                    await copyDir(srcPath, destPath);
                } else {
                    await fs.copyFile(srcPath, destPath);
                }
            }
        };
        
        await copyDir(path.join(this.dataDir, 'blocks'), path.join(backupDir, 'blocks'));
        await copyDir(path.join(this.dataDir, 'transactions'), path.join(backupDir, 'transactions'));
        await copyDir(path.join(this.dataDir, 'state'), path.join(backupDir, 'state'));
        
        console.log(`💾 Backup created: ${backupDir}`);
        return backupDir;
    }

    /**
     * Register with the blockchain server
     */
    async registerWithBlockchain() {
        try {
            const registrationData = {
                deviceId: this.deviceId,
                url: `http://${this.host}:${this.port}`,
                capabilities: ['blocks', 'transactions', 'state'],
                metadata: {
                    maxStorageSize: this.maxStorageSize,
                    availableSpace: this.maxStorageSize - this.stats.storageUsed,
                    version: '1.0.0',
                    startedAt: new Date().toISOString()
                }
            };

            const response = await axios.post(
                `${this.blockchainUrl}/api/storage/register`,
                registrationData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.apiKey
                    },
                    timeout: 10000
                }
            );

            if (response.data.success) {
                this.isRegistered = true;
                console.log(`✅ Successfully registered with blockchain server`);
                console.log(`🔗 Blockchain: ${this.blockchainUrl}`);
                return true;
            } else {
                throw new Error(response.data.error || 'Registration failed');
            }
        } catch (error) {
            this.isRegistered = false;
            console.error(`❌ Failed to register with blockchain:`, error.message);
            return false;
        }
    }

    /**
     * Maintain registration with periodic heartbeats
     */
    startRegistrationMaintenance() {
        this.registrationTimer = setInterval(async () => {
            if (!this.isRegistered) {
                await this.registerWithBlockchain();
            }
        }, this.registrationInterval);
    }

    /**
     * Unregister from blockchain server
     */
    async unregisterFromBlockchain() {
        try {
            await axios.delete(
                `${this.blockchainUrl}/api/storage/unregister/${this.deviceId}`,
                {
                    headers: {
                        'X-API-Key': this.apiKey
                    },
                    timeout: 5000
                }
            );
            
            this.isRegistered = false;
            console.log(`📤 Unregistered from blockchain server`);
        } catch (error) {
            console.error(`❌ Failed to unregister:`, error.message);
        }
    }

    /**
     * Stop the storage client server
     */
    async stop() {
        // Clear registration timer
        if (this.registrationTimer) {
            clearInterval(this.registrationTimer);
            this.registrationTimer = null;
        }
        
        // Unregister from blockchain
        if (this.isRegistered) {
            await this.unregisterFromBlockchain();
        }
        
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('🛑 Storage client stopped');
                    resolve();
                });
            });
        }
    }

    async start() {
        return new Promise(async (resolve, reject) => {
            this.server = this.app.listen(this.port, this.host, async (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                this.stats.uptime = Date.now();
                
                console.log(`🚀 TOPAY Storage Client Started`);
                console.log(`📡 Server: http://${this.host}:${this.port}`);
                console.log(`💾 Storage: ${this.dataPath}`);
                console.log(`🆔 Device ID: ${this.deviceId}`);
                console.log(`📊 Max Storage: ${(this.maxStorageSize / (1024 * 1024 * 1024)).toFixed(1)}GB`);
                console.log(`🔗 Blockchain: ${this.blockchainUrl}`);
                console.log('');
                console.log('📋 Available endpoints:');
                console.log('   GET  /health - Health check');
                console.log('   GET  /stats - Storage statistics');
                console.log('   POST /api/storage/block - Store block');
                console.log('   GET  /api/storage/block/:hash - Get block');
                console.log('   POST /api/storage/transaction - Store transaction');
                console.log('   GET  /api/storage/transaction/:hash - Get transaction');
                console.log('   POST /api/storage/state - Store state');
                console.log('   GET  /api/storage/state/:key - Get state');
                console.log('   POST /backup - Create backup');
                
                // Register with blockchain server
                console.log(`🔗 Connecting to blockchain server...`);
                await this.registerWithBlockchain();
                this.startRegistrationMaintenance();
                
                resolve();
            });
        });
    }
}

// Command line interface
if (process.argv[1] && process.argv[1].endsWith('storage-client.js')) {
    const args = process.argv.slice(2);
    const options = {
        port: DEFAULT_PORT,
        host: 'localhost',
        dataPath: DEFAULT_DATA_DIR,
        apiKey: 'default-api-key',
        deviceId: `storage-${Date.now()}`,
        maxStorageSize: DEFAULT_MAX_STORAGE,
        blockchainUrl: DEFAULT_BLOCKCHAIN_URL // Uses environment variable or default
    };
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];
        
        switch (key) {
            case 'port':
                options.port = parseInt(value);
                break;
            case 'host':
                options.host = value;
                break;
            case 'data-path':
                options.dataPath = value;
                break;
            case 'api-key':
                options.apiKey = value;
                break;
            case 'device-id':
                options.deviceId = value;
                break;
            case 'max-storage':
                options.maxStorageSize = parseInt(value) * 1024 * 1024 * 1024; // Convert GB to bytes
                break;
            case 'blockchain-url':
                options.blockchainUrl = value;
                break;
            case 'data-dir':
                options.dataPath = value;
                break;
        }
    }
    
    const storageClient = new StorageClient(options);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Storage client shutting down...');
        await storageClient.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Storage client shutting down...');
        await storageClient.stop();
        process.exit(0);
    });
    
    storageClient.start();
}

export default StorageClient;