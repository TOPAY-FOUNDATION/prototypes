import { Blockchain } from './blockchain/blockchain.js';
import { Transaction } from './blockchain/transaction.js';
import { PersistenceManager } from './storage/persistence.js';

/**
 * Blockchain API - Programmatic interface for blockchain operations
 * Use this for building applications on top of the TOPAY blockchain
 */
export class BlockchainAPI {
  constructor(dataDir = './data') {
    this.blockchain = new Blockchain();
    this.persistence = new PersistenceManager(dataDir);
    this.initialized = false;
  }

  /**
   * Initialize the blockchain API
   */
  async initialize() {
    if (this.initialized) return;

    console.log('🚀 Initializing TOPAY Blockchain API...');
    
    // Initialize storage
    await this.persistence.initialize();
    
    // Try to load existing blockchain
    const existingBlockchain = await this.persistence.loadBlockchain();
    if (existingBlockchain) {
      this.blockchain.importChain(existingBlockchain);
      console.log('✅ Existing blockchain loaded');
    } else {
      console.log('✅ New blockchain initialized');
    }
    
    // Enable auto-save
    await this.persistence.enableAutoSave(this.blockchain, 30000);
    
    this.initialized = true;
    return this;
  }

  /**
   * Get wallet balance
   */
  getBalance(address) {
    if (!this.initialized) throw new Error('API not initialized');
    return this.blockchain.getBalance(address);
  }

  /**
   * Send transaction
   */
  async sendTransaction(fromWallet, toAddress, amount, data = null) {
    if (!this.initialized) await this.initialize();
    
    // Create transaction
    const transaction = new Transaction(fromWallet.address, toAddress, amount, data);
    
    // Sign transaction
    await transaction.signTransaction(fromWallet.keyPair);
    
    // Add to blockchain
    await this.blockchain.addTransaction(transaction);
    
    return {
      transactionId: transaction.hash,
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp,
      status: 'pending'
    };
  }

  /**
   * Mine pending transactions
   */
  async mineBlock(minerAddress) {
    if (!this.initialized) await this.initialize();
    
    if (this.blockchain.mempool.length === 0) {
      throw new Error('No transactions to mine');
    }
    
    const block = await this.blockchain.minePendingTransactions(minerAddress);
    await this.persistence.saveBlockchain(this.blockchain);
    
    return {
      blockIndex: block.index,
      blockHash: block.hash,
      transactionCount: block.transactions.length,
      timestamp: block.timestamp,
      nonce: block.nonce,
      miningReward: this.blockchain.miningReward
    };
  }

  /**
   * Get blockchain statistics
   */
  getStats() {
    if (!this.initialized) throw new Error('API not initialized');
    return this.blockchain.getStats();
  }

  /**
   * Get all transactions
   */
  getAllTransactions() {
    if (!this.initialized) throw new Error('API not initialized');
    return this.blockchain.getAllTransactions();
  }

  /**
   * Search transactions
   */
  searchTransactions(criteria) {
    if (!this.initialized) throw new Error('API not initialized');
    return this.blockchain.searchTransactions(criteria);
  }

  /**
   * Get transaction by hash
   */
  getTransaction(hash) {
    if (!this.initialized) throw new Error('API not initialized');
    
    for (const block of this.blockchain.chain) {
      const transaction = block.transactions.find(tx => tx.hash === hash);
      if (transaction) {
        return {
          ...transaction.toJSON(),
          blockIndex: block.index,
          blockHash: block.hash,
          confirmations: this.blockchain.chain.length - block.index
        };
      }
    }
    
    // Check mempool
    const pendingTx = this.blockchain.mempool.find(tx => tx.hash === hash);
    if (pendingTx) {
      return {
        ...pendingTx.toJSON(),
        blockIndex: null,
        blockHash: null,
        confirmations: 0,
        status: 'pending'
      };
    }
    
    return null;
  }

  /**
   * Get block by index
   */
  getBlock(index) {
    if (!this.initialized) throw new Error('API not initialized');
    
    const block = this.blockchain.getBlock(index);
    return block ? {
      index: block.index,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      transactions: block.transactions.map(tx => tx.toJSON()),
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    } : null;
  }

  /**
   * Get latest block
   */
  getLatestBlock() {
    if (!this.initialized) throw new Error('API not initialized');
    
    const block = this.blockchain.getLatestBlock();
    return {
      index: block.index,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      transactionCount: block.transactions.length,
      nonce: block.nonce
    };
  }

  /**
   * Validate blockchain
   */
  async validateBlockchain() {
    if (!this.initialized) await this.initialize();
    return await this.blockchain.isChainValid();
  }

  /**
   * Get mempool transactions
   */
  getMempoolTransactions() {
    if (!this.initialized) throw new Error('API not initialized');
    return this.blockchain.getMempoolTransactions();
  }

  /**
   * Export blockchain data
   */
  async exportData() {
    if (!this.initialized) await this.initialize();
    
    const blockchainData = this.blockchain.exportChain();
    const walletsData = await this.persistence.loadWallets();
    
    return {
      blockchain: blockchainData,
      wallets: walletsData,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Save data manually
   */
  async saveData() {
    if (!this.initialized) await this.initialize();
    
    await this.persistence.saveBlockchain(this.blockchain);
    await this.persistence.saveWallets(this.blockchain.wallets);
    
    return true;
  }

  /**
   * Create backup
   */
  async createBackup() {
    if (!this.initialized) await this.initialize();
    
    const backupPath = await this.persistence.createBackup();
    return { backupPath, timestamp: new Date().toISOString() };
  }

  /**
   * Set mining difficulty
   */
  setMiningDifficulty(difficulty) {
    if (!this.initialized) throw new Error('API not initialized');
    
    if (difficulty < 1 || difficulty > 6) {
      throw new Error('Difficulty must be between 1 and 6');
    }
    
    this.blockchain.difficulty = difficulty;
    return true;
  }

  /**
   * Set mining reward
   */
  setMiningReward(reward) {
    if (!this.initialized) throw new Error('API not initialized');
    
    if (reward <= 0) {
      throw new Error('Mining reward must be positive');
    }
    
    this.blockchain.miningReward = reward;
    return true;
  }

  /**
   * Add network node (simulation)
   */
  addNetworkNode(nodeId) {
    if (!this.initialized) throw new Error('API not initialized');
    this.blockchain.addNetworkNode(nodeId);
    return true;
  }

  /**
   * Remove network node (simulation)
   */
  removeNetworkNode(nodeId) {
    if (!this.initialized) throw new Error('API not initialized');
    this.blockchain.removeNetworkNode(nodeId);
    return true;
  }

  /**
   * Broadcast transaction (simulation)
   */
  async broadcastTransaction(transaction) {
    if (!this.initialized) await this.initialize();
    await this.blockchain.broadcastTransaction(transaction);
    return true;
  }
}

// Example usage
export async function quickStart() {
  console.log('🚀 TOPAY Blockchain API Quick Start\n');
  
  // Initialize API
  const api = new BlockchainAPI();
  await api.initialize();
  
  // Use predefined addresses (wallets should be created externally)
  console.log('👛 Using predefined demo addresses...');
  const address1 = 'TOPAYdemo1234567890abcdef1234567890abcdef12345678';
  const address2 = 'TOPAYdemo2234567890abcdef1234567890abcdef12345678';
  
  console.log(`Address 1: ${address1}`);
  console.log(`Address 2: ${address2}`);
  console.log('⚠️  Note: In production, wallets should be created using external wallet applications');
  
  // Send transaction (with placeholder signature)
  console.log('\n💸 Sending transaction...');
  const tx = await api.sendTransaction({
    from: address1,
    to: address2,
    amount: 50,
    memo: 'Test payment',
    signature: 'placeholder_signature',
    publicKey: 'placeholder_public_key'
  });
  console.log(`Transaction: ${tx.transactionId}`);
  
  // Mine block
  console.log('\n⛏️ Mining block...');
  const block = await api.mineBlock(address1);
  console.log(`Block #${block.blockIndex} mined with ${block.transactionCount} transactions`);
  
  // Check balances
  console.log('\n💰 Balances:');
  console.log(`Address 1: ${api.getBalance(address1)} TOPAY`);
  console.log(`Address 2: ${api.getBalance(address2)} TOPAY`);
  
  // Show stats
  console.log('\n📊 Blockchain Stats:');
  const stats = api.getStats();
  console.log(`Blocks: ${stats.blockCount}`);
  console.log(`Transactions: ${stats.totalTransactions}`);
  console.log(`Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
  
  return api;
}

// Auto-run quick start if executed directly
if (process.argv[1].endsWith('blockchain-api.js')) {
  quickStart().catch(console.error);
}