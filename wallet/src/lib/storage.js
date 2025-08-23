/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Persistence Manager
 * 
 * Manages persistent storage of blockchain and wallet data
 */

// Browser-compatible storage using localStorage
// Removed Node.js dependencies for browser compatibility
import { Blockchain } from './blockchain.js';
import { Wallet } from './wallet.js';

export class PersistenceManager {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.blockchainKey = 'topay_blockchain_data';
    this.walletsKey = 'topay_wallets_data';
    this.configKey = 'topay_config_data';
    this.backupPrefix = 'topay_backup_';
    this.autoSaveInterval = null;
    this.autoSaveEnabled = false;
  }

  /**
   * Initialize storage directory
   */
  async initialize() {
    try {
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }
      console.log('Storage initialized using localStorage');
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  /**
   * Save blockchain to persistent storage
   */
  async saveBlockchain(blockchain) {
    try {
      await this.initialize();
      
      const blockchainData = blockchain.exportChain();
      const jsonData = JSON.stringify(blockchainData);
      
      localStorage.setItem(this.blockchainKey, jsonData);
      console.log('Blockchain saved successfully');
      
    } catch (error) {
      console.error('Failed to save blockchain:', error);
      throw error;
    }
  }

  /**
   * Load blockchain from persistent storage
   */
  async loadBlockchain() {
    try {
      const data = localStorage.getItem(this.blockchainKey);
      
      if (!data) {
        console.log('No existing blockchain found, creating new one');
        return new Blockchain();
      }
      
      const blockchainData = JSON.parse(data);
      
      const blockchain = new Blockchain();
      blockchain.importChain(blockchainData);
      
      console.log('Blockchain loaded successfully');
      return blockchain;
      
    } catch (error) {
      console.error('Failed to load blockchain:', error);
      throw error;
    }
  }

  /**
   * Save wallets to persistent storage
   */
  async saveWallets(wallets) {
    try {
      await this.initialize();
      
      // Convert wallet map to serializable format
      const walletsData = {};
      for (const [address, wallet] of wallets) {
        walletsData[address] = wallet.exportPublicData();
      }
      
      const jsonData = JSON.stringify(walletsData);
      localStorage.setItem(this.walletsKey, jsonData);
      
      console.log('Wallets saved successfully');
      
    } catch (error) {
      console.error('Failed to save wallets:', error);
      throw error;
    }
  }

  /**
   * Load wallets from persistent storage
   */
  async loadWallets() {
    try {
      const data = localStorage.getItem(this.walletsKey);
      
      if (!data) {
        console.log('No existing wallets found, creating empty wallet map');
        return new Map();
      }
      
      const walletsData = JSON.parse(data);
      
      const wallets = new Map();
      for (const [address, walletData] of Object.entries(walletsData)) {
        const wallet = new Wallet();
        wallet.importWallet(walletData.privateKey);
        wallets.set(address, wallet);
      }
      
      console.log(`Loaded ${wallets.size} wallets`);
      return wallets;
      
    } catch (error) {
      console.error('Failed to load wallets:', error);
      throw error;
    }
  }

  /**
   * Save configuration
   */
  async saveConfig(config) {
    try {
      await this.initialize();
      
      const jsonData = JSON.stringify(config);
      localStorage.setItem(this.configKey, jsonData);
      
      console.log('Configuration saved successfully');
      
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Load configuration
   */
  async loadConfig() {
    try {
      const data = localStorage.getItem(this.configKey);
      
      if (!data) {
        console.log('No existing configuration found, using defaults');
        return this.getDefaultConfig();
      }
      
      const config = JSON.parse(data);
      
      console.log('Configuration loaded successfully');
      return config;
      
    } catch (error) {
      console.error('Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      network: {
        port: 3001,
        peers: [],
        maxPeers: 10
      },
      mining: {
        difficulty: 4,
        miningReward: 10,
        blockTime: 10000 // 10 seconds
      },
      storage: {
        autoSave: true,
        autoSaveInterval: 30000, // 30 seconds
        maxBackups: 10
      }
    };
  }

  /**
   * Enable auto-save functionality
   */
  enableAutoSave(blockchain, wallets, interval = 30000) {
    if (this.autoSaveEnabled) {
      this.disableAutoSave();
    }

    this.autoSaveEnabled = true;
    this.autoSaveInterval = setInterval(async () => {
      try {
        await this.saveBlockchain(blockchain);
        await this.saveWallets(wallets);
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, interval);

    console.log(`Auto-save enabled with ${interval}ms interval`);
  }

  /**
   * Disable auto-save functionality
   */
  disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.autoSaveEnabled = false;
    console.log('Auto-save disabled');
  }

  /**
   * Create backup of current data
   */
  async createBackup(name = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = name || `backup-${timestamp}`;
      const backupKey = `${this.backupPrefix}${backupName}`;
      
      const backupData = {
        timestamp: new Date().toISOString(),
        blockchain: null,
        wallets: null,
        config: null
      };
      
      // Try to load existing data
      try {
        const blockchain = await this.loadBlockchain();
        backupData.blockchain = blockchain.exportChain();
      } catch (error) {
        console.warn('Could not backup blockchain data:', error.message);
      }
      
      try {
        const wallets = await this.loadWallets();
        const walletsData = {};
        for (const [address, wallet] of wallets) {
          walletsData[address] = {
            address: wallet.address,
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey
          };
        }
        backupData.wallets = walletsData;
      } catch (error) {
        console.warn('Could not backup wallet data:', error.message);
      }
      
      try {
        backupData.config = await this.loadConfig();
      } catch (error) {
        console.warn('Could not backup config data:', error.message);
      }
      
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      console.log(`Backup created: ${backupName}`);
      return backupName;
      
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const backups = [];
      
      // Iterate through localStorage keys to find backups
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.backupPrefix)) {
          const name = key.replace(this.backupPrefix, '');
          backups.push(name);
        }
      }
      
      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupName) {
    try {
      const backupKey = `${this.backupPrefix}${backupName}`;
      const data = localStorage.getItem(backupKey);
      
      if (!data) {
        throw new Error(`Backup not found: ${backupName}`);
      }
      
      const backupData = JSON.parse(data);
      
      console.log(`Restoring from backup: ${backupName}`);
      
      // Restore blockchain
      if (backupData.blockchain) {
        const blockchain = new Blockchain();
        blockchain.importChain(backupData.blockchain);
        await this.saveBlockchain(blockchain);
        console.log('Blockchain restored');
      }
      
      // Restore wallets
      if (backupData.wallets) {
        const wallets = new Map();
        for (const [address, walletData] of Object.entries(backupData.wallets)) {
          const wallet = new Wallet();
          wallet.importWallet(walletData.privateKey);
          wallets.set(address, wallet);
        }
        await this.saveWallets(wallets);
        console.log('Wallets restored');
      }
      
      // Restore config
      if (backupData.config) {
        await this.saveConfig(backupData.config);
        console.log('Configuration restored');
      }
      
      console.log(`Restored from backup: ${backupName}`);
      
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const stats = {
        storage: 'localStorage',
        files: {},
        backups: [],
        totalSize: 0
      };

      // Check blockchain data
      try {
        const blockchainData = localStorage.getItem(this.blockchainKey);
        if (blockchainData) {
          stats.files.blockchain = {
            size: blockchainData.length,
            exists: true
          };
          stats.totalSize += blockchainData.length;
        }
      } catch (error) {
        console.warn('Could not get blockchain stats:', error);
      }

      // Check wallets data
      try {
        const walletsData = localStorage.getItem(this.walletsKey);
        if (walletsData) {
          stats.files.wallets = {
            size: walletsData.length,
            exists: true
          };
          stats.totalSize += walletsData.length;
        }
      } catch (error) {
        console.warn('Could not get wallets stats:', error);
      }

      // Check config data
      try {
        const configData = localStorage.getItem(this.configKey);
        if (configData) {
          stats.files.config = {
            size: configData.length,
            exists: true
          };
          stats.totalSize += configData.length;
        }
      } catch (error) {
        console.warn('Could not get config stats:', error);
      }

      // List backups
      stats.backups = await this.listBackups();

      return stats;

    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups (keep only the most recent N backups)
   */
  async cleanupBackups(keepCount = 10) {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= keepCount) {
        return;
      }

      // Sort backups by name (which includes timestamp)
      backups.sort();
      
      // Remove oldest backups
      const toRemove = backups.slice(0, backups.length - keepCount);
      
      for (const backup of toRemove) {
        const backupKey = `${this.backupPrefix}${backup}`;
        localStorage.removeItem(backupKey);
        console.log(`Removed old backup: ${backup}`);
      }

    } catch (error) {
      console.error('Failed to cleanup backups:', error);
      throw error;
    }
  }
}

// Legacy Storage class for backward compatibility
export class Storage {
  constructor() {
    this.persistence = new PersistenceManager();
  }

  async ensureDataDirectory() {
    await this.persistence.initialize();
  }

  async saveBlockchain(blockchain) {
    await this.persistence.saveBlockchain(blockchain);
  }

  async loadBlockchain() {
    return await this.persistence.loadBlockchain();
  }

  async saveWallets(wallets) {
    await this.persistence.saveWallets(wallets);
  }

  async loadWallets() {
    return await this.persistence.loadWallets();
  }
}