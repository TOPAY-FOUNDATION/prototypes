/**
 * TOPAY Foundation Quantum-Safe Blockchain Network Node
 * Production Network Entry Point
 * 
 * Starts the actual blockchain network with:
 * - Genesis block mining
 * - Full RPC server functionality
 * - Network synchronization capabilities
 * - Persistent storage
 */

import dotenv from 'dotenv';
import { Blockchain } from './blockchain/blockchain.js';
import { BlockchainRPCServer } from './blockchain-rpc-server.js';
import { RemotePersistenceManager } from './storage/remote-persistence.js';
import { PersistenceManager } from './storage/persistence.js';
import { Transaction } from './blockchain/transaction.js';
import os from 'os';
import path from 'path';

// Load environment variables
dotenv.config();

class TOPAYNetworkNode {
  constructor(options = {}) {
    // Load configuration from environment variables with fallbacks
    this.nodeId = options.nodeId || process.env.NODE_ID || `node-${Date.now()}`;
    this.port = options.port || parseInt(process.env.BLOCKCHAIN_PORT) || 8545;
    this.minerAddress = options.minerAddress || process.env.MINER_ADDRESS || null;
    this.autoMining = options.autoMining || process.env.AUTO_MINING === 'true' || false;
    this.miningInterval = options.miningInterval || parseInt(process.env.MINING_INTERVAL) || 30000;
    
    // Configure validator codes from environment variables
    let validatorCodes;
    if (options.validatorCodes) {
      // Command line argument takes precedence
      validatorCodes = options.validatorCodes;
    } else if (process.env.VALIDATOR_CODES) {
      // Parse comma-separated codes from environment
      validatorCodes = process.env.VALIDATOR_CODES.split(',').map(code => code.trim());
    } else {
      // Use empty array to let RemotePersistenceManager use defaults and sync with RPC
      validatorCodes = [];
    }
    
    // Network configuration from environment
    this.networkTimeout = parseInt(process.env.NETWORK_TIMEOUT) || 5000;
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.retryDelay = parseInt(process.env.RETRY_DELAY) || 1000;
    
    // Storage configuration
    this.enableRemoteStorage = process.env.ENABLE_REMOTE_STORAGE !== 'false';
    this.storageReplication = process.env.STORAGE_REPLICATION !== 'false';
    this.backupEnabled = process.env.BACKUP_ENABLED !== 'false';
    
    // Debug configuration
    this.debugMode = process.env.DEBUG_MODE === 'true';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    
    console.log(`🔧 Configuration loaded from environment:`);
    console.log(`   Node ID: ${this.nodeId}`);
    console.log(`   Port: ${this.port}`);
    console.log(`   Validator Codes: ${validatorCodes.length > 0 ? validatorCodes.join(', ') : 'Auto-detect from RPC'}`);
    console.log(`   Remote Storage: ${this.enableRemoteStorage ? 'Enabled' : 'Disabled'}`);
    console.log(`   Auto Mining: ${this.autoMining ? 'Enabled' : 'Disabled'}`);
    
    this.blockchain = null;
    this.rpcServer = null;
    
    // Configure node-specific storage path
    const storagePath = this.getNodeStoragePath();
    console.log(`💾 Node storage path: ${storagePath}`);
    this.localPersistence = new PersistenceManager(storagePath);
    this.remotePersistence = new RemotePersistenceManager(validatorCodes, {
      timeout: this.networkTimeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      replication: this.storageReplication,
      backup: this.backupEnabled
    });
    this.persistence = this.enableRemoteStorage ? this.remotePersistence : this.localPersistence;
    this.miningTimer = null;
    this.isRunning = false;
  }

  /**
   * Get node-specific storage path
   */
  getNodeStoragePath() {
    // Check for explicit storage path in environment
    const envStoragePath = process.env.STORAGE_PATH;
    if (envStoragePath && envStoragePath.trim()) {
      return path.resolve(envStoragePath.trim());
    }
    
    // Generate node-specific path in user's home directory
    const homeDir = os.homedir();
    const nodeSpecificDir = `TOPAY-Blockchain-${this.nodeId}-${this.port}`;
    const defaultPath = path.join(homeDir, 'TOPAY-Blockchain', nodeSpecificDir, 'data');
    
    return defaultPath;
  }

  /**
   * Initialize the network node
   */
  async initialize() {
    console.log('🚀 TOPAY Foundation Quantum-Safe Blockchain Network Node');
    console.log('=' .repeat(70));
    console.log(`📡 Node ID: ${this.nodeId}`);
    console.log(`🌐 RPC Port: ${this.port}`);
    console.log(`⛏️  Auto Mining: ${this.autoMining ? 'Enabled' : 'Disabled'}`);
    console.log(`🔗 Validator Codes: ${this.persistence.validatorCodes.join(', ')}`);
    
    // Load or create blockchain first (without validator dependency)
    await this.initializeBlockchain();
    
    // Initialize RPC server with our blockchain instance
    this.rpcServer = new BlockchainRPCServer(this.port);
    this.rpcServer.blockchain = this.blockchain; // Use our blockchain instance
    this.rpcServer.persistence = this.localPersistence; // Use our persistence manager
    
    console.log('\n✅ Network node initialized successfully!');
  }

  /**
   * Initialize blockchain with genesis block mining
   */
  async initializeBlockchain() {
    console.log('\n📊 Initializing blockchain...');
    
    // Always try to load from local storage first
    console.log('📂 Checking local storage for existing blockchain...');
    const localBlockchain = await this.localPersistence.loadBlockchain();
    
    if (localBlockchain && localBlockchain.chain && localBlockchain.chain.length > 1) {
      console.log('📂 Loading existing blockchain from local storage...');
      this.blockchain = new Blockchain();
      try {
        this.blockchain.importChain(localBlockchain);
        console.log(`✅ Blockchain loaded from local storage: ${this.blockchain.chain.length} blocks`);
        console.log(`💰 Mining reward: ${this.blockchain.miningReward} TOPAY`);
        console.log(`⚡ Current difficulty: ${this.blockchain.difficulty}`);
        
        // Validate the loaded chain
        const isValid = await this.blockchain.isChainValid();
        if (!isValid) {
          console.log('⚠️  Loaded blockchain is invalid, creating new one...');
          await this.createNewBlockchain();
        }
      } catch (error) {
        console.error('❌ Failed to load blockchain from local storage:', error.message);
        console.log('🆕 Creating new blockchain...');
        await this.createNewBlockchain();
      }
    } else {
      console.log('🆕 No existing blockchain found in local storage, creating new one...');
      await this.createNewBlockchain();
    }
  }

  /**
   * Sync blockchain with remote storage
   */
  async syncWithRemoteStorage() {
    console.log('\n🔄 Syncing blockchain with remote storage...');
    
    try {
      // Try to load blockchain from remote storage
      const remoteBlockchain = await this.remotePersistence.loadBlockchain();
      
      if (remoteBlockchain && remoteBlockchain.chain && remoteBlockchain.chain.length > this.blockchain.chain.length) {
        console.log(`📥 Remote blockchain has more blocks (${remoteBlockchain.chain.length} vs ${this.blockchain.chain.length})`);
        console.log('🔄 Updating local blockchain with remote data...');
        
        // Validate remote blockchain before importing
        const tempBlockchain = new Blockchain();
        tempBlockchain.importChain(remoteBlockchain);
        const isValid = await tempBlockchain.isChainValid();
        
        if (isValid) {
          this.blockchain = tempBlockchain;
          await this.localPersistence.saveBlockchain(this.blockchain);
          console.log('✅ Local blockchain updated from remote storage');
        } else {
          console.warn('⚠️  Remote blockchain is invalid, keeping local version');
        }
      } else if (this.blockchain.chain.length > 1) {
        console.log('📤 Uploading local blockchain to remote storage...');
        await this.remotePersistence.saveBlockchain(this.blockchain);
        console.log('✅ Local blockchain uploaded to remote storage');
      }
    } catch (error) {
      console.warn('⚠️  Failed to sync with remote storage:', error.message);
    }
  }

  /**
   * Create new blockchain and mine genesis block
   */
  async createNewBlockchain() {
    this.blockchain = new Blockchain();
    
    console.log('\n⛏️  Mining Genesis Block...');
    console.log('🔨 This may take a moment depending on difficulty...');
    
    // Create a special genesis miner address if none provided
    const genesisMiner = this.minerAddress || 'TOPAY0000000000000000000000000000000000000000000000';
    
    // Mine the first block after genesis (which contains the first mining reward)
    const startTime = Date.now();
    await this.blockchain.minePendingTransactions(genesisMiner);
    const miningTime = (Date.now() - startTime) / 1000;
    
    console.log(`✅ Genesis block mined successfully!`);
    console.log(`⏱️  Mining time: ${miningTime.toFixed(2)} seconds`);
    console.log(`🏆 Genesis miner: ${genesisMiner}`);
    console.log(`💰 Genesis reward: ${this.blockchain.miningReward} TOPAY`);
    console.log(`🔗 Genesis block hash: ${this.blockchain.getLatestBlock().hash.substring(0, 20)}...`);
    
    // Save the new blockchain to local storage
    await this.localPersistence.saveBlockchain(this.blockchain);
    console.log('💾 Blockchain saved to local storage');
  }

  /**
   * Start the network node
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Network node is already running');
      return;
    }

    await this.initialize();
    
    // Start RPC server first
    console.log('\n🌐 Starting RPC server...');
    await this.rpcServer.start();
    
    // Now initialize remote persistence with validators (RPC server is available)
    if (this.enableRemoteStorage) {
      console.log('\n🔄 Initializing remote persistence...');
      try {
        await this.remotePersistence.initialize();
        console.log('✅ Remote persistence initialized successfully!');
        
        // Sync with remote storage
        await this.syncWithRemoteStorage();
      } catch (error) {
        console.warn('⚠️  Remote persistence initialization failed:', error.message);
        console.log('🔄 Continuing with local storage only...');
      }
    }
    
    // Start auto-mining if enabled
    if (this.autoMining && this.minerAddress) {
      this.startAutoMining();
    }
    
    // Setup graceful shutdown
    this.setupGracefulShutdown();
    
    this.isRunning = true;
    
    // Display network information
    this.displayNetworkInfo();
    
    console.log('\n🎉 TOPAY Network Node is now running!');
    console.log('🔗 Ready to accept RPC calls and process transactions');
    console.log('📡 Network synchronization ready');
    console.log('\n💡 Use Ctrl+C to gracefully shutdown the node');
  }

  /**
   * Start automatic mining
   */
  startAutoMining() {
    console.log(`\n⛏️  Starting auto-mining with address: ${this.minerAddress}`);
    console.log(`⏰ Mining interval: ${this.miningInterval / 1000} seconds`);
    
    this.miningTimer = setInterval(async () => {
      try {
        if (this.blockchain.mempool.length > 0) {
          console.log(`\n🚀 Auto-mining: ${this.blockchain.mempool.length} transactions in mempool`);
          const startTime = Date.now();
          await this.blockchain.minePendingTransactions(this.minerAddress);
          const miningTime = (Date.now() - startTime) / 1000;
          
          console.log(`✅ Block mined in ${miningTime.toFixed(2)} seconds`);
          console.log(`💰 Mining reward: ${this.blockchain.miningReward} TOPAY`);
          
          // Save blockchain after mining to local storage
          await this.localPersistence.saveBlockchain(this.blockchain);
          
          // Also save to remote storage if available
          if (this.enableRemoteStorage && this.remotePersistence.hasActiveNodes()) {
            try {
              await this.remotePersistence.saveBlockchain(this.blockchain);
            } catch (error) {
              console.warn('⚠️  Failed to save to remote storage:', error.message);
            }
          }
        } else {
          console.log('⏳ Auto-mining: No transactions to mine');
        }
      } catch (error) {
        console.error('❌ Auto-mining error:', error.message);
      }
    }, this.miningInterval);
  }

  /**
   * Stop automatic mining
   */
  stopAutoMining() {
    if (this.miningTimer) {
      clearInterval(this.miningTimer);
      this.miningTimer = null;
      console.log('⛏️  Auto-mining stopped');
    }
  }

  /**
   * Display network information
   */
  displayNetworkInfo() {
    console.log('\n📊 Network Information:');
    console.log('=' .repeat(50));
    console.log(`🔗 RPC Endpoint: http://localhost:${this.port}/rpc`);
    console.log(`🏥 Health Check: http://localhost:${this.port}/health`);
    console.log(`📋 RPC Methods: http://localhost:${this.port}/api/rpc/methods`);
    console.log(`🧱 Total Blocks: ${this.blockchain.chain.length}`);
    console.log(`💎 Current Difficulty: ${this.blockchain.difficulty}`);
    console.log(`💰 Mining Reward: ${this.blockchain.miningReward} TOPAY`);
    console.log(`📝 Mempool Size: ${this.blockchain.mempool.length}`);
    
    if (this.minerAddress) {
      const balance = this.blockchain.getBalance(this.minerAddress);
      console.log(`⛏️  Miner Balance: ${balance} TOPAY`);
    }
    
    console.log('\n🔧 Available RPC Methods:');
    console.log('  • topay_getBlockNumber - Get latest block number');
    console.log('  • topay_getBalance(address) - Get address balance');
    console.log('  • topay_getBlock(blockId) - Get block details');
    console.log('  • topay_sendTransaction(txData) - Send transaction');
    console.log('  • topay_mine(minerAddress) - Mine pending transactions');
    console.log('  • topay_getChainInfo() - Get blockchain info');
    console.log('  • topay_getMempool() - Get pending transactions');
    console.log('  • topay_validateChain() - Validate blockchain');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      this.stopAutoMining();
      
      // Save final blockchain state to local storage
      try {
        await this.localPersistence.saveBlockchain(this.blockchain);
        console.log('💾 Final blockchain state saved to local storage');
      } catch (error) {
        console.error('❌ Failed to save final state to local storage:', error.message);
      }
      
      // Also save to remote storage if available
      if (this.enableRemoteStorage && this.remotePersistence.hasActiveNodes()) {
        try {
          await this.remotePersistence.saveBlockchain(this.blockchain);
          console.log('💾 Final blockchain state saved to remote storage');
        } catch (error) {
          console.error('❌ Failed to save final state to remote storage:', error.message);
        }
      }
      
      // Cleanup persistence managers
      try {
        if (this.remotePersistence) {
          await this.remotePersistence.destroy();
        }
      } catch (error) {
        console.error('❌ Failed to cleanup remote persistence:', error.message);
      }
      
      console.log('👋 TOPAY Network Node shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    return {
      nodeId: this.nodeId,
      isRunning: this.isRunning,
      blockchain: {
        blocks: this.blockchain.chain.length,
        difficulty: this.blockchain.difficulty,
        miningReward: this.blockchain.miningReward,
        mempoolSize: this.blockchain.mempool.length
      },
      mining: {
        autoMining: this.autoMining,
        minerAddress: this.minerAddress,
        interval: this.miningInterval
      },
      rpc: {
        port: this.port,
        endpoint: `http://localhost:${this.port}/rpc`
      }
    };
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        options.port = parseInt(args[++i]);
        break;
      case '--miner':
        options.minerAddress = args[++i];
        options.autoMining = true;
        break;
      case '--auto-mine':
        options.autoMining = true;
        break;
      case '--mining-interval':
        options.miningInterval = parseInt(args[++i]) * 1000;
        break;
      case '--node-id':
        options.nodeId = args[++i];
        break;
      case '--validators':
        options.validatorNodes = args[++i].split(',').map(url => url.trim());
        break;
      case '--help':
        console.log('TOPAY Network Node Options:');
        console.log('  --port <number>           RPC server port (default: 8545)');
        console.log('  --miner <address>         Enable auto-mining with address');
        console.log('  --auto-mine               Enable auto-mining');
        console.log('  --mining-interval <sec>   Mining interval in seconds (default: 30)');
        console.log('  --node-id <id>            Custom node identifier');
        console.log('  --validators <urls>       Comma-separated validator node URLs');
        console.log('                            (default: http://localhost:8547)');
        console.log('  --help                    Show this help');
        process.exit(0);
    }
  }
  
  return options;
}

// Auto-start if run directly
if (process.argv[1].endsWith('network-node.js')) {
  const options = parseArgs();
  const node = new TOPAYNetworkNode(options);
  
  node.start().catch(error => {
    console.error('❌ Failed to start network node:', error);
    process.exit(1);
  });
}

export { TOPAYNetworkNode };