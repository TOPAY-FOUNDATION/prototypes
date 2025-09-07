/**
 * TOPAY Foundation Wallet Manager
 * Manages multiple wallets, genesis wallet, and wallet operations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Wallet } from './Wallet.js';
import { Transaction } from '../blockchain/transaction.js';

export class WalletManager {
    /**
     * WalletManager Constructor
     * @param {Object} options - Configuration options
     * @param {string} options.dataPath - Path to store wallet data
     * @param {boolean} options.autoCreateGenesis - Auto-create genesis wallet
     * @param {number} options.genesisBalance - Genesis wallet initial balance
     */
    constructor(options = {}) {
        this.dataPath = options.dataPath || './data/wallets';
        this.autoCreateGenesis = options.autoCreateGenesis !== false;
        this.genesisBalance = options.genesisBalance || 1000000;
        
        this.wallets = new Map(); // address -> Wallet
        this.genesisWallet = null;
        this.defaultWallet = null;
        
        this.initialized = false;
        this.version = '1.0.0';
        
        console.log('🏦 TOPAY Wallet Manager initialized');
    }
    
    /**
     * Initialize wallet manager
     */
    async initialize() {
        if (this.initialized) {
            console.log('⚠️ Wallet manager already initialized');
            return;
        }
        
        try {
            // Ensure data directory exists
            await fs.mkdir(this.dataPath, { recursive: true });
            
            // Load existing wallets
            await this.loadWallets();
            
            // Create genesis wallet if needed
            if (this.autoCreateGenesis && !this.genesisWallet) {
                await this.createGenesisWallet();
            }
            
            this.initialized = true;
            console.log('✅ Wallet manager initialized successfully');
            console.log(`📊 Loaded ${this.wallets.size} wallets`);
            
        } catch (error) {
            console.error('❌ Failed to initialize wallet manager:', error.message);
            throw error;
        }
    }
    
    /**
     * Create genesis wallet with pre-allocated funds
     * @param {number} balance - Initial balance (optional)
     * @returns {Wallet} - Genesis wallet instance
     */
    async createGenesisWallet(balance = null) {
        const genesisBalance = balance || this.genesisBalance;
        
        console.log(`👑 Creating genesis wallet with ${genesisBalance} TOPAY...`);
        
        this.genesisWallet = Wallet.createGenesisWallet(genesisBalance, 'TOPAY Genesis Wallet');
        this.wallets.set(this.genesisWallet.address, this.genesisWallet);
        
        // Set as default wallet if no default exists
        if (!this.defaultWallet) {
            this.defaultWallet = this.genesisWallet;
        }
        
        // Save genesis wallet
        await this.saveWallet(this.genesisWallet);
        
        console.log(`✅ Genesis wallet created: ${this.genesisWallet.address}`);
        return this.genesisWallet;
    }
    
    /**
     * Create a new wallet
     * @param {Object} options - Wallet options
     * @returns {Wallet} - New wallet instance
     */
    async createWallet(options = {}) {
        const wallet = new Wallet(options);
        
        // Add to collection
        this.wallets.set(wallet.address, wallet);
        
        // Set as default if no default exists
        if (!this.defaultWallet) {
            this.defaultWallet = wallet;
        }
        
        // Save wallet
        await this.saveWallet(wallet);
        
        console.log(`✅ New wallet created: ${wallet.address}`);
        return wallet;
    }
    
    /**
     * Import wallet from backup data
     * @param {Object} walletData - Wallet backup data
     * @returns {Wallet} - Imported wallet
     */
    async importWallet(walletData) {
        const wallet = Wallet.importWallet(walletData);
        
        // Check if wallet already exists
        if (this.wallets.has(wallet.address)) {
            throw new Error(`Wallet ${wallet.address} already exists`);
        }
        
        // Add to collection
        this.wallets.set(wallet.address, wallet);
        
        // Update genesis wallet reference if applicable
        if (wallet.isGenesis) {
            this.genesisWallet = wallet;
        }
        
        // Save wallet
        await this.saveWallet(wallet);
        
        console.log(`📥 Wallet imported: ${wallet.address}`);
        return wallet;
    }
    
    /**
     * Get wallet by address
     * @param {string} address - Wallet address
     * @returns {Wallet|null} - Wallet instance or null
     */
    getWallet(address) {
        return this.wallets.get(address) || null;
    }
    
    /**
     * Get genesis wallet
     * @returns {Wallet|null} - Genesis wallet or null
     */
    getGenesisWallet() {
        return this.genesisWallet;
    }
    
    /**
     * Get default wallet
     * @returns {Wallet|null} - Default wallet or null
     */
    getDefaultWallet() {
        return this.defaultWallet;
    }
    
    /**
     * Set default wallet
     * @param {string} address - Wallet address
     */
    setDefaultWallet(address) {
        const wallet = this.getWallet(address);
        if (!wallet) {
            throw new Error(`Wallet ${address} not found`);
        }
        
        this.defaultWallet = wallet;
        console.log(`🎯 Default wallet set to: ${address}`);
    }
    
    /**
     * List all wallets
     * @returns {Array<Wallet>} - Array of wallets
     */
    listWallets() {
        return Array.from(this.wallets.values());
    }
    
    /**
     * Get wallets by type
     * @param {string} type - Wallet type ('genesis', 'user', 'all')
     * @returns {Array<Wallet>} - Filtered wallets
     */
    getWalletsByType(type = 'all') {
        const wallets = this.listWallets();
        
        switch (type) {
            case 'genesis':
                return wallets.filter(w => w.isGenesis);
            case 'user':
                return wallets.filter(w => !w.isGenesis);
            default:
                return wallets;
        }
    }
    
    /**
     * Create transaction between wallets
     * @param {string} fromAddress - Sender address
     * @param {string} toAddress - Recipient address
     * @param {number} amount - Amount to send
     * @param {string} data - Optional transaction data
     * @returns {Transaction} - Created transaction
     */
    async createTransaction(fromAddress, toAddress, amount, data = null) {
        const fromWallet = this.getWallet(fromAddress);
        if (!fromWallet) {
            throw new Error(`Sender wallet ${fromAddress} not found`);
        }
        
        if (!Wallet.isValidAddress(toAddress)) {
            throw new Error(`Invalid recipient address: ${toAddress}`);
        }
        
        return await fromWallet.createTransaction(toAddress, amount, data);
    }
    
    /**
     * Get wallet balances from blockchain
     * @param {Blockchain} blockchain - Blockchain instance
     * @returns {Object} - Address to balance mapping
     */
    getWalletBalances(blockchain) {
        const balances = {};
        
        for (const [address, wallet] of this.wallets) {
            balances[address] = {
                address: address,
                balance: wallet.getBalance(blockchain),
                isGenesis: wallet.isGenesis,
                label: wallet.metadata.label
            };
        }
        
        return balances;
    }
    
    /**
     * Fund wallet from genesis wallet
     * @param {string} targetAddress - Target wallet address
     * @param {number} amount - Amount to fund
     * @returns {Transaction} - Funding transaction
     */
    async fundWalletFromGenesis(targetAddress, amount) {
        if (!this.genesisWallet) {
            throw new Error('Genesis wallet not available');
        }
        
        if (!Wallet.isValidAddress(targetAddress)) {
            throw new Error(`Invalid target address: ${targetAddress}`);
        }
        
        console.log(`💰 Funding ${targetAddress} with ${amount} TOPAY from genesis wallet`);
        
        return await this.genesisWallet.createTransaction(targetAddress, amount, 'Genesis funding');
    }
    
    /**
     * Save wallet to file
     * @param {Wallet} wallet - Wallet to save
     */
    async saveWallet(wallet) {
        try {
            const walletFile = path.join(this.dataPath, `${wallet.address}.json`);
            const walletData = wallet.exportWallet(true); // Include private key
            
            await fs.writeFile(walletFile, JSON.stringify(walletData, null, 2));
            
        } catch (error) {
            console.error(`❌ Failed to save wallet ${wallet.address}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Load all wallets from files
     */
    async loadWallets() {
        try {
            const files = await fs.readdir(this.dataPath);
            const walletFiles = files.filter(file => file.endsWith('.json'));
            
            for (const file of walletFiles) {
                try {
                    const filePath = path.join(this.dataPath, file);
                    const walletData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                    
                    const wallet = Wallet.importWallet(walletData);
                    this.wallets.set(wallet.address, wallet);
                    
                    // Set genesis wallet reference
                    if (wallet.isGenesis) {
                        this.genesisWallet = wallet;
                    }
                    
                    // Set default wallet to first loaded wallet
                    if (!this.defaultWallet) {
                        this.defaultWallet = wallet;
                    }
                    
                } catch (error) {
                    console.warn(`⚠️ Failed to load wallet from ${file}:`, error.message);
                }
            }
            
            console.log(`📂 Loaded ${this.wallets.size} wallets from storage`);
            
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Failed to load wallets:', error.message);
            }
        }
    }
    
    /**
     * Export all wallets
     * @param {boolean} includePrivateKeys - Include private keys in export
     * @returns {Object} - Export data
     */
    exportAllWallets(includePrivateKeys = false) {
        const exportData = {
            version: this.version,
            exportedAt: Date.now(),
            genesisWalletAddress: this.genesisWallet?.address,
            defaultWalletAddress: this.defaultWallet?.address,
            wallets: []
        };
        
        for (const wallet of this.wallets.values()) {
            exportData.wallets.push(wallet.exportWallet(includePrivateKeys));
        }
        
        console.log(`📤 Exported ${exportData.wallets.length} wallets`);
        return exportData;
    }
    
    /**
     * Import wallets from export data
     * @param {Object} exportData - Export data
     */
    async importAllWallets(exportData) {
        if (!exportData.wallets || !Array.isArray(exportData.wallets)) {
            throw new Error('Invalid export data format');
        }
        
        let importedCount = 0;
        
        for (const walletData of exportData.wallets) {
            try {
                await this.importWallet(walletData);
                importedCount++;
            } catch (error) {
                console.warn(`⚠️ Failed to import wallet ${walletData.address}:`, error.message);
            }
        }
        
        // Restore default wallet if specified
        if (exportData.defaultWalletAddress && this.wallets.has(exportData.defaultWalletAddress)) {
            this.setDefaultWallet(exportData.defaultWalletAddress);
        }
        
        console.log(`📥 Imported ${importedCount} wallets`);
    }
    
    /**
     * Delete wallet
     * @param {string} address - Wallet address to delete
     */
    async deleteWallet(address) {
        const wallet = this.getWallet(address);
        if (!wallet) {
            throw new Error(`Wallet ${address} not found`);
        }
        
        if (wallet.isGenesis) {
            throw new Error('Cannot delete genesis wallet');
        }
        
        // Remove from collection
        this.wallets.delete(address);
        
        // Update default wallet if needed
        if (this.defaultWallet?.address === address) {
            this.defaultWallet = this.genesisWallet || this.wallets.values().next().value || null;
        }
        
        // Delete file
        try {
            const walletFile = path.join(this.dataPath, `${address}.json`);
            await fs.unlink(walletFile);
        } catch (error) {
            console.warn(`⚠️ Failed to delete wallet file for ${address}:`, error.message);
        }
        
        console.log(`🗑️ Wallet deleted: ${address}`);
    }
    
    /**
     * Get wallet manager statistics
     * @returns {Object} - Statistics
     */
    getStats() {
        const wallets = this.listWallets();
        const genesisWallets = wallets.filter(w => w.isGenesis);
        const userWallets = wallets.filter(w => !w.isGenesis);
        
        return {
            totalWallets: wallets.length,
            genesisWallets: genesisWallets.length,
            userWallets: userWallets.length,
            hasGenesisWallet: !!this.genesisWallet,
            hasDefaultWallet: !!this.defaultWallet,
            genesisWalletAddress: this.genesisWallet?.address,
            defaultWalletAddress: this.defaultWallet?.address,
            dataPath: this.dataPath,
            version: this.version
        };
    }
    
    /**
     * Create development wallets for testing
     * @param {number} count - Number of wallets to create
     * @param {number} fundingAmount - Amount to fund each wallet from genesis
     * @returns {Array<Wallet>} - Created wallets
     */
    async createDevelopmentWallets(count = 5, fundingAmount = 1000) {
        if (!this.genesisWallet) {
            throw new Error('Genesis wallet required for funding development wallets');
        }
        
        const wallets = [];
        const transactions = [];
        
        for (let i = 0; i < count; i++) {
            // Create wallet
            const wallet = await this.createWallet({
                label: `Dev Wallet ${i + 1}`,
                description: `Development wallet ${i + 1} for testing`,
                tags: ['development', 'testing']
            });
            
            wallets.push(wallet);
            
            // Create funding transaction if amount > 0
            if (fundingAmount > 0) {
                const fundingTx = await this.fundWalletFromGenesis(wallet.address, fundingAmount);
                transactions.push(fundingTx);
            }
        }
        
        console.log(`🏭 Created ${count} development wallets${fundingAmount > 0 ? ` with ${fundingAmount} TOPAY each` : ''}`);
        
        return { wallets, transactions };
    }
}