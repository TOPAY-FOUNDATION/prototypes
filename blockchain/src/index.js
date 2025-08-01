/**
 * TOPAY Foundation Quantum-Safe Blockchain Network
 * Main Entry Point - Production Network Mode
 * 
 * Starts the blockchain network with RPC server for production use
 */

import { BlockchainRPCServer } from './blockchain-rpc-server.js';
import { PersistenceManager } from './storage/persistence.js';

/**
 * Initialize and start the TOPAY Blockchain Network
 */
async function startBlockchainNetwork() {
  console.log('🚀 TOPAY Foundation Quantum-Safe Blockchain Network');
  console.log('=' .repeat(60));
  console.log('🌐 Starting Production Blockchain Network...');
  
  try {
    // Get configuration from environment variables
    const PORT = process.env.BLOCKCHAIN_PORT || process.env.PORT || 8545;
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const NETWORK_ID = process.env.NETWORK_ID || 'topay-mainnet';
    
    console.log(`\n⚙️  Network Configuration:`);
    console.log(`   Environment: ${NODE_ENV}`);
    console.log(`   Network ID: ${NETWORK_ID}`);
    console.log(`   RPC Port: ${PORT}`);
    console.log(`   Data Directory: ${process.env.DATA_DIR || './data'}`);
    
    // Initialize persistence layer
    console.log('\n💾 Initializing data persistence...');
    const persistence = new PersistenceManager();
    await persistence.initialize();
    
    // Create and start RPC server
    console.log('\n🔧 Initializing RPC server...');
    const server = new BlockchainRPCServer(PORT);
    
    // Start the blockchain network
    console.log('\n🚀 Starting blockchain network...');
    await server.start();
    
    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
    // Network status monitoring
    startNetworkMonitoring(server);
    
    console.log('\n✅ TOPAY Blockchain Network is now running!');
    console.log('\n📡 Network Endpoints:');
    console.log(`   RPC: http://localhost:${PORT}/rpc`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Methods: http://localhost:${PORT}/api/rpc/methods`);
    
    console.log('\n🔗 JSON-RPC 2.0 Compatible Methods:');
    console.log('   • topay_getBlockNumber - Get latest block number');
    console.log('   • topay_getBalance(address) - Get address balance');
    console.log('   • topay_getBlock(blockId) - Get block by number/hash');
    console.log('   • topay_getTransaction(hash) - Get transaction details');
    console.log('   • topay_sendTransaction(txData) - Submit transaction');
    console.log('   • topay_getMempool() - Get pending transactions');
    console.log('   • topay_mine(minerAddress) - Mine pending transactions');
    console.log('   • topay_getChainInfo() - Get blockchain information');
    console.log('   • topay_validateChain() - Validate blockchain integrity');
    console.log('   • topay_getTransactionHistory(address) - Get tx history');
    console.log('   • topay_getNetworkStats() - Get network statistics');
    
    console.log('\n🛠️  Development Methods:');
    console.log('   • topay_addTestData() - Add test transactions');
    console.log('   • topay_resetChain() - Reset blockchain (dev only)');
    
    console.log('\n💡 Usage Examples:');
    console.log('   curl -X POST http://localhost:' + PORT + '/rpc \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"jsonrpc":"2.0","method":"topay_getBlockNumber","id":1}\'');
    
    console.log('\n🔐 Security Notes:');
    console.log('   • Quantum-safe cryptography enabled');
    console.log('   • All transactions require valid signatures');
    console.log('   • Blockchain integrity continuously validated');
    console.log('   • Persistent storage with auto-backup');
    
    console.log('\n🌐 Network is ready for connections!');
    
  } catch (error) {
    console.error('❌ Failed to start blockchain network:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    try {
      // Save blockchain state
      if (server && server.persistence) {
        console.log('💾 Saving blockchain state...');
        await server.persistence.saveBlockchain(server.blockchain);
      }
      
      console.log('✅ Blockchain network shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Handle different shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

/**
 * Start network monitoring and periodic status updates
 */
function startNetworkMonitoring(server) {
  // Log network status every 5 minutes
  setInterval(() => {
    if (server && server.blockchain) {
      const stats = {
        blocks: server.blockchain.chain.length,
        mempool: server.blockchain.mempool.length,
        difficulty: server.blockchain.difficulty,
        uptime: Math.floor(process.uptime())
      };
      
      console.log(`\n📊 Network Status (${new Date().toLocaleTimeString()}):`);
      console.log(`   Blocks: ${stats.blocks} | Mempool: ${stats.mempool} | Difficulty: ${stats.difficulty} | Uptime: ${stats.uptime}s`);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  // Memory usage monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.rss / 1024 / 1024);
    
    if (memMB > 500) { // Alert if memory usage > 500MB
      console.log(`⚠️  High memory usage: ${memMB}MB`);
    }
  }, 2 * 60 * 1000); // 2 minutes
}

// Start the blockchain network
startBlockchainNetwork().catch((error) => {
  console.error('❌ Critical error starting blockchain network:', error);
  process.exit(1);
});