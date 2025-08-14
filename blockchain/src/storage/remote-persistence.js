/**
 * Remote Persistence Manager for TOPAY Blockchain
 * Stores blockchain data on remote validator nodes via RPC
 */

import fetch from 'node-fetch';
import { ValidatorRegistry } from './validator-registry.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class RemotePersistenceManager {
  constructor(validatorCodes = [], options = {}) {
    
    // Initialize validator registry
    this.validatorRegistry = new ValidatorRegistry(options);
    
    // Use validator codes instead of direct URLs
    this.validatorCodes = validatorCodes.length > 0 ? validatorCodes : 
        (process.env.VALIDATOR_CODES ? process.env.VALIDATOR_CODES.split(',').map(code => code.trim()) : 
        ['TOPAY-VAL-LOCAL-001', 'TOPAY-VAL-LOCAL-002']);
    
    this.options = {
      timeout: options.timeout || parseInt(process.env.NETWORK_TIMEOUT) || 10000,
      maxRetries: options.maxRetries || parseInt(process.env.MAX_RETRIES) || 3,
      retryDelay: options.retryDelay || parseInt(process.env.RETRY_DELAY) || 1000,
      replicationFactor: options.replicationFactor || parseInt(process.env.STORAGE_REPLICATION) || 2,
      enableBackup: options.enableBackup !== undefined ? options.enableBackup : 
          (process.env.BACKUP_ENABLED === 'true'),
      enableReplication: options.enableReplication !== undefined ? options.enableReplication : 
          (process.env.STORAGE_REPLICATION && parseInt(process.env.STORAGE_REPLICATION) > 1),
      ...options
    };
    
    this.activeNodes = new Set();
    this.failedNodes = new Set();
    
    console.log('🔗 RemotePersistenceManager Configuration:');
    console.log(`   Validator Codes: ${this.validatorCodes.join(', ')}`);
    console.log(`   Timeout: ${this.options.timeout}ms`);
    console.log(`   Max Retries: ${this.options.maxRetries}`);
    console.log(`   Retry Delay: ${this.options.retryDelay}ms`);
    console.log(`   Replication Factor: ${this.options.replicationFactor}`);
    console.log(`   Backup Enabled: ${this.options.enableBackup}`);
    console.log(`   Replication Enabled: ${this.options.enableReplication}`);
  }

  /**
   * Initialize remote storage by checking validator node availability
   */
  async initialize() {
    console.log('🔄 Initializing remote persistence...');
    
    if (this.validatorCodes.length === 0) {
      console.log('⚠️  No validator codes configured, running in standalone mode');
      return;
    }
    
    // Connect to validators using codes
    const connectionResults = await this.validatorRegistry.connectToValidators(this.validatorCodes);
    
    connectionResults.forEach(result => {
      if (result.success) {
        this.activeNodes.add(result.code);
        console.log(`✅ Connected to validator: ${result.code}`);
      } else {
        this.failedNodes.add(result.code);
        console.log(`❌ Failed to connect to validator: ${result.code} - ${result.error}`);
      }
    });
    
    if (this.activeNodes.size === 0) {
      console.warn('⚠️  No validator nodes are available, running in standalone mode');
      console.log('🔄 Will retry validator connections periodically...');
      this.startValidatorRetryTimer();
    } else {
      console.log(`✅ Remote persistence initialized with ${this.activeNodes.size}/${this.validatorCodes.length} validators`);
    }
  }

  /**
   * Test connection to a validator node
   */
  async testNodeConnection(nodeUrl) {
    const response = await this.makeRequest(nodeUrl, '/api/status');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data.status || data.status !== 'running') {
      throw new Error('Validator not running');
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest(validatorCode, endpoint, method = 'GET', data = null) {
    const validator = this.validatorRegistry.getValidator(validatorCode);
    if (!validator) {
      throw new Error(`Validator ${validatorCode} not found in registry`);
    }

    return await this.validatorRegistry.makeRequest(validator.url, endpoint, method, data);
  }

  /**
   * Save blockchain data to remote validators
   */
  async saveBlockchain(blockchain) {
    console.log('💾 Saving blockchain to remote storage...');
    
    const blockchainData = {
      blocks: blockchain.chain,
      pendingTransactions: blockchain.pendingTransactions,
      miningReward: blockchain.miningReward,
      difficulty: blockchain.difficulty,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Get best validators for saving
    const bestValidators = this.validatorRegistry.getBestValidators(this.options.replicationFactor);
    const validatorCodes = bestValidators.map(v => v.code);

    if (validatorCodes.length === 0) {
      throw new Error('No active validators available for saving blockchain');
    }

    const results = await this.validatorRegistry.saveToValidators(
      validatorCodes, 
      '/api/blockchain', 
      blockchainData
    );

    const successCount = results.filter(r => r.success).length;
    if (successCount === 0) {
      throw new Error('Failed to save blockchain to any validator node');
    }

    console.log(`📊 Blockchain saved to ${successCount}/${validatorCodes.length} validators`);
    return results;
  }

  /**
   * Load blockchain data from remote validators
   */
  async loadBlockchain() {
    console.log('📥 Loading blockchain from remote storage...');
    
    // Get active validator codes
    const activeValidators = this.validatorRegistry.getActiveValidators();
    const validatorCodes = activeValidators.map(v => v.code);
    
    if (validatorCodes.length === 0) {
        throw new Error('No active validators available for loading blockchain');
    }

    try {
        const data = await this.validatorRegistry.loadFromValidators(validatorCodes, '/api/blockchain');
        console.log(`📊 Loaded ${data.blocks?.length || 0} blocks from validator`);
        return data;
    } catch (error) {
        throw new Error(`Failed to load blockchain from any validator node: ${error.message}`);
    }
  }

  /**
   * Save wallets data to remote validators - REMOVED
   * This functionality has been removed as part of wallet integration removal
   */
  async saveWallets(wallets) {
    console.log('⚠️ Wallet functionality has been removed');
    return false;
  }

  /**
   * Load wallets data from remote validators - REMOVED
   * This functionality has been removed as part of wallet integration removal
   */
  async loadWallets() {
    console.log('⚠️ Wallet functionality has been removed');
    return null;
  }

  /**
   * Save configuration to remote validators
   */
  async saveConfig(config) {
    console.log('⚙️ Saving configuration to remote validators...');
    
    const configData = {
      ...config,
      savedAt: new Date().toISOString(),
      version: '1.0',
      nodeId: this.getNodeId()
    };

    const results = await this.replicateData('config', configData);
    
    if (results.successful.length === 0) {
      throw new Error('Failed to save configuration to any validator node');
    }

    console.log(`✅ Configuration saved to ${results.successful.length}/${this.activeNodes.size} validators`);
    
    return results.successful.length > 0;
  }

  /**
   * Load configuration from remote validators
   */
  async loadConfig() {
    console.log('⚙️ Loading configuration from remote validators...');
    
    const results = await this.fetchFromValidators('config');
    
    if (results.length === 0) {
      console.log('⚙️ No configuration found on validators, using defaults');
      return null;
    }

    // Use the most recent configuration
    const latestData = results.reduce((latest, current) => {
      const currentTime = new Date(current.data.savedAt).getTime();
      const latestTime = new Date(latest.data.savedAt).getTime();
      return currentTime > latestTime ? current : latest;
    });

    console.log(`⚙️ Configuration loaded from validator: ${latestData.nodeUrl}`);
    
    return latestData.data;
  }

  /**
   * Save individual wallet to remote validators - REMOVED
   * This functionality has been removed as part of wallet integration removal
   */
  async saveWallet(walletData) {
    console.log('⚠️ Wallet functionality has been removed');
    return { successful: [], failed: [] };
  }

  /**
   * Load individual wallet from remote validators - REMOVED
   * This functionality has been removed as part of wallet integration removal
   */
  async loadWallet(address) {
    console.log('⚠️ Wallet functionality has been removed');
    return null;
  }

  /**
   * Get validator registry status
   */
  getValidatorStatus() {
    return {
      totalValidators: this.validatorRegistry.getAllValidators().length,
      activeValidators: this.validatorRegistry.getActiveValidators().length,
      failedValidators: this.failedNodes.size,
      validatorCodes: this.validatorCodes,
      registryHealth: this.validatorRegistry.exportConfig()
    };
  }

  /**
   * Add new validator to registry
   */
  addValidator(validatorInfo) {
    return this.validatorRegistry.registerValidator(validatorInfo);
  }

  /**
   * Remove validator from registry
   */
  removeValidator(code) {
    const validator = this.validatorRegistry.getValidator(code);
    if (validator) {
      this.validatorRegistry.validators.delete(code);
      this.activeNodes.delete(code);
      this.failedNodes.delete(code);
      console.log(`🗑️ Removed validator: ${code}`);
      return true;
    }
    return false;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.validatorRegistry) {
      this.validatorRegistry.destroy();
    }
    this.activeNodes.clear();
    this.failedNodes.clear();
    console.log('🧹 RemotePersistenceManager destroyed');
  }

  /**
   * Auto-save functionality with remote storage
   */
  async enableAutoSave(blockchain, interval = 30000) { // 30 seconds
    console.log(`🔄 Remote auto-save enabled (every ${interval/1000} seconds)`);
    
    setInterval(async () => {
      try {
        await this.saveBlockchain(blockchain);
        // Wallet saving removed as part of wallet integration removal
        console.log('🔄 Remote auto-save completed');
      } catch (error) {
        console.error('❌ Remote auto-save failed:', error);
      }
    }, interval);
  }

  /**
   * Create backup across all validators
   */
  async createBackup(suffix = '') {
    console.log('💾 Creating backup across all validators...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}${suffix}`;

    const results = { successful: [], failed: [] };
    const promises = Array.from(this.activeNodes).map(async (nodeUrl) => {
      try {
        const response = await this.makeRequest(nodeUrl, `/api/storage/backup`, {
          method: 'POST',
          body: JSON.stringify({ backupId, timestamp })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        results.successful.push({ nodeUrl, result });
      } catch (error) {
        results.failed.push({ nodeUrl, error: error.message });
      }
    });

    await Promise.allSettled(promises);

    console.log(`💾 Backup created on ${results.successful.length}/${this.activeNodes.size} validators`);
    if (results.failed.length > 0) {
      console.warn(`⚠️ Backup failed on ${results.failed.length} validators:`, results.failed);
    }

    return { backupId, results };
  }

  /**
   * Get storage statistics from all validators
   */
  async getStats() {
    console.log('📊 Gathering storage statistics from validators...');
    
    const stats = {
      validators: {
        total: this.validatorNodes.length,
        active: this.activeNodes.size,
        failed: this.failedNodes.size
      },
      storage: {},
      replicationFactor: this.options.replicationFactor
    };

    const promises = Array.from(this.activeNodes).map(async (nodeUrl) => {
      try {
        const response = await this.makeRequest(nodeUrl, '/api/storage/stats');
        if (response.ok) {
          const nodeStats = await response.json();
          stats.storage[nodeUrl] = nodeStats;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get stats from ${nodeUrl}:`, error.message);
      }
    });

    await Promise.allSettled(promises);
    return stats;
  }

  /**
   * Get a unique node identifier
   */
  getNodeId() {
    return `blockchain-node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a new validator node
   */
  async addValidatorNode(nodeUrl) {
    if (this.validatorNodes.includes(nodeUrl)) {
      console.warn(`⚠️ Validator node already exists: ${nodeUrl}`);
      return false;
    }

    try {
      await this.testNodeConnection(nodeUrl);
      this.validatorNodes.push(nodeUrl);
      this.activeNodes.add(nodeUrl);
      this.failedNodes.delete(nodeUrl);
      console.log(`✅ Added validator node: ${nodeUrl}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to add validator node ${nodeUrl}:`, error.message);
      return false;
    }
  }

  /**
   * Remove a validator node
   */
  removeValidatorNode(nodeUrl) {
    const index = this.validatorNodes.indexOf(nodeUrl);
    if (index === -1) {
      console.warn(`⚠️ Validator node not found: ${nodeUrl}`);
      return false;
    }

    this.validatorNodes.splice(index, 1);
    this.activeNodes.delete(nodeUrl);
    this.failedNodes.delete(nodeUrl);
    console.log(`🗑️ Removed validator node: ${nodeUrl}`);
    return true;
  }

  /**
   * Get list of active validator nodes
   */
  getActiveNodes() {
    return Array.from(this.activeNodes);
  }

  /**
   * Get list of failed validator nodes
   */
  getFailedNodes() {
    return Array.from(this.failedNodes);
  }

  /**
   * Start validator retry timer to periodically attempt reconnection
   */
  startValidatorRetryTimer() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }
    
    this.retryTimer = setInterval(async () => {
      if (this.activeNodes.size === 0 && this.validatorCodes.length > 0) {
        console.log('🔄 Retrying validator connections...');
        try {
          const connectionResults = await this.validatorRegistry.connectToValidators(this.validatorCodes);
          
          connectionResults.forEach(result => {
            if (result.success) {
              this.activeNodes.add(result.code);
              this.failedNodes.delete(result.code);
              console.log(`✅ Reconnected to validator: ${result.code}`);
            }
          });
          
          if (this.activeNodes.size > 0) {
            console.log(`✅ Successfully connected to ${this.activeNodes.size} validators`);
            clearInterval(this.retryTimer);
            this.retryTimer = null;
          }
        } catch (error) {
          console.log('🔄 Validator retry failed, will try again in 30 seconds...');
        }
      }
    }, 30000); // Retry every 30 seconds
  }
}