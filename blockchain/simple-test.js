/**
 * Simple TOPAY Blockchain Test
 * Demonstrates basic blockchain functionality
 */

import { Blockchain } from './src/blockchain/blockchain.js';
import { Transaction } from './src/blockchain/transaction.js';

async function simpleTest() {
  console.log('🚀 TOPAY Blockchain Simple Test');
  console.log('=' .repeat(50));
  
  try {
    // Initialize blockchain
    console.log('\n📊 Creating new blockchain...');
    const blockchain = new Blockchain();
    
    // Test addresses
    const alice = 'TOPAYalice1234567890abcdef1234567890abcdef12345678';
    const bob = 'TOPAYbob234567890abcdef1234567890abcdef123456789';
    const miner = 'TOPAYminer234567890abcdef1234567890abcdef12345678';
    
    console.log(`\nAlice: ${alice}`);
    console.log(`Bob: ${bob}`);
    console.log(`Miner: ${miner}`);
    
    // Mine initial block to give Alice some coins
    console.log('\n⛏️ Mining initial block for Alice...');
    await blockchain.minePendingTransactions(alice);
    
    console.log(`\n💰 Alice's balance: ${blockchain.getBalance(alice)} TOPAY`);
    
    // Create and send transaction from Alice to Bob
    console.log('\n💸 Alice sends 30 TOPAY to Bob...');
    const tx1 = new Transaction(alice, bob, 30, {
      message: 'Payment for services',
      type: 'payment'
    });
    await tx1.signTransaction('alice_private_key');
    await blockchain.broadcastTransaction(tx1);
    
    // Create another transaction
    console.log('💸 Alice sends 20 TOPAY to Bob...');
    const tx2 = new Transaction(alice, bob, 20, {
      message: 'Second payment',
      type: 'payment'
    });
    await tx2.signTransaction('alice_private_key');
    await blockchain.broadcastTransaction(tx2);
    
    // Mine the transactions
    console.log('\n⛏️ Mining transactions...');
    await blockchain.minePendingTransactions(miner);
    
    // Check balances
    console.log('\n💰 Final Balances:');
    console.log(`Alice: ${blockchain.getBalance(alice)} TOPAY`);
    console.log(`Bob: ${blockchain.getBalance(bob)} TOPAY`);
    console.log(`Miner: ${blockchain.getBalance(miner)} TOPAY`);
    
    // Validate blockchain
    console.log('\n🔍 Validating blockchain...');
    const isValid = await blockchain.isChainValid();
    console.log(`Blockchain valid: ${isValid ? '✅ Yes' : '❌ No'}`);
    
    // Show stats
    console.log('\n📈 Blockchain Stats:');
    const stats = blockchain.getStats();
    console.log(`Blocks: ${stats.blockCount}`);
    console.log(`Transactions: ${stats.totalTransactions}`);
    console.log(`Difficulty: ${stats.difficulty}`);
    console.log(`Mempool: ${stats.mempoolSize}`);
    
    console.log('\n✅ Simple test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
simpleTest().catch(console.error);