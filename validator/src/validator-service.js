/**
 * TOPAY Validator Service - Core Validation Engine
 * Handles blockchain validation, network communication, and consensus
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import EventEmitter from 'events';
import express from 'express';
import WebSocket from 'ws';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import pkg from 'node-machine-id';
const { machineId } = pkg;
import si from 'systeminformation';

// Import ValidatorClient for RPC registration
import { ValidatorClient } from './rpc/validator-client.js';

// Dynamic import for ES modules
let fetch;

class ValidatorService extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.isRunning = false;
        this.validatorId = null;
        this.blockchain = null;
        this.peers = new Map();
        this.validationStats = {
            blocksValidated: 0,
            transactionsValidated: 0,
            validationErrors: 0,
            uptime: 0,
            lastValidation: null
        };
        this.server = null;
        this.wsServer = null;
        this.syncInterval = null;
        this.validationInterval = null;
        this.startTime = null;
        
        // Connection status tracking
        this.rpcConnected = false;
        this.wsConnected = false;
        
        // RPC Client for blockchain registration
        this.validatorClient = null;

        // Blockchain classes (loaded dynamically)
        this.Blockchain = null;
        this.Transaction = null;
        this.Block = null;
    }

    async start() {
        if (this.isRunning) {
            this.logger.warn('Validator service is already running');
            return;
        }

        console.log('🚀 Starting TOPAY Validator Service...');
        this.startTime = Date.now();

        try {
            // Initialize fetch for ES module compatibility
            if (!fetch) {
                const fetchModule = await import('node-fetch');
                fetch = fetchModule.default;
            }
            
            // Initialize validator ID
            await this.initializeValidatorId();
            
            // Load blockchain classes
            await this.loadBlockchainClasses();
            
            // Initialize blockchain
            await this.initializeBlockchain();
            
            // Start HTTP API server
            await this.startApiServer();
            
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Initialize and register with blockchain via RPC
            await this.initializeRPCClient();
            
            // Connect to blockchain network
            await this.connectToNetwork();
            
            // Start validation processes
            this.startValidationLoop();
            this.startSyncLoop();
            
            // Start periodic connection check
            this.connectionCheckInterval = setInterval(() => {
                this.checkConnections();
            }, this.config.get('connectionCheckInterval', 5000)); // 5 seconds
            
            this.isRunning = true;
            console.log('✅ TOPAY Validator Service started successfully');
            console.log(`📊 Validator ID: ${this.validatorId}`);
            console.log(`🌐 API Server: http://localhost:${this.config.get('apiPort', 8547)}`);
            console.log(`🔌 WebSocket Server: ws://localhost:${this.config.get('wsPort', 8548)}`);
            
            this.emit('started');
        } catch (error) {
            console.error('❌ Failed to start validator service:', error);
            await this.stop();
            throw error;
        }
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping TOPAY Validator Service...');

        try {
            // Clear intervals
            if (this.syncInterval) clearInterval(this.syncInterval);
            if (this.validationInterval) clearInterval(this.validationInterval);
            if (this.connectionCheckInterval) clearInterval(this.connectionCheckInterval);

            // Close WebSocket server
            if (this.wsServer) {
                this.wsServer.close();
            }

            // Close HTTP server
            if (this.server) {
                this.server.close();
            }

            // Unregister from blockchain
            if (this.validatorClient) {
                try {
                    await this.validatorClient.unregister();
                    console.log('✅ Unregistered from blockchain');
                } catch (error) {
                    console.warn('⚠️ Failed to unregister from blockchain:', error.message);
                }
            }

            // Disconnect from peers
            this.peers.clear();

            // Reset connection status
            this.rpcConnected = false;
            this.wsConnected = false;

            // Save final state
            await this.saveValidationStats();

            this.isRunning = false;
            console.log('✅ TOPAY Validator Service stopped');
            this.emit('stopped');
        } catch (error) {
            console.error('❌ Error stopping validator service:', error);
            throw error;
        }
    }

    async restart() {
        console.log('🔄 Restarting TOPAY Validator Service...');
        await this.stop();
        await this.start();
    }

    async initializeValidatorId() {
        try {
            const id = await machineId();
            this.validatorId = `TOPAY-VAL-${id.substring(0, 16).toUpperCase()}`;
        } catch (error) {
            // Fallback to random ID
            this.validatorId = `TOPAY-VAL-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        }
    }

    async loadBlockchainClasses() {
        try {
            // Use local blockchain files with ES module imports
            const { Blockchain } = await import('./blockchain/blockchain.js');
            const { Transaction } = await import('./blockchain/transaction.js');
            const { Block } = await import('./blockchain/block.js');

            this.Blockchain = Blockchain;
            this.Transaction = Transaction;
            this.Block = Block;

            console.log('✅ Blockchain classes loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load blockchain classes:', error);
            throw new Error('Failed to load blockchain dependencies');
        }
    }

    async initializeBlockchain() {
        try {
            this.blockchain = new this.Blockchain();
            
            // Load existing blockchain data if available
            const dataPath = this.config.get('blockchainDataPath');
            if (dataPath) {
                try {
                    const data = await fs.readFile(dataPath, 'utf8');
                    const blockchainData = JSON.parse(data);
                    
                    if (blockchainData.chain && Array.isArray(blockchainData.chain)) {
                        // Reconstruct blockchain from saved data using proper fromJSON methods
                        this.blockchain.chain = blockchainData.chain.map(blockData => this.Block.fromJSON(blockData));
                        
                        if (blockchainData.mempool && Array.isArray(blockchainData.mempool)) {
                            this.blockchain.mempool = blockchainData.mempool.map(txData => this.Transaction.fromJSON(txData));
                        } else {
                            this.blockchain.mempool = [];
                        }
                        
                        console.log(`✅ Loaded blockchain with ${this.blockchain.chain.length} blocks`);
                    }
                } catch (loadError) {
                    console.warn('⚠️ Could not load existing blockchain data, starting fresh');
                }
            }
            
            // Validate the loaded blockchain
            const isValid = this.blockchain.isChainValid();
            if (!isValid) {
                console.warn('⚠️ Loaded blockchain is invalid, starting fresh');
                this.blockchain = new this.Blockchain();
            }
            
            console.log('✅ Blockchain initialized');
        } catch (error) {
            console.error('❌ Failed to initialize blockchain:', error);
            throw error;
        }
    }

    async startApiServer() {
        const app = express();
        app.use(express.json());
        
        // Import cors dynamically
        const cors = await import('cors');
        app.use(cors.default());
        
        const apiPort = process.env.VALIDATOR_PORT || this.config.get('apiPort', 8547);

        // Validator status endpoint
        app.get('/api/status', (req, res) => {
            res.json(this.getStatus());
        });

        // Blockchain info endpoint
        app.get('/api/blockchain', (req, res) => {
            res.json({
                blockCount: this.blockchain.chain.length,
                mempoolSize: this.blockchain.mempool.length,
                isValid: this.blockchain.isChainValid(),
                latestBlock: this.blockchain.getLatestBlock(),
                difficulty: this.blockchain.difficulty
            });
        });

        // Validation stats endpoint
        app.get('/api/validation-stats', (req, res) => {
            res.json({
                ...this.validationStats,
                uptime: Date.now() - this.startTime
            });
        });

        // Peer info endpoint
        app.get('/api/peers', (req, res) => {
            res.json({
                connectedPeers: this.peers.size,
                peers: Array.from(this.peers.entries()).map(([id, peer]) => ({
                    id,
                    address: peer.address,
                    connected: peer.connected,
                    lastSeen: peer.lastSeen
                }))
            });
        });

        // System info endpoint
        app.get('/api/system', async (req, res) => {
            try {
                const [cpu, mem, osInfo] = await Promise.all([
                    si.cpu(),
                    si.mem(),
                    si.osInfo()
                ]);

                res.json({
                    cpu: {
                        manufacturer: cpu.manufacturer,
                        brand: cpu.brand,
                        cores: cpu.cores,
                        speed: cpu.speed
                    },
                    memory: {
                        total: mem.total,
                        free: mem.free,
                        used: mem.used
                    },
                    os: {
                        platform: osInfo.platform,
                        distro: osInfo.distro,
                        release: osInfo.release,
                        arch: osInfo.arch
                    },
                    validatorId: this.validatorId
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to get system info' });
            }
        });

        // Remote Storage Endpoints
        
        // Store blockchain data
        app.post('/api/storage/blockchain', async (req, res) => {
            try {
                const blockchainData = req.body;
                await this.storeData('blockchain', blockchainData);
                res.json({ 
                    success: true, 
                    message: 'Blockchain data stored successfully',
                    validatorId: this.validatorId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Failed to store blockchain data:', error);
                res.status(500).json({ error: 'Failed to store blockchain data' });
            }
        });

        // Retrieve blockchain data
        app.get('/api/storage/blockchain', async (req, res) => {
            try {
                const data = await this.retrieveData('blockchain');
                if (data) {
                    res.json(data);
                } else {
                    res.status(404).json({ error: 'Blockchain data not found' });
                }
            } catch (error) {
                console.error('❌ Failed to retrieve blockchain data:', error);
                res.status(500).json({ error: 'Failed to retrieve blockchain data' });
            }
        });

        // Store wallets data
        app.post('/api/storage/wallets', async (req, res) => {
            try {
                const walletsData = req.body;
                await this.storeData('wallets', walletsData);
                res.json({ 
                    success: true, 
                    message: 'Wallets data stored successfully',
                    validatorId: this.validatorId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Failed to store wallets data:', error);
                res.status(500).json({ error: 'Failed to store wallets data' });
            }
        });

        // Retrieve wallets data
        app.get('/api/storage/wallets', async (req, res) => {
            try {
                const data = await this.retrieveData('wallets');
                if (data) {
                    res.json(data);
                } else {
                    res.status(404).json({ error: 'Wallets data not found' });
                }
            } catch (error) {
                console.error('❌ Failed to retrieve wallets data:', error);
                res.status(500).json({ error: 'Failed to retrieve wallets data' });
            }
        });

        // Store configuration data
        app.post('/api/storage/config', async (req, res) => {
            try {
                const configData = req.body;
                await this.storeData('config', configData);
                res.json({ 
                    success: true, 
                    message: 'Configuration data stored successfully',
                    validatorId: this.validatorId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Failed to store configuration data:', error);
                res.status(500).json({ error: 'Failed to store configuration data' });
            }
        });

        // Retrieve configuration data
        app.get('/api/storage/config', async (req, res) => {
            try {
                const data = await this.retrieveData('config');
                if (data) {
                    res.json(data);
                } else {
                    res.status(404).json({ error: 'Configuration data not found' });
                }
            } catch (error) {
                console.error('❌ Failed to retrieve configuration data:', error);
                res.status(500).json({ error: 'Failed to retrieve configuration data' });
            }
        });

        // Create backup
        app.post('/api/storage/backup', async (req, res) => {
            try {
                const { backupId, timestamp } = req.body;
                const backupPath = await this.createStorageBackup(backupId, timestamp);
                res.json({ 
                    success: true, 
                    message: 'Backup created successfully',
                    backupId,
                    backupPath,
                    validatorId: this.validatorId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('❌ Failed to create backup:', error);
                res.status(500).json({ error: 'Failed to create backup' });
            }
        });

        // Get storage statistics
        app.get('/api/storage/stats', async (req, res) => {
            try {
                const stats = await this.getStorageStats();
                res.json(stats);
            } catch (error) {
                console.error('❌ Failed to get storage stats:', error);
                res.status(500).json({ error: 'Failed to get storage stats' });
            }
        });

        this.server = app.listen(apiPort, () => {
            console.log(`✅ API Server started on port ${apiPort}`);
        });
    }

    async startWebSocketServer() {
        const wsPort = process.env.VALIDATOR_WS_PORT || this.config.get('wsPort', 8548);
        this.wsServer = new WebSocket.Server({ port: wsPort });

        this.wsServer.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            this.wsConnected = true;

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('❌ WebSocket message error:', error);
                    ws.send(JSON.stringify({ error: 'Invalid message format' }));
                }
            });

            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
                // Check if there are any remaining connections
                this.wsConnected = this.wsServer.clients.size > 0;
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
            });

            // Send initial status
            ws.send(JSON.stringify({
                type: 'status',
                data: this.getStatus()
            }));
        });

        console.log(`✅ WebSocket Server started on port ${wsPort}`);
    }

    async handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'get_status':
                ws.send(JSON.stringify({
                    type: 'status',
                    data: this.getStatus()
                }));
                break;

            case 'get_blockchain':
                ws.send(JSON.stringify({
                    type: 'blockchain',
                    data: {
                        chain: this.blockchain.chain,
                        mempool: this.blockchain.mempool
                    }
                }));
                break;

            case 'validate_block':
                if (message.block) {
                    const isValid = await this.validateBlock(message.block);
                    ws.send(JSON.stringify({
                        type: 'validation_result',
                        blockHash: message.block.hash,
                        isValid
                    }));
                }
                break;

            default:
                ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
    }

    async connectToNetwork() {
        const rpcUrl = this.config.get('rpcUrl', 'http://localhost:8545');
        const rpcEndpoint = rpcUrl.endsWith('/rpc') ? rpcUrl : `${rpcUrl}/rpc`;
        
        try {
            // Test connection to blockchain RPC
            const response = await fetch(rpcEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'topay_getChainInfo',
                    params: [],
                    id: 1
                })
            });

            if (response.ok) {
                console.log('✅ Connected to blockchain network');
                this.rpcConnected = true;
                this.peers.set('rpc-server', {
                    address: rpcUrl,
                    connected: true,
                    lastSeen: Date.now()
                });
            } else {
                console.warn('⚠️ Could not connect to blockchain RPC server');
                this.rpcConnected = false;
            }
        } catch (error) {
            console.warn('⚠️ Network connection failed:', error.message);
            this.rpcConnected = false;
        }
    }

    startValidationLoop() {
        const interval = this.config.get('validationInterval', 30000); // 30 seconds
        
        this.validationInterval = setInterval(async () => {
            try {
                await this.performValidation();
            } catch (error) {
                console.error('❌ Validation error:', error);
                this.validationStats.validationErrors++;
            }
        }, interval);

        console.log(`✅ Validation loop started (interval: ${interval}ms)`);
    }

    startSyncLoop() {
        const interval = this.config.get('syncInterval', 60000); // 60 seconds
        
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncWithNetwork();
            } catch (error) {
                console.error('❌ Sync error:', error);
            }
        }, interval);

        console.log(`✅ Sync loop started (interval: ${interval}ms)`);
    }

    async performValidation() {
        const startTime = Date.now();
        
        // Validate the entire blockchain
        const isValid = this.blockchain.isChainValid();
        
        if (isValid) {
            this.validationStats.blocksValidated += this.blockchain.chain.length;
            this.validationStats.transactionsValidated += this.blockchain.chain.reduce(
                (total, block) => total + block.transactions.length, 0
            );
        } else {
            this.validationStats.validationErrors++;
            console.warn('⚠️ Blockchain validation failed');
        }

        this.validationStats.lastValidation = new Date().toISOString();
        
        const validationTime = Date.now() - startTime;
        console.log(`✅ Validation completed in ${validationTime}ms (Valid: ${isValid})`);

        // Broadcast validation result to WebSocket clients
        this.broadcastToWebSocketClients({
            type: 'validation_complete',
            data: {
                isValid,
                validationTime,
                stats: this.validationStats
            }
        });

        await this.saveValidationStats();
    }

    async syncWithNetwork() {
        const rpcUrl = this.config.get('rpcUrl', 'http://localhost:8545');
        const rpcEndpoint = rpcUrl.endsWith('/rpc') ? rpcUrl : `${rpcUrl}/rpc`;
        
        try {
            const response = await fetch(rpcEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'topay_getChain',
                    params: [],
                    id: 2
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.result && data.result.chain) {
                    // Compare with local blockchain and sync if needed
                    const remoteChain = data.result.chain;
                    if (remoteChain.length > this.blockchain.chain.length) {
                        console.log(`🔄 Syncing blockchain (${remoteChain.length - this.blockchain.chain.length} new blocks)`);
                        // Implement sync logic here
                    }
                }
                
                // Update peer status
                this.rpcConnected = true;
                this.peers.set('rpc-server', {
                    address: rpcUrl,
                    connected: true,
                    lastSeen: Date.now()
                });
            }
        } catch (error) {
            console.warn('⚠️ Sync failed:', error.message);
            // Mark peer as disconnected
            this.rpcConnected = false;
            const peer = this.peers.get('rpc-server');
            if (peer) {
                peer.connected = false;
            }
        }
    }

    async validateBlock(blockData) {
        try {
            // Create block instance
            const block = new this.Block(
                blockData.timestamp,
                blockData.transactions,
                blockData.previousHash
            );
            block.hash = blockData.hash;
            block.nonce = blockData.nonce;

            // Validate block structure and hash
            const expectedHash = block.calculateHash();
            return expectedHash === block.hash;
        } catch (error) {
            console.error('❌ Block validation error:', error);
            return false;
        }
    }

    broadcastToWebSocketClients(message) {
        if (this.wsServer) {
            this.wsServer.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    async saveValidationStats() {
        try {
            const statsPath = this.config.get('statsPath', './data/validation-stats.json');
            const statsDir = path.dirname(statsPath);
            
            // Ensure directory exists
            await fs.mkdir(statsDir, { recursive: true });
            
            const stats = {
                ...this.validationStats,
                uptime: Date.now() - this.startTime,
                lastSaved: new Date().toISOString()
            };
            
            await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
        } catch (error) {
            console.error('❌ Failed to save validation stats:', error);
        }
    }

    async exportLogs() {
        // Implement log export functionality
        const logs = [
            `TOPAY Validator Logs - ${new Date().toISOString()}`,
            `Validator ID: ${this.validatorId}`,
            `Uptime: ${Date.now() - this.startTime}ms`,
            `Validation Stats: ${JSON.stringify(this.validationStats, null, 2)}`,
            `Peers: ${this.peers.size}`,
            `Blockchain Status: ${this.blockchain ? 'Loaded' : 'Not loaded'}`,
            `Service Status: ${this.isRunning ? 'Running' : 'Stopped'}`
        ].join('\\n');
        
        return logs;
    }

    // Remote Storage Methods
    async saveBlockchainData(data) {
        try {
            const dataPath = path.join(this.config.get('dataPath', './data'), 'blockchain.json');
            const dataDir = path.dirname(dataPath);
            
            // Ensure directory exists
            await fs.mkdir(dataDir, { recursive: true });
            
            // Save blockchain data
            await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
            
            console.log(`💾 Blockchain data saved to validator: ${dataPath}`);
            return { success: true, path: dataPath };
        } catch (error) {
            console.error('❌ Failed to save blockchain data:', error);
            throw error;
        }
    }

    async loadBlockchainData() {
        try {
            const dataPath = path.join(this.config.get('dataPath', './data'), 'blockchain.json');
            const data = await fs.readFile(dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null; // File doesn't exist
            }
            console.error('❌ Failed to load blockchain data:', error);
            throw error;
        }
    }

    async saveWalletsData(data) {
        try {
            const dataPath = path.join(this.config.get('dataPath', './data'), 'wallets.json');
            const dataDir = path.dirname(dataPath);
            
            // Ensure directory exists
            await fs.mkdir(dataDir, { recursive: true });
            
            // Save wallets data
            await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
            
            console.log(`💾 Wallets data saved to validator: ${dataPath}`);
            return { success: true, path: dataPath };
        } catch (error) {
            console.error('❌ Failed to save wallets data:', error);
            throw error;
        }
    }

    async loadWalletsData() {
        try {
            const dataPath = path.join(this.config.get('dataPath', './data'), 'wallets.json');
            const data = await fs.readFile(dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null; // File doesn't exist
            }
            console.error('❌ Failed to load wallets data:', error);
            throw error;
        }
    }

    async saveConfigData(data) {
        try {
            const dataPath = path.join(this.config.get('dataPath', './data'), 'config.json');
            const dataDir = path.dirname(dataPath);
            
            // Ensure directory exists
            await fs.mkdir(dataDir, { recursive: true });
            
            // Save config data
            await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
            
            console.log(`💾 Config data saved to validator: ${dataPath}`);
            return { success: true, path: dataPath };
        } catch (error) {
            console.error('❌ Failed to save config data:', error);
            throw error;
        }
    }

    async loadConfigData() {
        try {
            const dataPath = path.join(this.config.get('dataPath', './data'), 'config.json');
            const data = await fs.readFile(dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null; // File doesn't exist
            }
            console.error('❌ Failed to load config data:', error);
            throw error;
        }
    }

    async createBackup(type) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(this.config.get('dataPath', './data'), 'backups');
            
            // Ensure backup directory exists
            await fs.mkdir(backupDir, { recursive: true });
            
            let sourceFile, backupFile;
            
            switch (type) {
                case 'blockchain':
                    sourceFile = path.join(this.config.get('dataPath', './data'), 'blockchain.json');
                    backupFile = path.join(backupDir, `blockchain-${timestamp}.json`);
                    break;
                case 'wallets':
                    sourceFile = path.join(this.config.get('dataPath', './data'), 'wallets.json');
                    backupFile = path.join(backupDir, `wallets-${timestamp}.json`);
                    break;
                case 'config':
                    sourceFile = path.join(this.config.get('dataPath', './data'), 'config.json');
                    backupFile = path.join(backupDir, `config-${timestamp}.json`);
                    break;
                default:
                    throw new Error(`Unknown backup type: ${type}`);
            }
            
            // Copy file to backup location
            await fs.copyFile(sourceFile, backupFile);
            
            console.log(`📦 Backup created: ${backupFile}`);
            return { success: true, backupPath: backupFile, timestamp };
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
            throw error;
        }
    }

    async getStorageStats() {
        try {
            const dataPath = this.config.get('dataPath', './data');
            const stats = {
                dataPath,
                files: {},
                totalSize: 0,
                lastModified: null
            };
            
            const files = ['blockchain.json', 'wallets.json', 'config.json'];
            
            for (const file of files) {
                try {
                    const filePath = path.join(dataPath, file);
                    const fileStat = await fs.stat(filePath);
                    stats.files[file] = {
                        size: fileStat.size,
                        modified: fileStat.mtime,
                        exists: true
                    };
                    stats.totalSize += fileStat.size;
                    
                    if (!stats.lastModified || fileStat.mtime > stats.lastModified) {
                        stats.lastModified = fileStat.mtime;
                    }
                } catch (error) {
                    stats.files[file] = {
                        size: 0,
                        modified: null,
                        exists: false
                    };
                }
            }
            
            return stats;
        } catch (error) {
            console.error('❌ Failed to get storage stats:', error);
            throw error;
        }
    }

    async initializeRPCClient() {
        try {
            const blockchainUrl = process.env.BLOCKCHAIN_URL || this.config.get('blockchainUrl', 'http://localhost:3001');
            const validatorPort = process.env.VALIDATOR_PORT || this.config.get('apiPort', 8547);
            
            this.validatorClient = new ValidatorClient(blockchainUrl, {
                validatorId: this.validatorId,
                port: validatorPort,
                host: 'localhost'
            });
            
            // Register with blockchain
            const registrationResult = await this.validatorClient.register();
            console.log('✅ Registered with blockchain:', registrationResult);
            
            // Start periodic status updates
            this.startStatusUpdates();
            
        } catch (error) {
            console.error('❌ Failed to initialize RPC client:', error);
            throw error;
        }
    }

    startStatusUpdates() {
        // Send status updates every 30 seconds
        setInterval(async () => {
            if (this.validatorClient && this.isRunning) {
                try {
                    const status = this.getStatus();
                    await this.validatorClient.updateStatus({
                        status: 'active',
                        blockHeight: status.blockchain?.blockCount || 0,
                        lastValidation: status.validationStats.lastValidation,
                        uptime: status.uptime
                    });
                } catch (error) {
                    console.warn('⚠️ Failed to update status:', error.message);
                }
            }
        }, 30000);
    }

    getStatus() {
        const latestBlock = this.blockchain ? this.blockchain.getLatestBlock() : null;
        
        // Create completely serializable status object
        const status = {
            validatorId: this.validatorId,
            isRunning: this.isRunning,
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            rpcConnected: this.rpcConnected,
            wsConnected: this.wsConnected,
            blockchain: this.blockchain ? {
                blockCount: this.blockchain.chain.length,
                mempoolSize: this.blockchain.mempool.length,
                isValid: this.blockchain.isChainValid(),
                latestBlock: latestBlock ? {
                    index: latestBlock.index,
                    hash: latestBlock.hash,
                    timestamp: latestBlock.timestamp,
                    transactionCount: latestBlock.transactions.length,
                    difficulty: latestBlock.difficulty || 0,
                    nonce: latestBlock.nonce || 0
                } : null
            } : null,
            peers: {
                connected: 0,
                total: 0
            },
            validationStats: {
                blocksValidated: this.validationStats.blocksValidated || 0,
                transactionsValidated: this.validationStats.transactionsValidated || 0,
                validationErrors: this.validationStats.validationErrors || 0,
                lastValidation: this.validationStats.lastValidation || null,
                uptime: this.startTime ? Date.now() - this.startTime : 0
            }
        };

        // Safely count peers without including complex objects
        try {
            const connectedPeers = Array.from(this.peers.values()).filter(p => p && p.connected === true);
            status.peers.connected = connectedPeers.length;
            status.peers.total = this.peers.size;
        } catch (error) {
            // If peers cause issues, just use defaults
            status.peers.connected = 0;
            status.peers.total = 0;
        }

        return status;
    }

    async checkConnections() {
        // Check RPC connection
        const rpcUrl = this.config.get('rpcUrl', 'http://localhost:8545');
        const rpcEndpoint = rpcUrl.endsWith('/rpc') ? rpcUrl : `${rpcUrl}/rpc`;
        
        try {
            const response = await fetch(rpcEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'topay_getChainInfo',
                    params: [],
                    id: 999
                }),
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();
                this.rpcConnected = data.result && !data.error;
            } else {
                this.rpcConnected = false;
            }
            
            const peer = this.peers.get('rpc-server');
            if (peer) {
                peer.connected = this.rpcConnected;
                peer.lastSeen = Date.now();
            }
        } catch (error) {
            this.rpcConnected = false;
            const peer = this.peers.get('rpc-server');
            if (peer) {
                peer.connected = false;
            }
        }

        // Check WebSocket connections
        this.wsConnected = this.wsServer && this.wsServer.clients.size > 0;

        // Emit connection status update
        this.emit('connectionStatusChanged', {
            rpcConnected: this.rpcConnected,
            wsConnected: this.wsConnected
        });
    }

    async updateConfig(newConfig) {
        await this.config.update(newConfig);
        // Restart services that depend on config
        if (this.isRunning) {
            console.log('🔄 Restarting services due to config update...');
            // Implement selective restart logic here
        }
    }
}

export default ValidatorService;

// Main execution - start validator when file is run directly
const validator = new ValidatorService();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down validator...');
    await validator.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down validator...');
    await validator.stop();
    process.exit(0);
});

// Start the validator
validator.start().catch(error => {
    console.error('❌ Failed to start validator:', error);
    process.exit(1);
});