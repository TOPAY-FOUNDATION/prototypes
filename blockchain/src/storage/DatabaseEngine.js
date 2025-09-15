/**
 * TOPAY Foundation Database Engine
 * Advanced blockchain data storage system with LevelDB-like functionality
 * Supports multiple storage backends and provides efficient data operations
 */

import fs from 'fs/promises';
import path from 'path';
import { computeHash } from '@topayfoundation/topayz512';

/**
 * Database abstraction layer with multiple backend support
 */
export class DatabaseEngine {
    constructor(options = {}) {
        this.dataPath = options.dataPath || './data/blockchain';
        this.backend = options.backend || 'json'; // json, leveldb-sim, sqlite
        this.compression = options.compression || false;
        this.indexing = options.indexing !== false;
        this.cacheSize = options.cacheSize || 1000;
        
        // In-memory cache for frequently accessed data
        this.cache = new Map();
        this.indexes = new Map();
        this.stats = {
            reads: 0,
            writes: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.initialized = false;
        console.log(`🗄️ Database Engine initialized with ${this.backend} backend`);
    }
    
    /**
     * Initialize the database engine
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            await fs.mkdir(this.dataPath, { recursive: true });
            await fs.mkdir(path.join(this.dataPath, 'blocks'), { recursive: true });
            await fs.mkdir(path.join(this.dataPath, 'transactions'), { recursive: true });
            await fs.mkdir(path.join(this.dataPath, 'state'), { recursive: true });
            await fs.mkdir(path.join(this.dataPath, 'indexes'), { recursive: true });
            
            // Load existing indexes
            await this.loadIndexes();
            
            this.initialized = true;
            console.log(`✅ Database Engine initialized at ${this.dataPath}`);
        } catch (error) {
            console.error('❌ Failed to initialize database:', error);
            throw error;
        }
    }
    
    /**
     * Store a block in the database
     */
    async putBlock(blockIndex, blockData) {
        const key = `block:${blockIndex}`;
        const data = {
            index: blockIndex,
            hash: blockData.hash,
            previousHash: blockData.previousHash,
            timestamp: blockData.timestamp,
            transactions: blockData.transactions,
            merkleRoot: blockData.merkleRoot,
            nonce: blockData.nonce,
            difficulty: blockData.difficulty,
            size: JSON.stringify(blockData).length
        };
        
        await this.put(key, data, 'blocks');
        
        // Update block index
        await this.updateIndex('blocks', blockIndex, {
            hash: blockData.hash,
            timestamp: blockData.timestamp,
            txCount: blockData.transactions.length
        });
        
        // Index transactions in this block
        for (const tx of blockData.transactions) {
            await this.indexTransaction(tx, blockIndex);
        }
        
        console.log(`📦 Block ${blockIndex} stored (${data.size} bytes)`);
    }
    
    /**
     * Retrieve a block from the database
     */
    async getBlock(blockIndex) {
        const key = `block:${blockIndex}`;
        return await this.get(key, 'blocks');
    }
    
    /**
     * Get block by hash
     */
    async getBlockByHash(hash) {
        const blockIndex = await this.getFromIndex('blocks', 'hash', hash);
        if (blockIndex !== null) {
            return await this.getBlock(blockIndex.key);
        }
        return null;
    }
    
    /**
     * Store a transaction
     */
    async putTransaction(txHash, txData, blockIndex = null) {
        const key = `tx:${txHash}`;
        const data = {
            hash: txHash,
            from: txData.from,
            to: txData.to,
            amount: txData.amount,
            timestamp: txData.timestamp,
            signature: txData.signature,
            blockIndex: blockIndex,
            data: txData.data
        };
        
        await this.put(key, data, 'transactions');
        await this.indexTransaction(data, blockIndex);
        
        console.log(`💸 Transaction ${txHash.substring(0, 10)}... stored`);
    }
    
    /**
     * Retrieve a transaction
     */
    async getTransaction(txHash) {
        const key = `tx:${txHash}`;
        return await this.get(key, 'transactions');
    }
    
    /**
     * Get transactions by address
     */
    async getTransactionsByAddress(address, limit = 50, offset = 0) {
        const fromTxs = await this.getFromIndex('transactions', 'from', address) || [];
        const toTxs = await this.getFromIndex('transactions', 'to', address) || [];
        
        const allTxs = [...fromTxs, ...toTxs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(offset, offset + limit);
        
        const transactions = [];
        for (const txRef of allTxs) {
            const tx = await this.getTransaction(txRef.hash);
            if (tx) transactions.push(tx);
        }
        
        return transactions;
    }
    
    /**
     * Store account state
     */
    async putAccountState(address, state) {
        const key = `account:${address}`;
        const data = {
            address,
            balance: state.balance || 0,
            nonce: state.nonce || 0,
            lastUpdated: Date.now(),
            ...state
        };
        
        await this.put(key, data, 'state');
        await this.updateIndex('accounts', address, {
            balance: data.balance,
            lastUpdated: data.lastUpdated
        });
    }
    
    /**
     * Get account state
     */
    async getAccountState(address) {
        const key = `account:${address}`;
        return await this.get(key, 'state');
    }
    
    /**
     * Get block range
     */
    async getBlockRange(startIndex, endIndex) {
        const blocks = [];
        for (let i = startIndex; i <= endIndex; i++) {
            const block = await this.getBlock(i);
            if (block) blocks.push(block);
        }
        return blocks;
    }
    
    /**
     * Generic put operation
     */
    async put(key, data, collection = 'default') {
        this.stats.writes++;
        
        // Update cache
        this.cache.set(`${collection}:${key}`, data);
        
        // Manage cache size
        if (this.cache.size > this.cacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        // Persist to storage backend
        await this.persistData(key, data, collection);
    }
    
    /**
     * Generic get operation
     */
    async get(key, collection = 'default') {
        this.stats.reads++;
        
        const cacheKey = `${collection}:${key}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            this.stats.cacheHits++;
            return this.cache.get(cacheKey);
        }
        
        this.stats.cacheMisses++;
        
        // Load from storage
        const data = await this.loadData(key, collection);
        
        // Update cache
        if (data) {
            this.cache.set(cacheKey, data);
        }
        
        return data;
    }
    
    /**
     * Persist data to storage backend
     */
    async persistData(key, data, collection) {
        const filePath = path.join(this.dataPath, collection, `${key.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        
        const fileData = {
            key,
            data,
            timestamp: Date.now(),
            checksum: computeHash(JSON.stringify(data))
        };
        
        await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));
    }
    
    /**
     * Load data from storage backend
     */
    async loadData(key, collection) {
        try {
            const filePath = path.join(this.dataPath, collection, `${key.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const fileData = JSON.parse(fileContent);
            
            // Verify checksum
            const expectedChecksum = computeHash(JSON.stringify(fileData.data));
            if (fileData.checksum !== expectedChecksum) {
                console.warn(`⚠️ Checksum mismatch for ${key}`);
            }
            
            return fileData.data;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`❌ Error loading ${key}:`, error);
            }
            return null;
        }
    }
    
    /**
     * Index a transaction for efficient lookups
     */
    async indexTransaction(tx, blockIndex) {
        if (!this.indexing) return;
        
        const txRef = {
            hash: tx.hash,
            timestamp: tx.timestamp,
            blockIndex
        };
        
        // Index by from address
        if (tx.from) {
            await this.addToIndex('transactions', 'from', tx.from, txRef);
        }
        
        // Index by to address
        if (tx.to) {
            await this.addToIndex('transactions', 'to', tx.to, txRef);
        }
        
        // Index by hash
        await this.addToIndex('transactions', 'hash', tx.hash, { key: blockIndex, ...txRef });
    }
    
    /**
     * Update an index
     */
    async updateIndex(indexName, key, data) {
        if (!this.indexing) return;
        
        if (!this.indexes.has(indexName)) {
            this.indexes.set(indexName, new Map());
        }
        
        this.indexes.get(indexName).set(key, data);
        await this.saveIndex(indexName);
    }
    
    /**
     * Add to an index (for multiple values per key)
     */
    async addToIndex(indexName, field, value, data) {
        if (!this.indexing) return;
        
        const fullIndexName = `${indexName}_${field}`;
        
        if (!this.indexes.has(fullIndexName)) {
            this.indexes.set(fullIndexName, new Map());
        }
        
        const index = this.indexes.get(fullIndexName);
        
        if (!index.has(value)) {
            index.set(value, []);
        }
        
        index.get(value).push(data);
        await this.saveIndex(fullIndexName);
    }
    
    /**
     * Get from index
     */
    async getFromIndex(indexName, field, value) {
        const fullIndexName = field ? `${indexName}_${field}` : indexName;
        
        if (!this.indexes.has(fullIndexName)) {
            await this.loadIndex(fullIndexName);
        }
        
        const index = this.indexes.get(fullIndexName);
        return index ? index.get(value) : null;
    }
    
    /**
     * Save index to disk
     */
    async saveIndex(indexName) {
        const indexPath = path.join(this.dataPath, 'indexes', `${indexName}.json`);
        const indexData = this.indexes.get(indexName);
        
        if (indexData) {
            const serializedIndex = {
                name: indexName,
                data: Array.from(indexData.entries()),
                timestamp: Date.now()
            };
            
            await fs.writeFile(indexPath, JSON.stringify(serializedIndex, null, 2));
        }
    }
    
    /**
     * Load index from disk
     */
    async loadIndex(indexName) {
        try {
            const indexPath = path.join(this.dataPath, 'indexes', `${indexName}.json`);
            const indexContent = await fs.readFile(indexPath, 'utf8');
            const indexData = JSON.parse(indexContent);
            
            this.indexes.set(indexName, new Map(indexData.data));
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`❌ Error loading index ${indexName}:`, error);
            }
            this.indexes.set(indexName, new Map());
        }
    }
    
    /**
     * Load all indexes
     */
    async loadIndexes() {
        try {
            const indexesPath = path.join(this.dataPath, 'indexes');
            const indexFiles = await fs.readdir(indexesPath);
            
            for (const file of indexFiles) {
                if (file.endsWith('.json')) {
                    const indexName = file.replace('.json', '');
                    await this.loadIndex(indexName);
                }
            }
            
            console.log(`📚 Loaded ${indexFiles.length} indexes`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Error loading indexes:', error);
            }
        }
    }
    
    /**
     * Get database statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            indexCount: this.indexes.size,
            backend: this.backend,
            dataPath: this.dataPath
        };
    }
    
    /**
     * Compact database (remove unused data)
     */
    async compact() {
        console.log('🗜️ Starting database compaction...');
        
        // Clear cache to free memory
        this.cache.clear();
        
        // Rebuild indexes
        this.indexes.clear();
        await this.loadIndexes();
        
        console.log('✅ Database compaction completed');
    }
    
    /**
     * Create database backup
     */
    async backup(backupPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fullBackupPath = path.join(backupPath, `blockchain-backup-${timestamp}`);
        
        await fs.mkdir(fullBackupPath, { recursive: true });
        
        // Copy all data directories
        const dataDirs = ['blocks', 'transactions', 'state', 'indexes'];
        
        for (const dir of dataDirs) {
            const srcDir = path.join(this.dataPath, dir);
            const destDir = path.join(fullBackupPath, dir);
            
            try {
                await fs.mkdir(destDir, { recursive: true });
                const files = await fs.readdir(srcDir);
                
                for (const file of files) {
                    const srcFile = path.join(srcDir, file);
                    const destFile = path.join(destDir, file);
                    await fs.copyFile(srcFile, destFile);
                }
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error(`❌ Error backing up ${dir}:`, error);
                }
            }
        }
        
        console.log(`💾 Database backup created: ${fullBackupPath}`);
        return fullBackupPath;
    }
    
    /**
     * Close database connection
     */
    async close() {
        // Save all indexes
        for (const indexName of this.indexes.keys()) {
            await this.saveIndex(indexName);
        }
        
        this.cache.clear();
        this.indexes.clear();
        this.initialized = false;
        
        console.log('🔒 Database connection closed');
    }
}