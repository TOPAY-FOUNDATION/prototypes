/**
 * TOPAY Foundation Simple Blockchain
 * Basic blockchain implementation with 512-bit hashing using TOPAY-Z512
 */

import { Block } from './block.js';
import { BlockchainCache } from '../cache/BlockchainCache.js';

export class Blockchain {
  constructor() {
    this.cache = new BlockchainCache();
    this.difficulty = 2; // Mining difficulty (number of leading zeros required)
    
    // Try to load from cache first
    this.loadFromCache();
    
    // Start auto-save every 30 seconds
    this.cache.startAutoSave(() => ({
      chain: this.chain,
      difficulty: this.difficulty
    }), 30000);
  }

  /**
   * Load blockchain from cache or create genesis block
   */
  loadFromCache() {
    const cachedData = this.cache.loadBlockchain();
    
    if (cachedData && cachedData.chain && cachedData.chain.length > 0) {
      // Reconstruct blocks from cached data
      this.chain = cachedData.chain.map(blockData => {
        const block = new Block(
          blockData.index,
          blockData.timestamp,
          blockData.data,
          blockData.previousHash
        );
        block.hash = blockData.hash;
        block.nonce = blockData.nonce;
        return block;
      });
      
      this.difficulty = cachedData.difficulty || 2;
      console.log(`🔄 Restored blockchain from cache: ${this.chain.length} blocks`);
    } else {
      // Create fresh blockchain with genesis block
      this.chain = [this.createGenesisBlock()];
      console.log('🆕 Created new blockchain with genesis block');
      
      // Save initial state to cache
      this.saveToCache();
    }
  }

  /**
   * Save current blockchain state to cache
   */
  saveToCache() {
    this.cache.saveBlockchain(this.chain, this.difficulty);
  }

  /**
   * Create the genesis block
   * @returns {Block} Genesis block
   */
  createGenesisBlock() {
    const genesisBlock = new Block(0, Date.now(), 'Genesis Block', '0');
    genesisBlock.hash = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    return genesisBlock;
  }

  /**
   * Get the latest block in the chain
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a new block to the blockchain
   * @param {*} data - Data to store in the block
   * @returns {Block} The newly added block
   */
  async addBlock(data) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(
      previousBlock.index + 1,
      Date.now(),
      data,
      previousBlock.hash
    );

    // Mine the block
    await newBlock.mineBlock(this.difficulty);
    
    // Add to chain
    this.chain.push(newBlock);
    
    // Save to cache
    this.saveToCache();
    
    console.log(`⛏️  Block ${newBlock.index} mined and added to blockchain`);
    return newBlock;
  }

  /**
   * Validate the entire blockchain
   */
  async isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check if current block is valid
      if (!(await currentBlock.isValid())) {
        console.log(`❌ Block ${i} is invalid`);
        return false;
      }

      // Check if current block points to previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log(`❌ Block ${i} has invalid previous hash`);
        return false;
      }
    }

    console.log('✅ Blockchain is valid');
    return true;
  }

  /**
   * Get blockchain statistics
   */
  getStats() {
    const totalBlocks = this.chain.length;
    const latestBlock = this.getLatestBlock();
    
    return {
      totalBlocks,
      difficulty: this.difficulty,
      latestBlockIndex: latestBlock.index,
      latestBlockHash: latestBlock.hash.substring(0, 20) + '...',
      latestBlockTimestamp: new Date(latestBlock.timestamp).toISOString(),
      chainValid: null // Will be set when validation is called
    };
  }

  /**
   * Get a specific block by index
   */
  getBlock(index) {
    if (index >= 0 && index < this.chain.length) {
      return this.chain[index];
    }
    return null;
  }

  /**
   * Get all blocks
   */
  getAllBlocks() {
    return this.chain.map(block => block.toJSON());
  }

  /**
   * Search for blocks containing specific data
   */
  searchBlocks(searchTerm) {
    return this.chain.filter(block => 
      JSON.stringify(block.data).toLowerCase().includes(searchTerm.toLowerCase())
    ).map(block => block.toJSON());
  }

  /**
   * Export blockchain to JSON
   */
  exportChain() {
    return {
      chain: this.chain.map(block => block.toJSON()),
      difficulty: this.difficulty,
      exportTimestamp: Date.now()
    };
  }

  /**
   * Import blockchain from external data
   * @param {Object} chainData - Blockchain data to import
   * @returns {boolean} Success status
   */
  async importChain(chainData) {
    try {
      if (!chainData || !chainData.chain || !Array.isArray(chainData.chain)) {
        return false;
      }

      // Reconstruct blocks from imported data
      const importedChain = chainData.chain.map(blockData => {
        const block = new Block(
          blockData.index,
          blockData.timestamp,
          blockData.data,
          blockData.previousHash
        );
        block.hash = blockData.hash;
        block.nonce = blockData.nonce;
        return block;
      });

      // Validate imported chain
      const tempBlockchain = new Blockchain();
      tempBlockchain.chain = importedChain;
      
      if (await tempBlockchain.isChainValid()) {
        this.chain = importedChain;
        this.difficulty = chainData.difficulty || 2;
        this.saveToCache(); // Save imported data
        console.log(`📥 Blockchain imported: ${this.chain.length} blocks`);
        return true;
      } else {
        console.log('❌ Invalid blockchain data - import rejected');
        return false;
      }
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      return false;
    }
  }

  /**
   * Set mining difficulty
   * @param {number} difficulty - New difficulty level
   */
  setDifficulty(difficulty) {
    if (difficulty >= 1 && difficulty <= 6) {
      this.difficulty = difficulty;
      this.saveToCache(); // Save updated difficulty
      console.log(`⚙️ Mining difficulty set to ${difficulty}`);
    } else {
      console.log('❌ Difficulty must be between 1 and 6');
    }
  }

  /**
   * Get chain length
   */
  getChainLength() {
    return this.chain.length;
  }

  /**
   * Clear the blockchain (reset to genesis)
   */
  reset() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.saveToCache(); // Save reset state
    console.log('🔄 Blockchain reset to genesis block');
  }
}