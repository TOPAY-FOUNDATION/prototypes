/**
 * TOPAY Foundation Wallet Utilities
 * Helper functions and CLI tools for wallet management
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Wallet } from './Wallet.js';
import { WalletManager } from './WalletManager.js';
import { Blockchain } from '../blockchain/blockchain.js';

export class WalletUtils {
    /**
     * Generate multiple random wallets for testing
     * @param {number} count - Number of wallets to generate
     * @param {boolean} saveToFile - Whether to save wallets to files
     * @param {string} outputDir - Directory to save wallet files
     * @returns {Array<Wallet>} - Generated wallets
     */
    static async generateTestWallets(count = 10, saveToFile = true, outputDir = './test-wallets') {
        const wallets = [];
        
        if (saveToFile) {
            await fs.mkdir(outputDir, { recursive: true });
        }
        
        for (let i = 0; i < count; i++) {
            const wallet = new Wallet({
                label: `Test Wallet ${i + 1}`,
                description: `Auto-generated test wallet ${i + 1}`,
                tags: ['test', 'generated']
            });
            
            wallets.push(wallet);
            
            if (saveToFile) {
                const walletFile = path.join(outputDir, `test-wallet-${i + 1}.json`);
                const walletData = wallet.exportWallet(true);
                await fs.writeFile(walletFile, JSON.stringify(walletData, null, 2));
            }
        }
        
        console.log(`🏭 Generated ${count} test wallets${saveToFile ? ` in ${outputDir}` : ''}`);
        return wallets;
    }
    
    /**
     * Create a development blockchain with funded wallets
     * @param {Object} options - Configuration options
     * @returns {Object} - Blockchain and wallets
     */
    static async createDevelopmentBlockchain(options = {}) {
        const {
            genesisBalance = 1000000,
            walletCount = 5,
            fundingAmount = 1000,
            dataPath = './dev-data'
        } = options;
        
        console.log('🏗️ Creating development blockchain with genesis wallet...');
        
        // Create blockchain with genesis wallet
        const blockchain = new Blockchain({
            genesisBalance,
            walletDataPath: path.join(dataPath, 'wallets'),
            autoCreateGenesis: true
        });
        
        // Wait for genesis wallet initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create and fund development wallets
        const walletManager = blockchain.getWalletManager();
        const { wallets, transactions } = await walletManager.createDevelopmentWallets(walletCount, fundingAmount);
        
        // Add funding transactions to blockchain
        for (const tx of transactions) {
            await blockchain.addTransaction(tx);
        }
        
        console.log('✅ Development blockchain created successfully');
        console.log(`👑 Genesis wallet: ${blockchain.getGenesisWallet()?.address}`);
        console.log(`🏦 Created ${wallets.length} funded development wallets`);
        
        return {
            blockchain,
            genesisWallet: blockchain.getGenesisWallet(),
            wallets,
            transactions,
            walletManager
        };
    }
    
    /**
     * Validate wallet file format
     * @param {string} filePath - Path to wallet file
     * @returns {Object} - Validation result
     */
    static async validateWalletFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const walletData = JSON.parse(data);
            
            const requiredFields = ['address', 'publicKey'];
            const missingFields = requiredFields.filter(field => !walletData[field]);
            
            if (missingFields.length > 0) {
                return {
                    valid: false,
                    error: `Missing required fields: ${missingFields.join(', ')}`,
                    walletData: null
                };
            }
            
            // Validate address format
            if (!Wallet.isValidAddress(walletData.address)) {
                return {
                    valid: false,
                    error: 'Invalid wallet address format',
                    walletData: null
                };
            }
            
            return {
                valid: true,
                error: null,
                walletData
            };
            
        } catch (error) {
            return {
                valid: false,
                error: `Failed to read/parse wallet file: ${error.message}`,
                walletData: null
            };
        }
    }
    
    /**
     * Backup all wallets to a single file
     * @param {WalletManager} walletManager - Wallet manager instance
     * @param {string} backupPath - Path for backup file
     * @param {boolean} includePrivateKeys - Include private keys in backup
     */
    static async backupWallets(walletManager, backupPath, includePrivateKeys = false) {
        try {
            const backupData = walletManager.exportAllWallets(includePrivateKeys);
            
            // Add backup metadata
            backupData.backupInfo = {
                createdAt: Date.now(),
                version: '1.0.0',
                includesPrivateKeys: includePrivateKeys,
                walletCount: backupData.wallets.length
            };
            
            await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
            
            console.log(`📦 Wallet backup created: ${backupPath}`);
            console.log(`💾 Backed up ${backupData.wallets.length} wallets`);
            
            if (includePrivateKeys) {
                console.log('⚠️ Backup includes private keys - keep secure!');
            }
            
        } catch (error) {
            console.error('❌ Failed to create wallet backup:', error.message);
            throw error;
        }
    }
    
    /**
     * Restore wallets from backup file
     * @param {WalletManager} walletManager - Wallet manager instance
     * @param {string} backupPath - Path to backup file
     */
    static async restoreWallets(walletManager, backupPath) {
        try {
            const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
            
            if (!backupData.wallets || !Array.isArray(backupData.wallets)) {
                throw new Error('Invalid backup file format');
            }
            
            await walletManager.importAllWallets(backupData);
            
            console.log(`📥 Wallet backup restored from: ${backupPath}`);
            console.log(`💾 Restored ${backupData.wallets.length} wallets`);
            
        } catch (error) {
            console.error('❌ Failed to restore wallet backup:', error.message);
            throw error;
        }
    }
    
    /**
     * Generate wallet report
     * @param {WalletManager} walletManager - Wallet manager instance
     * @param {Blockchain} blockchain - Blockchain instance
     * @returns {Object} - Wallet report
     */
    static generateWalletReport(walletManager, blockchain) {
        const wallets = walletManager.listWallets();
        const balances = walletManager.getWalletBalances(blockchain);
        
        const report = {
            summary: {
                totalWallets: wallets.length,
                genesisWallets: wallets.filter(w => w.isGenesis).length,
                userWallets: wallets.filter(w => !w.isGenesis).length,
                totalBalance: Object.values(balances).reduce((sum, b) => sum + b.balance, 0)
            },
            wallets: wallets.map(wallet => ({
                address: wallet.address,
                label: wallet.metadata.label,
                isGenesis: wallet.isGenesis,
                balance: balances[wallet.address]?.balance || 0,
                transactionCount: wallet.metadata.transactionCount,
                createdAt: wallet.createdAt,
                lastUsed: wallet.metadata.lastUsed
            })),
            genesisWallet: walletManager.getGenesisWallet()?.getInfo(),
            defaultWallet: walletManager.getDefaultWallet()?.getInfo(),
            generatedAt: Date.now()
        };
        
        return report;
    }
    
    /**
     * Export wallet report to file
     * @param {WalletManager} walletManager - Wallet manager instance
     * @param {Blockchain} blockchain - Blockchain instance
     * @param {string} outputPath - Output file path
     */
    static async exportWalletReport(walletManager, blockchain, outputPath) {
        try {
            const report = this.generateWalletReport(walletManager, blockchain);
            await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
            
            console.log(`📊 Wallet report exported: ${outputPath}`);
            console.log(`📈 Report includes ${report.summary.totalWallets} wallets`);
            
        } catch (error) {
            console.error('❌ Failed to export wallet report:', error.message);
            throw error;
        }
    }
    
    /**
     * Create wallet from mnemonic phrase (simplified)
     * @param {string} mnemonic - Mnemonic phrase
     * @param {Object} options - Wallet options
     * @returns {Wallet} - Created wallet
     */
    static createWalletFromMnemonic(mnemonic, options = {}) {
        // Simplified mnemonic to private key conversion
        // In production, use proper BIP39 implementation
        const crypto = require('crypto');
        const privateKey = crypto.createHash('sha256').update(mnemonic).digest('hex');
        
        return new Wallet({
            privateKey,
            ...options
        });
    }
    
    /**
     * Generate mnemonic phrase for wallet (simplified)
     * @returns {string} - Mnemonic phrase
     */
    static generateMnemonic() {
        // Simplified mnemonic generation
        // In production, use proper BIP39 word list
        const words = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
            'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
            'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
        ];
        
        const mnemonic = [];
        for (let i = 0; i < 12; i++) {
            mnemonic.push(words[Math.floor(Math.random() * words.length)]);
        }
        
        return mnemonic.join(' ');
    }
    
    /**
     * Batch create transactions between wallets
     * @param {Array} transactions - Array of transaction specs
     * @param {WalletManager} walletManager - Wallet manager instance
     * @returns {Array<Transaction>} - Created transactions
     */
    static async batchCreateTransactions(transactions, walletManager) {
        const createdTransactions = [];
        
        for (const txSpec of transactions) {
            try {
                const { from, to, amount, data } = txSpec;
                const transaction = await walletManager.createTransaction(from, to, amount, data);
                createdTransactions.push(transaction);
                
                console.log(`💸 Created transaction: ${amount} TOPAY from ${from.substring(0, 10)}... to ${to.substring(0, 10)}...`);
                
            } catch (error) {
                console.error(`❌ Failed to create transaction:`, error.message);
            }
        }
        
        console.log(`📦 Batch created ${createdTransactions.length} transactions`);
        return createdTransactions;
    }
    
    /**
     * Analyze wallet activity
     * @param {string} address - Wallet address
     * @param {Blockchain} blockchain - Blockchain instance
     * @returns {Object} - Activity analysis
     */
    static analyzeWalletActivity(address, blockchain) {
        const transactions = blockchain.getTransactionHistory(address);
        const balance = blockchain.getBalance(address);
        
        let totalSent = 0;
        let totalReceived = 0;
        let transactionCount = transactions.length;
        
        const activity = {
            sent: [],
            received: [],
            genesis: []
        };
        
        for (const tx of transactions) {
            if (tx.from === 'GENESIS' && tx.to === address) {
                totalReceived += tx.amount;
                activity.genesis.push(tx);
            } else if (tx.from === address) {
                totalSent += tx.amount;
                activity.sent.push(tx);
            } else if (tx.to === address) {
                totalReceived += tx.amount;
                activity.received.push(tx);
            }
        }
        
        return {
            address,
            balance,
            totalSent,
            totalReceived,
            transactionCount,
            netFlow: totalReceived - totalSent,
            activity,
            firstTransaction: transactions[0]?.timestamp,
            lastTransaction: transactions[transactions.length - 1]?.timestamp,
            isActive: transactionCount > 0
        };
    }
    
    /**
     * Find wallets with specific criteria
     * @param {WalletManager} walletManager - Wallet manager instance
     * @param {Blockchain} blockchain - Blockchain instance
     * @param {Object} criteria - Search criteria
     * @returns {Array<Wallet>} - Matching wallets
     */
    static findWallets(walletManager, blockchain, criteria = {}) {
        const wallets = walletManager.listWallets();
        const balances = walletManager.getWalletBalances(blockchain);
        
        return wallets.filter(wallet => {
            const balance = balances[wallet.address]?.balance || 0;
            
            // Filter by balance range
            if (criteria.minBalance !== undefined && balance < criteria.minBalance) {
                return false;
            }
            if (criteria.maxBalance !== undefined && balance > criteria.maxBalance) {
                return false;
            }
            
            // Filter by wallet type
            if (criteria.isGenesis !== undefined && wallet.isGenesis !== criteria.isGenesis) {
                return false;
            }
            
            // Filter by label
            if (criteria.label && !wallet.metadata.label.includes(criteria.label)) {
                return false;
            }
            
            // Filter by tags
            if (criteria.tags && !criteria.tags.every(tag => wallet.metadata.tags.includes(tag))) {
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Display wallet information in console
     * @param {Wallet} wallet - Wallet to display
     * @param {Blockchain} blockchain - Blockchain instance (optional)
     */
    static displayWalletInfo(wallet, blockchain = null) {
        console.log('\n' + '='.repeat(60));
        console.log(`📱 WALLET INFORMATION`);
        console.log('='.repeat(60));
        console.log(`Address: ${wallet.address}`);
        console.log(`Label: ${wallet.metadata.label}`);
        console.log(`Type: ${wallet.isGenesis ? 'Genesis Wallet' : 'User Wallet'}`);
        
        if (blockchain) {
            const balance = wallet.getBalance(blockchain);
            console.log(`Balance: ${balance} TOPAY`);
            
            const activity = this.analyzeWalletActivity(wallet.address, blockchain);
            console.log(`Transactions: ${activity.transactionCount}`);
            console.log(`Total Sent: ${activity.totalSent} TOPAY`);
            console.log(`Total Received: ${activity.totalReceived} TOPAY`);
        }
        
        console.log(`Created: ${new Date(wallet.createdAt).toLocaleString()}`);
        console.log(`Last Used: ${wallet.metadata.lastUsed ? new Date(wallet.metadata.lastUsed).toLocaleString() : 'Never'}`);
        console.log(`Tags: ${wallet.metadata.tags.join(', ')}`);
        console.log('='.repeat(60));
    }
}