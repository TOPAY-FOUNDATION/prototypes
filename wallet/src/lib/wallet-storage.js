/**
 * Browser-compatible Wallet Storage Manager
 * Handles wallet-specific data persistence using localStorage
 */

class WalletStorage {
  constructor(walletAddress) {
    this.walletAddress = walletAddress;
    this.storagePrefix = 'topay_wallet_';
  }

  /**
   * Save tokens data
   */
  async saveTokens(tokens) {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_tokens`;
      localStorage.setItem(key, JSON.stringify({
        tokens,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save tokens:', error);
      return false;
    }
  }

  /**
   * Load tokens data
   */
  async loadTokens() {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_tokens`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.tokens || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return [];
    }
  }

  /**
   * Get tokens data (alias for loadTokens for backward compatibility)
   */
  getTokens() {
    return this.loadTokens();
  }

  /**
   * Save wallet settings
   */
  async saveSettings(settings) {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_settings`;
      localStorage.setItem(key, JSON.stringify({
        settings,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Load wallet settings
   */
  async loadSettings() {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_settings`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.settings || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  /**
   * Save transaction history
   */
  async saveTransactionHistory(transactions) {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_transactions`;
      localStorage.setItem(key, JSON.stringify({
        transactions,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save transaction history:', error);
      return false;
    }
  }

  /**
   * Load transaction history
   */
  async loadTransactionHistory() {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_transactions`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.transactions || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load transaction history:', error);
      return [];
    }
  }

  /**
   * Save address book
   */
  async saveAddressBook(addresses) {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_addressbook`;
      localStorage.setItem(key, JSON.stringify({
        addresses,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save address book:', error);
      return false;
    }
  }

  /**
   * Load address book
   */
  async loadAddressBook() {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_addressbook`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.addresses || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load address book:', error);
      return [];
    }
  }

  /**
   * Save wallet metadata
   */
  async saveWalletMetadata(metadata) {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_metadata`;
      localStorage.setItem(key, JSON.stringify({
        metadata,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save wallet metadata:', error);
      return false;
    }
  }

  /**
   * Load wallet metadata
   */
  async loadWalletMetadata() {
    try {
      const key = `${this.storagePrefix}${this.walletAddress}_metadata`;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.metadata || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to load wallet metadata:', error);
      return {};
    }
  }

  /**
   * Create wallet backup
   */
  async createBackup() {
    try {
      const backup = {
        tokens: await this.loadTokens(),
        settings: await this.loadSettings(),
        transactions: await this.loadTransactionHistory(),
        addressBook: await this.loadAddressBook(),
        metadata: await this.loadWalletMetadata(),
        timestamp: Date.now(),
        version: '1.0'
      };
      
      return backup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    try {
      let totalSize = 0;
      let walletItems = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix + this.walletAddress)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
            walletItems++;
          }
        }
      }
      
      return {
        totalSize,
        walletItems,
        availableSpace: 5 * 1024 * 1024 - totalSize, // Assume 5MB limit
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalSize: 0,
        walletItems: 0,
        availableSpace: 5 * 1024 * 1024,
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Clear all wallet data
   */
  async clearWalletData() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix + this.walletAddress)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear wallet data:', error);
      return false;
    }
  }
}

export default WalletStorage;