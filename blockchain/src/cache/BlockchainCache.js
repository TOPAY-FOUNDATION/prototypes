/**
 * TOPAY Foundation Blockchain Cache System
 * Simple file-based caching for demo blockchain data persistence
 */

import fs from 'fs';
import path from 'path';

class BlockchainCache {
  constructor(cacheDir = './cache') {
    // For serverless environments, use /tmp directory
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      this.cacheDir = '/tmp/blockchain-cache';
    } else {
      this.cacheDir = path.resolve(cacheDir);
    }
    
    this.blockchainFile = path.join(this.cacheDir, 'blockchain.json');
    this.statsFile = path.join(this.cacheDir, 'stats.json');
    this.configFile = path.join(this.cacheDir, 'config.json');
    
    this.ensureCacheDirectory();
  }

  /**
   * Ensure cache directory exists
   */
  ensureCacheDirectory() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
        console.log(`📁 Created cache directory: ${this.cacheDir}`);
      }
    } catch (error) {
      console.error('❌ Failed to create cache directory:', error.message);
    }
  }

  /**
   * Save blockchain data to cache
   * @param {Array} chain - The blockchain array
   * @param {number} difficulty - Current mining difficulty
   * @param {Object} tokens - Token data
   */
  saveBlockchain(chain, difficulty = 2, tokens = null) {
    try {
      const blockchainData = {
        chain: chain.map(block => ({
          index: block.index,
          timestamp: block.timestamp,
          data: block.data,
          previousHash: block.previousHash,
          hash: block.hash,
          nonce: block.nonce
        })),
        difficulty: difficulty,
        tokens: tokens,
        lastUpdated: Date.now(),
        version: '2.0.0'
      };

      fs.writeFileSync(this.blockchainFile, JSON.stringify(blockchainData, null, 2));
      console.log(`💾 Blockchain cached: ${chain.length} blocks saved`);
      
      // Also save stats
      this.saveStats({
        totalBlocks: chain.length,
        difficulty: difficulty,
        lastBlockTime: chain.length > 0 ? chain[chain.length - 1].timestamp : null,
        cacheUpdated: Date.now()
      });

    } catch (error) {
      console.error('❌ Failed to save blockchain to cache:', error.message);
    }
  }

  /**
   * Load blockchain data from cache
   * @returns {Object|null} Cached blockchain data or null if not found
   */
  loadBlockchain() {
    try {
      if (!fs.existsSync(this.blockchainFile)) {
        console.log('📂 No cached blockchain found, starting fresh');
        return null;
      }

      const data = fs.readFileSync(this.blockchainFile, 'utf8');
      const blockchainData = JSON.parse(data);
      
      console.log(`📥 Loaded cached blockchain: ${blockchainData.chain.length} blocks`);
      console.log(`⚙️  Cached difficulty: ${blockchainData.difficulty}`);
      
      return blockchainData;
    } catch (error) {
      console.error('❌ Failed to load blockchain from cache:', error.message);
      return null;
    }
  }

  /**
   * Save blockchain statistics
   * @param {Object} stats - Statistics object
   */
  saveStats(stats) {
    try {
      const statsData = {
        ...stats,
        savedAt: Date.now()
      };

      fs.writeFileSync(this.statsFile, JSON.stringify(statsData, null, 2));
    } catch (error) {
      console.error('❌ Failed to save stats to cache:', error.message);
    }
  }

  /**
   * Load blockchain statistics
   * @returns {Object|null} Cached stats or null if not found
   */
  loadStats() {
    try {
      if (!fs.existsSync(this.statsFile)) {
        return null;
      }

      const data = fs.readFileSync(this.statsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load stats from cache:', error.message);
      return null;
    }
  }

  /**
   * Save configuration data
   * @param {Object} config - Configuration object
   */
  saveConfig(config) {
    try {
      const configData = {
        ...config,
        savedAt: Date.now()
      };

      fs.writeFileSync(this.configFile, JSON.stringify(configData, null, 2));
      console.log('⚙️  Configuration saved to cache');
    } catch (error) {
      console.error('❌ Failed to save config to cache:', error.message);
    }
  }

  /**
   * Load configuration data
   * @returns {Object|null} Cached config or null if not found
   */
  loadConfig() {
    try {
      if (!fs.existsSync(this.configFile)) {
        return null;
      }

      const data = fs.readFileSync(this.configFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load config from cache:', error.message);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    try {
      const files = [this.blockchainFile, this.statsFile, this.configFile];
      
      files.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });

      console.log('🗑️  Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear cache:', error.message);
      return false;
    }
  }

  /**
   * Get cache information
   * @returns {Object} Cache information
   */
  getCacheInfo() {
    try {
      const info = {
        cacheDir: this.cacheDir,
        files: {
          blockchain: fs.existsSync(this.blockchainFile),
          stats: fs.existsSync(this.statsFile),
          config: fs.existsSync(this.configFile)
        },
        sizes: {}
      };

      // Get file sizes
      if (info.files.blockchain) {
        info.sizes.blockchain = fs.statSync(this.blockchainFile).size;
      }
      if (info.files.stats) {
        info.sizes.stats = fs.statSync(this.statsFile).size;
      }
      if (info.files.config) {
        info.sizes.config = fs.statSync(this.configFile).size;
      }

      return info;
    } catch (error) {
      console.error('❌ Failed to get cache info:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Export cached data for backup
   * @returns {Object} All cached data
   */
  exportCache() {
    try {
      return {
        blockchain: this.loadBlockchain(),
        stats: this.loadStats(),
        config: this.loadConfig(),
        exportedAt: Date.now()
      };
    } catch (error) {
      console.error('❌ Failed to export cache:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Import cached data from backup
   * @param {Object} cacheData - Cache data to import
   * @returns {boolean} Success status
   */
  importCache(cacheData) {
    try {
      if (cacheData.blockchain) {
        fs.writeFileSync(this.blockchainFile, JSON.stringify(cacheData.blockchain, null, 2));
      }
      
      if (cacheData.stats) {
        fs.writeFileSync(this.statsFile, JSON.stringify(cacheData.stats, null, 2));
      }
      
      if (cacheData.config) {
        fs.writeFileSync(this.configFile, JSON.stringify(cacheData.config, null, 2));
      }

      console.log('📥 Cache imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import cache:', error.message);
      return false;
    }
  }

  /**
   * Auto-save blockchain data periodically
   * @param {Function} getBlockchainData - Function that returns current blockchain data
   * @param {number} intervalMs - Save interval in milliseconds (default: 30 seconds)
   */
  startAutoSave(getBlockchainData, intervalMs = 30000) {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      try {
        const { chain, difficulty } = getBlockchainData();
        this.saveBlockchain(chain, difficulty);
      } catch (error) {
        console.error('❌ Auto-save failed:', error.message);
      }
    }, intervalMs);

    console.log(`⏰ Auto-save enabled: every ${intervalMs / 1000} seconds`);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏰ Auto-save disabled');
    }
  }
}

export { BlockchainCache };