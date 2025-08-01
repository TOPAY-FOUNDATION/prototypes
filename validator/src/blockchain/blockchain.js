/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Main Blockchain Class
 * 
 * Implements the core blockchain with quantum-safe features
 */

import { computeHash, fragmentData, reconstructData } from '@topayfoundation/topayz512';
import { Block } from './block.js';
import { Transaction } from './transaction.js';

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.mempool = []; // Transaction pool
    this.validators = new Set(); // For future PoS
    this.networkNodes = new Set(); // For network simulation
    this.fragmentedBlocks = new Map(); // For mobile optimization
  }

  /**
   * Create the genesis block
   */
  createGenesisBlock() {
    const genesisBlock = new Block(Date.now(), [], '0');
    genesisBlock.index = 0;
    genesisBlock.hash = '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    genesisBlock.merkleRoot = '0'.repeat(128);
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

    // Skip balance check for mining reward transactions (from: null)
    if (transaction.from !== null) {
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
   * Mine pending transactions
   */
  async minePendingTransactions(miningRewardAddress) {
    console.log('\n🚀 Starting mining process...');
    
    // Select transactions from mempool
    const transactionsToMine = this.mempool.splice(0, 10); // Take up to 10 transactions
    
    // Add mining reward transaction
    const rewardTransaction = new Transaction(null, miningRewardAddress, this.miningReward);
    await rewardTransaction.signTransaction('system');
    transactionsToMine.push(rewardTransaction);

    // Create new block
    const block = new Block(Date.now(), transactionsToMine, this.getLatestBlock().hash);
    block.index = this.chain.length;
    block.difficulty = this.difficulty;

    // Mine the block
    await block.mineBlock(this.difficulty);

    // Add to chain
    this.chain.push(block);

    console.log(`✅ Block #${block.index} mined and added to chain!`);
    console.log(`   Transactions: ${block.transactions.length}`);
    console.log(`   Block size: ${block.getSize()} bytes`);

    // Fragment large blocks for mobile optimization
    if (block.getSize() > 2048) {
      await this.fragmentBlock(block);
    }

    // Adjust difficulty
    this.adjustDifficulty();

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
   * Adjust mining difficulty based on block time
   */
  adjustDifficulty() {
    if (this.chain.length < 2) return;

    const lastBlock = this.getLatestBlock();
    const previousBlock = this.chain[this.chain.length - 2];
    const timeDiff = (lastBlock.timestamp - previousBlock.timestamp) / 1000; // seconds

    const targetTime = 10; // Target 10 seconds per block

    if (timeDiff < targetTime / 2) {
      this.difficulty++;
      console.log(`⬆️ Difficulty increased to ${this.difficulty}`);
    } else if (timeDiff > targetTime * 2 && this.difficulty > 1) {
      this.difficulty--;
      console.log(`⬇️ Difficulty decreased to ${this.difficulty}`);
    }
  }

  /**
   * Get balance for an address
   */
  getBalance(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address) {
          balance -= transaction.amount;
        }
        if (transaction.to === address) {
          balance += transaction.amount;
        }
      }
    }

    return balance;
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
      difficulty: this.difficulty,
      miningReward: this.miningReward,
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
}

export { Blockchain };