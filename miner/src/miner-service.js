/**
 * TOPAY Miner Service - Core Mining Engine
 * Handles blockchain mining, network communication, and consensus
 */

// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const EventEmitter = require('events');
const express = require('express');
const { WebSocketServer } = require('ws');
const { promises: fs } = require('fs');
const path = require('path');
const crypto = require('crypto');
const { machineId } = require('node-machine-id');
const si = require('systeminformation');

// Import ValidatorClient for RPC registration
const { ValidatorClient } = require('./rpc/validator-client.js');



// Dynamic import for ES modules
let fetch;

class MinerService extends EventEmitter {
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
        
        // Mining-specific properties
        this.isMining = false;
        this.miningStats = {
            blocksMinedTotal: 0,
            blocksMinedSession: 0,
            hashRate: 0,
            lastBlockMined: null,
            miningRewards: 0
        };
        this.miningInterval = null;
        this.minerAddress = null;
        this.autoMining = false;
        this.miningDifficulty = 2;
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
            // Initialize fetch for CommonJS compatibility
            if (!fetch) {
                fetch = require('node-fetch');
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
            
            // Initialize and register with blockchain via RPC (optional)
            try {
                await this.initializeRPCClient();
            } catch (error) {
                console.warn('⚠️ Could not connect to blockchain, running in standalone mode:', error.message);
                this.validatorClient = null;
            }
            

            
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
                    await this.validatorClient.shutdown();
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
            // Use local blockchain files with CommonJS require
            const { Blockchain } = require('./blockchain/blockchain.js');
            const { Transaction } = require('./blockchain/transaction.js');
            const { Block } = require('./blockchain/block.js');

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
        
        // Import cors
        const cors = require('cors');
        app.use(cors());
        
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

        // Manual connection endpoint
        app.post('/api/connect', async (req, res) => {
            try {
                const { blockchainUrl } = req.body;
                
                if (!blockchainUrl) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Blockchain URL is required' 
                    });
                }
                
                console.log(`🔄 Manual connection request to: ${blockchainUrl}`);
                
                // Attempt to connect to the specified blockchain URL
                const result = await this.connectToNetwork(blockchainUrl);
                
                if (result.success) {
                    // If connection successful, reinitialize the RPC client with the new URL
                    try {
                        await this.initializeRPCClient();
                        res.json({
                            success: true,
                            message: 'Successfully connected to blockchain and reinitialized validator client',
                            blockchainUrl
                        });
                    } catch (clientError) {
                        res.status(500).json({
                            success: false,
                            message: `Connected to blockchain but failed to initialize validator client: ${clientError.message}`,
                            blockchainUrl
                        });
                    }
                } else {
                    res.status(400).json({
                        success: false,
                        message: result.message,
                        blockchainUrl
                    });
                }
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    message: `Connection error: ${error.message}` 
                });
            }
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

        // Mining endpoints
        app.post('/api/mine/start', async (req, res) => {
            try {
                const { minerAddress } = req.body;
                if (!minerAddress) {
                    return res.status(400).json({ error: 'Miner address required' });
                }
                
                const result = await this.startMining(minerAddress);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/mine/stop', async (req, res) => {
            try {
                const result = await this.stopMining();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/mine/auto/start', async (req, res) => {
            try {
                const { minerAddress, interval } = req.body;
                if (!minerAddress) {
                    return res.status(400).json({ error: 'Miner address required' });
                }
                
                const result = await this.startAutoMining(minerAddress, interval);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/mine/auto/stop', async (req, res) => {
            try {
                const result = await this.stopAutoMining();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.post('/api/mine/block', async (req, res) => {
            try {
                const result = await this.mineBlock();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/mine/status', (req, res) => {
            try {
                const status = this.getMiningStatus();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        app.get('/api/mine/summary', async (req, res) => {
            try {
                const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
                const summaryFile = path.join(baseDataDir, 'mining-summary.json');
                const data = await fs.readFile(summaryFile, 'utf8');
                const summary = JSON.parse(data);
                res.json(summary);
            } catch (error) {
                res.status(404).json({ error: 'Mining summary not found' });
            }
        });

        app.get('/api/blockchain/state', async (req, res) => {
            try {
                const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
                const stateFile = path.join(baseDataDir, 'blockchain-state.json');
                const data = await fs.readFile(stateFile, 'utf8');
                const state = JSON.parse(data);
                res.json(state);
            } catch (error) {
                res.status(404).json({ error: 'Blockchain state not found' });
            }
        });

        this.server = app.listen(apiPort, () => {
            console.log(`✅ API Server started on port ${apiPort}`);
        });
    }

    async startWebSocketServer() {
        const wsPort = process.env.VALIDATOR_WS_PORT || this.config.get('wsPort', 8548);
        this.wsServer = new WebSocketServer({ port: wsPort });

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

    async connectToNetwork(customRpcUrl = null) {
        // Use custom URL if provided, otherwise use config or default
        const rpcUrl = customRpcUrl || this.config.get('rpcUrl', 'http://localhost:8545');
        const rpcEndpoint = rpcUrl.endsWith('/rpc') ? rpcUrl : `${rpcUrl}/rpc`;
        
        // Track connection attempt time
        this.lastConnectionAttempt = new Date().toISOString();
        
        try {
            console.log(`🔌 Attempting to connect to blockchain at: ${rpcUrl}`);
            
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
                // Parse the response to get chain info
                const chainInfo = await response.json();
                console.log('✅ Connected to blockchain network');
                console.log(`📊 Chain info: ${JSON.stringify(chainInfo.result || {}, null, 2)}`);
                
                this.rpcConnected = true;
                
                // If custom URL was provided, update the config
                if (customRpcUrl) {
                    this.config.set('rpcUrl', customRpcUrl);
                    console.log(`✅ Updated blockchain URL to: ${customRpcUrl}`);
                }
                
                this.peers.set('rpc-server', {
                    address: rpcUrl,
                    connected: true,
                    lastSeen: Date.now()
                });
                
                return { 
                    success: true, 
                    message: 'Connected to blockchain network',
                    chainInfo: chainInfo.result || {}
                };
            } else {
                console.warn('⚠️ Could not connect to blockchain RPC server');
                this.rpcConnected = false;
                return { success: false, message: 'Could not connect to blockchain RPC server' };
            }
        } catch (error) {
            console.warn('⚠️ Network connection failed:', error.message);
            this.rpcConnected = false;
            return { success: false, message: `Connection failed: ${error.message}` };
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
                    method: 'topay_getChainInfo',
                    params: [],
                    id: 2
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.result && data.result.blockCount) {
                    // Compare with local blockchain and sync if needed
                    const remoteBlockCount = data.result.blockCount;
                    if (remoteBlockCount > this.blockchain.chain.length) {
                        console.log(`🔄 Syncing blockchain (${remoteBlockCount - this.blockchain.chain.length} new blocks)`);
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
            
            const files = ['blockchain.json', 'config.json'];
            
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
            // Use the rpcUrl from config (which may have been updated by connectToNetwork)
            // or fall back to environment variable or default
            const blockchainUrl = process.env.BLOCKCHAIN_RPC_URL || 
                                 this.config.get('rpcUrl') || 
                                 this.config.get('blockchainUrl', 'http://localhost:8545');
            const validatorPort = process.env.VALIDATOR_PORT || this.config.get('apiPort', 8547);
            
            console.log(`🔄 Initializing validator client with blockchain URL: ${blockchainUrl}`);
            
            // If we already have a validator client, shut it down properly first
            if (this.validatorClient) {
                try {
                    await this.validatorClient.shutdown();
                    console.log('✅ Previous validator client shutdown successfully');
                } catch (shutdownError) {
                    console.warn('⚠️ Error shutting down previous validator client:', shutdownError.message);
                }
            }
            
            // Create new validator client with updated URL
            this.validatorClient = new ValidatorClient({
                blockchainUrl: blockchainUrl,
                validatorPort: validatorPort,
                validatorName: this.validatorId,
                region: 'local',
                tier: 'primary'
            });
            
            // Initialize and register with blockchain
            const registrationResult = await this.validatorClient.initialize();
            console.log('✅ Registered with blockchain:', registrationResult);
            
            // Start periodic status updates
            this.startStatusUpdates();
            
            return registrationResult;
        } catch (error) {
            console.error('❌ Failed to initialize RPC client:', error);
            throw error;
        }
    }

    // Wallet client initialization removed

    startStatusUpdates() {
        // Send status updates every 30 seconds
        setInterval(async () => {
            if (this.validatorClient && this.isRunning) {
                try {
                    const status = this.getStatus();
                    await this.validatorClient.updateStatus('active', 100, {
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
        
        // Get current blockchain URL
        const blockchainUrl = this.validatorClient ? 
            this.validatorClient.blockchainUrl : 
            (process.env.BLOCKCHAIN_RPC_URL || 
             this.config.get('rpcUrl') || 
             this.config.get('blockchainUrl', 'http://localhost:8545'));
        
        // Create completely serializable status object
        const status = {
            validatorId: this.validatorId,
            isRunning: this.isRunning,
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            rpcConnected: this.rpcConnected,
            wsConnected: this.wsConnected,
            connection: {
                blockchainUrl: blockchainUrl,
                lastConnectionAttempt: this.lastConnectionAttempt || null,
                connectionStatus: this.rpcConnected ? 'connected' : 'disconnected'
            },
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

    // ==================== MINING METHODS ====================

    /**
     * Start mining process
     */
    async startMining(minerAddress) {
        if (this.isMining) {
            console.log('⚠️ Mining is already active');
            return { success: false, message: 'Mining already active' };
        }

        if (!this.blockchain) {
            console.log('❌ Blockchain not initialized');
            return { success: false, message: 'Blockchain not initialized' };
        }

        this.minerAddress = minerAddress;
        this.isMining = true;
        this.miningStats.blocksMinedSession = 0;
        
        console.log(`🚀 Starting mining with address: ${minerAddress}`);
        
        // Start mining loop
        this.startMiningLoop();
        
        this.emit('miningStarted', { minerAddress, timestamp: Date.now() });
        return { success: true, message: 'Mining started successfully' };
    }

    /**
     * Stop mining process
     */
    async stopMining() {
        if (!this.isMining) {
            console.log('⚠️ Mining is not active');
            return { success: false, message: 'Mining not active' };
        }

        this.isMining = false;
        
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }
        
        console.log('🛑 Mining stopped');
        this.emit('miningStopped', { timestamp: Date.now() });
        return { success: true, message: 'Mining stopped successfully' };
    }

    /**
     * Start auto-mining with interval
     */
    async startAutoMining(minerAddress, interval = 30000) {
        this.autoMining = true;
        this.minerAddress = minerAddress;
        
        console.log(`🔄 Starting auto-mining every ${interval}ms`);
        
        this.miningInterval = setInterval(async () => {
            if (this.blockchain && this.blockchain.mempool.length > 0) {
                await this.mineBlock();
            }
        }, interval);
        
        return { success: true, message: 'Auto-mining started' };
    }

    /**
     * Stop auto-mining
     */
    async stopAutoMining() {
        this.autoMining = false;
        
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }
        
        console.log('🛑 Auto-mining stopped');
        return { success: true, message: 'Auto-mining stopped' };
    }

    /**
     * Mine a single block
     */
    async mineBlock() {
        if (!this.blockchain || !this.minerAddress) {
            console.log('❌ Cannot mine: blockchain or miner address not set');
            return { success: false, message: 'Blockchain or miner address not set' };
        }

        try {
            const startTime = Date.now();
            console.log('\n⛏️ Mining new block...');
            
            // Mine pending transactions
            await this.blockchain.minePendingTransactions(this.minerAddress);
            
            const miningTime = Date.now() - startTime;
            const latestBlock = this.blockchain.getLatestBlock();
            
            // Update mining stats
            this.miningStats.blocksMinedTotal++;
            this.miningStats.blocksMinedSession++;
            this.miningStats.lastBlockMined = Date.now();
            this.miningStats.miningRewards += this.blockchain.miningReward;
            this.miningStats.hashRate = latestBlock.nonce / (miningTime / 1000);
            
            // Save blockchain data
            await this.saveMinedBlockData(latestBlock);
            
            console.log(`✅ Block #${latestBlock.index} mined successfully!`);
            console.log(`   Mining time: ${miningTime}ms`);
            console.log(`   Hash rate: ${this.miningStats.hashRate.toFixed(2)} H/s`);
            console.log(`   Total blocks mined: ${this.miningStats.blocksMinedTotal}`);
            
            this.emit('blockMined', {
                block: latestBlock,
                miningTime,
                hashRate: this.miningStats.hashRate,
                minerAddress: this.minerAddress
            });
            
            return {
                success: true,
                block: latestBlock,
                miningTime,
                hashRate: this.miningStats.hashRate
            };
            
        } catch (error) {
            console.error('❌ Mining failed:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Start continuous mining loop
     */
    startMiningLoop() {
        const mineNext = async () => {
            if (!this.isMining) return;
            
            if (this.blockchain && this.blockchain.mempool.length > 0) {
                await this.mineBlock();
            }
            
            // Schedule next mining attempt
            if (this.isMining) {
                setTimeout(mineNext, 1000); // Check every second
            }
        };
        
        mineNext();
    }

    /**
     * Save mined block data to persistent storage with comprehensive blockchain data
     */
    async saveMinedBlockData(block) {
        try {
            const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
            
            // Create all necessary directories
            const directories = [
                path.join(baseDataDir, 'mined-blocks'),
                path.join(baseDataDir, 'blocks'),
                path.join(baseDataDir, 'transactions'),
                path.join(baseDataDir, 'backups')
            ];
            
            for (const dir of directories) {
                await fs.mkdir(dir, { recursive: true });
            }
            
            // Save individual block file with enhanced data
            const blockFile = path.join(baseDataDir, 'mined-blocks', `block-${block.index}.json`);
            const blockData = {
                ...block.toJSON(),
                minedAt: Date.now(),
                minerAddress: this.minerAddress,
                miningStats: { ...this.miningStats },
                networkInfo: {
                    peersConnected: this.peers.size,
                    rpcConnected: this.rpcConnected,
                    wsConnected: this.wsConnected
                }
            };
            
            await fs.writeFile(blockFile, JSON.stringify(blockData, null, 2));
            
            // Save block to main blocks directory
            const mainBlockFile = path.join(baseDataDir, 'blocks', `block-${block.index}.json`);
            await fs.writeFile(mainBlockFile, JSON.stringify(block.toJSON(), null, 2));
            
            // Save individual transactions
            await this.saveBlockTransactions(block, baseDataDir);
            
            // Update mining summary
            await this.updateMiningSummary(block);
            
            // Save complete blockchain state
            await this.saveCompleteBlockchainData();
            
            // Create automatic backup
            await this.createAutomaticBackup(block.index);
            
            // Update blockchain index
            await this.updateBlockchainIndex(block);
            
            console.log(`💾 Complete block data saved: ${blockFile}`);
            console.log(`📊 Blockchain state updated with ${this.blockchain.chain.length} blocks`);
            
        } catch (error) {
            console.error('❌ Failed to save block data:', error.message);
            throw error;
        }
    }

    /**
     * Update mining summary statistics
     */
    async updateMiningSummary(block) {
        try {
            const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
            const summaryFile = path.join(baseDataDir, 'mining-summary.json');
            
            let summary = {
                totalBlocksMined: 0,
                totalRewards: 0,
                averageHashRate: 0,
                firstBlockMined: null,
                lastBlockMined: null,
                minerAddress: this.minerAddress,
                blocks: []
            };
            
            // Load existing summary if it exists
            try {
                const existingData = await fs.readFile(summaryFile, 'utf8');
                summary = JSON.parse(existingData);
            } catch (error) {
                // File doesn't exist, use default summary
            }
            
            // Update summary
            summary.totalBlocksMined = this.miningStats.blocksMinedTotal;
            summary.totalRewards = this.miningStats.miningRewards;
            summary.averageHashRate = this.miningStats.hashRate;
            summary.lastBlockMined = Date.now();
            summary.minerAddress = this.minerAddress;
            
            if (!summary.firstBlockMined) {
                summary.firstBlockMined = Date.now();
            }
            
            // Add block info
            summary.blocks.push({
                index: block.index,
                hash: block.hash,
                timestamp: block.timestamp,
                transactionCount: block.transactions.length,
                nonce: block.nonce,
                difficulty: block.difficulty
            });
            
            await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
            
        } catch (error) {
            console.error('❌ Failed to update mining summary:', error.message);
        }
    }

    /**
     * Save complete blockchain data with comprehensive information
     */
    async saveCompleteBlockchainData() {
        try {
            const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
            
            // Save main blockchain state
            const stateFile = path.join(baseDataDir, 'blockchain-state.json');
            const blockchainData = {
                chain: this.blockchain.chain.map(block => block.toJSON()),
                mempool: this.blockchain.mempool.map(tx => tx.toJSON()),
                difficulty: this.blockchain.difficulty,
                miningReward: this.blockchain.miningReward,
                networkNodes: Array.from(this.blockchain.networkNodes || []),
                validators: Array.from(this.blockchain.validators || []),
                lastUpdated: Date.now(),
                minerInfo: {
                    minerAddress: this.minerAddress,
                    validatorId: this.validatorId,
                    miningStats: { ...this.miningStats }
                }
            };
            
            await fs.writeFile(stateFile, JSON.stringify(blockchainData, null, 2));
            
            // Save compressed blockchain for backup
            const compressedFile = path.join(baseDataDir, 'blockchain-compressed.json');
            const compressedData = {
                chainLength: this.blockchain.chain.length,
                latestBlockHash: this.blockchain.getLatestBlock().hash,
                totalTransactions: this.blockchain.chain.reduce((total, block) => total + block.transactions.length, 0),
                difficulty: this.blockchain.difficulty,
                lastUpdated: Date.now()
            };
            
            await fs.writeFile(compressedFile, JSON.stringify(compressedData, null, 2));
            
            // Save blockchain metadata
            await this.saveBlockchainMetadata();
            
            console.log('💾 Complete blockchain data saved');
            
        } catch (error) {
            console.error('❌ Failed to save complete blockchain data:', error.message);
            throw error;
        }
    }

    /**
     * Save individual block transactions
     */
    async saveBlockTransactions(block, baseDataDir) {
        try {
            const transactionsDir = path.join(baseDataDir, 'transactions');
            
            for (let i = 0; i < block.transactions.length; i++) {
                const transaction = block.transactions[i];
                const txFile = path.join(transactionsDir, `tx-${block.index}-${i}.json`);
                const txData = {
                    ...transaction.toJSON(),
                    blockIndex: block.index,
                    blockHash: block.hash,
                    transactionIndex: i,
                    savedAt: Date.now()
                };
                
                await fs.writeFile(txFile, JSON.stringify(txData, null, 2));
            }
            
        } catch (error) {
            console.error('❌ Failed to save block transactions:', error.message);
        }
    }
    
    /**
     * Create automatic backup after mining
     */
    async createAutomaticBackup(blockIndex) {
        try {
            const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
            const backupsDir = path.join(baseDataDir, 'backups');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupsDir, `blockchain-backup-block-${blockIndex}-${timestamp}.json`);
            
            const backupData = {
                blockIndex,
                timestamp: Date.now(),
                minerAddress: this.minerAddress,
                blockchain: {
                    chain: this.blockchain.chain.map(block => block.toJSON()),
                    mempool: this.blockchain.mempool.map(tx => tx.toJSON()),
                    difficulty: this.blockchain.difficulty,
                    miningReward: this.blockchain.miningReward
                },
                miningStats: { ...this.miningStats },
                validationStats: { ...this.validationStats }
            };
            
            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`📦 Automatic backup created: ${backupFile}`);
            
        } catch (error) {
            console.error('❌ Failed to create automatic backup:', error.message);
        }
    }
    
    /**
     * Update blockchain index for fast lookups
     */
    async updateBlockchainIndex(block) {
        try {
            const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
            const indexFile = path.join(baseDataDir, 'blockchain-index.json');
            
            let index = {
                blocks: {},
                transactions: {},
                addresses: {},
                lastUpdated: Date.now()
            };
            
            // Load existing index
            try {
                const existingData = await fs.readFile(indexFile, 'utf8');
                index = JSON.parse(existingData);
            } catch (error) {
                // File doesn't exist, use default index
            }
            
            // Update block index
            index.blocks[block.index] = {
                hash: block.hash,
                timestamp: block.timestamp,
                transactionCount: block.transactions.length,
                nonce: block.nonce,
                difficulty: block.difficulty
            };
            
            // Update transaction and address indexes
            block.transactions.forEach((tx, txIndex) => {
                const txId = `${block.index}-${txIndex}`;
                index.transactions[txId] = {
                    from: tx.from,
                    to: tx.to,
                    amount: tx.amount,
                    blockIndex: block.index,
                    timestamp: tx.timestamp
                };
                
                // Update address index
                if (tx.from && tx.from !== 'SYSTEM') {
                    if (!index.addresses[tx.from]) index.addresses[tx.from] = [];
                    index.addresses[tx.from].push(txId);
                }
                
                if (!index.addresses[tx.to]) index.addresses[tx.to] = [];
                index.addresses[tx.to].push(txId);
            });
            
            index.lastUpdated = Date.now();
            await fs.writeFile(indexFile, JSON.stringify(index, null, 2));
            
        } catch (error) {
            console.error('❌ Failed to update blockchain index:', error.message);
        }
    }
    
    /**
     * Save blockchain metadata
     */
    async saveBlockchainMetadata() {
        try {
            const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
            const metadataFile = path.join(baseDataDir, 'blockchain-metadata.json');
            
            const metadata = {
                version: '1.0.0',
                createdAt: this.startTime,
                lastUpdated: Date.now(),
                minerInfo: {
                    minerAddress: this.minerAddress,
                    validatorId: this.validatorId
                },
                chainStats: {
                    totalBlocks: this.blockchain.chain.length,
                    totalTransactions: this.blockchain.chain.reduce((total, block) => total + block.transactions.length, 0),
                    currentDifficulty: this.blockchain.difficulty,
                    miningReward: this.blockchain.miningReward
                },
                networkStats: {
                    peersConnected: this.peers.size,
                    rpcConnected: this.rpcConnected,
                    wsConnected: this.wsConnected
                },
                miningStats: { ...this.miningStats },
                validationStats: { ...this.validationStats }
            };
            
            await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
            
        } catch (error) {
            console.error('❌ Failed to save blockchain metadata:', error.message);
        }
    }

    /**
     * Load blockchain state from storage with enhanced recovery
     */
    async loadBlockchainState() {
        try {
            const baseDataDir = this.config.get('dataPath', path.join(__dirname, '..', 'data'));
            const stateFile = path.join(baseDataDir, 'blockchain-state.json');
            const data = await fs.readFile(stateFile, 'utf8');
            const blockchainData = JSON.parse(data);
            
            if (this.blockchain && blockchainData.chain) {
                // Restore blockchain state
                this.blockchain.chain = blockchainData.chain.map(blockData => {
                    const block = this.Block.fromJSON(blockData);
                    return block;
                });
                
                this.blockchain.mempool = blockchainData.mempool.map(txData => {
                    return this.Transaction.fromJSON(txData);
                });
                
                this.blockchain.difficulty = blockchainData.difficulty || 2;
                this.blockchain.miningReward = blockchainData.miningReward || 100;
                
                console.log(`📚 Blockchain state loaded: ${this.blockchain.chain.length} blocks`);
            }
            
        } catch (error) {
            console.log('ℹ️ No existing blockchain state found, starting fresh');
        }
    }

    /**
     * Get mining status and statistics
     */
    getMiningStatus() {
        return {
            isMining: this.isMining,
            autoMining: this.autoMining,
            minerAddress: this.minerAddress,
            difficulty: this.miningDifficulty,
            stats: { ...this.miningStats },
            blockchain: this.blockchain ? {
                blockCount: this.blockchain.chain.length,
                mempoolSize: this.blockchain.mempool.length,
                difficulty: this.blockchain.difficulty,
                miningReward: this.blockchain.miningReward
            } : null
        };
    }

}

module.exports = MinerService;

// Main execution - start miner when file is run directly
async function startMiner() {
    try {
        // Import and initialize config
        const ValidatorConfig = require('./config/validator-config-cjs.js');
        const config = new ValidatorConfig();
        await config.load();
        
        // Create miner with config
        const miner = new MinerService(config);

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down miner...');
            await miner.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down miner...');
            await miner.stop();
            process.exit(0);
        });

        // Start the miner
        await miner.start();
    } catch (error) {
        console.error('❌ Failed to start miner:', error);
        process.exit(1);
    }
}

// Only start the miner if this file is run directly (not imported as a module)
if (require.main === module) {
    startMiner();
}