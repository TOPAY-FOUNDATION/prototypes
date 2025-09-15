/**
 * TOPAY Foundation Data Synchronization Manager
 * Handles real-time synchronization between blockchain and storage systems
 * Provides automatic data persistence and recovery mechanisms
 */

import { BlockchainStorage } from './BlockchainStorage.js';
import { PersistenceManager } from './persistence.js';
import fs from 'fs/promises';
import path from 'path';

export class DataSyncManager {
    constructor(blockchain, options = {}) {
        this.blockchain = blockchain;
        this.dataPath = options.dataPath || './data';
        this.syncInterval = options.syncInterval || 30000; // 30 seconds
        this.autoSync = options.autoSync !== false;
        this.enableRealTimeSync = options.realTimeSync !== false;
        
        // Initialize storage systems
        this.storage = new BlockchainStorage({
            dataPath: path.join(this.dataPath, 'blockchain'),
            backend: options.backend || 'json',
            compression: options.compression || false,
            indexing: options.indexing !== false,
            autoBackup: options.autoBackup || true,
            cacheSize: options.cacheSize || 2000
        });
        
        this.persistence = new PersistenceManager(path.join(this.dataPath, 'legacy'));
        
        // Sync state tracking
        this.syncState = {
            lastSyncedBlock: -1,
            lastSyncTime: null,
            syncInProgress: false,
            totalSynced: 0,
            errors: []
        };
        
        // Event listeners for real-time sync
        this.eventListeners = new Map();
        
        this.initialized = false;
        
        console.log('🔄 Data Sync Manager initialized');
    }
    
    /**
     * Initialize the data sync manager
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Initialize storage systems
            await this.storage.initialize();
            await this.persistence.initialize();
            
            // Load sync state
            await this.loadSyncState();
            
            // Setup real-time event listeners
            if (this.enableRealTimeSync) {
                this.setupRealTimeSync();
            }
            
            // Setup auto-sync if enabled
            if (this.autoSync) {
                this.setupAutoSync();
            }
            
            // Perform initial sync
            await this.performInitialSync();
            
            this.initialized = true;
            console.log('✅ Data Sync Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Data Sync Manager:', error);
            throw error;
        }
    }
    
    /**
     * Setup real-time synchronization
     */
    setupRealTimeSync() {
        // Hook into blockchain events for real-time sync
        const originalAddTransaction = this.blockchain.addTransaction.bind(this.blockchain);
        const originalProcessPendingTransactions = this.blockchain.processPendingTransactions.bind(this.blockchain);
        
        // Override addTransaction to sync transactions
        this.blockchain.addTransaction = async (transaction) => {
            const result = await originalAddTransaction(transaction);
            
            // Sync transaction to storage
            try {
                await this.storage.storeTransaction(transaction, null);
                console.log(`🔄 Real-time sync: Transaction ${transaction.hash.substring(0, 10)}... stored`);
            } catch (error) {
                console.error('❌ Real-time transaction sync failed:', error);
                this.syncState.errors.push({
                    type: 'transaction_sync',
                    error: error.message,
                    timestamp: Date.now()
                });
            }
            
            return result;
        };
        
        // Override processPendingTransactions to sync blocks
        this.blockchain.processPendingTransactions = async () => {
            const result = await originalProcessPendingTransactions();
            
            // Sync the latest block
            try {
                const latestBlock = this.blockchain.getLatestBlock();
                if (latestBlock.index > this.syncState.lastSyncedBlock) {
                    await this.syncBlock(latestBlock);
                    this.syncState.lastSyncedBlock = latestBlock.index;
                    await this.saveSyncState();
                    console.log(`🔄 Real-time sync: Block ${latestBlock.index} stored`);
                }
            } catch (error) {
                console.error('❌ Real-time block sync failed:', error);
                this.syncState.errors.push({
                    type: 'block_sync',
                    error: error.message,
                    timestamp: Date.now()
                });
            }
            
            return result;
        };
        
        console.log('🔄 Real-time synchronization enabled');
    }
    
    /**
     * Setup automatic periodic synchronization
     */
    setupAutoSync() {
        setInterval(async () => {
            if (!this.syncState.syncInProgress) {
                await this.performIncrementalSync();
            }
        }, this.syncInterval);
        
        console.log(`🔄 Auto-sync enabled (every ${this.syncInterval / 1000} seconds)`);
    }
    
    /**
     * Perform initial synchronization
     */
    async performInitialSync() {
        console.log('🔄 Starting initial synchronization...');
        
        this.syncState.syncInProgress = true;
        
        try {
            const chainLength = this.blockchain.chain.length;
            let syncedCount = 0;
            
            for (let i = this.syncState.lastSyncedBlock + 1; i < chainLength; i++) {
                const block = this.blockchain.chain[i];
                await this.syncBlock(block);
                syncedCount++;
                
                if (syncedCount % 10 === 0) {
                    console.log(`🔄 Synced ${syncedCount}/${chainLength - this.syncState.lastSyncedBlock - 1} blocks`);
                }
            }
            
            this.syncState.lastSyncedBlock = chainLength - 1;
            this.syncState.lastSyncTime = Date.now();
            this.syncState.totalSynced += syncedCount;
            
            await this.saveSyncState();
            
            console.log(`✅ Initial sync completed: ${syncedCount} blocks synced`);
        } catch (error) {
            console.error('❌ Initial sync failed:', error);
            this.syncState.errors.push({
                type: 'initial_sync',
                error: error.message,
                timestamp: Date.now()
            });
        } finally {
            this.syncState.syncInProgress = false;
        }
    }
    
    /**
     * Perform incremental synchronization
     */
    async performIncrementalSync() {
        const chainLength = this.blockchain.chain.length;
        
        if (chainLength <= this.syncState.lastSyncedBlock + 1) {
            return; // Nothing to sync
        }
        
        console.log('🔄 Starting incremental synchronization...');
        
        this.syncState.syncInProgress = true;
        
        try {
            let syncedCount = 0;
            
            for (let i = this.syncState.lastSyncedBlock + 1; i < chainLength; i++) {
                const block = this.blockchain.chain[i];
                await this.syncBlock(block);
                syncedCount++;
            }
            
            this.syncState.lastSyncedBlock = chainLength - 1;
            this.syncState.lastSyncTime = Date.now();
            this.syncState.totalSynced += syncedCount;
            
            await this.saveSyncState();
            
            if (syncedCount > 0) {
                console.log(`✅ Incremental sync completed: ${syncedCount} blocks synced`);
            }
        } catch (error) {
            console.error('❌ Incremental sync failed:', error);
            this.syncState.errors.push({
                type: 'incremental_sync',
                error: error.message,
                timestamp: Date.now()
            });
        } finally {
            this.syncState.syncInProgress = false;
        }
    }
    
    /**
     * Sync a single block to storage
     */
    async syncBlock(block) {
        try {
            // Store block in enhanced storage
            await this.storage.storeBlock(block);
            
            // Store individual transactions
            for (const transaction of block.transactions || []) {
                await this.storage.storeTransaction(transaction, block.index);
            }
            
            // Legacy persistence for compatibility
            await this.persistence.saveBlockchain({
                chain: this.blockchain.chain.slice(0, block.index + 1),
                mempool: this.blockchain.mempool,
                networkNodes: Array.from(this.blockchain.networkNodes)
            });
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to sync block ${block.index}:`, error);
            throw error;
        }
    }
    
    /**
     * Force full resynchronization
     */
    async performFullResync() {
        console.log('🔄 Starting full resynchronization...');
        
        this.syncState.syncInProgress = true;
        this.syncState.lastSyncedBlock = -1;
        
        try {
            // Clear existing storage
            await this.storage.performMaintenance();
            
            // Sync all blocks
            const chainLength = this.blockchain.chain.length;
            let syncedCount = 0;
            
            for (let i = 0; i < chainLength; i++) {
                const block = this.blockchain.chain[i];
                await this.syncBlock(block);
                syncedCount++;
                
                if (syncedCount % 50 === 0) {
                    console.log(`🔄 Full resync progress: ${syncedCount}/${chainLength} blocks`);
                }
            }
            
            this.syncState.lastSyncedBlock = chainLength - 1;
            this.syncState.lastSyncTime = Date.now();
            this.syncState.totalSynced = chainLength;
            
            await this.saveSyncState();
            
            console.log(`✅ Full resync completed: ${syncedCount} blocks synced`);
        } catch (error) {
            console.error('❌ Full resync failed:', error);
            this.syncState.errors.push({
                type: 'full_resync',
                error: error.message,
                timestamp: Date.now()
            });
        } finally {
            this.syncState.syncInProgress = false;
        }
    }
    
    /**
     * Restore blockchain from storage
     */
    async restoreFromStorage() {
        console.log('🔄 Restoring blockchain from storage...');
        
        try {
            const storageStats = await this.storage.getStorageStats();
            const totalBlocks = storageStats.chainState?.totalBlocks || 0;
            
            if (totalBlocks === 0) {
                console.log('📂 No blocks found in storage');
                return false;
            }
            
            // Clear current blockchain
            this.blockchain.chain = [];
            this.blockchain.mempool = [];
            
            // Restore blocks from storage
            const restoredBlocks = [];
            
            for (let i = 0; i < totalBlocks; i++) {
                const blockData = await this.storage.getBlock(i);
                if (blockData) {
                    // Reconstruct block object
                    const block = {
                        index: blockData.index,
                        hash: blockData.hash,
                        previousHash: blockData.previousHash,
                        timestamp: blockData.timestamp,
                        transactions: blockData.transactions || [],
                        merkleRoot: blockData.merkleRoot,
                        nonce: blockData.nonce,
                        difficulty: blockData.difficulty
                    };
                    
                    restoredBlocks.push(block);
                }
            }
            
            // Validate and set restored chain
            if (restoredBlocks.length > 0) {
                this.blockchain.chain = restoredBlocks;
                this.syncState.lastSyncedBlock = restoredBlocks.length - 1;
                await this.saveSyncState();
                
                console.log(`✅ Blockchain restored: ${restoredBlocks.length} blocks`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Failed to restore from storage:', error);
            return false;
        }
    }
    
    /**
     * Create comprehensive backup
     */
    async createBackup(backupPath) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fullBackupPath = path.join(backupPath, `topay-full-backup-${timestamp}`);
            
            await fs.mkdir(fullBackupPath, { recursive: true });
            
            // Backup storage data
            const storageBackupPath = await this.storage.createBackup(fullBackupPath);
            
            // Backup legacy persistence data
            const legacyBackupPath = await this.persistence.createBackup('_legacy');
            
            // Backup sync state
            const syncStatePath = path.join(fullBackupPath, 'sync-state.json');
            await fs.writeFile(syncStatePath, JSON.stringify(this.syncState, null, 2));
            
            // Create backup manifest
            const manifest = {
                timestamp: Date.now(),
                version: '1.0.0',
                blockchain: {
                    blocks: this.blockchain.chain.length,
                    transactions: this.blockchain.chain.reduce((sum, block) => sum + (block.transactions?.length || 0), 0),
                    mempool: this.blockchain.mempool.length
                },
                storage: await this.storage.getStorageStats(),
                syncState: this.syncState
            };
            
            const manifestPath = path.join(fullBackupPath, 'backup-manifest.json');
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
            
            console.log(`💾 Comprehensive backup created: ${fullBackupPath}`);
            return fullBackupPath;
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
            throw error;
        }
    }
    
    /**
     * Save sync state to disk
     */
    async saveSyncState() {
        try {
            const syncStatePath = path.join(this.dataPath, 'sync-state.json');
            await fs.writeFile(syncStatePath, JSON.stringify(this.syncState, null, 2));
        } catch (error) {
            console.error('❌ Failed to save sync state:', error);
        }
    }
    
    /**
     * Load sync state from disk
     */
    async loadSyncState() {
        try {
            const syncStatePath = path.join(this.dataPath, 'sync-state.json');
            const stateData = await fs.readFile(syncStatePath, 'utf8');
            this.syncState = { ...this.syncState, ...JSON.parse(stateData) };
            console.log('📊 Sync state loaded');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Failed to load sync state:', error);
            }
        }
    }
    
    /**
     * Get synchronization statistics
     */
    getSyncStats() {
        return {
            ...this.syncState,
            chainLength: this.blockchain.chain.length,
            syncProgress: this.blockchain.chain.length > 0 ? 
                ((this.syncState.lastSyncedBlock + 1) / this.blockchain.chain.length) * 100 : 100,
            initialized: this.initialized
        };
    }
    
    /**
     * Verify data integrity
     */
    async verifyIntegrity() {
        console.log('🔍 Verifying data integrity...');
        
        const issues = [];
        
        try {
            // Check blockchain validity
            const isChainValid = await this.blockchain.isChainValid();
            if (!isChainValid) {
                issues.push('Blockchain chain is invalid');
            }
            
            // Check storage consistency
            for (let i = 0; i <= this.syncState.lastSyncedBlock; i++) {
                const blockchainBlock = this.blockchain.chain[i];
                const storageBlock = await this.storage.getBlock(i);
                
                if (!storageBlock) {
                    issues.push(`Block ${i} missing from storage`);
                } else if (blockchainBlock.hash !== storageBlock.hash) {
                    issues.push(`Block ${i} hash mismatch between blockchain and storage`);
                }
            }
            
            console.log(`✅ Integrity check completed: ${issues.length} issues found`);
            return { valid: issues.length === 0, issues };
        } catch (error) {
            console.error('❌ Integrity verification failed:', error);
            return { valid: false, issues: [error.message] };
        }
    }
    
    /**
     * Close the data sync manager
     */
    async close() {
        try {
            // Save current sync state
            await this.saveSyncState();
            
            // Close storage systems
            await this.storage.close();
            
            this.initialized = false;
            console.log('🔒 Data Sync Manager closed');
        } catch (error) {
            console.error('❌ Error closing Data Sync Manager:', error);
        }
    }
}