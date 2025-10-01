/**
 * TOPAY Foundation Simple Blockchain
 * Basic blockchain implementation with 512-bit hashing using TOPAY-Z512
 */

import { Block } from './block.js';
import { BlockchainCache } from '../cache/BlockchainCache.js';
import { TokenManager } from '../contracts/TokenManager.js';

export class Blockchain {
  constructor() {
    this.cache = new BlockchainCache();
    this.difficulty = 2; // Mining difficulty (number of leading zeros required)
    this.tokenManager = new TokenManager(); // Token management system
    
    // Try to load from cache first
    this.loadFromCache();
    
    // Start auto-save every 30 seconds
    this.cache.startAutoSave(() => ({
      chain: this.chain,
      difficulty: this.difficulty,
      tokens: this.tokenManager.toJSON()
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
      
      // Load token data if available
      if (cachedData.tokens) {
        this.tokenManager.fromJSON(cachedData.tokens);
      }
      
      // Check if this is a genesis block and set genesis wallet info
      if (this.chain.length > 0 && this.chain[0].data && typeof this.chain[0].data === 'object') {
        const genesisData = this.chain[0].data;
        if (genesisData.type === 'GENESIS_BLOCK' && genesisData.genesisWallet) {
          this.genesisWalletAddress = genesisData.genesisWallet.address;
          // Find the native token ID
          for (const [tokenId, token] of this.tokenManager.tokens) {
            if (token.symbol === 'TPY' && token.name === 'TOPAY') {
              this.nativeTokenId = tokenId;
              break;
            }
          }
          console.log(`🏛️ Genesis wallet restored: ${this.genesisWalletAddress}`);
          console.log(`💰 Native token restored: ${this.nativeTokenId}`);
        }
      }
      
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
    this.cache.saveBlockchain(this.chain, this.difficulty, this.tokenManager.toJSON());
  }

  /**
   * Create the genesis block with genesis wallet and native token
   * @returns {Block} Genesis block
   */
  createGenesisBlock() {
    // Genesis wallet address
    const genesisWalletAddress = 'TOPAY_GENESIS_WALLET_000000000000';
    
    // Create genesis data with wallet and native token
    const genesisData = {
      type: 'GENESIS_BLOCK',
      genesisWallet: {
        address: genesisWalletAddress,
        publicKey: 'genesis_public_key_000000000000000000000000000000000000000000000000000000000000000',
        label: 'TOPAY Genesis Wallet'
      },
      nativeToken: {
        name: 'TOPAY',
        symbol: 'TPY',
        totalSupply: 1000000, // 1M TOPAY tokens
        owner: genesisWalletAddress,
        tokenId: 'TOPAY_NATIVE_TOKEN'
      },
      timestamp: Date.now(),
      message: 'TOPAY Blockchain Genesis Block - Native Token Created'
    };

    // Create genesis token in token manager
    const genesisTokenId = this.tokenManager.createToken(
      'TOPAY',
      'TPY', 
      1000000,
      genesisWalletAddress
    );

    // Store genesis wallet address and native token ID for future reference
    this.genesisWalletAddress = genesisWalletAddress;
    this.nativeTokenId = genesisTokenId;

    // Update genesis data with actual token ID
    genesisData.nativeToken.tokenId = genesisTokenId;

    const genesisBlock = new Block(0, Date.now(), genesisData, '0');
    genesisBlock.hash = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    
    console.log(`🏛️ Genesis block created with genesis wallet: ${genesisWalletAddress}`);
    console.log(`💰 Native token TOPAY (TPY) created with 1M supply in genesis wallet`);
    
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
   * Distribute native tokens from genesis wallet to a new wallet
   * @param {string} toAddress - Address of the new wallet
   * @param {number} amount - Amount of tokens to distribute (default: 1000)
   * @returns {Object} Distribution result
   */
  async distributeGenesisTokens(toAddress, amount = 1000) {
    try {
      if (!this.genesisWalletAddress || !this.nativeTokenId) {
        throw new Error('Genesis wallet or native token not initialized');
      }

      // Check if genesis wallet has enough tokens
      const genesisBalance = this.tokenManager.getBalance(this.nativeTokenId, this.genesisWalletAddress);
      if (genesisBalance < amount) {
        throw new Error(`Insufficient tokens in genesis wallet. Available: ${genesisBalance}, Requested: ${amount}`);
      }

      // Create transfer transaction from genesis wallet to new wallet
      const transferTransaction = {
        type: 'TRANSFER_TOKEN',
        from: this.genesisWalletAddress,
        to: toAddress,
        tokenId: this.nativeTokenId,
        amount: amount,
        timestamp: Date.now()
      };

      // Process the token transfer
      const result = await this.addTokenTransaction(transferTransaction);
      
      if (result.success) {
        console.log(`💸 Distributed ${amount} TPY tokens from genesis wallet to ${toAddress}`);
        return {
          success: true,
          amount: amount,
          tokenId: this.nativeTokenId,
          symbol: 'TPY',
          transaction: result.transaction,
          block: result.block
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to distribute genesis tokens:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add a token transaction to the blockchain
   * @param {Object} transaction - Token transaction data
   * @returns {Object} Transaction result with block information
   */
  async addTokenTransaction(transaction) {
    try {
      // Process the transaction through token manager
      const result = this.tokenManager.processTransaction(transaction);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Add transaction to blockchain
      const transactionData = {
        type: 'TOKEN_TRANSACTION',
        transaction: transaction,
        result: result,
        timestamp: Date.now()
      };

      const block = await this.addBlock(transactionData);
      
      return {
        success: true,
        block: block.toJSON(),
        transaction: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
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
    const totalTokens = this.tokenManager.getAllTokens().length;
    
    return {
      totalBlocks,
      difficulty: this.difficulty,
      latestBlockIndex: latestBlock.index,
      latestBlockHash: latestBlock.hash.substring(0, 20) + '...',
      latestBlockTimestamp: new Date(latestBlock.timestamp).toISOString(),
      totalTokens,
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
    this.tokenManager = new TokenManager(); // Reset token manager
    this.saveToCache(); // Save reset state
    console.log('🔄 Blockchain reset to genesis block');
  }

  /**
   * Get token information
   * @param {string} tokenId - Token ID (optional)
   * @returns {Object|Array} Token info or all tokens
   */
  getTokenInfo(tokenId = null) {
    if (tokenId) {
      const token = this.tokenManager.getToken(tokenId);
      return token ? { tokenId, ...token.getTokenInfo() } : null;
    }
    return this.tokenManager.getAllTokens();
  }

  /**
   * Get token balance for an address
   * @param {string} tokenId - Token ID
   * @param {string} address - Address to check
   * @returns {number} Balance amount
   */
  getTokenBalance(tokenId, address) {
    return this.tokenManager.getBalance(tokenId, address);
  }

  /**
   * Get all token balances for an address
   * @param {string} address - Address to check
   * @returns {Array} Array of token balances
   */
  getAllTokenBalances(address) {
    return this.tokenManager.getAllBalancesForAddress(address);
  }
}