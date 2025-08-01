/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Persistence Manager
 * 
 * Manages persistent storage of blockchain and wallet data
 */

import fs from 'fs/promises';
import path from 'path';
import { Blockchain } from './blockchain.js';
import { Wallet } from './wallet.js';

export class PersistenceManager {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.blockchainFile = path.join(dataDir, 'blockchain.json');
    this.walletsFile = path.join(dataDir, 'wallets.json');
    this.configFile = path.join(dataDir, 'config.json');
    this.backupDir = path.join(dataDir, 'backups');
    this.autoSaveInterval = null;
    this.autoSaveEnabled = false;
  }

  /**
   * Initialize storage directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`Storage initialized at: ${this.dataDir}`);
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
      const jsonData = JSON.stringify(blockchainData, null, 2);
      
      await fs.writeFile(this.blockchainFile, jsonData, 'utf8');
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
      const data = await fs.readFile(this.blockchainFile, 'utf8');
      const blockchainData = JSON.parse(data);
      
      const blockchain = new Blockchain();
      blockchain.importChain(blockchainData);
      
      console.log('Blockchain loaded successfully');
      return blockchain;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No existing blockchain found, creating new one');
        return new Blockchain();
      }
      
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
      
      const jsonData = JSON.stringify(walletsData, null, 2);
      await fs.writeFile(this.walletsFile, jsonData, 'utf8');
      
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
      const data = await fs.readFile(this.walletsFile, 'utf8');
      const walletsData = JSON.parse(data);
      
      const wallets = new Map();
      for (const [address, walletData] of Object.entries(walletsData)) {
        const wallet = Wallet.fromPublicData(walletData);
        wallets.set(address, wallet);
      }
      
      console.log('Wallets loaded successfully');
      return wallets;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No existing wallets found, creating empty wallet map');
        return new Map();
      }
      
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
      
      const jsonData = JSON.stringify(config, null, 2);
      await fs.writeFile(this.configFile, jsonData, 'utf8');
      
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
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      
      console.log('Configuration loaded successfully');
      return config;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No existing configuration found, using defaults');
        return this.getDefaultConfig();
      }
      
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
      const backupPath = path.join(this.backupDir, backupName);
      
      await fs.mkdir(backupPath, { recursive: true });
      
      // Copy blockchain file
      try {
        await fs.copyFile(this.blockchainFile, path.join(backupPath, 'blockchain.json'));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      
      // Copy wallets file
      try {
        await fs.copyFile(this.walletsFile, path.join(backupPath, 'wallets.json'));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      
      // Copy config file
      try {
        await fs.copyFile(this.configFile, path.join(backupPath, 'config.json'));
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      
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
      const backups = await fs.readdir(this.backupDir);
      return backups.filter(item => item.startsWith('backup-'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      // Check if backup exists
      await fs.access(backupPath);
      
      // Restore blockchain
      const blockchainBackup = path.join(backupPath, 'blockchain.json');
      try {
        await fs.copyFile(blockchainBackup, this.blockchainFile);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      
      // Restore wallets
      const walletsBackup = path.join(backupPath, 'wallets.json');
      try {
        await fs.copyFile(walletsBackup, this.walletsFile);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      
      // Restore config
      const configBackup = path.join(backupPath, 'config.json');
      try {
        await fs.copyFile(configBackup, this.configFile);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
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
        dataDir: this.dataDir,
        files: {},
        backups: [],
        totalSize: 0
      };

      // Check blockchain file
      try {
        const blockchainStat = await fs.stat(this.blockchainFile);
        stats.files.blockchain = {
          size: blockchainStat.size,
          modified: blockchainStat.mtime
        };
        stats.totalSize += blockchainStat.size;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      // Check wallets file
      try {
        const walletsStat = await fs.stat(this.walletsFile);
        stats.files.wallets = {
          size: walletsStat.size,
          modified: walletsStat.mtime
        };
        stats.totalSize += walletsStat.size;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      // Check config file
      try {
        const configStat = await fs.stat(this.configFile);
        stats.files.config = {
          size: configStat.size,
          modified: configStat.mtime
        };
        stats.totalSize += configStat.size;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
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
        const backupPath = path.join(this.backupDir, backup);
        await fs.rm(backupPath, { recursive: true, force: true });
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