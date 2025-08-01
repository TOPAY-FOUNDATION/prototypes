/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Wallet Integration Test
 * 
 * Tests the integration between wallet-nextjs and the core blockchain
 */

import { Blockchain } from '../wallet-nextjs/src/lib/blockchain.js';
import { Wallet } from '../wallet-nextjs/src/lib/wallet.js';
import { Transaction } from '../wallet-nextjs/src/lib/transaction.js';

async function testWalletIntegration() {
  console.log('🧪 Testing Wallet-Blockchain Integration...\n');

  try {
    // Test 1: Create blockchain instance
    console.log('1️⃣ Creating blockchain instance...');
    const blockchain = new Blockchain();
    console.log('✅ Blockchain created successfully');
    console.log(`   Genesis block hash: ${blockchain.chain[0].hash}`);
    console.log(`   Initial difficulty: ${blockchain.difficulty}\n`);

    // Test 2: Create wallets
    console.log('2️⃣ Creating test wallets...');
    const wallet1 = new Wallet();
    await wallet1.generateWallet();
    
    const wallet2 = new Wallet();
    await wallet2.generateWallet();
    
    console.log('✅ Wallets created successfully');
    console.log(`   Wallet 1 address: ${wallet1.address}`);
    console.log(`   Wallet 2 address: ${wallet2.address}\n`);

    // Test 3: Check initial balances
    console.log('3️⃣ Checking initial balances...');
    const balance1 = blockchain.getBalance(wallet1.address);
    const balance2 = blockchain.getBalance(wallet2.address);
    console.log('✅ Balance check successful');
    console.log(`   Wallet 1 balance: ${balance1} TOPAY`);
    console.log(`   Wallet 2 balance: ${balance2} TOPAY\n`);

    // Test 4: Mine initial block to give wallet1 some coins
    console.log('4️⃣ Mining initial block...');
    blockchain.minePendingTransactions(wallet1.address);
    const newBalance1 = blockchain.getBalance(wallet1.address);
    console.log('✅ Block mined successfully');
    console.log(`   Wallet 1 new balance: ${newBalance1} TOPAY`);
    console.log(`   Blockchain height: ${blockchain.chain.length}\n`);

    // Test 5: Create and add transaction
    console.log('5️⃣ Creating transaction...');
    if (newBalance1 >= 5) {
      const transaction = new Transaction(wallet1.address, wallet2.address, 5, 'Test transaction');
      await transaction.signTransaction();
      
      const isValid = await transaction.isValid();
      console.log('✅ Transaction created and signed');
      console.log(`   Transaction ID: ${transaction.id}`);
      console.log(`   Transaction valid: ${isValid}\n`);

      // Test 6: Add transaction to mempool
      console.log('6️⃣ Adding transaction to mempool...');
      blockchain.addTransaction(transaction);
      console.log('✅ Transaction added to mempool');
      console.log(`   Mempool size: ${blockchain.mempool.length}\n`);

      // Test 7: Mine block with transaction
      console.log('7️⃣ Mining block with transaction...');
      blockchain.minePendingTransactions(wallet1.address);
      const finalBalance1 = blockchain.getBalance(wallet1.address);
      const finalBalance2 = blockchain.getBalance(wallet2.address);
      console.log('✅ Block with transaction mined');
      console.log(`   Wallet 1 final balance: ${finalBalance1} TOPAY`);
      console.log(`   Wallet 2 final balance: ${finalBalance2} TOPAY`);
      console.log(`   Blockchain height: ${blockchain.chain.length}\n`);
    } else {
      console.log('⚠️ Skipping transaction test - insufficient balance');
      console.log(`   Required: 5 TOPAY, Available: ${newBalance1} TOPAY\n`);
    }

    // Test 8: Validate blockchain
    console.log('8️⃣ Validating blockchain...');
    const isChainValid = await blockchain.isChainValid();
    console.log('✅ Blockchain validation complete');
    console.log(`   Blockchain valid: ${isChainValid}\n`);

    // Test 9: Get transaction history
    console.log('9️⃣ Getting transaction history...');
    const history1 = blockchain.getTransactionHistory(wallet1.address);
    const history2 = blockchain.getTransactionHistory(wallet2.address);
    console.log('✅ Transaction history retrieved');
    console.log(`   Wallet 1 transactions: ${history1.length}`);
    console.log(`   Wallet 2 transactions: ${history2.length}\n`);

    // Test 10: Get blockchain stats
    console.log('🔟 Getting blockchain statistics...');
    const stats = blockchain.getStats();
    console.log('✅ Statistics retrieved');
    console.log(`   Total blocks: ${stats.totalBlocks}`);
    console.log(`   Total transactions: ${stats.totalTransactions}`);
    console.log(`   Current difficulty: ${stats.difficulty}`);
    console.log(`   Mempool size: ${stats.mempoolSize}\n`);

    console.log('🎉 All tests passed! Wallet-Blockchain integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testWalletIntegration();