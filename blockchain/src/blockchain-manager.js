import readline from 'readline';
import { Blockchain } from './blockchain/blockchain.js';
import { Transaction } from './blockchain/transaction.js';
import { PersistenceManager } from './storage/persistence.js';

/**
 * Interactive Blockchain Manager
 * Full-featured blockchain interface for real usage
 */
export class BlockchainManager {
  constructor() {
    this.blockchain = null;
    this.persistence = new PersistenceManager();
    this.currentWallet = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.autoSaveEnabled = false;
  }

  /**
   * Initialize the blockchain manager
   */
  async initialize() {
    console.log('🚀 Initializing TOPAY Blockchain Manager...\n');
    
    // Initialize storage
    await this.persistence.initialize();
    
    // Try to load existing blockchain
    const existingBlockchain = await this.persistence.loadBlockchain();
    
    if (existingBlockchain) {
      this.blockchain = new Blockchain();
      this.blockchain.importChain(existingBlockchain);
      
      // Load wallets
      const walletsData = await this.persistence.loadWallets();
      if (walletsData) {
        for (const walletData of walletsData.wallets) {
          // Note: We can only restore public data, private keys need to be regenerated
          console.log(`👛 Found wallet: ${walletData.address}`);
        }
      }
      
      console.log('✅ Existing blockchain loaded successfully!\n');
    } else {
      this.blockchain = new Blockchain();
      console.log('✅ New blockchain created!\n');
    }
    
    // Enable auto-save
    await this.enableAutoSave();
  }

  /**
   * Enable auto-save functionality
   */
  async enableAutoSave() {
    if (!this.autoSaveEnabled) {
      await this.persistence.enableAutoSave(this.blockchain, 30000); // Save every 30 seconds
      this.autoSaveEnabled = true;
    }
  }

  /**
   * Main menu interface
   */
  async showMainMenu() {
    console.log('\n' + '='.repeat(50));
    console.log('🔗 TOPAY BLOCKCHAIN MANAGER');
    console.log('='.repeat(50));
    console.log('1.  👛 Wallet Management');
    console.log('2.  💸 Send Transaction');
    console.log('3.  ⛏️  Mine Block');
    console.log('4.  📊 View Blockchain');
    console.log('5.  🔍 Search Transactions');
    console.log('6.  📈 Blockchain Statistics');
    console.log('7.  💾 Save Data');
    console.log('8.  📂 Load Data');
    console.log('9.  🔄 Create Backup');
    console.log('10. ⚙️  Settings');
    console.log('11. 🚪 Exit');
    console.log('='.repeat(50));
    
    const choice = await this.prompt('Select an option (1-11): ');
    await this.handleMainMenuChoice(choice);
  }

  /**
   * Handle main menu selection
   */
  async handleMainMenuChoice(choice) {
    switch (choice) {
      case '1':
        await this.walletMenu();
        break;
      case '2':
        await this.sendTransaction();
        break;
      case '3':
        await this.mineBlock();
        break;
      case '4':
        await this.viewBlockchain();
        break;
      case '5':
        await this.searchTransactions();
        break;
      case '6':
        await this.showStatistics();
        break;
      case '7':
        await this.saveData();
        break;
      case '8':
        await this.loadData();
        break;
      case '9':
        await this.createBackup();
        break;
      case '10':
        await this.settingsMenu();
        break;
      case '11':
        await this.exit();
        return;
      default:
        console.log('❌ Invalid option. Please try again.');
    }
    
    await this.showMainMenu();
  }

  /**
   * Wallet management menu
   */
  async walletMenu() {
    console.log('\n👛 WALLET MANAGEMENT');
    console.log('Note: Wallets should be created externally using wallet applications');
    console.log('1. Select Current Wallet (by address)');
    console.log('2. View Current Wallet');
    console.log('3. View Wallet Balance');
    console.log('4. Back to Main Menu');
    
    const choice = await this.prompt('Select option: ');
    
    switch (choice) {
      case '1':
        await this.selectWalletByAddress();
        break;
      case '2':
        await this.viewCurrentWallet();
        break;
      case '3':
        await this.viewWalletBalance();
        break;
      case '4':
        return;
      default:
        console.log('❌ Invalid option.');
    }
    
    await this.walletMenu();
  }

  /**
   * Select current wallet by address
   */
  async selectWalletByAddress() {
    const address = await this.prompt('Enter wallet address: ');
    
    if (!address || address.trim() === '') {
      console.log('❌ Invalid address.');
      return;
    }
    
    // For now, just store the address as current wallet
    // In a real implementation, you'd validate the address format
    this.currentWallet = { address: address.trim() };
    console.log(`✅ Selected wallet: ${this.currentWallet.address}`);
  }

  /**
   * View current wallet details
   */
  async viewCurrentWallet() {
    if (!this.currentWallet) {
      console.log('❌ No wallet selected. Please select a wallet first.');
      return;
    }
    
    console.log('\n👛 Current Wallet Details:');
    console.log(`   Address: ${this.currentWallet.address}`);
    console.log(`   Balance: ${this.blockchain.getBalance(this.currentWallet.address)} TOPAY`);
    
    const history = this.blockchain.getTransactionHistory(this.currentWallet.address);
    console.log(`   Transactions: ${history.length}`);
  }

  /**
   * View wallet balance
   */
  async viewWalletBalance() {
    if (!this.currentWallet) {
      console.log('❌ No wallet selected.');
      return;
    }
    
    const balance = this.blockchain.getBalance(this.currentWallet.address);
    console.log(`\n💰 Wallet Balance: ${balance} TOPAY`);
    console.log(`   Address: ${this.currentWallet.address}`);
  }

  /**
   * Send transaction
   */
  async sendTransaction() {
    if (!this.currentWallet) {
      console.log('❌ No wallet selected. Please select a wallet first.');
      return;
    }
    
    try {
      console.log('\n💸 Send Transaction');
      console.log(`From: ${this.currentWallet.address}`);
      console.log(`Balance: ${this.blockchain.getBalance(this.currentWallet.address)} TOPAY`);
      
      const toAddress = await this.prompt('To address: ');
      const amountStr = await this.prompt('Amount (TOPAY): ');
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount) || amount <= 0) {
        console.log('❌ Invalid amount.');
        return;
      }
      
      const data = await this.prompt('Transaction data (optional): ');
      
      console.log('\n🔄 Creating transaction...');
      console.log('⚠️  Note: Transaction signing should be done externally with wallet application');
      
      const transaction = new Transaction(
        this.currentWallet.address,
        toAddress,
        amount,
        data || null
      );
      
      // For demo purposes, create a simple signature placeholder
      // In real implementation, this would be signed by external wallet
      transaction.signature = 'EXTERNAL_SIGNATURE_REQUIRED';
      transaction.publicKey = 'EXTERNAL_PUBLIC_KEY_REQUIRED';
      
      // Add to blockchain (validation would normally check signature)
      await this.blockchain.addTransaction(transaction);
      
      console.log('✅ Transaction created and added to mempool!');
      console.log(`   Transaction ID: ${transaction.hash}`);
      console.log(`   Amount: ${amount} TOPAY`);
      console.log(`   To: ${toAddress}`);
      console.log('⚠️  Note: In production, this transaction would need proper external signing');
      
    } catch (error) {
      console.error('❌ Transaction failed:', error.message);
    }
  }

  /**
   * Mine a block
   */
  async mineBlock() {
    try {
      console.log('\n⛏️ Mining new block...');
      
      if (this.blockchain.mempool.length === 0) {
        console.log('❌ No transactions in mempool to mine.');
        return;
      }
      
      const miningAddress = this.currentWallet ? this.currentWallet.address : null;
      
      if (!miningAddress) {
        console.log('❌ No wallet selected for mining rewards.');
        return;
      }
      
      console.log(`   Mining to: ${miningAddress}`);
      console.log(`   Transactions: ${this.blockchain.mempool.length}`);
      console.log(`   Difficulty: ${this.blockchain.difficulty}`);
      
      const block = await this.blockchain.minePendingTransactions(miningAddress);
      
      console.log('✅ Block mined successfully!');
      console.log(`   Block #${block.index}`);
      console.log(`   Hash: ${block.hash}`);
      console.log(`   Transactions: ${block.transactions.length}`);
      console.log(`   Mining reward: ${this.blockchain.miningReward} TOPAY`);
      
    } catch (error) {
      console.error('❌ Mining failed:', error.message);
    }
  }

  /**
   * View blockchain
   */
  async viewBlockchain() {
    console.log('\n🔗 Blockchain Overview:');
    console.log(`   Total Blocks: ${this.blockchain.chain.length}`);
    console.log(`   Latest Block: #${this.blockchain.getLatestBlock().index}`);
    console.log(`   Difficulty: ${this.blockchain.difficulty}`);
    console.log(`   Mempool: ${this.blockchain.mempool.length} pending transactions`);
    
    const showDetails = await this.prompt('Show block details? (y/n): ');
    
    if (showDetails.toLowerCase() === 'y') {
      this.blockchain.chain.forEach((block, index) => {
        console.log(`\n📦 Block #${index}:`);
        console.log(`   Hash: ${block.hash}`);
        console.log(`   Previous Hash: ${block.previousHash}`);
        console.log(`   Timestamp: ${new Date(block.timestamp).toLocaleString()}`);
        console.log(`   Transactions: ${block.transactions.length}`);
        console.log(`   Nonce: ${block.nonce}`);
      });
    }
  }

  /**
   * Search transactions
   */
  async searchTransactions() {
    console.log('\n🔍 Transaction Search');
    console.log('1. Search by address');
    console.log('2. Search by amount range');
    console.log('3. View all transactions');
    
    const choice = await this.prompt('Select search type: ');
    let results = [];
    
    switch (choice) {
      case '1':
        const address = await this.prompt('Enter address: ');
        results = this.blockchain.searchTransactions({ from: address });
        results = results.concat(this.blockchain.searchTransactions({ to: address }));
        break;
      case '2':
        const minAmount = parseFloat(await this.prompt('Minimum amount: ')) || 0;
        const maxAmount = parseFloat(await this.prompt('Maximum amount: ')) || Infinity;
        results = this.blockchain.searchTransactions({ minAmount, maxAmount });
        break;
      case '3':
        results = this.blockchain.getAllTransactions();
        break;
      default:
        console.log('❌ Invalid option.');
        return;
    }
    
    if (results.length === 0) {
      console.log('❌ No transactions found.');
      return;
    }
    
    console.log(`\n📋 Found ${results.length} transactions:`);
    results.slice(0, 10).forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.amount} TOPAY from ${tx.from || 'MINING'} to ${tx.to}`);
      console.log(`   Hash: ${tx.hash}`);
      console.log(`   Block: #${tx.blockIndex || 'Pending'}`);
      console.log('');
    });
    
    if (results.length > 10) {
      console.log(`... and ${results.length - 10} more transactions`);
    }
  }

  /**
   * Show blockchain statistics
   */
  async showStatistics() {
    const stats = this.blockchain.getStats();
    const storageStats = await this.persistence.getStats();
    
    console.log('\n📈 Blockchain Statistics:');
    console.log(`   Blocks: ${stats.blockCount}`);
    console.log(`   Transactions: ${stats.totalTransactions}`);
    console.log(`   Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
    console.log(`   Average Block Size: ${(stats.averageBlockSize / 1024).toFixed(2)} KB`);
    console.log(`   Mining Difficulty: ${stats.difficulty}`);
    console.log(`   Mining Reward: ${stats.miningReward} TOPAY`);
    console.log(`   Mempool: ${stats.mempoolSize} transactions`);
    console.log(`   Wallets: ${stats.walletCount}`);
    console.log(`   Network Nodes: ${stats.networkNodes}`);
    
    console.log('\n💾 Storage Statistics:');
    console.log(`   Data Directory: ${storageStats.dataDir}`);
    console.log(`   Total Storage: ${(storageStats.totalSize / 1024).toFixed(2)} KB`);
    
    Object.entries(storageStats.files).forEach(([name, info]) => {
      if (info.exists) {
        console.log(`   ${name}: ${(info.size / 1024).toFixed(2)} KB (${info.modified.toLocaleString()})`);
      } else {
        console.log(`   ${name}: Not saved`);
      }
    });
  }

  /**
   * Save data manually
   */
  async saveData() {
    console.log('\n💾 Saving blockchain data...');
    
    try {
      await this.persistence.saveBlockchain(this.blockchain);
      await this.persistence.saveWallets(this.blockchain.wallets);
      
      console.log('✅ Data saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save data:', error.message);
    }
  }

  /**
   * Load data manually
   */
  async loadData() {
    console.log('\n📂 Loading blockchain data...');
    
    try {
      const blockchainData = await this.persistence.loadBlockchain();
      if (blockchainData) {
        this.blockchain.importChain(blockchainData);
        console.log('✅ Blockchain data loaded successfully!');
      }
      
      const walletsData = await this.persistence.loadWallets();
      if (walletsData) {
        console.log(`✅ Found ${walletsData.wallets.length} wallet records`);
      }
      
    } catch (error) {
      console.error('❌ Failed to load data:', error.message);
    }
  }

  /**
   * Create backup
   */
  async createBackup() {
    console.log('\n🔄 Creating backup...');
    
    try {
      const backupPath = await this.persistence.createBackup();
      console.log(`✅ Backup created: ${backupPath}`);
      
      const backups = await this.persistence.listBackups();
      console.log(`📁 Total backups: ${backups.length}`);
      
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message);
    }
  }

  /**
   * Settings menu
   */
  async settingsMenu() {
    console.log('\n⚙️ Settings');
    console.log('1. Change mining difficulty');
    console.log('2. Change mining reward');
    console.log('3. View auto-save status');
    console.log('4. Back to main menu');
    
    const choice = await this.prompt('Select option: ');
    
    switch (choice) {
      case '1':
        const difficulty = parseInt(await this.prompt('New difficulty (1-6): '));
        if (difficulty >= 1 && difficulty <= 6) {
          this.blockchain.difficulty = difficulty;
          console.log(`✅ Mining difficulty set to ${difficulty}`);
        } else {
          console.log('❌ Invalid difficulty. Must be between 1 and 6.');
        }
        break;
      case '2':
        const reward = parseFloat(await this.prompt('New mining reward: '));
        if (reward > 0) {
          this.blockchain.miningReward = reward;
          console.log(`✅ Mining reward set to ${reward} TOPAY`);
        } else {
          console.log('❌ Invalid reward amount.');
        }
        break;
      case '3':
        console.log(`Auto-save: ${this.autoSaveEnabled ? 'Enabled (every 30 seconds)' : 'Disabled'}`);
        break;
      case '4':
        return;
      default:
        console.log('❌ Invalid option.');
    }
    
    await this.settingsMenu();
  }

  /**
   * Exit application
   */
  async exit() {
    console.log('\n🔄 Saving data before exit...');
    
    try {
      await this.persistence.saveBlockchain(this.blockchain);
      await this.persistence.saveWallets(this.blockchain.wallets);
      console.log('✅ Data saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save data:', error.message);
    }
    
    console.log('\n👋 Thank you for using TOPAY Blockchain Manager!');
    console.log('🔗 Your blockchain data has been saved and will be available next time.');
    
    this.rl.close();
    process.exit(0);
  }

  /**
   * Prompt helper
   */
  prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  /**
   * Start the blockchain manager
   */
  async start() {
    try {
      await this.initialize();
      await this.showMainMenu();
    } catch (error) {
      console.error('❌ Failed to start blockchain manager:', error);
      process.exit(1);
    }
  }
}

// Auto-start if run directly
if (process.argv[1].endsWith('blockchain-manager.js')) {
  const manager = new BlockchainManager();
  manager.start();
}