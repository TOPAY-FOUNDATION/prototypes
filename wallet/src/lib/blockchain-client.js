/**
 * TOPAY Foundation Blockchain Client
 * Connects wallet to the main blockchain workspace
 */

import { config } from './config.js';

export class BlockchainClient {
  constructor(rpcUrl = config.blockchain.rpcUrl) {
    this.rpcUrl = rpcUrl;
    this.requestId = 0;
  }

  /**
   * Make RPC call to the main blockchain
   */
  async rpcCall(method, params = []) {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: ++this.requestId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC error');
      }

      return data.result;
    } catch (error) {
      console.error(`RPC call failed for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get blockchain information
   */
  async getChainInfo() {
    return await this.rpcCall('topay_getChainInfo');
  }

  /**
   * Get balance for an address
   */
  async getBalance(address) {
    return await this.rpcCall('topay_getBalance', [address]);
  }

  /**
   * Get block by number or hash
   */
  async getBlock(blockId) {
    return await this.rpcCall('topay_getBlock', [blockId]);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash) {
    return await this.rpcCall('topay_getTransaction', [hash]);
  }

  /**
   * Send a transaction
   */
  async sendTransaction(transaction) {
    return await this.rpcCall('topay_sendTransaction', [transaction]);
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address) {
    return await this.rpcCall('topay_getTransactionHistory', [address]);
  }

  /**
   * Get mempool transactions
   */
  async getMempool() {
    return await this.rpcCall('topay_getMempool');
  }

  /**
   * Mine a block
   */
  async mine(minerAddress) {
    return await this.rpcCall('topay_mine', [minerAddress]);
  }

  /**
   * Validate the blockchain
   */
  async validateChain() {
    return await this.rpcCall('topay_validateChain');
  }

  /**
   * Get network statistics
   */
  async getNetworkStats() {
    return await this.rpcCall('topay_getNetworkStats');
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    return await this.rpcCall('topay_getBlockNumber');
  }

  /**
   * Check if the blockchain server is running
   */
  async isServerRunning() {
    try {
      await this.getChainInfo();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for server to be available
   */
  async waitForServer(maxAttempts = 30, delay = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isServerRunning()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
  }
}

// Export singleton instance
export const blockchainClient = new BlockchainClient();