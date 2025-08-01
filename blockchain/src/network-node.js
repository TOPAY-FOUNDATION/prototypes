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
import { Transaction } from './blockchain/transaction.js';

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
    
    // Configure validator nodes from environment variables
    let validatorNodes;
    if (options.validatorNodes) {
      // Command line argument takes precedence
      validatorNodes = options.validatorNodes;
    } else if (process.env.VALIDATOR_NODES) {
      // Parse comma-separated URLs from environment
      validatorNodes = process.env.VALIDATOR_NODES.split(',').map(url => url.trim());
    } else {
      // Default fallback
      validatorNodes = [process.env.PRIMARY_VALIDATOR || 'http://localhost:8547'];
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
    console.log(`   Validator Nodes: ${validatorNodes.join(', ')}`);
    console.log(`   Remote Storage: ${this.enableRemoteStorage ? 'Enabled' : 'Disabled'}`);
    console.log(`   Auto Mining: ${this.autoMining ? 'Enabled' : 'Disabled'}`);
    
    this.blockchain = null;
    this.rpcServer = null;
    this.persistence = this.enableRemoteStorage ? 
      new RemotePersistenceManager(validatorNodes, {
        timeout: this.networkTimeout,
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay,
        replication: this.storageReplication,
        backup: this.backupEnabled
      }) : null;
    this.miningTimer = null;
    this.isRunning = false;
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
    
    // Initialize persistence
    console.log('\n🔄 Initializing remote persistence...');
    await this.persistence.initialize();
    
    // Load or create blockchain
    await this.initializeBlockchain();
    
    // Initialize RPC server with our blockchain instance
    this.rpcServer = new BlockchainRPCServer(this.port);
    this.rpcServer.blockchain = this.blockchain; // Use our blockchain instance
    
    console.log('\n✅ Network node initialized successfully!');
  }

  /**
   * Initialize blockchain with genesis block mining
   */
  async initializeBlockchain() {
    console.log('\n📊 Initializing blockchain...');
    
    // Try to load existing blockchain
    const existingBlockchain = await this.persistence.loadBlockchain();
    
    if (existingBlockchain && existingBlockchain.chain && existingBlockchain.chain.length > 1) {
      console.log('📂 Loading existing blockchain from storage...');
      this.blockchain = new Blockchain();
      try {
        this.blockchain.importChain(existingBlockchain);
        console.log(`✅ Blockchain loaded: ${this.blockchain.chain.length} blocks`);
        console.log(`💰 Mining reward: ${this.blockchain.miningReward} TOPAY`);
        console.log(`⚡ Current difficulty: ${this.blockchain.difficulty}`);
        
        // Validate the loaded chain
        const isValid = await this.blockchain.isChainValid();
        if (!isValid) {
          console.log('⚠️  Loaded blockchain is invalid, creating new one...');
          await this.createNewBlockchain();
        }
      } catch (error) {
        console.error('❌ Failed to load blockchain:', error.message);
        console.log('🆕 Creating new blockchain...');
        await this.createNewBlockchain();
      }
    } else {
      console.log('🆕 No existing blockchain found, creating new one...');
      await this.createNewBlockchain();
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
    
    // Save the new blockchain
    await this.persistence.saveBlockchain(this.blockchain);
    console.log('💾 Blockchain saved to storage');
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
    
    // Start RPC server
    console.log('\n🌐 Starting RPC server...');
    await this.rpcServer.start();
    
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
          
          // Save blockchain after mining
          await this.persistence.saveBlockchain(this.blockchain);
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
      
      // Save final blockchain state
      try {
        await this.persistence.saveBlockchain(this.blockchain);
        console.log('💾 Final blockchain state saved');
      } catch (error) {
        console.error('❌ Failed to save final state:', error.message);
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