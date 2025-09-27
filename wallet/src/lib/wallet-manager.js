import { Wallet } from './wallet.js';
import BlockchainClient from './blockchain-client.js';
import SecurityManager from './security-manager.js';
import { config } from './config.js';

/**
 * WalletManager - High-level wallet management with blockchain integration and security
 */
export class WalletManager {
  constructor() {
    this.wallet = null;
    this.blockchain = null;
    this.security = new SecurityManager();
    this.isConnected = false;
    this.autoRefreshInterval = null;
  }

  /**
   * Initialize wallet manager with blockchain connection
   */
  async initialize(blockchainUrl = config.blockchain.baseUrl) {
    try {
      // Initialize blockchain client
      this.blockchain = new BlockchainClient(blockchainUrl);
      
      // Test connection
      const isRunning = await this.blockchain.isServerRunning();
      if (isRunning) {
        this.isConnected = true;
        console.log('✅ Connected to blockchain server');
      } else {
        console.warn('⚠️ Blockchain server not available, using mock data');
        this.isConnected = false;
      }

      return this.isConnected;
    } catch (error) {
      console.error('Failed to initialize wallet manager:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Authenticate user
   */
  async authenticate(password) {
    return await this.security.authenticate(password);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.security.isValidSession();
  }

  /**
   * Logout user
   */
  logout() {
    this.security.logout();
  }

  /**
   * Create a new wallet
   */
  async createWallet() {
    this.security.requireAuth('wallet creation');
    
    try {
      this.wallet = new Wallet();
      await this.wallet.generateWallet();
      
      console.log('✅ New wallet created:', this.wallet.address);
      return this.wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('Wallet creation failed: ' + error.message);
    }
  }

  /**
   * Create wallet from seed
   */
  async createWalletFromSeed(seed) {
    this.security.requireAuth('wallet creation');
    
    try {
      this.wallet = new Wallet();
      await this.wallet.generateFromSeed(seed);
      
      console.log('✅ Wallet created from seed:', this.wallet.address);
      return this.wallet;
    } catch (error) {
      console.error('Failed to create wallet from seed:', error);
      throw new Error('Wallet creation from seed failed: ' + error.message);
    }
  }

  /**
   * Import wallet from backup
   */
  async importWallet(backupData) {
    this.security.requireAuth('wallet import');
    
    try {
      this.wallet = new Wallet();
      this.wallet.importFromBackup(backupData);
      
      console.log('✅ Wallet imported:', this.wallet.address);
      return this.wallet;
    } catch (error) {
      console.error('Failed to import wallet:', error);
      throw new Error('Wallet import failed: ' + error.message);
    }
  }

  /**
   * Get current wallet balance
   */
  async getBalance() {
    if (!this.wallet) {
      throw new Error('No wallet loaded');
    }

    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }

    try {
      this.security.checkRateLimit('balance_check', 30); // 30 per minute
      const balance = await this.wallet.getBalance(this.blockchain);
      return balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Send transaction with security validation
   */
  async sendTransaction(to, amount, data = null) {
    if (!this.wallet) {
      throw new Error('No wallet loaded');
    }

    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }

    try {
      // Security validation
      this.security.validateTransaction(to, amount, data);
      this.security.checkRateLimit('transaction', 5); // 5 per minute
      
      // Sanitize inputs
      to = this.security.sanitizeInput(to);
      data = this.security.sanitizeInput(data);

      const result = await this.wallet.sendTransaction(this.blockchain, to, amount, data);
      
      // Refresh balance after transaction
      setTimeout(() => this.refreshBalance(), 1000);
      
      return result;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(limit = 10, offset = 0) {
    if (!this.wallet) {
      throw new Error('No wallet loaded');
    }

    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }

    try {
      this.security.checkRateLimit('history_check', 20); // 20 per minute
      const history = await this.wallet.getTransactionHistory(this.blockchain, limit, offset);
      return history;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }

  /**
   * Generate new address for receiving funds
   */
  async generateReceiveAddress() {
    if (!this.wallet) {
      throw new Error('No wallet loaded');
    }

    this.security.requireAuth('address generation');
    
    try {
      // For now, return the current wallet address
      // In a full HD wallet implementation, this would generate a new address
      return this.wallet.address;
    } catch (error) {
      console.error('Failed to generate receive address:', error);
      throw error;
    }
  }

  /**
   * Refresh wallet balance
   */
  async refreshBalance() {
    if (!this.wallet || !this.blockchain) {
      return null;
    }

    try {
      const balance = await this.getBalance();
      console.log('Balance refreshed:', balance);
      return balance;
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      return null;
    }
  }

  /**
   * Start auto-refresh of balance
   */
  startAutoRefresh(intervalMs = 30000) {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    this.autoRefreshInterval = setInterval(() => {
      this.refreshBalance();
    }, intervalMs);

    console.log('Auto-refresh started with interval:', intervalMs + 'ms');
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      console.log('Auto-refresh stopped');
    }
  }

  /**
   * Get blockchain info
   */
  async getBlockchainInfo() {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }

    try {
      return await this.blockchain.getBlockchainInfo();
    } catch (error) {
      console.error('Failed to get blockchain info:', error);
      throw error;
    }
  }

  /**
   * Get network peers
   */
  async getPeers() {
    if (!this.blockchain) {
      throw new Error('Blockchain not initialized');
    }

    try {
      return await this.blockchain.getPeers();
    } catch (error) {
      console.error('Failed to get peers:', error);
      throw error;
    }
  }

  /**
   * Export wallet for backup (requires authentication)
   */
  exportWallet() {
    if (!this.wallet) {
      throw new Error('No wallet loaded');
    }

    this.security.requireAuth('wallet export');
    return this.wallet.exportForBackup();
  }

  /**
   * Export public wallet data
   */
  exportPublicData() {
    if (!this.wallet) {
      throw new Error('No wallet loaded');
    }

    return this.wallet.exportPublicData();
  }

  /**
   * Get comprehensive wallet stats
   */
  getWalletStats() {
    const walletStats = this.wallet ? this.wallet.getStats() : null;
    const securityStatus = this.security.getSecurityStatus();
    
    return {
      wallet: walletStats,
      security: securityStatus,
      connection: {
        isConnected: this.isConnected,
        blockchainUrl: this.blockchain?.baseUrl || null
      }
    };
  }

  /**
   * Secure cleanup
   */
  cleanup() {
    this.stopAutoRefresh();
    
    if (this.wallet) {
      this.wallet.secureErase();
      this.wallet = null;
    }

    this.security.logout();
    this.blockchain = null;
    this.isConnected = false;
    
    console.log('Wallet manager cleaned up');
  }
}

export default WalletManager;