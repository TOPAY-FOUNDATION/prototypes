/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Main Blockchain Class
 * 
 * Implements the core blockchain with quantum-safe features
 */

import { computeHash, fragmentData, reconstructData } from '@topayfoundation/topayz512';
import { Block } from './block.js';
import { Transaction } from './transaction.js';
import { GovernanceSystems } from './governance-systems.js';
import { WalletManager } from '../wallet/WalletManager.js';

export class Blockchain {
  constructor(options = {}) {
    // Genesis wallet configuration
    this.genesisBalance = options.genesisBalance || 1000000;
    this.genesisWalletAddress = options.genesisWalletAddress || null;
    
    // Initialize wallet manager
    this.walletManager = new WalletManager({
      dataPath: options.walletDataPath || './data/wallets',
      autoCreateGenesis: options.autoCreateGenesis !== false,
      genesisBalance: this.genesisBalance
    });
    
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.mempool = []; // Transaction pool
    this.validators = new Set(); // For future PoS
    this.networkNodes = new Set(); // For network simulation
    this.fragmentedBlocks = new Map(); // For mobile optimization
    
    // Initialize governance systems
    this.governance = new GovernanceSystems(this);
    
    // Initialize genesis wallet system
    this.initializeGenesisWallet();
  }

  /**
   * Initialize genesis wallet system
   */
  async initializeGenesisWallet() {
    try {
      await this.walletManager.initialize();
      
      const genesisWallet = this.walletManager.getGenesisWallet();
      if (genesisWallet) {
        this.genesisWalletAddress = genesisWallet.address;
        console.log(`👑 Genesis wallet initialized: ${this.genesisWalletAddress}`);
        console.log(`💰 Genesis balance: ${this.genesisBalance} TOPAY`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize genesis wallet:', error.message);
    }
  }

  /**
   * Create the genesis block with pre-allocated funds
   */
  createGenesisBlock() {
    const genesisTransactions = [];
    
    // Create genesis funding transaction if genesis wallet exists
    if (this.genesisWalletAddress && this.genesisBalance > 0) {
      const genesisTransaction = new Transaction(
        'GENESIS', // Special genesis sender
        this.genesisWalletAddress,
        this.genesisBalance,
        'Genesis block pre-allocation'
      );
      
      // Set special genesis transaction properties
      genesisTransaction.timestamp = Date.now();
      genesisTransaction.signature = 'GENESIS_SIGNATURE';
      genesisTransaction.id = computeHash(`GENESIS${this.genesisWalletAddress}${this.genesisBalance}`);
      
      genesisTransactions.push(genesisTransaction);
      
      console.log(`🎯 Genesis block will pre-allocate ${this.genesisBalance} TOPAY to ${this.genesisWalletAddress}`);
    }
    
    const genesisBlock = new Block(Date.now(), genesisTransactions, '0');
    genesisBlock.index = 0;
    genesisBlock.hash = '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    genesisBlock.merkleRoot = genesisTransactions.length > 0 ? 
      computeHash(JSON.stringify(genesisTransactions)) : 
      '0'.repeat(128);
    
    console.log(`🏗️ Genesis block created with ${genesisTransactions.length} pre-allocation transactions`);
    return genesisBlock;
  }

  /**
   * Get the latest block
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add transaction to mempool
   */
  async addTransaction(transaction) {
    // Validate transaction
    if (!(await transaction.isValid())) {
      throw new Error('Invalid transaction');
    }

    // Skip balance check for mining reward transactions (from: null) and system transactions
    if (transaction.from !== null && transaction.from !== 'SYSTEM') {
      // Check if sender has sufficient balance (simplified)
      const senderBalance = this.getBalance(transaction.from);
      if (senderBalance < transaction.amount) {
        throw new Error('Insufficient balance');
      }
    }

    this.mempool.push(transaction);
    console.log(`📝 Transaction added to mempool: ${transaction.amount} TOPAY from ${transaction.from ? transaction.from.substring(0, 10) + '...' : 'SYSTEM'} to ${transaction.to.substring(0, 10)}...`);
  }

  /**
   * Process pending transactions into a new block
   */
  async processPendingTransactions() {
    console.log('\n🚀 Processing pending transactions...');
    
    // Select transactions from mempool
    const transactionsToProcess = this.mempool.splice(0, 10); // Take up to 10 transactions
    
    if (transactionsToProcess.length === 0) {
      console.log('⚠️ No transactions to process');
      return null;
    }

    // Create new block
    const block = new Block(Date.now(), transactionsToProcess, this.getLatestBlock().hash);
    block.index = this.chain.length;

    // Add to chain
    this.chain.push(block);

    console.log(`✅ Block #${block.index} processed and added to chain!`);
    console.log(`   Transactions: ${block.transactions.length}`);
    console.log(`   Block size: ${block.getSize()} bytes`);

    // Fragment large blocks for mobile optimization
    if (block.getSize() > 2048) {
      await this.fragmentBlock(block);
    }

    return block;
  }

  /**
   * Fragment block for mobile optimization
   */
  async fragmentBlock(block) {
    console.log(`📦 Fragmenting block #${block.index} for mobile optimization...`);
    
    const fragmentResult = await block.fragmentBlock();
    
    if (fragmentResult.isFragmented) {
      this.fragmentedBlocks.set(block.index, fragmentResult);
      console.log(`   Block fragmented into ${fragmentResult.fragments.length} pieces`);
    }
  }

  /**
   * Reconstruct block from fragments
   */
  async reconstructBlock(blockIndex) {
    const fragmentData = this.fragmentedBlocks.get(blockIndex);
    
    if (!fragmentData || !fragmentData.isFragmented) {
      return this.chain[blockIndex]; // Return original block if not fragmented
    }

    console.log(`🔧 Reconstructing block #${blockIndex} from fragments...`);
    
    try {
      const reconstructedBlock = await Block.reconstructFromFragments(fragmentData.fragments);
      return reconstructedBlock;
    } catch (error) {
      console.error(`❌ Failed to reconstruct block #${blockIndex}:`, error);
      throw error;
    }
  }



  /**
   * Get balance for address (including genesis pre-allocation)
   */
  getBalance(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // Handle genesis transactions (from 'GENESIS')
        if (transaction.from === 'GENESIS' && transaction.to === address) {
          balance += transaction.amount;
        }
        // Handle regular transactions
        else if (transaction.from === address) {
          balance -= transaction.amount;
        }
        else if (transaction.to === address) {
          balance += transaction.amount;
        }
      }
    }

    return balance;
  }
  
  /**
   * Get wallet manager instance
   */
  getWalletManager() {
    return this.walletManager;
  }
  
  /**
   * Get genesis wallet
   */
  getGenesisWallet() {
    return this.walletManager.getGenesisWallet();
  }
  
  /**
   * Create a new wallet
   */
  async createWallet(options = {}) {
    return await this.walletManager.createWallet(options);
  }
  
  /**
   * Get wallet by address
   */
  getWallet(address) {
    return this.walletManager.getWallet(address);
  }
  
  /**
   * Fund wallet from genesis
   */
  async fundWalletFromGenesis(targetAddress, amount) {
    const transaction = await this.walletManager.fundWalletFromGenesis(targetAddress, amount);
    await this.addTransaction(transaction);
    return transaction;
  }
  
  /**
   * Get all wallet balances
   */
  getWalletBalances() {
    return this.walletManager.getWalletBalances(this);
  }

  /**
   * Get transaction history for an address
   */
  getTransactionHistory(address) {
    const transactions = [];

    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address || transaction.to === address) {
          transactions.push({
            ...transaction.toJSON(),
            blockIndex: block.index,
            blockTimestamp: block.timestamp,
            blockHash: block.hash
          });
        }
      }
    }

    return transactions.sort((a, b) => b.blockTimestamp - a.blockTimestamp);
  }

  /**
   * Validate the entire blockchain
   */
  async isChainValid() {
    console.log('🔍 Validating blockchain...');

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Validate current block
      if (!(await currentBlock.isValid())) {
        console.log(`❌ Block #${i} is invalid`);
        return false;
      }

      // Check if previous hash matches
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log(`❌ Block #${i} has invalid previous hash`);
        return false;
      }
    }

    console.log('✅ Blockchain is valid!');
    return true;
  }

  /**
   * Get blockchain statistics
   */
  getStats() {
    const totalTransactions = this.chain.reduce((total, block) => total + block.transactions.length, 0);
    const totalSize = this.chain.reduce((total, block) => total + block.getSize(), 0);
    const fragmentedBlockCount = this.fragmentedBlocks.size;
    
    // Safely get latest block hash
    const latestBlock = this.getLatestBlock();
    const latestBlockHash = latestBlock && latestBlock.hash ? latestBlock.hash : 'N/A';

    return {
      blockCount: this.chain.length,
      totalTransactions,
      totalSize,
      averageBlockSize: this.chain.length > 0 ? Math.round(totalSize / this.chain.length) : 0,
      mempoolSize: this.mempool.length,
      fragmentedBlocks: fragmentedBlockCount,
      networkNodes: this.networkNodes.size,
      latestBlockHash: latestBlockHash,
      chainValid: null // Will be set by validation
    };
  }

  /**
   * Simulate network node
   */
  addNetworkNode(nodeId) {
    this.networkNodes.add(nodeId);
    console.log(`🌐 Network node added: ${nodeId}`);
  }

  /**
   * Remove network node
   */
  removeNetworkNode(nodeId) {
    this.networkNodes.delete(nodeId);
    console.log(`🌐 Network node removed: ${nodeId}`);
  }

  /**
   * Broadcast transaction to network (simulation)
   */
  async broadcastTransaction(transaction) {
    console.log(`📡 Broadcasting transaction to ${this.networkNodes.size} nodes...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add to mempool
    await this.addTransaction(transaction);
    
    console.log('✅ Transaction broadcasted successfully');
  }

  /**
   * Get mempool transactions
   */
  getMempoolTransactions() {
    return this.mempool.map(tx => tx.toJSON());
  }

  /**
   * Clear mempool
   */
  clearMempool() {
    this.mempool = [];
    console.log('🗑️ Mempool cleared');
  }

  /**
   * Export blockchain data
   */
  exportChain() {
    return {
      chain: this.chain.map(block => block.toJSON()),
      mempool: this.mempool.map(tx => tx.toJSON()),
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      stats: this.getStats(),
      exportedAt: Date.now()
    };
  }

  /**
   * Import blockchain data
   */
  importChain(chainData) {
    console.log('📥 Importing blockchain data...');
    
    try {
      // Import blocks and reconstruct them as Block objects
      this.chain = chainData.chain.map(blockData => Block.fromJSON(blockData));
      this.difficulty = chainData.difficulty || 2;
      this.miningReward = chainData.miningReward || 100;
      
      // Import mempool if it exists and reconstruct Transaction objects
      if (chainData.mempool && Array.isArray(chainData.mempool)) {
        this.mempool = chainData.mempool.map(txData => Transaction.fromJSON(txData));
      } else {
        this.mempool = [];
      }
      
      console.log(`✅ Imported ${this.chain.length} blocks and ${this.mempool.length} mempool transactions`);
    } catch (error) {
      console.error('❌ Failed to import blockchain:', error);
      throw error;
    }
  }

  /**
   * Get block by index
   */
  getBlock(index) {
    return this.chain[index] || null;
  }

  /**
   * Get block by hash
   */
  getBlockByHash(hash) {
    return this.chain.find(block => block.hash === hash) || null;
  }

  /**
   * Search transactions by criteria
   */
  searchTransactions(criteria) {
    const results = [];
    
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        let matches = true;
        
        if (criteria.from && transaction.from !== criteria.from) matches = false;
        if (criteria.to && transaction.to !== criteria.to) matches = false;
        if (criteria.minAmount && transaction.amount < criteria.minAmount) matches = false;
        if (criteria.maxAmount && transaction.amount > criteria.maxAmount) matches = false;
        
        if (matches) {
          results.push({
            ...transaction.toJSON(),
            blockIndex: block.index,
            blockHash: block.hash
          });
        }
      }
    }
    
    return results;
  }

  // ==================== GOVERNANCE SYSTEM METHODS ====================

  /**
   * Request transaction reversal
   */
  async requestTransactionReversal(transactionId, requesterAddress, reason, evidence = null) {
    return await this.governance.requestTransactionReversal(transactionId, requesterAddress, reason, evidence);
  }

  /**
   * Approve transaction reversal
   */
  async approveTransactionReversal(transactionId, approverAddress) {
    return await this.governance.approveTransactionReversal(transactionId, approverAddress);
  }

  /**
   * Register voter for governance
   */
  async registerVoter(voterAddress) {
    return await this.governance.registerVoter(voterAddress);
  }

  /**
   * Create governance proposal
   */
  async createProposal(proposerAddress, title, description, options, votingPeriod) {
    return await this.governance.createProposal(proposerAddress, title, description, options, votingPeriod);
  }

  /**
   * Cast vote on proposal
   */
  async castVote(proposalId, voterAddress, optionId, weight = 1) {
    return await this.governance.castVote(proposalId, voterAddress, optionId, weight);
  }

  /**
   * Submit report for suspicious activity
   */
  async submitReport(reporterAddress, targetType, targetId, category, description, evidence = null) {
    return await this.governance.submitReport(reporterAddress, targetType, targetId, category, description, evidence);
  }

  /**
   * Moderate submitted report
   */
  async moderateReport(reportId, moderatorAddress, action, notes = '') {
    return await this.governance.moderateReport(reportId, moderatorAddress, action, notes);
  }

  /**
   * Check if address is blacklisted
   */
  isAddressBlacklisted(address) {
    return this.governance.isAddressBlacklisted(address);
  }

  /**
   * Check if transaction is flagged
   */
  isTransactionFlagged(transactionId) {
    return this.governance.isTransactionFlagged(transactionId);
  }

  /**
   * Get governance statistics
   */
  getGovernanceStats() {
    return {
      reversals: this.governance.getReversalStats(),
      voting: this.governance.getVotingStats(),
      reports: this.governance.getReportStats()
    };
  }

  /**
   * Get pending governance items
   */
  getPendingGovernanceItems() {
    return {
      reversals: this.governance.getPendingReversals(),
      proposals: this.governance.getActiveProposals()
    };
  }
}