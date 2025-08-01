import fs from 'fs/promises';
import path from 'path';

/**
 * Persistent storage manager for blockchain and wallet data
 */
export class PersistenceManager {
  constructor(dataDir = './data') {
    this.dataDir = path.resolve(dataDir);
    this.blockchainFile = path.join(this.dataDir, 'blockchain.json');
    this.walletsFile = path.join(this.dataDir, 'wallets.json');
    this.configFile = path.join(this.dataDir, 'config.json');
  }

  /**
   * Initialize storage directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`📁 Storage directory initialized: ${this.dataDir}`);
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
      throw error;
    }
  }

  /**
   * Save blockchain data to file
   */
  async saveBlockchain(blockchain) {
    try {
      const data = {
        ...blockchain.exportChain(),
        savedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      await fs.writeFile(this.blockchainFile, JSON.stringify(data, null, 2));
      console.log(`💾 Blockchain saved to ${this.blockchainFile}`);
      console.log(`   Blocks: ${data.chain.length}`);
      console.log(`   Size: ${JSON.stringify(data).length} bytes`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save blockchain:', error);
      return false;
    }
  }

  /**
   * Load blockchain data from file
   */
  async loadBlockchain() {
    try {
      const data = await fs.readFile(this.blockchainFile, 'utf8');
      const blockchainData = JSON.parse(data);
      
      console.log(`📂 Blockchain loaded from ${this.blockchainFile}`);
      console.log(`   Blocks: ${blockchainData.chain.length}`);
      console.log(`   Saved: ${blockchainData.savedAt}`);
      
      return blockchainData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('📂 No existing blockchain file found, starting fresh');
        return null;
      }
      console.error('❌ Failed to load blockchain:', error);
      throw error;
    }
  }

  /**
   * Save wallets data to file
   */
  async saveWallets(wallets) {
    try {
      const walletsData = {
        wallets: Array.from(wallets.entries()).map(([address, wallet]) => ({
          address,
          publicData: wallet.exportPublicData(),
          backup: wallet.createBackup()
        })),
        savedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      await fs.writeFile(this.walletsFile, JSON.stringify(walletsData, null, 2));
      console.log(`👛 Wallets saved to ${this.walletsFile}`);
      console.log(`   Count: ${walletsData.wallets.length}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save wallets:', error);
      return false;
    }
  }

  /**
   * Load wallets data from file
   */
  async loadWallets() {
    try {
      const data = await fs.readFile(this.walletsFile, 'utf8');
      const walletsData = JSON.parse(data);
      
      console.log(`👛 Wallets loaded from ${this.walletsFile}`);
      console.log(`   Count: ${walletsData.wallets.length}`);
      console.log(`   Saved: ${walletsData.savedAt}`);
      
      return walletsData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('👛 No existing wallets file found, starting fresh');
        return null;
      }
      console.error('❌ Failed to load wallets:', error);
      throw error;
    }
  }

  /**
   * Save configuration
   */
  async saveConfig(config) {
    try {
      const configData = {
        ...config,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      await fs.writeFile(this.configFile, JSON.stringify(configData, null, 2));
      console.log(`⚙️ Configuration saved to ${this.configFile}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save configuration:', error);
      return false;
    }
  }

  /**
   * Load configuration
   */
  async loadConfig() {
    try {
      const data = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(data);
      
      console.log(`⚙️ Configuration loaded from ${this.configFile}`);
      
      return config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('⚙️ No existing configuration found, using defaults');
        return null;
      }
      console.error('❌ Failed to load configuration:', error);
      throw error;
    }
  }

  /**
   * Auto-save functionality
   */
  async enableAutoSave(blockchain, interval = 30000) { // 30 seconds
    console.log(`🔄 Auto-save enabled (every ${interval/1000} seconds)`);
    
    setInterval(async () => {
      try {
        await this.saveBlockchain(blockchain);
        await this.saveWallets(blockchain.wallets);
        console.log('🔄 Auto-save completed');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, interval);
  }

  /**
   * Create backup
   */
  async createBackup(suffix = '') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.dataDir, 'backups', `backup-${timestamp}${suffix}`);
      
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy all data files
      const files = [this.blockchainFile, this.walletsFile, this.configFile];
      
      for (const file of files) {
        try {
          const filename = path.basename(file);
          await fs.copyFile(file, path.join(backupDir, filename));
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
      
      console.log(`💾 Backup created: ${backupDir}`);
      return backupDir;
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * List all backups
   */
  async listBackups() {
    try {
      const backupDir = path.join(this.dataDir, 'backups');
      const backups = await fs.readdir(backupDir);
      
      return backups.map(backup => ({
        name: backup,
        path: path.join(backupDir, backup),
        created: backup.match(/backup-(.+)/)?.[1]?.replace(/-/g, ':') || 'unknown'
      }));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    try {
      const stats = {
        dataDir: this.dataDir,
        files: {},
        totalSize: 0
      };

      const files = [
        { name: 'blockchain', path: this.blockchainFile },
        { name: 'wallets', path: this.walletsFile },
        { name: 'config', path: this.configFile }
      ];

      for (const file of files) {
        try {
          const stat = await fs.stat(file.path);
          stats.files[file.name] = {
            exists: true,
            size: stat.size,
            modified: stat.mtime
          };
          stats.totalSize += stat.size;
        } catch (error) {
          stats.files[file.name] = {
            exists: false,
            size: 0,
            modified: null
          };
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      throw error;
    }
  }
}