/**
 * TOPAY Foundation Enhanced RPC Server
 * Advanced blockchain data transmission and reading RPC methods
 * Integrates with BlockchainStorage for efficient data operations
 */

import express from 'express';
import cors from 'cors';
import { Blockchain } from '../blockchain/blockchain.js';
import { Transaction } from '../blockchain/transaction.js';
import { BlockchainStorage } from '../storage/BlockchainStorage.js';
import { ContractEngine } from '../contracts/ContractEngine.js';

export class EnhancedRPCServer {
    constructor(port = process.env.BLOCKCHAIN_PORT || 3001, options = {}) {
        this.app = express();
        this.port = port;
        this.blockchain = new Blockchain();
        this.contractEngine = new ContractEngine(this.blockchain);
        
        // Initialize enhanced storage system
        this.storage = new BlockchainStorage({
            dataPath: options.dataPath || './data/blockchain',
            backend: options.backend || 'json',
            compression: options.compression || false,
            indexing: options.indexing !== false,
            autoBackup: options.autoBackup || false,
            cacheSize: options.cacheSize || 1000
        });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupEnhancedRoutes();
        
        console.log('🚀 Enhanced RPC Server initialized');
    }
    
    setupMiddleware() {
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        
        this.app.use(express.json({ limit: '50mb' }));
        
        // Enhanced request logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }
    
    setupRoutes() {
        // Health check with storage info
        this.app.get('/health', async (req, res) => {
            const storageStats = await this.storage.getStorageStats();
            
            res.json({
                status: 'healthy',
                rpcVersion: '2.0',
                enhanced: true,
                blockchain: {
                    blocks: this.blockchain.chain.length,
                    difficulty: this.blockchain.difficulty,
                    mempool: this.blockchain.mempool.length
                },
                storage: {
                    initialized: storageStats.initialized,
                    totalBlocks: storageStats.chainState?.totalBlocks || 0,
                    totalTransactions: storageStats.chainState?.totalTransactions || 0,
                    cacheHits: storageStats.cacheHits,
                    cacheMisses: storageStats.cacheMisses
                },
                timestamp: Date.now()
            });
        });
        
        // Main enhanced RPC endpoint
        this.app.post('/rpc', async (req, res) => {
            try {
                const { jsonrpc, method, params, id } = req.body;
                
                // Validate JSON-RPC 2.0 format
                if (jsonrpc !== '2.0' || !method) {
                    return res.json({
                        jsonrpc: '2.0',
                        error: { code: -32600, message: 'Invalid Request' },
                        id: id || null
                    });
                }
                
                const result = await this.handleEnhancedRPCMethod(method, params || []);
                
                res.json({
                    jsonrpc: '2.0',
                    result,
                    id
                });
                
            } catch (error) {
                console.error('Enhanced RPC Error:', error);
                res.json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error.message
                    },
                    id: req.body.id || null
                });
            }
        });
    }
    
    setupEnhancedRoutes() {
        // Enhanced API methods list
        this.app.get('/api/rpc/methods', (req, res) => {
            res.json({
                enhanced: true,
                version: '2.0',
                methods: [
                    // Standard blockchain RPC methods
                    'topay_getBlockNumber',
                    'topay_getBalance',
                    'topay_getBlock',
                    'topay_getBlockByHash',
                    'topay_getTransaction',
                    'topay_sendTransaction',
                    'topay_getMempool',
                    'topay_getChainInfo',
                    'topay_validateChain',
                    
                    // Enhanced data transmission methods
                    'topay_getBlockRange',
                    'topay_getBlockHeaders',
                    'topay_getTransactionsByAddress',
                    'topay_getTransactionsByBlock',
                    'topay_getTransactionPool',
                    'topay_getAccountState',
                    'topay_getAccountHistory',
                    'topay_getUTXOSet',
                    'topay_getChainState',
                    
                    // Advanced query methods
                    'topay_searchTransactions',
                    'topay_getTransactionsByTimeRange',
                    'topay_getBlocksByTimeRange',
                    'topay_getAddressStats',
                    'topay_getRichList',
                    
                    // Storage and maintenance methods
                    'topay_getStorageStats',
                    'topay_performMaintenance',
                    'topay_createBackup',
                    'topay_compactDatabase',
                    
                    // Network and synchronization
                    'topay_syncStatus',
                    'topay_getPeers',
                    'topay_broadcastBlock',
                    'topay_broadcastTransaction'
                ]
            });
        });
        
        // Storage statistics endpoint
        this.app.get('/api/storage/stats', async (req, res) => {
            try {
                const stats = await this.storage.getStorageStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Backup endpoint
        this.app.post('/api/storage/backup', async (req, res) => {
            try {
                const { path: backupPath } = req.body;
                const result = await this.storage.createBackup(backupPath || './backups');
                res.json({ success: true, backupPath: result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    async handleEnhancedRPCMethod(method, params) {
        switch (method) {
            // Standard methods (delegated to blockchain)
            case 'topay_getBlockNumber':
                return this.blockchain.chain.length - 1;
                
            case 'topay_getBalance':
                const address = params[0];
                if (!address) throw new Error('Address parameter required');
                const accountState = await this.storage.getAccountState(address);
                return accountState.balance;
                
            case 'topay_getBlock':
                const blockId = params[0];
                if (blockId === undefined) throw new Error('Block identifier required');
                
                if (blockId === 'latest') {
                    const latestIndex = this.blockchain.chain.length - 1;
                    return await this.storage.getBlock(latestIndex);
                } else if (typeof blockId === 'number') {
                    return await this.storage.getBlock(blockId);
                } else {
                    return await this.storage.getBlockByHash(blockId);
                }
                
            case 'topay_getBlockByHash':
                const blockHash = params[0];
                if (!blockHash) throw new Error('Block hash required');
                return await this.storage.getBlockByHash(blockHash);
                
            case 'topay_getTransaction':
                const txHash = params[0];
                if (!txHash) throw new Error('Transaction hash required');
                return await this.storage.getTransaction(txHash);
                
            // Enhanced data transmission methods
            case 'topay_getBlockRange':
                const startIndex = params[0];
                const endIndex = params[1];
                const includeTransactions = params[2] !== false;
                
                if (startIndex === undefined || endIndex === undefined) {
                    throw new Error('Start and end block indices required');
                }
                
                return await this.storage.getBlockRange(startIndex, endIndex, includeTransactions);
                
            case 'topay_getBlockHeaders':
                const headerStartIndex = params[0];
                const headerEndIndex = params[1];
                
                if (headerStartIndex === undefined || headerEndIndex === undefined) {
                    throw new Error('Start and end block indices required');
                }
                
                const blocks = await this.storage.getBlockRange(headerStartIndex, headerEndIndex, false);
                return blocks.map(block => ({
                    index: block.index,
                    hash: block.hash,
                    previousHash: block.previousHash,
                    timestamp: block.timestamp,
                    merkleRoot: block.merkleRoot,
                    difficulty: block.difficulty,
                    nonce: block.nonce,
                    transactionCount: block.transactions?.length || 0
                }));
                
            case 'topay_getTransactionsByAddress':
                const txAddress = params[0];
                const limit = params[1] || 50;
                const offset = params[2] || 0;
                const type = params[3] || 'all'; // 'all', 'sent', 'received'
                
                if (!txAddress) throw new Error('Address parameter required');
                
                return await this.storage.getTransactionsByAddress(txAddress, limit, offset, type);
                
            case 'topay_getTransactionsByBlock':
                const blockIndex = params[0];
                if (blockIndex === undefined) throw new Error('Block index required');
                
                const block = await this.storage.getBlock(blockIndex);
                return block ? block.transactions : [];
                
            case 'topay_getAccountState':
                const stateAddress = params[0];
                if (!stateAddress) throw new Error('Address parameter required');
                
                return await this.storage.getAccountState(stateAddress);
                
            case 'topay_getAccountHistory':
                const historyAddress = params[0];
                const historyLimit = params[1] || 100;
                const historyOffset = params[2] || 0;
                
                if (!historyAddress) throw new Error('Address parameter required');
                
                const transactions = await this.storage.getTransactionsByAddress(historyAddress, historyLimit, historyOffset);
                const historyAccountState = await this.storage.getAccountState(historyAddress);
                
                return {
                    address: historyAddress,
                    currentState: historyAccountState,
                    transactions,
                    totalTransactions: transactions.length
                };
                
            case 'topay_getChainState':
                const storageStats = await this.storage.getStorageStats();
                return storageStats.chainState;
                
            case 'topay_getTransactionsByTimeRange':
                const startTime = params[0];
                const endTime = params[1];
                const timeLimit = params[2] || 100;
                
                if (!startTime || !endTime) {
                    throw new Error('Start and end timestamps required');
                }
                
                // This would require additional indexing by timestamp
                // For now, return a placeholder implementation
                return {
                    message: 'Time-based transaction search requires additional indexing',
                    startTime,
                    endTime,
                    limit: timeLimit
                };
                
            case 'topay_getAddressStats':
                const statsAddress = params[0];
                if (!statsAddress) throw new Error('Address parameter required');
                
                const addressState = await this.storage.getAccountState(statsAddress);
                const addressTxs = await this.storage.getTransactionsByAddress(statsAddress, 1000, 0);
                
                const sentTxs = addressTxs.filter(tx => tx.from === statsAddress);
                const receivedTxs = addressTxs.filter(tx => tx.to === statsAddress);
                
                const totalSent = sentTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
                const totalReceived = receivedTxs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
                
                return {
                    address: statsAddress,
                    balance: addressState.balance,
                    nonce: addressState.nonce,
                    totalTransactions: addressTxs.length,
                    sentTransactions: sentTxs.length,
                    receivedTransactions: receivedTxs.length,
                    totalSent,
                    totalReceived,
                    firstSeen: addressTxs.length > 0 ? Math.min(...addressTxs.map(tx => tx.timestamp)) : null,
                    lastSeen: addressState.lastUpdated
                };
                
            case 'topay_getStorageStats':
                return await this.storage.getStorageStats();
                
            case 'topay_performMaintenance':
                await this.storage.performMaintenance();
                return { message: 'Storage maintenance completed', timestamp: Date.now() };
                
            case 'topay_createBackup':
                const backupPath = params[0] || './backups';
                const backupResult = await this.storage.createBackup(backupPath);
                return { success: true, backupPath: backupResult, timestamp: Date.now() };
                
            case 'topay_compactDatabase':
                await this.storage.db.compact();
                return { message: 'Database compaction completed', timestamp: Date.now() };
                
            case 'topay_syncStatus':
                return {
                    syncing: false,
                    currentBlock: this.blockchain.chain.length - 1,
                    highestBlock: this.blockchain.chain.length - 1,
                    startingBlock: 0,
                    storageInitialized: this.storage.initialized
                };
                
            case 'topay_getPeers':
                return {
                    peers: Array.from(this.blockchain.networkNodes),
                    peerCount: this.blockchain.networkNodes.size
                };
                
            case 'topay_sendTransaction':
                const { from, to, amount, memo, data, signature, publicKey } = params[0] || {};
                
                if (!from || !to || amount === undefined) {
                    throw new Error('Missing required transaction parameters');
                }
                
                const transactionData = data || memo;
                const transaction = new Transaction(from, to, amount, transactionData);
                
                if (signature) {
                    transaction.signature = signature;
                } else {
                    await transaction.signTransaction('dummy_private_key');
                }
                
                if (publicKey) transaction.publicKey = publicKey;
                
                // Add to blockchain mempool
                await this.blockchain.addTransaction(transaction);
                
                // Store in enhanced storage (as pending)
                await this.storage.storeTransaction(transaction, null);
                
                return {
                    transactionHash: transaction.hash,
                    status: 'pending',
                    message: 'Transaction added to mempool and stored'
                };
                
            case 'topay_getMempool':
                return {
                    transactions: this.blockchain.mempool.map(tx => tx.toJSON()),
                    count: this.blockchain.mempool.length
                };
                
            case 'topay_getChainInfo':
                const chainStats = await this.storage.getStorageStats();
                return {
                    blockCount: this.blockchain.chain.length,
                    totalTransactions: chainStats.chainState?.totalTransactions || 0,
                    mempoolSize: this.blockchain.mempool.length,
                    latestBlock: this.blockchain.getLatestBlock(),
                    isValid: await this.blockchain.isChainValid(),
                    storageStats: chainStats
                };
                
            case 'topay_validateChain':
                return {
                    isValid: await this.blockchain.isChainValid(),
                    timestamp: Date.now()
                };
                
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }
    
    /**
     * Initialize the enhanced RPC server
     */
    async initialize() {
        try {
            // Initialize storage system
            await this.storage.initialize();
            
            // Sync existing blockchain data to storage
            await this.syncBlockchainToStorage();
            
            console.log('✅ Enhanced RPC Server initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced RPC Server:', error);
            throw error;
        }
    }
    
    /**
     * Sync existing blockchain data to storage
     */
    async syncBlockchainToStorage() {
        console.log('🔄 Syncing blockchain data to storage...');
        
        for (let i = 0; i < this.blockchain.chain.length; i++) {
            const block = this.blockchain.chain[i];
            await this.storage.storeBlock(block);
        }
        
        console.log(`✅ Synced ${this.blockchain.chain.length} blocks to storage`);
    }
    
    /**
     * Start the enhanced RPC server
     */
    async start() {
        try {
            await this.initialize();
            
            this.server = this.app.listen(this.port, () => {
                console.log(`🚀 Enhanced TOPAY RPC Server running on port ${this.port}`);
                console.log(`📡 RPC Endpoint: http://localhost:${this.port}/rpc`);
                console.log(`🏥 Health Check: http://localhost:${this.port}/health`);
                console.log(`📊 API Methods: http://localhost:${this.port}/api/rpc/methods`);
                console.log(`💾 Storage Stats: http://localhost:${this.port}/api/storage/stats`);
            });
            
            return this.server;
        } catch (error) {
            console.error('❌ Failed to start Enhanced RPC Server:', error);
            throw error;
        }
    }
    
    /**
     * Stop the enhanced RPC server
     */
    async stop() {
        try {
            if (this.server) {
                this.server.close();
            }
            
            await this.storage.close();
            console.log('🔒 Enhanced RPC Server stopped');
        } catch (error) {
            console.error('❌ Error stopping Enhanced RPC Server:', error);
        }
    }
}

// Auto-start if run directly
if (process.argv[1].endsWith('EnhancedRPCServer.js')) {
    const port = process.argv[2] ? parseInt(process.argv[2]) : 3001;
    const server = new EnhancedRPCServer(port);
    server.start().catch(console.error);
}