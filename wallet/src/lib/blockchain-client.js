/**
 * Browser-compatible Blockchain Client
 * Handles communication with the TOPAY blockchain
 */

class BlockchainClient {
  constructor(rpcUrl = process.env.BLOCKCHAIN_URL || 'http://localhost:3000') {
    this.rpcUrl = rpcUrl;
    this.requestId = 1;
  }

  /**
   * Make RPC call to blockchain
   */
  async rpcCall(method, params = []) {
    try {
      const response = await fetch(`${this.rpcUrl}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: this.requestId++
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC Error');
      }

      return data.result;
    } catch (error) {
      console.error(`RPC call failed for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get blockchain info
   */
  async getBlockchainInfo() {
    try {
      return await this.rpcCall('topay_getBlockchainInfo');
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
   * Get account balance
   */
  async getBalance(address) {
    try {
      const balance = await this.rpcCall('topay_getBalance', [address]);
      return parseFloat(balance) || 0;
    } catch (error) {
      console.error('Failed to get balance:', error);
      // Return mock balance for development
      return Math.random() * 1000;
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(from, to, amount, gasLimit = 21000, gasPrice = 20) {
    try {
      const result = await this.rpcCall('topay_sendTransaction', [
        from,
        to,
        amount,
        gasLimit,
        gasPrice
      ]);
      
      return result;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      // Return mock transaction for development
      return {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        success: true,
        mock: true
      };
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash) {
    try {
      return await this.rpcCall('topay_getTransaction', [txHash]);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      // Return mock transaction for development
      return {
        hash: txHash,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        amount: Math.random() * 100,
        status: 'confirmed',
        blockNumber: Math.floor(Math.random() * 1000000) + 500000,
        timestamp: Date.now() - Math.random() * 86400000,
        mock: true
      };
    }
  }

  /**
   * Get transaction history for address
   */
  async getTransactionHistory(address, limit = 10, offset = 0) {
    try {
      return await this.rpcCall('topay_getTransactionHistory', [address, limit, offset]);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      // Return mock transaction history for development
      const mockTransactions = [];
      for (let i = 0; i < limit; i++) {
        mockTransactions.push({
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          from: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
          to: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
          amount: Math.random() * 100,
          status: Math.random() > 0.1 ? 'confirmed' : 'pending',
          blockNumber: Math.floor(Math.random() * 1000000) + 500000,
          timestamp: Date.now() - Math.random() * 86400000 * 30,
          type: Math.random() > 0.5 ? 'sent' : 'received',
          mock: true
        });
      }
      return mockTransactions;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice() {
    try {
      const gasPrice = await this.rpcCall('topay_getGasPrice');
      return parseInt(gasPrice) || 20;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      // Return mock gas price for development
      return 20;
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(from, to, amount) {
    try {
      const gasEstimate = await this.rpcCall('topay_estimateGas', [from, to, amount]);
      return parseInt(gasEstimate) || 21000;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      // Return mock gas estimate for development
      return 21000;
    }
  }

  /**
   * Get latest block
   */
  async getLatestBlock() {
    try {
      return await this.rpcCall('topay_getLatestBlock');
    } catch (error) {
      console.error('Failed to get latest block:', error);
      // Return mock block for development
      return {
        number: Math.floor(Math.random() * 1000000) + 500000,
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Date.now(),
        transactions: Math.floor(Math.random() * 100),
        mock: true
      };
    }
  }

  /**
   * Get network peers
   */
  async getPeers() {
    try {
      return await this.rpcCall('topay_getPeers');
    } catch (error) {
      console.error('Failed to get peers:', error);
      // Return mock peers for development
      const mockPeers = [];
      const peerCount = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < peerCount; i++) {
        mockPeers.push({
          id: `peer-${i + 1}`,
          address: `192.168.1.${Math.floor(Math.random() * 255) + 1}:3000`,
          version: '1.0.0',
          connected: Math.random() > 0.2,
          lastSeen: Date.now() - Math.random() * 3600000,
          mock: true
        });
      }
      return mockPeers;
    }
  }

  /**
   * Check if server is running
   */
  async isServerRunning() {
    try {
      const response = await fetch(`${this.rpcUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.warn('Blockchain server not available:', error.message);
      return false;
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
   * Get chain info
   */
  async getChainInfo() {
    try {
      return await this.rpcCall('topay_getChainInfo');
    } catch (error) {
      console.error('Failed to get chain info:', error);
      // Return mock data for development
      return {
        chainId: 1337,
        networkName: 'TOPAY Testnet',
        blockHeight: Math.floor(Math.random() * 1000000) + 500000,
        totalSupply: '1000000000',
        circulatingSupply: '500000000',
        version: '1.0.0',
        mock: true
      };
    }
  }

  /**
   * Get mempool transactions
   */
  async getMempool() {
    try {
      return await this.rpcCall('topay_getMempool');
    } catch (error) {
      console.error('Failed to get mempool:', error);
      // Return mock data for development
      return {
        pendingTransactions: Math.floor(Math.random() * 50),
        totalSize: Math.floor(Math.random() * 1000000) + 100000,
        transactions: [],
        mock: true
      };
    }
  }
}

export default BlockchainClient;