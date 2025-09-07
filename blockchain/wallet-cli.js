#!/usr/bin/env node
/**
 * TOPAY Foundation Wallet CLI
 * Command-line interface for wallet management and testing
 */

import { Blockchain } from './src/blockchain/blockchain.js';
import { WalletManager } from './src/wallet/WalletManager.js';
import { WalletUtils } from './src/wallet/WalletUtils.js';
import { Wallet } from './src/wallet/Wallet.js';

class WalletCLI {
    constructor() {
        this.blockchain = null;
        this.walletManager = null;
    }
    
    async initialize() {
        console.log('🚀 Initializing TOPAY Wallet CLI...');
        
        // Create blockchain with genesis wallet
        this.blockchain = new Blockchain({
            genesisBalance: 1000000,
            walletDataPath: './data/cli-wallets',
            autoCreateGenesis: true
        });
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 200));
        
        this.walletManager = this.blockchain.getWalletManager();
        
        console.log('✅ TOPAY Wallet CLI initialized successfully');
        console.log(`👑 Genesis wallet: ${this.blockchain.getGenesisWallet()?.address}`);
    }
    
    async runCommand(command, args = []) {
        try {
            switch (command) {
                case 'create':
                    await this.createWallet(args);
                    break;
                case 'list':
                    await this.listWallets();
                    break;
                case 'balance':
                    await this.getBalance(args[0]);
                    break;
                case 'send':
                    await this.sendTransaction(args[0], args[1], parseFloat(args[2]));
                    break;
                case 'fund':
                    await this.fundFromGenesis(args[0], parseFloat(args[1]));
                    break;
                case 'info':
                    await this.getWalletInfo(args[0]);
                    break;
                case 'genesis':
                    await this.showGenesisInfo();
                    break;
                case 'report':
                    await this.generateReport();
                    break;
                case 'backup':
                    await this.backupWallets(args[0]);
                    break;
                case 'restore':
                    await this.restoreWallets(args[0]);
                    break;
                case 'test':
                    await this.runTests();
                    break;
                case 'dev':
                    await this.createDevEnvironment();
                    break;
                case 'help':
                default:
                    this.showHelp();
                    break;
            }
        } catch (error) {
            console.error('❌ Command failed:', error.message);
        }
    }
    
    async createWallet(args) {
        const label = args[0] || 'New Wallet';
        const wallet = await this.walletManager.createWallet({
            label,
            description: `Wallet created via CLI: ${label}`,
            tags: ['cli', 'user']
        });
        
        console.log('✅ Wallet created successfully!');
        console.log(`📱 Address: ${wallet.address}`);
        console.log(`🏷️ Label: ${wallet.metadata.label}`);
    }
    
    async listWallets() {
        const wallets = this.walletManager.listWallets();
        const balances = this.walletManager.getWalletBalances(this.blockchain);
        
        console.log('\n📋 WALLET LIST');
        console.log('='.repeat(80));
        console.log('Address'.padEnd(45) + 'Label'.padEnd(20) + 'Balance'.padEnd(15));
        console.log('-'.repeat(80));
        
        for (const wallet of wallets) {
            const balance = balances[wallet.address]?.balance || 0;
            const type = wallet.isGenesis ? '👑' : '👤';
            
            console.log(
                `${type} ${wallet.address}`.padEnd(45) +
                wallet.metadata.label.padEnd(20) +
                `${balance} TOPAY`.padEnd(15)
            );
        }
        
        console.log('-'.repeat(80));
        console.log(`Total: ${wallets.length} wallets`);
    }
    
    async getBalance(address) {
        if (!address) {
            console.error('❌ Address required');
            return;
        }
        
        const wallet = this.walletManager.getWallet(address);
        if (!wallet) {
            console.error(`❌ Wallet not found: ${address}`);
            return;
        }
        
        const balance = wallet.getBalance(this.blockchain);
        console.log(`💰 Balance for ${wallet.metadata.label}: ${balance} TOPAY`);
    }
    
    async sendTransaction(fromAddress, toAddress, amount) {
        if (!fromAddress || !toAddress || !amount) {
            console.error('❌ Usage: send <from_address> <to_address> <amount>');
            return;
        }
        
        const transaction = await this.walletManager.createTransaction(fromAddress, toAddress, amount);
        await this.blockchain.addTransaction(transaction);
        
        console.log('✅ Transaction created successfully!');
        console.log(`💸 Sent ${amount} TOPAY from ${fromAddress.substring(0, 10)}... to ${toAddress.substring(0, 10)}...`);
        console.log(`🆔 Transaction ID: ${transaction.id}`);
    }
    
    async fundFromGenesis(targetAddress, amount) {
        if (!targetAddress || !amount) {
            console.error('❌ Usage: fund <target_address> <amount>');
            return;
        }
        
        const transaction = await this.blockchain.fundWalletFromGenesis(targetAddress, amount);
        
        console.log('✅ Funding transaction created!');
        console.log(`💰 Funded ${targetAddress.substring(0, 10)}... with ${amount} TOPAY from genesis wallet`);
        console.log(`🆔 Transaction ID: ${transaction.id}`);
    }
    
    async getWalletInfo(address) {
        if (!address) {
            console.error('❌ Address required');
            return;
        }
        
        const wallet = this.walletManager.getWallet(address);
        if (!wallet) {
            console.error(`❌ Wallet not found: ${address}`);
            return;
        }
        
        WalletUtils.displayWalletInfo(wallet, this.blockchain);
    }
    
    async showGenesisInfo() {
        const genesisWallet = this.blockchain.getGenesisWallet();
        if (!genesisWallet) {
            console.log('❌ No genesis wallet found');
            return;
        }
        
        console.log('\n👑 GENESIS WALLET INFORMATION');
        console.log('='.repeat(60));
        console.log(`Address: ${genesisWallet.address}`);
        console.log(`Initial Balance: ${genesisWallet.genesisBalance} TOPAY`);
        console.log(`Current Balance: ${genesisWallet.getBalance(this.blockchain)} TOPAY`);
        console.log(`Created: ${new Date(genesisWallet.createdAt).toLocaleString()}`);
        
        const activity = WalletUtils.analyzeWalletActivity(genesisWallet.address, this.blockchain);
        console.log(`Total Sent: ${activity.totalSent} TOPAY`);
        console.log(`Total Received: ${activity.totalReceived} TOPAY`);
        console.log(`Transactions: ${activity.transactionCount}`);
        console.log('='.repeat(60));
    }
    
    async generateReport() {
        const report = WalletUtils.generateWalletReport(this.walletManager, this.blockchain);
        
        console.log('\n📊 WALLET REPORT');
        console.log('='.repeat(60));
        console.log(`Total Wallets: ${report.summary.totalWallets}`);
        console.log(`Genesis Wallets: ${report.summary.genesisWallets}`);
        console.log(`User Wallets: ${report.summary.userWallets}`);
        console.log(`Total Balance: ${report.summary.totalBalance} TOPAY`);
        console.log('='.repeat(60));
        
        // Save report to file
        const reportPath = `./wallet-report-${Date.now()}.json`;
        await WalletUtils.exportWalletReport(this.walletManager, this.blockchain, reportPath);
    }
    
    async backupWallets(backupPath) {
        const path = backupPath || `./wallet-backup-${Date.now()}.json`;
        await WalletUtils.backupWallets(this.walletManager, path, true);
    }
    
    async restoreWallets(backupPath) {
        if (!backupPath) {
            console.error('❌ Backup file path required');
            return;
        }
        
        await WalletUtils.restoreWallets(this.walletManager, backupPath);
    }
    
    async runTests() {
        console.log('🧪 Running wallet system tests...');
        
        try {
            // Test 1: Create test wallets
            console.log('\n1️⃣ Creating test wallets...');
            const testWallets = await WalletUtils.generateTestWallets(3, false);
            console.log(`✅ Created ${testWallets.length} test wallets`);
            
            // Test 2: Fund wallets from genesis
            console.log('\n2️⃣ Funding wallets from genesis...');
            for (const wallet of testWallets) {
                await this.blockchain.fundWalletFromGenesis(wallet.address, 100);
            }
            console.log('✅ All wallets funded');
            
            // Test 3: Create transactions between wallets
            console.log('\n3️⃣ Creating transactions between wallets...');
            const transactions = [
                { from: testWallets[0].address, to: testWallets[1].address, amount: 25, data: 'Test transaction 1' },
                { from: testWallets[1].address, to: testWallets[2].address, amount: 15, data: 'Test transaction 2' }
            ];
            
            const createdTxs = await WalletUtils.batchCreateTransactions(transactions, this.walletManager);
            
            for (const tx of createdTxs) {
                await this.blockchain.addTransaction(tx);
            }
            
            console.log(`✅ Created ${createdTxs.length} transactions`);
            
            // Test 4: Check balances
            console.log('\n4️⃣ Checking final balances...');
            for (const wallet of testWallets) {
                const balance = wallet.getBalance(this.blockchain);
                console.log(`💰 ${wallet.address.substring(0, 10)}...: ${balance} TOPAY`);
            }
            
            console.log('\n✅ All tests completed successfully!');
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }
    
    async createDevEnvironment() {
        console.log('🏗️ Creating development environment...');
        
        const devSetup = await WalletUtils.createDevelopmentBlockchain({
            genesisBalance: 1000000,
            walletCount: 5,
            fundingAmount: 1000,
            dataPath: './dev-environment'
        });
        
        console.log('\n🎯 Development Environment Created!');
        console.log('='.repeat(50));
        console.log(`👑 Genesis Wallet: ${devSetup.genesisWallet.address}`);
        console.log(`🏦 Development Wallets: ${devSetup.wallets.length}`);
        console.log(`💸 Funding Transactions: ${devSetup.transactions.length}`);
        console.log('='.repeat(50));
        
        // Display wallet addresses
        console.log('\n📋 Development Wallet Addresses:');
        devSetup.wallets.forEach((wallet, index) => {
            console.log(`${index + 1}. ${wallet.address} (${wallet.metadata.label})`);
        });
    }
    
    showHelp() {
        console.log('\n🏦 TOPAY Wallet CLI - Help');
        console.log('='.repeat(50));
        console.log('Available commands:');
        console.log('');
        console.log('📱 Wallet Management:');
        console.log('  create [label]           - Create new wallet');
        console.log('  list                     - List all wallets');
        console.log('  info <address>           - Show wallet details');
        console.log('  balance <address>        - Get wallet balance');
        console.log('');
        console.log('💸 Transactions:');
        console.log('  send <from> <to> <amount> - Send TOPAY between wallets');
        console.log('  fund <address> <amount>   - Fund wallet from genesis');
        console.log('');
        console.log('👑 Genesis Wallet:');
        console.log('  genesis                  - Show genesis wallet info');
        console.log('');
        console.log('📊 Reports & Backup:');
        console.log('  report                   - Generate wallet report');
        console.log('  backup [path]            - Backup all wallets');
        console.log('  restore <path>           - Restore wallets from backup');
        console.log('');
        console.log('🧪 Development:');
        console.log('  test                     - Run wallet system tests');
        console.log('  dev                      - Create development environment');
        console.log('');
        console.log('❓ Help:');
        console.log('  help                     - Show this help message');
        console.log('='.repeat(50));
    }
}

// CLI Entry Point
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    const commandArgs = args.slice(1);
    
    const cli = new WalletCLI();
    
    try {
        await cli.initialize();
        await cli.runCommand(command, commandArgs);
    } catch (error) {
        console.error('❌ CLI Error:', error.message);
        process.exit(1);
    }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { WalletCLI };