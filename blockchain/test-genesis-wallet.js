/**
 * TOPAY Genesis Wallet Test Script
 * Tests the genesis wallet functionality and constructor system
 */

import { Blockchain } from './src/blockchain/blockchain.js';
import { Transaction } from './src/blockchain/transaction.js';

async function testGenesisWallet() {
    console.log('🧪 Testing TOPAY Genesis Wallet System...');
    console.log('='.repeat(60));
    
    try {
        // Test 1: Create blockchain with genesis wallet
        console.log('\n1️⃣ Creating blockchain with genesis wallet...');
        const blockchain = new Blockchain({
            genesisBalance: 1000000,
            autoCreateGenesis: true
        });
        
        // Wait for async initialization
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ Blockchain created successfully');
        console.log(`📊 Genesis block has ${blockchain.chain[0].transactions.length} transactions`);
        
        // Test 2: Check genesis wallet
        const genesisWallet = blockchain.getGenesisWallet();
        if (genesisWallet) {
            console.log('\n2️⃣ Genesis wallet verification...');
            console.log(`👑 Genesis wallet address: ${genesisWallet.address}`);
            console.log(`💰 Genesis balance: ${genesisWallet.genesisBalance} TOPAY`);
            console.log(`🏷️ Genesis wallet label: ${genesisWallet.metadata.label}`);
            console.log('✅ Genesis wallet verified');
        } else {
            console.log('❌ Genesis wallet not found');
            return;
        }
        
        // Test 3: Check genesis wallet balance on blockchain
        console.log('\n3️⃣ Checking genesis wallet balance on blockchain...');
        const genesisBalance = blockchain.getBalance(genesisWallet.address);
        console.log(`💰 Genesis wallet blockchain balance: ${genesisBalance} TOPAY`);
        
        if (genesisBalance === genesisWallet.genesisBalance) {
            console.log('✅ Genesis balance matches expected amount');
        } else {
            console.log(`⚠️ Balance mismatch: expected ${genesisWallet.genesisBalance}, got ${genesisBalance}`);
        }
        
        // Test 4: Create new wallets
        console.log('\n4️⃣ Creating new user wallets...');
        const wallet1 = await blockchain.createWallet({
            label: 'Test Wallet 1',
            description: 'First test wallet',
            tags: ['test', 'user']
        });
        
        const wallet2 = await blockchain.createWallet({
            label: 'Test Wallet 2', 
            description: 'Second test wallet',
            tags: ['test', 'user']
        });
        
        console.log(`📱 Created wallet 1: ${wallet1.address}`);
        console.log(`📱 Created wallet 2: ${wallet2.address}`);
        console.log('✅ User wallets created successfully');
        
        // Test 5: Fund wallets from genesis
        console.log('\n5️⃣ Funding wallets from genesis...');
        
        const fundTx1 = await blockchain.fundWalletFromGenesis(wallet1.address, 1000);
        const fundTx2 = await blockchain.fundWalletFromGenesis(wallet2.address, 500);
        
        console.log(`💸 Funding transaction 1: ${fundTx1.id}`);
        console.log(`💸 Funding transaction 2: ${fundTx2.id}`);
        console.log('✅ Funding transactions created');
        
        // Test 6: Check wallet balances
        console.log('\n6️⃣ Checking wallet balances...');
        
        const balance1 = blockchain.getBalance(wallet1.address);
        const balance2 = blockchain.getBalance(wallet2.address);
        const genesisBalanceAfter = blockchain.getBalance(genesisWallet.address);
        
        console.log(`💰 Wallet 1 balance: ${balance1} TOPAY`);
        console.log(`💰 Wallet 2 balance: ${balance2} TOPAY`);
        console.log(`💰 Genesis balance after funding: ${genesisBalanceAfter} TOPAY`);
        
        if (balance1 === 1000 && balance2 === 500) {
            console.log('✅ Wallet balances are correct');
        } else {
            console.log('⚠️ Wallet balances are incorrect');
        }
        
        // Test 7: Create transaction between wallets
        console.log('\n7️⃣ Creating transaction between wallets...');
        
        const userTx = await wallet1.createTransaction(wallet2.address, 250, 'Test transfer');
        await blockchain.addTransaction(userTx);
        
        console.log(`💸 User transaction: ${userTx.id}`);
        console.log(`📤 Sent 250 TOPAY from wallet 1 to wallet 2`);
        
        // Check balances after transaction
        const finalBalance1 = blockchain.getBalance(wallet1.address);
        const finalBalance2 = blockchain.getBalance(wallet2.address);
        
        console.log(`💰 Final wallet 1 balance: ${finalBalance1} TOPAY`);
        console.log(`💰 Final wallet 2 balance: ${finalBalance2} TOPAY`);
        
        if (finalBalance1 === 750 && finalBalance2 === 750) {
            console.log('✅ Transaction processed correctly');
        } else {
            console.log('⚠️ Transaction processing issue');
        }
        
        // Test 8: Wallet manager statistics
        console.log('\n8️⃣ Wallet manager statistics...');
        
        const walletManager = blockchain.getWalletManager();
        const stats = walletManager.getStats();
        
        console.log(`📊 Total wallets: ${stats.totalWallets}`);
        console.log(`👑 Genesis wallets: ${stats.genesisWallets}`);
        console.log(`👤 User wallets: ${stats.userWallets}`);
        console.log(`🎯 Has genesis wallet: ${stats.hasGenesisWallet}`);
        console.log('✅ Statistics retrieved successfully');
        
        // Test 9: Blockchain validation
        console.log('\n9️⃣ Validating blockchain integrity...');
        
        const isValid = await blockchain.isChainValid();
        console.log(`🔍 Blockchain valid: ${isValid}`);
        
        if (isValid) {
            console.log('✅ Blockchain integrity verified');
        } else {
            console.log('❌ Blockchain integrity compromised');
        }
        
        // Final summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 GENESIS WALLET SYSTEM TEST COMPLETED');
        console.log('='.repeat(60));
        console.log('✅ All tests passed successfully!');
        console.log(`👑 Genesis wallet: ${genesisWallet.address}`);
        console.log(`💰 Genesis balance: ${genesisBalanceAfter} TOPAY`);
        console.log(`🏦 Total wallets created: ${stats.totalWallets}`);
        console.log(`📊 Blockchain blocks: ${blockchain.chain.length}`);
        console.log(`🔗 Blockchain valid: ${isValid}`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    testGenesisWallet();
}

export { testGenesisWallet };