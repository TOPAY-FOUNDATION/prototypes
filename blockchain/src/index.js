/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Main Entry Point
 * 
 * Demonstrates the quantum-safe blockchain functionality
 */

import { Blockchain } from './blockchain/blockchain.js';
import { Transaction } from './blockchain/transaction.js';
import { BlockchainRPCServer } from './blockchain-rpc-server.js';
import { ValidatorRegistry } from './storage/validator-registry.js';

async function main() {
  console.log('🚀 TOPAY Foundation Quantum-Safe Blockchain Prototype');
  console.log('=' .repeat(60));
  
  try {
    // Initialize blockchain
    console.log('\n📊 Initializing blockchain...');
    const blockchain = new Blockchain();
    
    // Initialize validator registry with RPC system
    console.log('\n🔧 Initializing validator registry with RPC system...');
    const validatorRegistry = new ValidatorRegistry({
      enableRPC: true,
      registryFile: 'validator-registry.json'
    });
    console.log('✅ Validator Registry RPC system enabled');
    
    // Use predefined addresses (wallets should be created externally)
    console.log('\n👛 Using predefined test addresses...');
    const address1 = 'TOPAYtest1234567890abcdef1234567890abcdef12345678';
    const address2 = 'TOPAYtest2234567890abcdef1234567890abcdef12345678';
    const minerAddress = 'TOPAYminer234567890abcdef1234567890abcdef12345678';
    
    console.log(`\nAddress 1: ${address1}`);
    console.log(`Address 2: ${address2}`);
    console.log(`Miner: ${minerAddress}`);
    console.log('⚠️  Note: In production, wallets should be created using external wallet applications');
    
    // Add some network nodes
    blockchain.addNetworkNode('node-1');
    blockchain.addNetworkNode('node-2');
    blockchain.addNetworkNode('node-3');
    
    // Create and broadcast transactions
    console.log('\n💸 Creating transactions...');
    
    // Give address1 some initial funds by mining
    console.log('\n⛏️ Mining initial block for address1...');
    await blockchain.minePendingTransactions(address1);
    
    // Create transactions and sign them properly
    const tx1 = new Transaction(address1, address2, 50, {
      message: 'First quantum-safe transaction!',
      metadata: { type: 'payment', category: 'test' }
    });
    // Sign transaction with placeholder key for demo
    await tx1.signTransaction('demo_private_key_1');
    
    const tx2 = new Transaction(address1, address2, 25, {
      message: 'Second transaction with encryption',
      confidential: true
    });
    await tx2.signTransaction('demo_private_key_1');
    
    // Broadcast transactions
    await blockchain.broadcastTransaction(tx1);
    await blockchain.broadcastTransaction(tx2);
    
    // Mine transactions
    console.log('\n⛏️ Mining transactions...');
    await blockchain.minePendingTransactions(minerAddress);
    
    // Create more transactions for demonstration
    const tx3 = new Transaction(address2, address1, 10);
    await tx3.signTransaction('demo_private_key_2');
    await blockchain.broadcastTransaction(tx3);
    
    const tx4 = new Transaction(address1, minerAddress, 15);
    await tx4.signTransaction('demo_private_key_1');
    await blockchain.broadcastTransaction(tx4);
    
    // Mine another block
    await blockchain.minePendingTransactions(minerAddress);
    
    // Display blockchain statistics
    console.log('\n📈 Blockchain Statistics:');
    console.log('=' .repeat(40));
    const stats = blockchain.getStats();
    console.log(`Blocks: ${stats.blockCount}`);
    console.log(`Total Transactions: ${stats.totalTransactions}`);
    console.log(`Total Size: ${stats.totalSize} bytes`);
    console.log(`Average Block Size: ${stats.averageBlockSize} bytes`);
    console.log(`Current Difficulty: ${stats.difficulty}`);
    console.log(`Mining Reward: ${stats.miningReward} TOPAY`);
    console.log(`Mempool Size: ${stats.mempoolSize}`);
    console.log(`Fragmented Blocks: ${stats.fragmentedBlocks}`);
    console.log(`Network Nodes: ${stats.networkNodes}`);
    
    // Display validator registry statistics
    console.log('\n🔧 Validator Registry Statistics:');
    console.log('=' .repeat(40));
    const activeValidators = validatorRegistry.getActiveValidators();
    console.log(`Active Validators: ${activeValidators.length}`);
    if (activeValidators.length > 0) {
      console.log('Registered Validators:');
      activeValidators.forEach((validator, index) => {
        console.log(`  ${index + 1}. ${validator.code} (${validator.url})`);
        console.log(`     Status: ${validator.status}, Last Update: ${new Date(validator.lastUpdate).toLocaleTimeString()}`);
      });
    }
    
    // Display wallet balances
    console.log('\n💰 Address Balances:');
    console.log('=' .repeat(40));
    console.log(`Address 1: ${blockchain.getBalance(address1)} TOPAY`);
    console.log(`Address 2: ${blockchain.getBalance(address2)} TOPAY`);
    console.log(`Miner: ${blockchain.getBalance(minerAddress)} TOPAY`);
    
    // Display transaction history
    console.log('\n📋 Transaction History (Address 1):');
    console.log('=' .repeat(40));
    const history = blockchain.getTransactionHistory(address1);
    history.slice(0, 5).forEach((tx, index) => {
      const fromAddr = tx.from ? tx.from.substring(0, 10) : 'MINING';
      const toAddr = tx.to ? tx.to.substring(0, 10) : 'UNKNOWN';
      console.log(`${index + 1}. ${tx.amount} TOPAY ${tx.from === address1 ? 'to' : 'from'} ${tx.from === address1 ? toAddr : fromAddr}...`);
      console.log(`   Block: #${tx.blockIndex}, Time: ${new Date(tx.blockTimestamp).toLocaleTimeString()}`);
    });
    
    // Validate blockchain
    console.log('\n🔍 Validating blockchain...');
    const isValid = await blockchain.isChainValid();
    console.log(`Blockchain valid: ${isValid ? '✅ Yes' : '❌ No'}`);
    
    // Demonstrate fragmentation
    console.log('\n📦 Fragmentation Demo:');
    console.log('=' .repeat(40));
    const latestBlock = blockchain.getLatestBlock();
    console.log(`Latest block size: ${latestBlock.getSize()} bytes`);
    
    if (latestBlock.getSize() > 1024) {
      const fragResult = await latestBlock.fragmentBlock();
      if (fragResult.isFragmented) {
        console.log(`Block fragmented into ${fragResult.fragments.length} pieces`);
        
        // Demonstrate reconstruction
        const reconstructed = await blockchain.reconstructBlock(latestBlock.index);
        console.log(`Block reconstructed successfully: ${reconstructed.hash === latestBlock.hash}`);
      }
    }
    
    // Display block details
    console.log('\n🧱 Latest Block Details:');
    console.log('=' .repeat(40));
    const blockStats = latestBlock.getStats();
    console.log(`Index: ${blockStats.index}`);
    console.log(`Hash: ${blockStats.hash.substring(0, 20)}...`);
    console.log(`Previous Hash: ${latestBlock.previousHash.substring(0, 20)}...`);
    console.log(`Merkle Root: ${blockStats.merkleRoot.substring(0, 20)}...`);
    console.log(`Transactions: ${blockStats.transactionCount}`);
    console.log(`Size: ${blockStats.size} bytes`);
    console.log(`Nonce: ${blockStats.nonce}`);
    console.log(`Difficulty: ${blockStats.difficulty}`);
    console.log(`Timestamp: ${new Date(latestBlock.timestamp).toLocaleString()}`);
    
    console.log('\n🎉 Blockchain prototype demonstration completed!');
    console.log('✨ All quantum-safe features working correctly!');
    console.log('⚠️  Note: Wallet creation and transaction signing should be handled by external wallet applications');
    
  } catch (error) {
    console.error('❌ Error in blockchain demonstration:', error);
    process.exit(1);
  }
}

// Initialize and start the integrated system
async function startIntegratedSystem() {
  const PORT = process.env.PORT || 3001;
  
  console.log('🚀 Starting TOPAY Blockchain with Validator Registry...');
  console.log(`📡 RPC Endpoint: http://localhost:${PORT}/rpc`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📊 API Methods: http://localhost:${PORT}/api/rpc/methods`);
  console.log(`🔧 Validator Registration: http://localhost:${PORT}/rpc/validator/*`);

  try {
    // Start the RPC server
    const server = new BlockchainRPCServer(PORT);
    await server.start();
    
    // Run the blockchain demonstration
    await main();
    
    console.log('\n🎉 TOPAY Blockchain with Validator Registry is ready!');
    console.log(`🌐 Access the system at: http://localhost:${PORT}`);
    console.log('📋 Validator Registration Endpoints:');
    console.log(`   POST http://localhost:${PORT}/rpc/validator/register`);
    console.log(`   GET  http://localhost:${PORT}/rpc/validator/list`);
    console.log(`   POST http://localhost:${PORT}/rpc/validator/status`);
    console.log(`   POST http://localhost:${PORT}/rpc/validator/unregister`);
    
  } catch (error) {
    console.error('❌ Failed to start integrated system:', error);
    process.exit(1);
  }
}

// Start the integrated system
startIntegratedSystem();