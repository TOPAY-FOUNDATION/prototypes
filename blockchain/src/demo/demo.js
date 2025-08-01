/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Interactive Demo
 * 
 * Provides an interactive demonstration of blockchain features
 */

import { Blockchain } from '../blockchain/blockchain';
import { Transaction } from '../blockchain/transaction.js';

class BlockchainDemo {
  constructor() {
    this.blockchain = null;
    this.wallets = new Map();
    this.isRunning = false;
  }

  async initialize() {
    console.log('🚀 Initializing TOPAY Blockchain Demo...');
    this.blockchain = new Blockchain();
    
    // Create demo wallets
    const alice = await this.createDemoWallet('Alice');
    const bob = await this.createDemoWallet('Bob');
    const charlie = await this.createDemoWallet('Charlie');
    const miner = await this.createDemoWallet('Miner');
    
    // Add network nodes
    this.blockchain.addNetworkNode('demo-node-1');
    this.blockchain.addNetworkNode('demo-node-2');
    
    console.log('✅ Demo initialized successfully!');
    return { alice, bob, charlie, miner };
  }

  async createDemoWallet(name) {
    const wallet = new Wallet();
    await wallet.generateWallet();
    this.blockchain.registerWallet(wallet);
    this.wallets.set(name, wallet);
    
    console.log(`👛 Created wallet for ${name}: ${wallet.address.substring(0, 15)}...`);
    return wallet;
  }

  async demonstrateBasicTransactions() {
    console.log('\n💸 === Basic Transaction Demo ===');
    
    const alice = this.wallets.get('Alice');
    const bob = this.wallets.get('Bob');
    const miner = this.wallets.get('Miner');
    
    // Mine initial funds for Alice
    console.log('⛏️ Mining initial funds for Alice...');
    await this.blockchain.minePendingTransactions(alice.address);
    
    console.log(`💰 Alice's balance: ${this.blockchain.getBalance(alice.address)} TOPAY`);
    
    // Create and send transaction
    const tx1 = new Transaction(alice.address, bob.address, 50, {
      message: 'Payment for quantum-safe services',
      type: 'payment'
    });
    await tx1.signTransaction(alice.keyPair?.privateKey);
    await this.blockchain.broadcastTransaction(tx1);
    
    console.log('📝 Transaction created and broadcasted');
    console.log(`   From: ${alice.address.substring(0, 15)}...`);
    console.log(`   To: ${bob.address.substring(0, 15)}...`);
    console.log(`   Amount: 50 TOPAY`);
    
    // Mine the transaction
    console.log('⛏️ Mining transaction...');
    await this.blockchain.minePendingTransactions(miner.address);
    
    console.log('✅ Transaction mined successfully!');
    console.log(`💰 Alice's balance: ${this.blockchain.getBalance(alice.address)} TOPAY`);
    console.log(`💰 Bob's balance: ${this.blockchain.getBalance(bob.address)} TOPAY`);
    console.log(`💰 Miner's balance: ${this.blockchain.getBalance(miner.address)} TOPAY`);
  }

  async demonstrateEncryptedTransactions() {
    console.log('\n🔐 === Encrypted Transaction Demo ===');
    
    const alice = this.wallets.get('Alice');
    const bob = this.wallets.get('Bob');
    const miner = this.wallets.get('Miner');
    
    // Create encrypted transaction
    const secretTx = new Transaction(alice.address, bob.address, 25, {
      message: 'Confidential payment',
      contractDetails: 'Secret business agreement',
      confidential: true
    });
    
    await secretTx.signTransaction(alice.keyPair?.privateKey);
    
    // Encrypt the data
    console.log('🔒 Encrypting transaction data...');
    await secretTx.encryptData(bob.kemKeyPair.publicKey);
    console.log('✅ Transaction data encrypted with quantum-safe KEM');
    
    await this.blockchain.broadcastTransaction(secretTx);
    await this.blockchain.minePendingTransactions(miner.address);
    
    // Demonstrate decryption
    console.log('🔓 Decrypting transaction data...');
    const decryptedData = await secretTx.decryptData(bob.kemKeyPair.secretKey);
    
    if (decryptedData) {
      console.log('✅ Decryption successful!');
      console.log(`   Message: ${decryptedData.message}`);
      console.log(`   Contract: ${decryptedData.contractDetails}`);
    } else {
      console.log('❌ Decryption failed');
    }
  }

  async demonstrateFragmentation() {
    console.log('\n📦 === Data Fragmentation Demo ===');
    
    const alice = this.wallets.get('Alice');
    const bob = this.wallets.get('Bob');
    
    // Create a large transaction with lots of data
    const largeData = {
      message: 'Large data transaction',
      document: 'A'.repeat(2000), // Large document
      metadata: {
        version: '1.0',
        created: Date.now(),
        tags: ['important', 'large', 'demo']
      }
    };
    
    const largeTx = new Transaction(alice.address, bob.address, 10, largeData);
    await largeTx.signTransaction(alice.keyPair?.privateKey);
    
    console.log('📊 Original transaction size:', JSON.stringify(largeTx).length, 'bytes');
    
    // Fragment the transaction
    console.log('🔧 Fragmenting large transaction...');
    const fragResult = await largeTx.fragmentTransaction();
    
    if (fragResult.isFragmented) {
      console.log(`✅ Transaction fragmented into ${fragResult.fragments.length} pieces`);
      console.log(`   Original size: ${JSON.stringify(largeTx).length} bytes`);
      console.log(`   Fragment count: ${fragResult.fragments.length}`);
      
      // Reconstruct the transaction
      console.log('🔧 Reconstructing transaction...');
      const reconstructed = await Transaction.reconstructFromFragments(fragResult.fragments);
      
      console.log('✅ Transaction reconstructed successfully!');
      console.log(`   Reconstructed size: ${JSON.stringify(reconstructed).length} bytes`);
      console.log(`   Data integrity: ${reconstructed.data.document.length === largeData.document.length ? '✅' : '❌'}`);
    }
  }

  async demonstrateHDWallet() {
    console.log('\n🌳 === HD Wallet Demo ===');
    
    const hdWallet = new Wallet();
    console.log('🔧 Generating HD wallet with 5 addresses...');
    
    const hdResult = await hdWallet.generateHDWallet(5);
    
    console.log('✅ HD Wallet created successfully!');
    console.log(`   Main address: ${hdResult.mainAddress}`);
    console.log(`   Total addresses: ${hdResult.totalAddresses}`);
    
    console.log('\n📋 Child addresses:');
    hdResult.childAddresses.forEach((address, index) => {
      console.log(`   ${index + 1}. ${address.substring(0, 20)}...`);
    });
    
    // Register HD wallet and give it some funds
    this.blockchain.registerWallet(hdWallet);
    await this.blockchain.minePendingTransactions(hdWallet.address);
    
    console.log(`💰 HD Wallet balance: ${this.blockchain.getBalance(hdWallet.address)} TOPAY`);
  }

  async demonstrateBlockValidation() {
    console.log('\n🔍 === Blockchain Validation Demo ===');
    
    console.log('🔧 Validating entire blockchain...');
    const isValid = await this.blockchain.isChainValid();
    
    console.log(`✅ Blockchain validation: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    // Show detailed stats
    const stats = this.blockchain.getStats();
    console.log('\n📊 Blockchain Statistics:');
    console.log(`   Blocks: ${stats.blockCount}`);
    console.log(`   Transactions: ${stats.totalTransactions}`);
    console.log(`   Total size: ${stats.totalSize} bytes`);
    console.log(`   Difficulty: ${stats.difficulty}`);
    console.log(`   Fragmented blocks: ${stats.fragmentedBlocks}`);
    
    // Show latest block details
    const latestBlock = this.blockchain.getLatestBlock();
    console.log('\n🧱 Latest Block:');
    console.log(`   Index: ${latestBlock.index}`);
    console.log(`   Hash: ${latestBlock.hash.substring(0, 20)}...`);
    console.log(`   Transactions: ${latestBlock.transactions.length}`);
    console.log(`   Nonce: ${latestBlock.nonce}`);
    console.log(`   Size: ${latestBlock.getSize()} bytes`);
  }

  async demonstrateNetworkSimulation() {
    console.log('\n🌐 === Network Simulation Demo ===');
    
    const alice = this.wallets.get('Alice');
    const charlie = this.wallets.get('Charlie');
    
    // Add more network nodes
    this.blockchain.addNetworkNode('demo-node-3');
    this.blockchain.addNetworkNode('demo-node-4');
    
    console.log(`📡 Network nodes: ${this.blockchain.networkNodes.size}`);
    
    // Create multiple transactions
    const transactions = [];
    for (let i = 0; i < 3; i++) {
      const tx = new Transaction(alice.address, charlie.address, 5 + i, {
        message: `Network transaction #${i + 1}`,
        networkTest: true
      });
      await tx.signTransaction(alice.keyPair?.privateKey);
      transactions.push(tx);
    }
    
    // Broadcast all transactions
    console.log('📡 Broadcasting multiple transactions...');
    for (const tx of transactions) {
      await this.blockchain.broadcastTransaction(tx);
    }
    
    console.log(`✅ ${transactions.length} transactions broadcasted`);
    console.log(`📝 Mempool size: ${this.blockchain.mempool.length}`);
    
    // Mine all pending transactions
    const miner = this.wallets.get('Miner');
    await this.blockchain.minePendingTransactions(miner.address);
    
    console.log('✅ All transactions mined successfully!');
  }

  async runFullDemo() {
    console.log('🎬 Starting Full TOPAY Blockchain Demo');
    console.log('=' .repeat(60));
    
    try {
      // Initialize
      await this.initialize();
      
      // Run all demonstrations
      await this.demonstrateBasicTransactions();
      await this.demonstrateEncryptedTransactions();
      await this.demonstrateFragmentation();
      await this.demonstrateHDWallet();
      await this.demonstrateNetworkSimulation();
      await this.demonstrateBlockValidation();
      
      console.log('\n🎉 === Demo Completed Successfully! ===');
      console.log('✨ All quantum-safe blockchain features demonstrated!');
      
      // Final summary
      const finalStats = this.blockchain.getStats();
      console.log('\n📈 Final Statistics:');
      console.log(`   Total blocks: ${finalStats.blockCount}`);
      console.log(`   Total transactions: ${finalStats.totalTransactions}`);
      console.log(`   Total wallets: ${this.wallets.size}`);
      console.log(`   Network nodes: ${finalStats.networkNodes}`);
      console.log(`   Blockchain size: ${finalStats.totalSize} bytes`);
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      throw error;
    }
  }
}

// Run the demo
async function main() {
  const demo = new BlockchainDemo();
  await demo.runFullDemo();
}

main().catch(console.error);