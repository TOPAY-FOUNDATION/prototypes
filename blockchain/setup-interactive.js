/**
 * TOPAY Interactive Blockchain Setup
 * This script initializes the blockchain with proper test data
 */

import { Blockchain } from './src/blockchain/blockchain.js';
import { Transaction } from './src/blockchain/transaction.js';
import { PersistenceManager } from './src/storage/persistence.js';

async function setupInteractiveBlockchain() {
    console.log('🚀 Setting up TOPAY Interactive Blockchain...\n');

    // Initialize blockchain
    const blockchain = new Blockchain();
    const persistence = new PersistenceManager('./data');
    await persistence.initialize();

    // Test addresses
    const testAddress1 = 'TOPAYtest1234567890abcdef1234567890abcdef12345678';
    const testAddress2 = 'TOPAYtest2234567890abcdef1234567890abcdef12345678';
    const testAddress3 = 'TOPAYtest3234567890abcdef1234567890abcdef12345678';

    console.log('📋 Test Addresses:');
    console.log(`   Address 1: ${testAddress1}`);
    console.log(`   Address 2: ${testAddress2}`);
    console.log(`   Address 3: ${testAddress3}\n`);

    // Mine initial blocks to give addresses some balance
    console.log('⛏️ Mining initial blocks to create balances...\n');

    // Mine 3 blocks with different miners to distribute initial funds
    await blockchain.minePendingTransactions(testAddress1);
    await blockchain.minePendingTransactions(testAddress2);
    await blockchain.minePendingTransactions(testAddress3);

    console.log('\n💰 Initial Balances:');
    console.log(`   ${testAddress1.substring(0, 20)}...: ${blockchain.getBalance(testAddress1)} TOPAY`);
    console.log(`   ${testAddress2.substring(0, 20)}...: ${blockchain.getBalance(testAddress2)} TOPAY`);
    console.log(`   ${testAddress3.substring(0, 20)}...: ${blockchain.getBalance(testAddress3)} TOPAY\n`);

    // Create some test transactions
    console.log('💸 Creating test transactions...\n');

    const transactions = [
        new Transaction(testAddress1, testAddress2, 30, 'Payment for services'),
        new Transaction(testAddress2, testAddress3, 25, 'Refund payment'),
        new Transaction(testAddress3, testAddress1, 15, 'Subscription fee'),
        new Transaction(testAddress1, testAddress3, 20, 'Product purchase'),
        new Transaction(testAddress2, testAddress1, 10, 'Commission payment')
    ];

    // Sign and add transactions
    const demoKeys = ['demo_key_1', 'demo_key_2', 'demo_key_3'];
    
    for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        await tx.signTransaction(demoKeys[i % 3]);
        await blockchain.addTransaction(tx);
    }

    // Mine transactions
    console.log('⛏️ Mining transaction blocks...\n');
    await blockchain.minePendingTransactions(testAddress1);
    await blockchain.minePendingTransactions(testAddress2);

    // Add more transactions for mempool
    const moreTransactions = [
        new Transaction(testAddress1, testAddress2, 5, 'Tip payment'),
        new Transaction(testAddress3, testAddress2, 8, 'Gift payment')
    ];

    for (let i = 0; i < moreTransactions.length; i++) {
        const tx = moreTransactions[i];
        await tx.signTransaction(demoKeys[i % 3]);
        await blockchain.addTransaction(tx);
    }

    console.log('💰 Final Balances:');
    console.log(`   ${testAddress1.substring(0, 20)}...: ${blockchain.getBalance(testAddress1)} TOPAY`);
    console.log(`   ${testAddress2.substring(0, 20)}...: ${blockchain.getBalance(testAddress2)} TOPAY`);
    console.log(`   ${testAddress3.substring(0, 20)}...: ${blockchain.getBalance(testAddress3)} TOPAY\n`);

    // Validate blockchain
    const isValid = await blockchain.isChainValid();
    console.log(`🔍 Blockchain validation: ${isValid ? '✅ Valid' : '❌ Invalid'}\n`);

    // Save blockchain
    await persistence.saveBlockchain(blockchain);
    console.log('💾 Blockchain saved successfully!\n');

    // Display statistics
    const stats = blockchain.getStats();
    console.log('📊 Blockchain Statistics:');
    console.log(`   Blocks: ${stats.blockCount}`);
    console.log(`   Transactions: ${stats.totalTransactions}`);
    console.log(`   Mempool: ${blockchain.mempool.length}`);
    console.log(`   Difficulty: ${stats.difficulty}`);
    console.log(`   Total Size: ${stats.totalSize} bytes`);
    console.log(`   Average Block Size: ${stats.averageBlockSize} bytes\n`);

    console.log('✅ Interactive blockchain setup complete!');
    console.log('🌐 You can now start the RPC server with: npm run rpc:server');
    console.log('🔗 Open interactive-blockchain.html in your browser to interact with the blockchain');

    return blockchain;
}

// Run setup
setupInteractiveBlockchain().catch(console.error);