/**
 * TOPAY Foundation Blockchain Storage Manager
 * High-level blockchain data storage operations using DatabaseEngine
 * Provides real blockchain-like data persistence and retrieval
 */

import { DatabaseEngine } from './DatabaseEngine.js';
import { PersistenceManager } from './persistence.js';
import { computeHash } from '@topayfoundation/topayz512';
import fs from 'fs/promises';
import path from 'path';

export class BlockchainStorage {
    constructor(options = {}) {
        this.dataPath = options.dataPath || './data/blockchain';
        this.enableCompression = options.compression || false;
        this.enableIndexing = options.indexing !== false;
        this.autoBackup = options.autoBackup || false;
        this.backupInterval = options.backupInterval || 3600000; // 1 hour
        
        // Initialize database engine
        this.db = new DatabaseEngine({
            dataPath: this.dataPath,
            backend: options.backend || 'json',
            compression: this.enableCompression,
            indexing: this.enableIndexing,
            cacheSize: options.cacheSize || 1000
        });
        
        // Legacy persistence manager for compatibility
        this.persistence = new PersistenceManager(path.join(this.dataPath, 'legacy'));
        
        // State tracking
        this.chainState = {
            latestBlockIndex: -1,
            totalTransactions: 0,
            totalBlocks: 0,
            chainHash: null,
            lastUpdated: null
        };
        
        // UTXO set for efficient balance calculations
        this.utxoSet = new Map();
        
        // Account states cache
        this.accountStates = new Map();
        
        this.initialized = false;
        
        console.log('🏗️ Blockchain Storage Manager initialized');
    }
    
    /**
     * Initialize the storage system
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            await this.db.initialize();
            await this.persistence.initialize();
            
            // Load chain state
            await this.loadChainState();
            
            // Load UTXO set
            await this.loadUTXOSet();
            
            // Setup auto-backup if enabled
            if (this.autoBackup) {
                this.setupAutoBackup();
            }
            
            this.initialized = true;
            console.log('✅ Blockchain Storage initialized successfully');
            console.log(`📊 Chain state: ${this.chainState.totalBlocks} blocks, ${this.chainState.totalTransactions} transactions`);
        } catch (error) {
            console.error('❌ Failed to initialize blockchain storage:', error);
            throw error;
        }
    }
    
    /**
     * Store a complete block with all its data
     */
    async storeBlock(block) {
        try {
            // Validate block structure
            if (!block || typeof block.index !== 'number') {
                throw new Error('Invalid block structure');
            }
            
            // Store block data
            await this.db.putBlock(block.index, {
                index: block.index,
                hash: block.hash,
                previousHash: block.previousHash,
                timestamp: block.timestamp,
                transactions: block.transactions || [],
                merkleRoot: block.merkleRoot,
                nonce: block.nonce,
                difficulty: block.difficulty
            });
            
            // Store individual transactions
            for (const tx of block.transactions || []) {
                await this.storeTransaction(tx, block.index);
            }
            
            // Update chain state
            await this.updateChainState(block);
            
            // Update UTXO set
            await this.updateUTXOSet(block);
            
            console.log(`📦 Block ${block.index} stored with ${block.transactions?.length || 0} transactions`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to store block ${block?.index}:`, error);
            return false;
        }
    }
    
    /**
     * Retrieve a block by index
     */
    async getBlock(blockIndex) {
        try {
            return await this.db.getBlock(blockIndex);
        } catch (error) {
            console.error(`❌ Failed to get block ${blockIndex}:`, error);
            return null;
        }
    }
    
    /**
     * Retrieve a block by hash
     */
    async getBlockByHash(hash) {
        try {
            return await this.db.getBlockByHash(hash);
        } catch (error) {
            console.error(`❌ Failed to get block by hash ${hash}:`, error);
            return null;
        }
    }
    
    /**
     * Get a range of blocks
     */
    async getBlockRange(startIndex, endIndex, includeTransactions = true) {
        try {
            const blocks = await this.db.getBlockRange(startIndex, endIndex);
            
            if (!includeTransactions) {
                // Remove transaction details for lighter response
                return blocks.map(block => ({
                    ...block,
                    transactions: block.transactions?.map(tx => tx.hash) || []
                }));
            }
            
            return blocks;
        } catch (error) {
            console.error(`❌ Failed to get block range ${startIndex}-${endIndex}:`, error);
            return [];
        }
    }
    
    /**
     * Store a transaction
     */
    async storeTransaction(transaction, blockIndex = null) {
        try {
            await this.db.putTransaction(transaction.hash, {
                hash: transaction.hash,
                from: transaction.from,
                to: transaction.to,
                amount: transaction.amount,
                timestamp: transaction.timestamp,
                signature: transaction.signature,
                data: transaction.data,
                nonce: transaction.nonce
            }, blockIndex);
            
            // Update account states
            if (blockIndex !== null) {
                await this.updateAccountStates(transaction);
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to store transaction ${transaction?.hash}:`, error);
            return false;
        }
    }
    
    /**
     * Retrieve a transaction by hash
     */
    async getTransaction(txHash) {
        try {
            return await this.db.getTransaction(txHash);
        } catch (error) {
            console.error(`❌ Failed to get transaction ${txHash}:`, error);
            return null;
        }
    }
    
    /**
     * Get transactions by address with pagination
     */
    async getTransactionsByAddress(address, limit = 50, offset = 0, type = 'all') {
        try {
            const transactions = await this.db.getTransactionsByAddress(address, limit * 2, offset);
            
            // Filter by type if specified
            let filteredTxs = transactions;
            if (type === 'sent') {
                filteredTxs = transactions.filter(tx => tx.from === address);
            } else if (type === 'received') {
                filteredTxs = transactions.filter(tx => tx.to === address);
            }
            
            return filteredTxs.slice(0, limit);
        } catch (error) {
            console.error(`❌ Failed to get transactions for address ${address}:`, error);
            return [];
        }
    }
    
    /**
     * Get account balance and state
     */
    async getAccountState(address) {
        try {
            // Check cache first
            if (this.accountStates.has(address)) {
                return this.accountStates.get(address);
            }
            
            // Load from database
            let state = await this.db.getAccountState(address);
            
            if (!state) {
                // Calculate state from UTXO set
                state = await this.calculateAccountState(address);
                await this.db.putAccountState(address, state);
            }
            
            // Cache the state
            this.accountStates.set(address, state);
            
            return state;
        } catch (error) {
            console.error(`❌ Failed to get account state for ${address}:`, error);
            return { address, balance: 0, nonce: 0, lastUpdated: Date.now() };
        }
    }
    
    /**
     * Calculate account state from transaction history
     */
    async calculateAccountState(address) {
        let balance = 0;
        let nonce = 0;
        let lastUpdated = 0;
        
        try {
            // Get all transactions for this address
            const transactions = await this.getTransactionsByAddress(address, 10000, 0);
            
            for (const tx of transactions) {
                if (tx.to === address) {
                    balance += parseFloat(tx.amount) || 0;
                }
                if (tx.from === address) {
                    balance -= parseFloat(tx.amount) || 0;
                    nonce++;
                }
                
                if (tx.timestamp > lastUpdated) {
                    lastUpdated = tx.timestamp;
                }
            }
        } catch (error) {
            console.error(`❌ Error calculating account state for ${address}:`, error);
        }
        
        return {
            address,
            balance: Math.max(0, balance), // Ensure non-negative balance
            nonce,
            lastUpdated: lastUpdated || Date.now()
        };
    }
    
    /**
     * Update chain state after adding a block
     */
    async updateChainState(block) {
        this.chainState.latestBlockIndex = block.index;
        this.chainState.totalBlocks = block.index + 1;
        this.chainState.totalTransactions += block.transactions?.length || 0;
        this.chainState.chainHash = block.hash;
        this.chainState.lastUpdated = Date.now();
        
        await this.saveChainState();
    }
    
    /**
     * Update UTXO set after adding a block
     */
    async updateUTXOSet(block) {
        for (const tx of block.transactions || []) {
            // Remove spent UTXOs (inputs)
            if (tx.from && tx.from !== 'GENESIS') {
                const utxoKey = `${tx.from}:${tx.nonce || 0}`;
                this.utxoSet.delete(utxoKey);
            }
            
            // Add new UTXOs (outputs)
            if (tx.to) {
                const utxoKey = `${tx.to}:${tx.hash}`;
                this.utxoSet.set(utxoKey, {
                    address: tx.to,
                    amount: tx.amount,
                    txHash: tx.hash,
                    blockIndex: block.index,
                    timestamp: tx.timestamp
                });
            }
        }
        
        await this.saveUTXOSet();
    }
    
    /**
     * Update account states after transaction
     */
    async updateAccountStates(transaction) {
        // Update sender state
        if (transaction.from && transaction.from !== 'GENESIS') {
            const fromState = await this.getAccountState(transaction.from);
            fromState.balance -= parseFloat(transaction.amount) || 0;
            fromState.nonce++;
            fromState.lastUpdated = Date.now();
            
            await this.db.putAccountState(transaction.from, fromState);
            this.accountStates.set(transaction.from, fromState);
        }
        
        // Update receiver state
        if (transaction.to) {
            const toState = await this.getAccountState(transaction.to);
            toState.balance += parseFloat(transaction.amount) || 0;
            toState.lastUpdated = Date.now();
            
            await this.db.putAccountState(transaction.to, toState);
            this.accountStates.set(transaction.to, toState);
        }
    }
    
    /**
     * Save chain state to disk
     */
    async saveChainState() {
        try {
            const statePath = path.join(this.dataPath, 'chain-state.json');
            await fs.writeFile(statePath, JSON.stringify(this.chainState, null, 2));
        } catch (error) {
            console.error('❌ Failed to save chain state:', error);
        }
    }
    
    /**
     * Load chain state from disk
     */
    async loadChainState() {
        try {
            const statePath = path.join(this.dataPath, 'chain-state.json');
            const stateData = await fs.readFile(statePath, 'utf8');
            this.chainState = { ...this.chainState, ...JSON.parse(stateData) };
            console.log('📊 Chain state loaded');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Failed to load chain state:', error);
            }
        }
    }
    
    /**
     * Save UTXO set to disk
     */
    async saveUTXOSet() {
        try {
            const utxoPath = path.join(this.dataPath, 'utxo-set.json');
            const utxoData = {
                utxos: Array.from(this.utxoSet.entries()),
                timestamp: Date.now()
            };
            await fs.writeFile(utxoPath, JSON.stringify(utxoData, null, 2));
        } catch (error) {
            console.error('❌ Failed to save UTXO set:', error);
        }
    }
    
    /**
     * Load UTXO set from disk
     */
    async loadUTXOSet() {
        try {
            const utxoPath = path.join(this.dataPath, 'utxo-set.json');
            const utxoData = await fs.readFile(utxoPath, 'utf8');
            const parsed = JSON.parse(utxoData);
            this.utxoSet = new Map(parsed.utxos);
            console.log(`💰 UTXO set loaded: ${this.utxoSet.size} UTXOs`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Failed to load UTXO set:', error);
            }
        }
    }
    
    /**
     * Setup automatic backup system
     */
    setupAutoBackup() {
        setInterval(async () => {
            try {
                const backupPath = path.join(this.dataPath, '..', 'backups');
                await fs.mkdir(backupPath, { recursive: true });
                await this.db.backup(backupPath);
                console.log('🔄 Automatic backup completed');
            } catch (error) {
                console.error('❌ Automatic backup failed:', error);
            }
        }, this.backupInterval);
        
        console.log(`🔄 Auto-backup enabled (every ${this.backupInterval / 60000} minutes)`);
    }
    
    /**
     * Get comprehensive storage statistics
     */
    async getStorageStats() {
        const dbStats = this.db.getStats();
        
        return {
            ...dbStats,
            chainState: this.chainState,
            utxoCount: this.utxoSet.size,
            accountStatesCount: this.accountStates.size,
            dataPath: this.dataPath,
            initialized: this.initialized
        };
    }
    
    /**
     * Perform database maintenance
     */
    async performMaintenance() {
        console.log('🔧 Starting storage maintenance...');
        
        try {
            // Compact database
            await this.db.compact();
            
            // Save current state
            await this.saveChainState();
            await this.saveUTXOSet();
            
            // Clear memory caches
            this.accountStates.clear();
            
            console.log('✅ Storage maintenance completed');
        } catch (error) {
            console.error('❌ Storage maintenance failed:', error);
        }
    }
    
    /**
     * Create a complete backup of the blockchain data
     */
    async createBackup(backupPath) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fullBackupPath = path.join(backupPath, `topay-blockchain-${timestamp}`);
            
            // Create backup using database engine
            await this.db.backup(fullBackupPath);
            
            // Also backup chain state and UTXO set
            await fs.mkdir(path.join(fullBackupPath, 'state'), { recursive: true });
            
            const stateBackupPath = path.join(fullBackupPath, 'state');
            await fs.copyFile(
                path.join(this.dataPath, 'chain-state.json'),
                path.join(stateBackupPath, 'chain-state.json')
            ).catch(() => {}); // Ignore if file doesn't exist
            
            await fs.copyFile(
                path.join(this.dataPath, 'utxo-set.json'),
                path.join(stateBackupPath, 'utxo-set.json')
            ).catch(() => {}); // Ignore if file doesn't exist
            
            console.log(`💾 Complete blockchain backup created: ${fullBackupPath}`);
            return fullBackupPath;
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
            throw error;
        }
    }
    
    /**
     * Close the storage system
     */
    async close() {
        try {
            // Save current state
            await this.saveChainState();
            await this.saveUTXOSet();
            
            // Close database
            await this.db.close();
            
            // Clear caches
            this.accountStates.clear();
            this.utxoSet.clear();
            
            this.initialized = false;
            console.log('🔒 Blockchain storage closed');
        } catch (error) {
            console.error('❌ Error closing storage:', error);
        }
    }
}