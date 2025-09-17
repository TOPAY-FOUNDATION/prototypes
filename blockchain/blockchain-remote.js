#!/usr/bin/env node
/**
 * TOPAY Blockchain with Remote Storage
 * 
 * This version of the blockchain uses remote storage instead of local storage,
 * making it suitable for deployment on services like Render that don't provide
 * persistent storage.
 * 
 * Usage:
 * node blockchain-remote.js --port 3000 --storage-url http://storage-device:3002
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Blockchain } from './src/blockchain/blockchain.js';
import RemoteStorageAdapter from './src/storage/RemoteStorageAdapter.js';

// Load environment variables
dotenv.config();
import { Transaction } from './src/blockchain/transaction.js';
import { Wallet } from './src/wallet/Wallet.js';

class RemoteBlockchainServer {
    constructor(options = {}) {
        this.port = process.env.PORT || options.port || 3000;
        this.storageUrl = process.env.STORAGE_URL || options.storageUrl || 'http://localhost:3002';
        
        // Device management configuration
        this.healthCheckInterval = process.env.HEALTH_CHECK_INTERVAL || 30000;
        this.maxDeviceErrors = process.env.MAX_DEVICE_ERRORS || 3;
        this.loadBalancingStrategy = process.env.LOAD_BALANCING || 'round-robin';
        this.callbackTimeout = process.env.CALLBACK_TIMEOUT || 10000;
        this.maxCallbackRetries = process.env.MAX_CALLBACK_RETRIES || 2;
        this.app = express();
        this.blockchain = null;
        this.storageAdapter = null;
        this.wallets = new Map();
        this.isInitialized = false;
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', async (req, res) => {
            const health = {
                status: 'healthy',
                service: 'TOPAY Blockchain (Remote Storage)',
                version: '1.0.0',
                initialized: this.isInitialized,
                timestamp: new Date().toISOString()
            };
            
            if (this.storageAdapter) {
                health.storage = await this.storageAdapter.healthCheck();
            }
            
            res.json(health);
        });

        // Blockchain info
        this.app.get('/api/blockchain/info', (req, res) => {
            if (!this.isInitialized) {
                return res.status(503).json({ error: 'Blockchain not initialized' });
            }
            
            res.json({
                chainLength: this.blockchain.chain.length,
                difficulty: this.blockchain.difficulty,
                miningReward: this.blockchain.miningReward,
                pendingTransactions: this.blockchain.pendingTransactions.length,
                storageType: 'remote',
                storageUrl: this.storageUrl
            });
        });

        // Get blockchain
        this.app.get('/api/blockchain', (req, res) => {
            if (!this.isInitialized) {
                return res.status(503).json({ error: 'Blockchain not initialized' });
            }
            
            res.json({
                chain: this.blockchain.chain,
                pendingTransactions: this.blockchain.pendingTransactions
            });
        });

        // Get block by index
        this.app.get('/api/blockchain/block/:index', async (req, res) => {
            try {
                if (!this.isInitialized) {
                    return res.status(503).json({ error: 'Blockchain not initialized' });
                }
                
                const index = parseInt(req.params.index);
                
                if (index < this.blockchain.chain.length) {
                    // Block is in memory
                    res.json({ block: this.blockchain.chain[index] });
                } else {
                    res.status(404).json({ error: 'Block not found' });
                }
            } catch (error) {
                console.error('Block retrieval error:', error);
                res.status(500).json({ error: 'Failed to retrieve block' });
            }
        });

        // Get block by hash
        this.app.get('/api/blockchain/block/hash/:hash', async (req, res) => {
            try {
                if (!this.isInitialized) {
                    return res.status(503).json({ error: 'Blockchain not initialized' });
                }
                
                const hash = req.params.hash;
                
                // Check in-memory chain first
                const block = this.blockchain.chain.find(b => b.hash === hash);
                if (block) {
                    return res.json({ block });
                }
                
                // Check remote storage
                const remoteBlock = await this.storageAdapter.getBlock(hash);
                if (remoteBlock) {
                    res.json({ block: remoteBlock });
                } else {
                    res.status(404).json({ error: 'Block not found' });
                }
            } catch (error) {
                console.error('Block retrieval error:', error);
                res.status(500).json({ error: 'Failed to retrieve block' });
            }
        });

        // Get transaction
        this.app.get('/api/blockchain/transaction/:hash', async (req, res) => {
            try {
                if (!this.isInitialized) {
                    return res.status(503).json({ error: 'Blockchain not initialized' });
                }
                
                const hash = req.params.hash;
                
                // Check pending transactions first
                const pendingTx = this.blockchain.pendingTransactions.find(tx => tx.hash === hash);
                if (pendingTx) {
                    return res.json({ transaction: pendingTx, status: 'pending' });
                }
                
                // Check in blocks
                for (const block of this.blockchain.chain) {
                    const tx = block.transactions.find(t => t.hash === hash);
                    if (tx) {
                        return res.json({ transaction: tx, status: 'confirmed', blockHash: block.hash });
                    }
                }
                
                // Check remote storage
                const remoteTx = await this.storageAdapter.getTransaction(hash);
                if (remoteTx) {
                    res.json({ transaction: remoteTx, status: 'confirmed' });
                } else {
                    res.status(404).json({ error: 'Transaction not found' });
                }
            } catch (error) {
                console.error('Transaction retrieval error:', error);
                res.status(500).json({ error: 'Failed to retrieve transaction' });
            }
        });

        // Create transaction
        this.app.post('/api/blockchain/transaction', async (req, res) => {
            try {
                if (!this.isInitialized) {
                    return res.status(503).json({ error: 'Blockchain not initialized' });
                }
                
                const { from, to, amount, privateKey } = req.body;
                
                if (!from || !to || !amount || !privateKey) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }
                
                // Create and sign transaction
                const transaction = new Transaction(from, to, amount);
                
                // Get or create wallet
                let wallet = this.wallets.get(from);
                if (!wallet) {
                    wallet = new Wallet();
                    wallet.privateKey = privateKey;
                    wallet.publicKey = from; // Simplified
                    this.wallets.set(from, wallet);
                }
                
                wallet.signTransaction(transaction);
                
                // Add to blockchain
                this.blockchain.addTransaction(transaction);
                
                // Store transaction remotely
                await this.storageAdapter.storeTransaction(transaction);
                
                res.json({ 
                    success: true, 
                    transactionHash: transaction.hash,
                    status: 'pending'
                });
            } catch (error) {
                console.error('Transaction creation error:', error);
                res.status(500).json({ error: 'Failed to create transaction' });
            }
        });

        // Mine block
        this.app.post('/api/blockchain/mine', async (req, res) => {
            try {
                if (!this.isInitialized) {
                    return res.status(503).json({ error: 'Blockchain not initialized' });
                }
                
                const { minerAddress } = req.body;
                
                if (!minerAddress) {
                    return res.status(400).json({ error: 'Miner address required' });
                }
                
                console.log('⛏️ Starting mining process...');
                const block = this.blockchain.minePendingTransactions(minerAddress);
                
                // Store block remotely
                await this.storageAdapter.storeBlock(block);
                
                // Store all transactions in the block
                for (const transaction of block.transactions) {
                    await this.storageAdapter.storeTransaction(transaction);
                }
                
                console.log('✅ Block mined and stored remotely');
                
                res.json({ 
                    success: true, 
                    block: {
                        hash: block.hash,
                        index: block.index,
                        timestamp: block.timestamp,
                        transactionCount: block.transactions.length
                    }
                });
            } catch (error) {
                console.error('Mining error:', error);
                res.status(500).json({ error: 'Mining failed' });
            }
        });

        // Get balance
        this.app.get('/api/blockchain/balance/:address', (req, res) => {
            try {
                if (!this.isInitialized) {
                    return res.status(503).json({ error: 'Blockchain not initialized' });
                }
                
                const address = req.params.address;
                const balance = this.blockchain.getBalance(address);
                
                res.json({ address, balance });
            } catch (error) {
                console.error('Balance retrieval error:', error);
                res.status(500).json({ error: 'Failed to get balance' });
            }
        });

        // Create wallet
        this.app.post('/api/wallet/create', (req, res) => {
            try {
                const wallet = new Wallet();
                this.wallets.set(wallet.publicKey, wallet);
                
                res.json({
                    publicKey: wallet.publicKey,
                    privateKey: wallet.privateKey
                });
            } catch (error) {
                console.error('Wallet creation error:', error);
                res.status(500).json({ error: 'Failed to create wallet' });
            }
        });

        // Storage device registration endpoints
        this.app.post('/api/storage/register', async (req, res) => {
            try {
                const { deviceId, url, capabilities, metadata } = req.body;
                
                if (!deviceId || !url) {
                    return res.status(400).json({
                        success: false,
                        error: 'Device ID and URL are required'
                    });
                }

                const device = this.storageAdapter.registerDevice({
                    deviceId,
                    url,
                    capabilities,
                    metadata
                });

                res.json({
                    success: true,
                    message: 'Storage device registered successfully',
                    device: device
                });
            } catch (error) {
                console.error('❌ Error registering storage device:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.delete('/api/storage/unregister/:deviceId', async (req, res) => {
            try {
                const { deviceId } = req.params;
                const success = this.storageAdapter.unregisterDevice(deviceId);
                
                if (success) {
                    res.json({
                        success: true,
                        message: 'Storage device unregistered successfully'
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Device not found'
                    });
                }
            } catch (error) {
                console.error('❌ Error unregistering storage device:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get registered storage devices
        this.app.get('/api/storage/devices', async (req, res) => {
            try {
                const devices = this.storageAdapter.getRegisteredDevices();
                res.json({
                    success: true,
                    devices: devices
                });
            } catch (error) {
                console.error('❌ Error getting storage devices:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Device monitoring and health check endpoints
        this.app.get('/api/storage/monitoring', (req, res) => {
            try {
                const monitoring = this.storageAdapter.getDeviceMonitoring();
                res.json({ success: true, monitoring });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/storage/health-check/:deviceId', async (req, res) => {
            try {
                const result = await this.storageAdapter.forceHealthCheck(req.params.deviceId);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        this.app.post('/api/storage/health-check-all', async (req, res) => {
            try {
                await this.storageAdapter.performHealthChecks();
                res.json({ success: true, message: 'Health checks initiated for all devices' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // === Storage Operation Callbacks ===

        // Request storage operation from specific device
        this.app.post('/api/storage/callback/:deviceId/:operation', async (req, res) => {
            try {
                const { deviceId, operation } = req.params;
                const data = req.body;
                
                const result = await this.storageAdapter.requestStorageOperation(deviceId, operation, data);
                res.json(result);
            } catch (error) {
                console.error(`❌ Storage callback failed for device ${req.params.deviceId}:`, error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Broadcast storage operation to all capable devices
        this.app.post('/api/storage/broadcast/:operation', async (req, res) => {
            try {
                const { operation } = req.params;
                const { data, capability } = req.body;
                
                const result = await this.storageAdapter.broadcastStorageOperation(operation, data, capability);
                res.json(result);
            } catch (error) {
                console.error(`❌ Storage broadcast failed for operation ${req.params.operation}:`, error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Request storage operation with automatic device selection
        this.app.post('/api/storage/auto/:operation', async (req, res) => {
            try {
                const { operation } = req.params;
                const { data, capability } = req.body;
                
                const result = await this.storageAdapter.requestStorageOperationAuto(operation, data, capability);
                res.json(result);
            } catch (error) {
                console.error(`❌ Auto storage operation failed for ${req.params.operation}:`, error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Storage statistics
        this.app.get('/api/storage/stats', async (req, res) => {
            try {
                if (!this.storageAdapter) {
                    return res.status(503).json({ error: 'Storage not initialized' });
                }
                
                const stats = await this.storageAdapter.getStorageStats();
                res.json({
                    success: true,
                    stats: stats
                });
            } catch (error) {
                console.error('Storage stats error:', error);
                res.status(500).json({ error: 'Failed to get storage stats' });
            }
        });

        // Create backup
        this.app.post('/api/storage/backup', async (req, res) => {
            try {
                if (!this.storageAdapter) {
                    return res.status(503).json({ error: 'Storage not initialized' });
                }
                
                const backupPath = await this.storageAdapter.createBackup();
                res.json({ success: true, backupPath });
            } catch (error) {
                console.error('Backup error:', error);
                res.status(500).json({ error: 'Backup failed' });
            }
        });
    }

    async initialize() {
        try {
            console.log('🚀 Initializing TOPAY Blockchain with Remote Storage...');
            
            // Initialize storage adapter
            this.storageAdapter = new RemoteStorageAdapter({
                storageUrl: this.storageUrl,
                blockchainId: `topay-blockchain-${Date.now()}`
            });
            
            await this.storageAdapter.initialize();
            
            // Initialize blockchain
            this.blockchain = new Blockchain();
            
            // Set up storage event listeners
            this.storageAdapter.on('connected', () => {
                console.log('📡 Storage connection established');
            });
            
            this.storageAdapter.on('disconnected', () => {
                console.log('📡 Storage connection lost');
            });
            
            this.storageAdapter.on('error', (error) => {
                console.error('💥 Storage error:', error.message);
            });
            
            // Store genesis block (skip if no storage devices available)
            if (this.blockchain.chain.length > 0) {
                try {
                    await this.storageAdapter.storeBlock(this.blockchain.chain[0]);
                    console.log('✅ Genesis block stored successfully');
                } catch (error) {
                    console.log('⚠️ Genesis block storage skipped - no storage devices available yet');
                    console.log('   Storage devices can register after server startup');
                }
            }
            
            this.isInitialized = true;
            console.log('✅ Blockchain initialized with remote storage');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }

    async start() {
        try {
            await this.initialize();
            
            this.app.listen(this.port, () => {
                console.log('🌟 TOPAY Blockchain Server (Remote Storage) Started');
                console.log(`🚀 Server running on port: ${this.port}`);
                console.log(`📡 Remote storage: ${this.storageUrl}`);
                console.log(`⛓️ Chain length: ${this.blockchain.chain.length}`);
                console.log('\n📋 Available endpoints:');
                console.log(`   GET  /health - Health check`);
                console.log(`   GET  /api/blockchain/info - Blockchain information`);
                console.log(`   GET  /api/blockchain - Full blockchain`);
                console.log(`   GET  /api/blockchain/block/:index - Get block by index`);
                console.log(`   GET  /api/blockchain/block/hash/:hash - Get block by hash`);
                console.log(`   GET  /api/blockchain/transaction/:hash - Get transaction`);
                console.log(`   POST /api/blockchain/transaction - Create transaction`);
                console.log(`   POST /api/blockchain/mine - Mine block`);
                console.log(`   GET  /api/blockchain/balance/:address - Get balance`);
                console.log(`   POST /api/wallet/create - Create wallet`);
                console.log(`   POST /api/storage/register - Register storage device`);
                console.log(`   DELETE /api/storage/unregister/:deviceId - Unregister storage device`);
                console.log(`   GET  /api/storage/devices - List registered devices`);
                console.log(`   GET  /api/storage/monitoring - Device monitoring dashboard`);
                console.log(`   POST /api/storage/health-check/:deviceId - Force health check on device`);
                console.log(`   POST /api/storage/health-check-all - Health check all devices`);
                console.log(`   GET  /api/storage/stats - Storage statistics`);
                console.log(`   POST /api/storage/backup - Create backup`);
                console.log(`   POST /api/storage/callback/:deviceId/:operation - Request storage operation from device`);
                console.log(`   POST /api/storage/broadcast/:operation - Broadcast storage operation`);
                console.log(`   POST /api/storage/auto/:operation - Auto storage operation`);
            });
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    async stop() {
        console.log('🛑 Shutting down blockchain server...');
        
        if (this.storageAdapter) {
            await this.storageAdapter.disconnect();
        }
        
        process.exit(0);
    }
}

// Command line interface
if (process.argv[1] && process.argv[1].endsWith('blockchain-remote.js')) {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];
        
        switch (key) {
            case 'port':
                options.port = parseInt(value);
                break;
            case 'storage-url':
                options.storageUrl = value;
                break;
        }
    }
    
    const server = new RemoteBlockchainServer(options);
    
    // Graceful shutdown
    process.on('SIGINT', () => server.stop());
    process.on('SIGTERM', () => server.stop());
    
    server.start();
}

export default RemoteBlockchainServer;