/**
 * TOPAY Foundation Quantum-Safe Blockchain Wallet
 * Comprehensive wallet system with genesis wallet support
 */

import crypto from 'crypto';
import { computeHash } from '@topayfoundation/topayz512';
import { Transaction } from '../blockchain/transaction.js';

export class Wallet {
    /**
     * Wallet Constructor - Creates new wallet or loads existing one
     * @param {Object} options - Wallet configuration options
     * @param {string} options.privateKey - Existing private key (optional)
     * @param {string} options.publicKey - Existing public key (optional)
     * @param {string} options.address - Existing address (optional)
     * @param {boolean} options.isGenesis - Whether this is a genesis wallet
     * @param {number} options.genesisBalance - Initial balance for genesis wallet
     */
    constructor(options = {}) {
        this.isGenesis = options.isGenesis || false;
        this.genesisBalance = options.genesisBalance || 0;
        this.createdAt = Date.now();
        this.version = '1.0.0';
        
        if (options.privateKey && options.publicKey && options.address) {
            // Load existing wallet
            this.privateKey = options.privateKey;
            this.publicKey = options.publicKey;
            this.address = options.address;
            console.log(`📂 Loaded existing wallet: ${this.address.substring(0, 10)}...`);
        } else {
            // Generate new wallet
            this.generateKeyPair();
            console.log(`🆕 Created new wallet: ${this.address.substring(0, 10)}...`);
        }
        
        // Initialize wallet metadata
        this.metadata = {
            label: options.label || (this.isGenesis ? 'Genesis Wallet' : 'TOPAY Wallet'),
            description: options.description || (this.isGenesis ? 'Genesis wallet with pre-allocated funds' : 'Standard TOPAY wallet'),
            tags: options.tags || (this.isGenesis ? ['genesis', 'system'] : ['user']),
            createdAt: this.createdAt,
            lastUsed: null,
            transactionCount: 0
        };
        
        if (this.isGenesis) {
            console.log(`👑 Genesis wallet created with ${this.genesisBalance} TOPAY initial balance`);
        }
    }
    
    /**
     * Generate new cryptographic key pair
     */
    generateKeyPair() {
        // Generate private key (256-bit)
        this.privateKey = crypto.randomBytes(32).toString('hex');
        
        // Generate public key from private key using ECDSA
        const keyPair = crypto.createECDH('secp256k1');
        keyPair.setPrivateKey(this.privateKey, 'hex');
        this.publicKey = keyPair.getPublicKey('hex');
        
        // Generate address from public key
        this.address = this.generateAddress(this.publicKey);
    }
    
    /**
     * Generate wallet address from public key
     * @param {string} publicKey - Public key in hex format
     * @returns {string} - Wallet address
     */
    generateAddress(publicKey) {
        // Create address using quantum-safe hash
        const hash = computeHash(publicKey);
        // Take first 40 characters and add TOPAY prefix
        return 'TOPAY' + hash.substring(0, 40);
    }
    
    /**
     * Sign a transaction with this wallet's private key
     * @param {Transaction} transaction - Transaction to sign
     * @returns {string} - Transaction signature
     */
    signTransaction(transaction) {
        if (!transaction) {
            throw new Error('Transaction is required for signing');
        }
        
        // Create transaction hash
        const transactionData = `${transaction.from}${transaction.to}${transaction.amount}${transaction.timestamp}`;
        const transactionHash = computeHash(transactionData);
        
        // Sign with private key
        const sign = crypto.createSign('SHA256');
        sign.update(transactionHash);
        const signature = sign.sign(this.privateKey, 'hex');
        
        // Update wallet metadata
        this.metadata.lastUsed = Date.now();
        this.metadata.transactionCount++;
        
        return signature;
    }
    
    /**
     * Create and sign a new transaction
     * @param {string} toAddress - Recipient address
     * @param {number} amount - Amount to send
     * @param {string} data - Optional transaction data
     * @returns {Transaction} - Signed transaction
     */
    async createTransaction(toAddress, amount, data = null) {
        if (!toAddress || amount <= 0) {
            throw new Error('Valid recipient address and positive amount required');
        }
        
        // Create transaction
        const transaction = new Transaction(this.address, toAddress, amount, data);
        
        // Sign transaction
        const signature = this.signTransaction(transaction);
        transaction.signature = signature;
        
        console.log(`💸 Transaction created: ${amount} TOPAY from ${this.address.substring(0, 10)}... to ${toAddress.substring(0, 10)}...`);
        
        return transaction;
    }
    
    /**
     * Get wallet balance from blockchain
     * @param {Blockchain} blockchain - Blockchain instance
     * @returns {number} - Current balance
     */
    getBalance(blockchain) {
        if (!blockchain) {
            throw new Error('Blockchain instance required');
        }
        
        return blockchain.getBalance(this.address);
    }
    
    /**
     * Get transaction history for this wallet
     * @param {Blockchain} blockchain - Blockchain instance
     * @returns {Array} - Array of transactions
     */
    getTransactionHistory(blockchain) {
        if (!blockchain) {
            throw new Error('Blockchain instance required');
        }
        
        return blockchain.getTransactionHistory(this.address);
    }
    
    /**
     * Export wallet data for backup
     * @param {boolean} includePrivateKey - Whether to include private key
     * @returns {Object} - Wallet export data
     */
    exportWallet(includePrivateKey = false) {
        const exportData = {
            address: this.address,
            publicKey: this.publicKey,
            isGenesis: this.isGenesis,
            genesisBalance: this.genesisBalance,
            metadata: { ...this.metadata },
            version: this.version,
            exportedAt: Date.now()
        };
        
        if (includePrivateKey) {
            exportData.privateKey = this.privateKey;
            console.log('⚠️ Wallet exported with private key - keep secure!');
        }
        
        return exportData;
    }
    
    /**
     * Import wallet from backup data
     * @param {Object} walletData - Exported wallet data
     * @returns {Wallet} - Imported wallet instance
     */
    static importWallet(walletData) {
        if (!walletData.address || !walletData.publicKey) {
            throw new Error('Invalid wallet data - missing required fields');
        }
        
        return new Wallet({
            privateKey: walletData.privateKey,
            publicKey: walletData.publicKey,
            address: walletData.address,
            isGenesis: walletData.isGenesis,
            genesisBalance: walletData.genesisBalance,
            label: walletData.metadata?.label,
            description: walletData.metadata?.description,
            tags: walletData.metadata?.tags
        });
    }
    
    /**
     * Create a genesis wallet with pre-allocated funds
     * @param {number} initialBalance - Initial balance for genesis wallet
     * @param {string} label - Optional label for the wallet
     * @returns {Wallet} - Genesis wallet instance
     */
    static createGenesisWallet(initialBalance = 1000000, label = 'Genesis Wallet') {
        return new Wallet({
            isGenesis: true,
            genesisBalance: initialBalance,
            label: label,
            description: `Genesis wallet with ${initialBalance} TOPAY pre-allocated funds`,
            tags: ['genesis', 'system', 'foundation']
        });
    }
    
    /**
     * Create multiple wallets for testing/development
     * @param {number} count - Number of wallets to create
     * @param {number} initialBalance - Initial balance for each wallet (if genesis)
     * @returns {Array<Wallet>} - Array of wallet instances
     */
    static createMultipleWallets(count = 5, initialBalance = 0) {
        const wallets = [];
        
        for (let i = 0; i < count; i++) {
            const wallet = new Wallet({
                isGenesis: initialBalance > 0,
                genesisBalance: initialBalance,
                label: `Wallet ${i + 1}`,
                description: `Auto-generated wallet ${i + 1}`,
                tags: initialBalance > 0 ? ['genesis', 'test'] : ['test']
            });
            wallets.push(wallet);
        }
        
        console.log(`🏭 Created ${count} wallets${initialBalance > 0 ? ' with genesis funds' : ''}`);
        return wallets;
    }
    
    /**
     * Validate wallet address format
     * @param {string} address - Address to validate
     * @returns {boolean} - Whether address is valid
     */
    static isValidAddress(address) {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        // Check TOPAY prefix and length
        return address.startsWith('TOPAY') && address.length === 45;
    }
    
    /**
     * Generate a random wallet address (for testing)
     * @returns {string} - Random valid address
     */
    static generateRandomAddress() {
        const randomData = crypto.randomBytes(32).toString('hex');
        const hash = computeHash(randomData);
        return 'TOPAY' + hash.substring(0, 40);
    }
    
    /**
     * Get wallet info summary
     * @returns {Object} - Wallet information
     */
    getInfo() {
        return {
            address: this.address,
            publicKey: this.publicKey,
            isGenesis: this.isGenesis,
            genesisBalance: this.genesisBalance,
            metadata: { ...this.metadata },
            hasPrivateKey: !!this.privateKey,
            version: this.version
        };
    }
    
    /**
     * Update wallet metadata
     * @param {Object} updates - Metadata updates
     */
    updateMetadata(updates) {
        this.metadata = { ...this.metadata, ...updates };
        console.log(`📝 Updated wallet metadata for ${this.address.substring(0, 10)}...`);
    }
    
    /**
     * Convert wallet to JSON
     * @returns {Object} - JSON representation
     */
    toJSON() {
        return {
            address: this.address,
            publicKey: this.publicKey,
            isGenesis: this.isGenesis,
            genesisBalance: this.genesisBalance,
            metadata: this.metadata,
            version: this.version,
            createdAt: this.createdAt
        };
    }
    
    /**
     * Create wallet from JSON
     * @param {Object} json - JSON data
     * @returns {Wallet} - Wallet instance
     */
    static fromJSON(json) {
        return new Wallet({
            publicKey: json.publicKey,
            address: json.address,
            isGenesis: json.isGenesis,
            genesisBalance: json.genesisBalance,
            label: json.metadata?.label,
            description: json.metadata?.description,
            tags: json.metadata?.tags
        });
    }
}