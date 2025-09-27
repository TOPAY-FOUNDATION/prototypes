/**
 * Browser-compatible Blockchain Client
 * Handles communication with the TOPAY blockchain using new /topay API endpoints
 */

import { config } from './config.js';

class BlockchainClient {
  constructor(baseUrl = config.blockchain.baseUrl) {
    this.baseUrl = baseUrl;
    this.apiUrl = `${baseUrl}/topay`;
    this.healthUrl = `${baseUrl}/health`;
    this.requestId = 1;
    this.retryAttempts = config.blockchain.retryAttempts;
    this.retryDelay = config.blockchain.retryDelay;
    this.timeout = config.blockchain.timeout;
  }

  /**
   * Make HTTP request with retry logic and timeout
   */
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const requestOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;
        console.warn(`Request attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    clearTimeout(timeoutId);
    throw lastError;
  }

  /**
   * Check server health and connectivity
   */
  async isServerRunning() {
    try {
      const response = await this.makeRequest(this.healthUrl);
      return response && (response.status === 'healthy' || response.message === 'Server is running');
    } catch (error) {
      console.warn('Health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get blockchain statistics
   */
  async getBlockchainInfo() {
    try {
      const response = await this.makeRequest(`${this.apiUrl}/stats`);
      return {
        chainId: 1337,
        networkName: 'TOPAY Blockchain',
        blockHeight: response.totalBlocks || 0,
        difficulty: response.difficulty || 1,
        latestBlockHash: response.latestBlockHash || null,
        latestBlockTimestamp: response.latestBlockTimestamp || null,
        chainValid: response.chainValid || false,
        peers: Math.floor(Math.random() * 10) + 5 // Mock peer count
      };
    } catch (error) {
      console.error('Failed to get blockchain info:', error);
      // Return mock data for development
      return {
        chainId: 1337,
        networkName: 'TOPAY Testnet',
        blockHeight: Math.floor(Math.random() * 1000000) + 500000,
        peers: Math.floor(Math.random() * 10) + 5,
        mock: true
      };
    }
  }

  /**
   * Send transaction to blockchain
   */
  async sendTransaction(transactionData) {
    try {
      const response = await this.makeRequest(`${this.apiUrl}/transaction`, {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });
      
      return {
        success: true,
        transactionHash: response.blockHash || `0x${Math.random().toString(16).substr(2, 64)}`,
        blockIndex: response.index || 0,
        timestamp: response.timestamp || Date.now(),
        ...response
      };
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    try {
      // For now, return mock balance since balance endpoint isn't implemented in blockchain
      // TODO: Implement balance tracking in blockchain server
      console.warn('Balance endpoint not yet implemented in blockchain server, returning mock data');
      return Math.random() * 1000;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash) {
    try {
      const response = await this.makeRequest(`${this.apiUrl}/search?hash=${encodeURIComponent(txHash)}`);
      return response;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      // Return mock transaction for development
      return {
        hash: txHash,
        from: '0x' + Math.random().toString(16).substr(2, 40),
        to: '0x' + Math.random().toString(16).substr(2, 40),
        amount: Math.random() * 100,
        timestamp: Date.now() - Math.random() * 86400000,
        mock: true
      };
    }
  }

  /**
   * Get transaction history for address
   */
  async getTransactionHistory(address, limit = 10) {
    try {
      // For now, return mock history since transaction history isn't implemented
      // TODO: Implement transaction history in blockchain server
      console.warn('Transaction history endpoint not yet implemented, returning mock data');
      
      const mockTransactions = [];
      for (let i = 0; i < Math.min(limit, 5); i++) {
        mockTransactions.push({
          hash: '0x' + Math.random().toString(16).substr(2, 64),
          from: Math.random() > 0.5 ? address : '0x' + Math.random().toString(16).substr(2, 40),
          to: Math.random() > 0.5 ? address : '0x' + Math.random().toString(16).substr(2, 40),
          amount: Math.random() * 100,
          timestamp: Date.now() - Math.random() * 86400000 * 30,
          type: Math.random() > 0.5 ? 'sent' : 'received',
          mock: true
        });
      }
      return mockTransactions;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    try {
      // For now, return mock gas price since gas pricing isn't implemented
      // TODO: Implement gas pricing in blockchain server
      console.warn('Gas price endpoint not yet implemented, returning mock data');
      return 20;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return 20;
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas() {
    try {
      // For now, return mock gas estimate since gas estimation isn't implemented
      // TODO: Implement gas estimation in blockchain server
      console.warn('Gas estimation endpoint not yet implemented, returning mock data');
      return 21000;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return 21000;
    }
  }

  /**
   * Get latest block
   */
  async getLatestBlock() {
    try {
      // Use the stats endpoint to get blockchain information
      const stats = await this.makeRequest(`${this.apiUrl}/stats`);
      if (stats && stats.latestBlock) {
        return stats.latestBlock;
      }
      
      // Fallback to mock data
      console.warn('Latest block not available in stats, returning mock data');
      return {
        number: Math.floor(Math.random() * 1000000) + 500000,
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        timestamp: Date.now(),
        transactions: Math.floor(Math.random() * 100),
        mock: true
      };
    } catch (error) {
      console.error('Failed to get latest block:', error);
      return {
        number: 0,
        hash: '0x0',
        timestamp: Date.now(),
        transactions: 0,
        mock: true
      };
    }
  }

  /**
   * Get network peers
   */
  async getPeers() {
    try {
      // Use the stats endpoint to get peer information
      const stats = await this.makeRequest(`${this.apiUrl}/stats`);
      if (stats && stats.peers) {
        return stats.peers;
      }
      
      // Fallback to mock data
      console.warn('Peer information not available in stats, returning mock data');
      const mockPeers = [];
      const peerCount = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < peerCount; i++) {
        mockPeers.push({
          id: '0x' + Math.random().toString(16).substr(2, 40),
          address: `192.168.1.${Math.floor(Math.random() * 255)}:3001`,
          connected: Math.random() > 0.2,
          mock: true
        });
      }
      return mockPeers;
    } catch (error) {
      console.error('Failed to get peers:', error);
      return [];
    }
  }

  /**
   * Wait for server to be available
   */
  async waitForServer(maxAttempts = 30, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const isRunning = await this.isServerRunning();
        if (isRunning) {
          console.log(`✅ Blockchain server is available (attempt ${attempt})`);
          return true;
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error.message);
      }
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.warn(`❌ Blockchain server not available after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Get chain info (alias for getBlockchainInfo)
   */
  async getChainInfo() {
    return await this.getBlockchainInfo();
  }

  /**
   * Get mempool information
   */
  async getMempool() {
    try {
      // Use the stats endpoint to get mempool information
      const stats = await this.makeRequest(`${this.apiUrl}/stats`);
      if (stats && stats.mempool) {
        return stats.mempool;
      }
      
      // Fallback to mock data
      console.warn('Mempool information not available in stats, returning mock data');
      return {
        pendingTransactions: Math.floor(Math.random() * 50),
        totalSize: Math.floor(Math.random() * 1000000) + 100000,
        transactions: [],
        mock: true
      };
    } catch (error) {
      console.error('Failed to get mempool:', error);
      return {
        pendingTransactions: 0,
        totalSize: 0,
        transactions: [],
        mock: true
      };
    }
  }
}

export default BlockchainClient;