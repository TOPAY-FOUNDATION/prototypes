/**
 * Token Manager for TOPAY Wallet
 * High-level interface for managing tokens and token operations
 */

import WalletContractUtils from './contract-utils.js';
import BlockchainClient from './blockchain-client.js';
import WalletStorage from './wallet-storage.js';

export class TokenManager {
  constructor(rpcUrl = 'http://localhost:8545', walletAddress = null) {
    this.contractUtils = new WalletContractUtils(rpcUrl);
    this.blockchainClient = new BlockchainClient(rpcUrl);
    this.walletAddress = walletAddress;
    this.storage = walletAddress ? new WalletStorage(walletAddress) : null;
    this.tokens = new Map(); // Cache for token information
  }

  /**
   * Initialize token manager
   */
  async initialize() {
    try {
      // Load saved tokens from storage if available
      if (this.storage) {
        const savedTokens = await this.storage.getTokens() || [];
        for (const token of savedTokens) {
          this.tokens.set(token.address, token);
        }
      }

      // Auto-discover TOPAY tokens on the blockchain
      await this.discoverTOPAYTokens();
      
      console.log(`🎯 Token Manager initialized with ${this.tokens.size} tokens`);
    } catch (error) {
      console.error('❌ Failed to initialize token manager:', error.message);
    }
  }

  /**
   * Discover TOPAY tokens on the blockchain
   */
  async discoverTOPAYTokens() {
    try {
      const topayTokens = await this.contractUtils.findTOPAYTokens();
      
      for (const token of topayTokens) {
        this.tokens.set(token.address, {
          address: token.address,
          name: token.name || 'TOPAY Token',
          symbol: token.symbol || 'TPY',
          decimals: token.decimals || 18,
          totalSupply: token.totalSupply || 0,
          type: 'TOPAY',
          isNative: token.symbol === 'TPY',
          deployedAt: token.deployedAt,
          deployer: token.deployer
        });
      }
      
      // Save discovered tokens
      this.saveTokens();
      
      console.log(`🔍 Discovered ${topayTokens.length} TOPAY tokens`);
    } catch (error) {
      console.error('❌ Failed to discover TOPAY tokens:', error.message);
    }
  }

  /**
   * Add a custom token
   */
  async addToken(contractAddress, userAddress = null) {
    try {
      // Get token information from blockchain
      const tokenInfo = await this.contractUtils.getTokenInfo(contractAddress);
      
      const token = {
        address: contractAddress,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        totalSupply: tokenInfo.totalSupply,
        type: 'CUSTOM',
        isNative: false,
        addedAt: new Date().toISOString()
      };
      
      // Get balance if user address provided
      if (userAddress) {
        token.balance = await this.getTokenBalance(contractAddress, userAddress);
      }
      
      this.tokens.set(contractAddress, token);
      this.saveTokens();
      
      console.log(`✅ Added token: ${token.name} (${token.symbol})`);
      return token;
    } catch (error) {
      console.error('❌ Failed to add token:', error.message);
      throw error;
    }
  }

  /**
   * Remove a token
   */
  removeToken(contractAddress) {
    if (this.tokens.has(contractAddress)) {
      const token = this.tokens.get(contractAddress);
      this.tokens.delete(contractAddress);
      this.saveTokens();
      console.log(`🗑️ Removed token: ${token.name} (${token.symbol})`);
      return true;
    }
    return false;
  }

  /**
   * Get all tokens
   */
  getAllTokens() {
    return Array.from(this.tokens.values());
  }

  /**
   * Get token by address
   */
  getToken(contractAddress) {
    return this.tokens.get(contractAddress);
  }

  /**
   * Get native TOPAY token
   */
  getNativeToken() {
    return Array.from(this.tokens.values()).find(token => token.isNative);
  }

  /**
   * Get token balance
   */
  async getTokenBalance(contractAddress, userAddress) {
    try {
      const balance = await this.contractUtils.getTokenBalance(contractAddress, userAddress);
      
      // Update cached token balance
      if (this.tokens.has(contractAddress)) {
        const token = this.tokens.get(contractAddress);
        token.balance = balance;
        token.lastBalanceUpdate = new Date().toISOString();
        this.tokens.set(contractAddress, token);
      }
      
      return balance;
    } catch (error) {
      console.error('❌ Failed to get token balance:', error.message);
      throw error;
    }
  }

  /**
   * Get balances for all tokens
   */
  async getAllTokenBalances(userAddress) {
    const balances = {};
    
    for (const [address, token] of this.tokens) {
      try {
        const balance = await this.getTokenBalance(address, userAddress);
        balances[address] = {
          ...token,
          balance,
          formattedBalance: this.formatTokenAmount(balance, token.decimals)
        };
      } catch (error) {
        console.warn(`Failed to get balance for ${token.symbol}:`, error.message);
        balances[address] = {
          ...token,
          balance: 0,
          formattedBalance: '0',
          error: error.message
        };
      }
    }
    
    return balances;
  }

  /**
   * Transfer tokens
   */
  async transferTokens(contractAddress, fromAddress, toAddress, amount) {
    try {
      const token = this.getToken(contractAddress);
      if (!token) {
        throw new Error('Token not found');
      }
      
      console.log(`💸 Transferring ${amount} ${token.symbol} from ${fromAddress} to ${toAddress}`);
      
      const result = await this.contractUtils.transferTokens(
        contractAddress,
        fromAddress,
        toAddress,
        amount
      );
      
      // Update balance cache
      await this.getTokenBalance(contractAddress, fromAddress);
      
      return result;
    } catch (error) {
      console.error('❌ Token transfer failed:', error.message);
      throw error;
    }
  }

  /**
   * Approve token spending
   */
  async approveTokens(contractAddress, ownerAddress, spenderAddress, amount) {
    try {
      const token = this.getToken(contractAddress);
      if (!token) {
        throw new Error('Token not found');
      }
      
      console.log(`✅ Approving ${amount} ${token.symbol} for ${spenderAddress}`);
      
      const result = await this.contractUtils.approveTokens(
        contractAddress,
        ownerAddress,
        spenderAddress,
        amount
      );
      
      return result;
    } catch (error) {
      console.error('❌ Token approval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get token allowance
   */
  async getTokenAllowance(contractAddress, ownerAddress, spenderAddress) {
    try {
      return await this.contractUtils.getTokenAllowance(
        contractAddress,
        ownerAddress,
        spenderAddress
      );
    } catch (error) {
      console.error('❌ Failed to get token allowance:', error.message);
      throw error;
    }
  }

  /**
   * Transfer tokens from approved allowance
   */
  async transferFromTokens(contractAddress, spenderAddress, fromAddress, toAddress, amount) {
    try {
      const token = this.getToken(contractAddress);
      if (!token) {
        throw new Error('Token not found');
      }
      
      console.log(`💸 TransferFrom ${amount} ${token.symbol} from ${fromAddress} to ${toAddress}`);
      
      const result = await this.contractUtils.transferFromTokens(
        contractAddress,
        spenderAddress,
        fromAddress,
        toAddress,
        amount
      );
      
      // Update balance caches
      await this.getTokenBalance(contractAddress, fromAddress);
      await this.getTokenBalance(contractAddress, toAddress);
      
      return result;
    } catch (error) {
      console.error('❌ TransferFrom failed:', error.message);
      throw error;
    }
  }

  /**
   * Mint tokens (owner only)
   */
  async mintTokens(contractAddress, ownerAddress, toAddress, amount) {
    try {
      const token = this.getToken(contractAddress);
      if (!token) {
        throw new Error('Token not found');
      }
      
      console.log(`🏭 Minting ${amount} ${token.symbol} to ${toAddress}`);
      
      const result = await this.contractUtils.mintTokens(
        contractAddress,
        ownerAddress,
        toAddress,
        amount
      );
      
      // Update balance and total supply
      await this.getTokenBalance(contractAddress, toAddress);
      await this.refreshTokenInfo(contractAddress);
      
      return result;
    } catch (error) {
      console.error('❌ Token minting failed:', error.message);
      throw error;
    }
  }

  /**
   * Burn tokens
   */
  async burnTokens(contractAddress, fromAddress, amount) {
    try {
      const token = this.getToken(contractAddress);
      if (!token) {
        throw new Error('Token not found');
      }
      
      console.log(`🔥 Burning ${amount} ${token.symbol} from ${fromAddress}`);
      
      const result = await this.contractUtils.burnTokens(
        contractAddress,
        fromAddress,
        amount
      );
      
      // Update balance and total supply
      await this.getTokenBalance(contractAddress, fromAddress);
      await this.refreshTokenInfo(contractAddress);
      
      return result;
    } catch (error) {
      console.error('❌ Token burning failed:', error.message);
      throw error;
    }
  }

  /**
   * Refresh token information from blockchain
   */
  async refreshTokenInfo(contractAddress) {
    try {
      const tokenInfo = await this.contractUtils.getTokenInfo(contractAddress);
      
      if (this.tokens.has(contractAddress)) {
        const existingToken = this.tokens.get(contractAddress);
        this.tokens.set(contractAddress, {
          ...existingToken,
          ...tokenInfo,
          lastInfoUpdate: new Date().toISOString()
        });
        this.saveTokens();
      }
      
      return tokenInfo;
    } catch (error) {
      console.error('❌ Failed to refresh token info:', error.message);
      throw error;
    }
  }

  /**
   * Format token amount with decimals
   */
  formatTokenAmount(amount, decimals = 18) {
    const divisor = Math.pow(10, decimals);
    return (amount / divisor).toFixed(6).replace(/\.?0+$/, '');
  }

  /**
   * Parse token amount to wei-like units
   */
  parseTokenAmount(amount, decimals = 18) {
    const multiplier = Math.pow(10, decimals);
    return Math.floor(parseFloat(amount) * multiplier);
  }

  /**
   * Save tokens to storage
   */
  saveTokens() {
    if (this.storage) {
      const tokensArray = Array.from(this.tokens.values());
      this.storage.saveTokens(tokensArray);
    }
  }

  /**
   * Get transaction history for a token
   */
  async getTokenTransactionHistory(contractAddress, userAddress, limit = 50) {
    try {
      // Get general transaction history
      const history = await this.blockchainClient.getTransactionHistory(userAddress, limit);
      
      // Filter for contract transactions
      const tokenTransactions = history.filter(tx => 
        tx.contractAddress === contractAddress ||
        (tx.data && tx.data.includes(contractAddress))
      );
      
      return tokenTransactions;
    } catch (error) {
      console.error('❌ Failed to get token transaction history:', error.message);
      throw error;
    }
  }

  /**
   * Check if server is running
   */
  async isServerRunning() {
    return await this.contractUtils.isServerRunning();
  }

  /**
   * Wait for server to be available
   */
  async waitForServer(maxAttempts = 30, delay = 1000) {
    return await this.contractUtils.waitForServer(maxAttempts, delay);
  }
}