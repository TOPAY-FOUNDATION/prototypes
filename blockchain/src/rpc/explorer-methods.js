/**
 * TOPAY Foundation Blockchain Explorer RPC Methods
 * Standard blockchain API methods for block explorer functionality
 */

export class ExplorerMethods {
  constructor(blockchain) {
    this.blockchain = blockchain;
  }

  /**
   * Get block by number (index)
   * Standard method: eth_getBlockByNumber equivalent
   * @param {number|string} blockNumber - Block number or 'latest'
   * @param {boolean} fullTransactions - Whether to include full transaction objects
   * @returns {Object|null} Block object or null if not found
   */
  async getBlockByNumber(blockNumber, fullTransactions = false) {
    try {
      let index;
      
      if (blockNumber === 'latest') {
        index = this.blockchain.getChainLength() - 1;
      } else {
        index = parseInt(blockNumber);
        if (isNaN(index) || index < 0) {
          throw new Error('Invalid block number');
        }
      }

      const block = this.blockchain.getBlock(index);
      if (!block) {
        return null;
      }

      return this.formatBlockResponse(block, fullTransactions);
    } catch (error) {
      throw new Error(`Failed to get block by number: ${error.message}`);
    }
  }

  /**
   * Get block by hash
   * Standard method: eth_getBlockByHash equivalent
   * @param {string} blockHash - Block hash
   * @param {boolean} fullTransactions - Whether to include full transaction objects
   * @returns {Object|null} Block object or null if not found
   */
  async getBlockByHash(blockHash, fullTransactions = false) {
    try {
      if (!blockHash || typeof blockHash !== 'string') {
        throw new Error('Invalid block hash');
      }

      const block = this.blockchain.getBlockByHash(blockHash);
      if (!block) {
        return null;
      }

      return this.formatBlockResponse(block, fullTransactions);
    } catch (error) {
      throw new Error(`Failed to get block by hash: ${error.message}`);
    }
  }

  /**
   * Get transaction by hash
   * Standard method: eth_getTransactionByHash equivalent
   * @param {string} txHash - Transaction hash
   * @returns {Object|null} Transaction object or null if not found
   */
  async getTransactionByHash(txHash) {
    try {
      if (!txHash || typeof txHash !== 'string') {
        throw new Error('Invalid transaction hash');
      }

      const transaction = this.blockchain.getTransactionByHash(txHash);
      if (!transaction) {
        return null;
      }

      return this.formatTransactionResponse(transaction);
    } catch (error) {
      throw new Error(`Failed to get transaction by hash: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt
   * Standard method: eth_getTransactionReceipt equivalent
   * @param {string} txHash - Transaction hash
   * @returns {Object|null} Transaction receipt or null if not found
   */
  async getTransactionReceipt(txHash) {
    try {
      if (!txHash || typeof txHash !== 'string') {
        throw new Error('Invalid transaction hash');
      }

      const receipt = this.blockchain.getTransactionReceipt(txHash);
      if (!receipt) {
        return null;
      }

      return this.formatReceiptResponse(receipt);
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  /**
   * Get account balance
   * Standard method: eth_getBalance equivalent
   * @param {string} address - Account address
   * @param {string|number} blockNumber - Block number or 'latest'
   * @returns {string} Balance in wei (as hex string)
   */
  async getBalance(address, blockNumber = 'latest') {
    try {
      if (!address || typeof address !== 'string') {
        throw new Error('Invalid address');
      }

      const balance = this.blockchain.getBalance(address, blockNumber);
      return `0x${balance.toString(16)}`;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get transaction count for an address
   * Standard method: eth_getTransactionCount equivalent
   * @param {string} address - Account address
   * @param {string|number} blockNumber - Block number or 'latest'
   * @returns {string} Transaction count as hex string
   */
  async getTransactionCount(address, blockNumber = 'latest') {
    try {
      if (!address || typeof address !== 'string') {
        throw new Error('Invalid address');
      }

      const count = this.blockchain.getTransactionCount(address, blockNumber);
      return `0x${count.toString(16)}`;
    } catch (error) {
      throw new Error(`Failed to get transaction count: ${error.message}`);
    }
  }

  /**
   * Get code at address (for smart contracts)
   * Standard method: eth_getCode equivalent
   * @param {string} address - Contract address
   * @param {string|number} blockNumber - Block number or 'latest'
   * @returns {string} Contract code as hex string
   */
  async getCode(address, blockNumber = 'latest') {
    try {
      if (!address || typeof address !== 'string') {
        throw new Error('Invalid address');
      }

      const code = this.blockchain.getCode(address, blockNumber);
      return code || '0x';
    } catch (error) {
      throw new Error(`Failed to get code: ${error.message}`);
    }
  }

  /**
   * Get latest block number
   * Standard method: eth_blockNumber equivalent
   * @returns {string} Latest block number as hex string
   */
  async getBlockNumber() {
    try {
      const blockNumber = this.blockchain.getChainLength() - 1;
      return `0x${blockNumber.toString(16)}`;
    } catch (error) {
      throw new Error(`Failed to get block number: ${error.message}`);
    }
  }

  /**
   * Get network information
   * @returns {Object} Network information
   */
  async getNetworkInfo() {
    try {
      const stats = this.blockchain.getStats();
      const isValid = await this.blockchain.isChainValid();
      
      return {
        networkId: '0x1', // TOPAY mainnet
        chainId: '0x1',
        networkName: 'TOPAY Foundation Network',
        blockNumber: this.blockchain.getChainLength() - 1,
        difficulty: this.blockchain.difficulty,
        totalBlocks: stats.totalBlocks,
        totalTransactions: stats.totalTransactions || 0,
        chainValid: isValid,
        hashingAlgorithm: 'TOPAY-Z512',
        consensusAlgorithm: 'Proof of Work',
        blockTime: 10, // seconds
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }

  /**
   * Search blockchain data
   * @param {string} query - Search query (hash, address, or block number)
   * @returns {Object} Search results
   */
  async search(query) {
    try {
      if (!query || typeof query !== 'string') {
        throw new Error('Invalid search query');
      }

      const results = {
        query: query,
        blocks: [],
        transactions: [],
        addresses: []
      };

      // Check if query is a number (block number)
      if (/^\d+$/.test(query)) {
        const blockNumber = parseInt(query);
        const block = this.blockchain.getBlock(blockNumber);
        if (block) {
          results.blocks.push(this.formatBlockResponse(block, false));
        }
      }

      // Check if query looks like a hash (64+ hex characters)
      if (/^[0-9a-fA-F]{64,}$/.test(query)) {
        // Try as block hash
        const block = this.blockchain.getBlockByHash(query);
        if (block) {
          results.blocks.push(this.formatBlockResponse(block, false));
        }

        // Try as transaction hash
        const transaction = this.blockchain.getTransactionByHash(query);
        if (transaction) {
          results.transactions.push(this.formatTransactionResponse(transaction));
        }
      }

      // Check if query looks like an address
      if (query.length >= 20) {
        const addressInfo = this.blockchain.getAddressInfo(query);
        if (addressInfo) {
          results.addresses.push(addressInfo);
        }
      }

      return {
        ...results,
        totalResults: results.blocks.length + results.transactions.length + results.addresses.length
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get recent blocks
   * @param {number} limit - Number of recent blocks to return
   * @returns {Array} Array of recent blocks
   */
  async getRecentBlocks(limit = 10) {
    try {
      const chainLength = this.blockchain.getChainLength();
      const startIndex = Math.max(0, chainLength - limit);
      const blocks = [];

      for (let i = chainLength - 1; i >= startIndex; i--) {
        const block = this.blockchain.getBlock(i);
        if (block) {
          blocks.push(this.formatBlockResponse(block, false));
        }
      }

      return blocks;
    } catch (error) {
      throw new Error(`Failed to get recent blocks: ${error.message}`);
    }
  }

  /**
   * Get recent transactions
   * @param {number} limit - Number of recent transactions to return
   * @returns {Array} Array of recent transactions
   */
  async getRecentTransactions(limit = 10) {
    try {
      const transactions = this.blockchain.getRecentTransactions(limit);
      return transactions.map(tx => this.formatTransactionResponse(tx));
    } catch (error) {
      throw new Error(`Failed to get recent transactions: ${error.message}`);
    }
  }

  /**
   * Format block response for API
   * @param {Block} block - Block object
   * @param {boolean} fullTransactions - Whether to include full transaction objects
   * @returns {Object} Formatted block response
   */
  formatBlockResponse(block, fullTransactions = false) {
    const blockData = block.toJSON ? block.toJSON() : block;
    
    return {
      number: `0x${blockData.index.toString(16)}`,
      hash: blockData.hash,
      parentHash: blockData.previousHash,
      nonce: `0x${blockData.nonce.toString(16)}`,
      timestamp: `0x${blockData.timestamp.toString(16)}`,
      difficulty: `0x${this.blockchain.difficulty.toString(16)}`,
      size: JSON.stringify(blockData).length,
      gasLimit: '0x1c9c380', // 30M gas limit
      gasUsed: '0x0', // Simplified - no gas tracking yet
      miner: this.blockchain.genesisWalletAddress || '0x0000000000000000000000000000000000000000',
      transactions: fullTransactions ? this.getBlockTransactions(blockData) : this.getBlockTransactionHashes(blockData),
      transactionsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      stateRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      receiptsRoot: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
  }

  /**
   * Format transaction response for API
   * @param {Object} transaction - Transaction object
   * @returns {Object} Formatted transaction response
   */
  formatTransactionResponse(transaction) {
    return {
      hash: transaction.hash,
      blockNumber: `0x${transaction.blockNumber.toString(16)}`,
      blockHash: transaction.blockHash,
      transactionIndex: `0x${transaction.transactionIndex.toString(16)}`,
      from: transaction.from,
      to: transaction.to,
      value: `0x${transaction.value.toString(16)}`,
      gas: `0x${transaction.gas.toString(16)}`,
      gasPrice: `0x${transaction.gasPrice.toString(16)}`,
      input: transaction.input || '0x',
      nonce: `0x${transaction.nonce.toString(16)}`,
      v: transaction.v || '0x1c',
      r: transaction.r || '0x0',
      s: transaction.s || '0x0'
    };
  }

  /**
   * Format transaction receipt response for API
   * @param {Object} receipt - Transaction receipt object
   * @returns {Object} Formatted receipt response
   */
  formatReceiptResponse(receipt) {
    return {
      transactionHash: receipt.transactionHash,
      transactionIndex: `0x${receipt.transactionIndex.toString(16)}`,
      blockNumber: `0x${receipt.blockNumber.toString(16)}`,
      blockHash: receipt.blockHash,
      cumulativeGasUsed: `0x${receipt.cumulativeGasUsed.toString(16)}`,
      gasUsed: `0x${receipt.gasUsed.toString(16)}`,
      contractAddress: receipt.contractAddress || null,
      logs: receipt.logs || [],
      logsBloom: receipt.logsBloom || '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      status: receipt.status ? '0x1' : '0x0'
    };
  }

  /**
   * Get block transactions (simplified)
   * @param {Object} blockData - Block data
   * @returns {Array} Array of transactions
   */
  getBlockTransactions(blockData) {
    // Simplified - extract transactions from block data
    if (blockData.data && Array.isArray(blockData.data)) {
      return blockData.data.map((tx, index) => ({
        hash: `0x${this.generateTxHash(blockData.hash, index)}`,
        blockNumber: blockData.index,
        blockHash: blockData.hash,
        transactionIndex: index,
        from: tx.from || '0x0000000000000000000000000000000000000000',
        to: tx.to || '0x0000000000000000000000000000000000000000',
        value: tx.value || 0,
        gas: tx.gas || 21000,
        gasPrice: tx.gasPrice || 1000000000,
        input: tx.input || '0x',
        nonce: tx.nonce || 0
      }));
    }
    return [];
  }

  /**
   * Get block transaction hashes (simplified)
   * @param {Object} blockData - Block data
   * @returns {Array} Array of transaction hashes
   */
  getBlockTransactionHashes(blockData) {
    if (blockData.data && Array.isArray(blockData.data)) {
      return blockData.data.map((tx, index) => 
        `0x${this.generateTxHash(blockData.hash, index)}`
      );
    }
    return [];
  }

  /**
   * Generate transaction hash (simplified)
   * @param {string} blockHash - Block hash
   * @param {number} index - Transaction index
   * @returns {string} Transaction hash
   */
  generateTxHash(blockHash, index) {
    // Simplified transaction hash generation
    const combined = blockHash + index.toString().padStart(8, '0');
    return combined.substring(0, 64);
  }
}