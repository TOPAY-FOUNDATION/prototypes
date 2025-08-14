/**
 * TOPAY Wallet Registration Test
 * 
 * This script tests the new wallet registration functionality that automatically
 * registers new wallets on the blockchain as minable transactions.
 */

// Using built-in fetch API (Node.js 18+)

class WalletRegistrationTester {
  constructor() {
    this.walletApiUrl = 'http://localhost:3000/api/wallet/generate';
    this.blockchainRpcUrl = 'http://localhost:8545/rpc';
  }

  /**
   * Test wallet creation with blockchain registration
   */
  async testWalletRegistration() {
    console.log('🔗 Testing TOPAY Wallet Registration on Blockchain');
    console.log('==================================================\n');

    try {
      // 1. Check blockchain status before wallet creation
      console.log('1. Checking blockchain status...');
      const initialStats = await this.getBlockchainStats();
      console.log(`   Initial blocks: ${initialStats.blockCount}`);
      console.log(`   Initial mempool: ${initialStats.mempoolSize}`);
      console.log(`   Initial transactions: ${initialStats.totalTransactions}\n`);

      // 2. Create a new wallet (should automatically register on blockchain)
      console.log('2. Creating new wallet with blockchain registration...');
      const walletResponse = await fetch(this.walletApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!walletResponse.ok) {
        throw new Error(`Wallet creation failed: ${walletResponse.status}`);
      }

      const walletData = await walletResponse.json();
      console.log(`✅ Wallet created: ${walletData.address}`);
      console.log(`   Registration status: ${walletData.blockchainRegistration?.registered ? 'SUCCESS' : 'FAILED'}`);
      
      if (walletData.blockchainRegistration?.transactionHash) {
        console.log(`   Transaction hash: ${walletData.blockchainRegistration.transactionHash}`);
      }
      console.log('');

      // 3. Check blockchain status after wallet creation
      console.log('3. Checking blockchain status after wallet creation...');
      const afterStats = await this.getBlockchainStats();
      console.log(`   Current blocks: ${afterStats.blockCount}`);
      console.log(`   Current mempool: ${afterStats.mempoolSize}`);
      console.log(`   Current transactions: ${afterStats.totalTransactions}`);
      
      const newTransactions = afterStats.totalTransactions - initialStats.totalTransactions;
      console.log(`   New transactions added: ${newTransactions}\n`);

      // 4. Check mempool for wallet registration transaction
      console.log('4. Checking mempool for wallet registration transaction...');
      const mempool = await this.getMempool();
      const registrationTx = mempool.find(tx => 
        tx.to === walletData.address && 
        tx.memo?.type === 'WALLET_REGISTRATION'
      );
      
      if (registrationTx) {
        console.log('✅ Wallet registration transaction found in mempool!');
        console.log(`   From: ${registrationTx.from || 'SYSTEM'}`);
        console.log(`   To: ${registrationTx.to}`);
        console.log(`   Type: ${registrationTx.memo?.type}`);
        console.log(`   Timestamp: ${new Date(registrationTx.memo?.timestamp).toISOString()}\n`);
      } else {
        console.log('❌ Wallet registration transaction not found in mempool\n');
      }

      // 5. Trigger mining to include the registration transaction
      console.log('5. Triggering mining to include wallet registration...');
      const miningResult = await this.triggerMining();
      console.log(`✅ Mining completed: Block #${miningResult.index}`);
      console.log(`   Transactions mined: ${miningResult.transactions?.length || 0}\n`);

      // 6. Verify wallet registration is now on blockchain
      console.log('6. Verifying wallet registration on blockchain...');
      const finalStats = await this.getBlockchainStats();
      console.log(`   Final blocks: ${finalStats.blockCount}`);
      console.log(`   Final transactions: ${finalStats.totalTransactions}`);
      
      // Search for the wallet registration transaction in blocks
      const walletTxHistory = await this.getTransactionHistory(walletData.address);
      const registrationOnChain = walletTxHistory.find(tx => 
        tx.memo?.type === 'WALLET_REGISTRATION'
      );
      
      if (registrationOnChain) {
        console.log('✅ Wallet registration confirmed on blockchain!');
        console.log(`   Block: #${registrationOnChain.blockIndex}`);
        console.log(`   Transaction hash: ${registrationOnChain.hash}`);
        console.log(`   Confirmations: ${registrationOnChain.confirmations || 'N/A'}\n`);
      } else {
        console.log('❌ Wallet registration not found on blockchain\n');
      }

      // 7. Summary
      console.log('📊 Test Summary:');
      console.log('================');
      console.log(`✅ Wallet created: ${walletData.address}`);
      console.log(`${walletData.blockchainRegistration?.registered ? '✅' : '❌'} Blockchain registration: ${walletData.blockchainRegistration?.registered ? 'SUCCESS' : 'FAILED'}`);
      console.log(`${registrationTx ? '✅' : '❌'} Transaction in mempool: ${registrationTx ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`${registrationOnChain ? '✅' : '❌'} Transaction mined: ${registrationOnChain ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
      console.log(`📈 Total new transactions: ${finalStats.totalTransactions - initialStats.totalTransactions}`);
      console.log(`📦 Total new blocks: ${finalStats.blockCount - initialStats.blockCount}\n`);

      return {
        success: true,
        wallet: walletData,
        registered: walletData.blockchainRegistration?.registered,
        mined: !!registrationOnChain
      };

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get blockchain statistics
   */
  async getBlockchainStats() {
    const response = await fetch(this.blockchainRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'topay_getChainInfo',
        params: [],
        id: 1
      })
    });

    const result = await response.json();
    return result.result;
  }

  /**
   * Get mempool transactions
   */
  async getMempool() {
    const response = await fetch(this.blockchainRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'topay_getMempool',
        params: [],
        id: 1
      })
    });

    const result = await response.json();
    return result.result || [];
  }

  /**
   * Trigger mining
   */
  async triggerMining() {
    const response = await fetch(this.blockchainRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'topay_mine',
        params: ['TOPAY_TEST_MINER_ADDRESS'],
        id: 1
      })
    });

    const result = await response.json();
    return result.result;
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address) {
    const response = await fetch(this.blockchainRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'topay_getTransactionHistory',
        params: [address],
        id: 1
      })
    });

    const result = await response.json();
    return result.result || [];
  }

  /**
   * Test multiple wallet registrations
   */
  async testMultipleWalletRegistrations(count = 3) {
    console.log(`\n🔗 Testing Multiple Wallet Registrations (${count} wallets)`);
    console.log('='.repeat(60));

    const results = [];
    
    for (let i = 1; i <= count; i++) {
      console.log(`\n📝 Creating wallet ${i}/${count}...`);
      
      try {
        const walletResponse = await fetch(this.walletApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const walletData = await walletResponse.json();
        console.log(`   Address: ${walletData.address}`);
        console.log(`   Registered: ${walletData.blockchainRegistration?.registered ? 'YES' : 'NO'}`);
        
        results.push({
          address: walletData.address,
          registered: walletData.blockchainRegistration?.registered
        });
        
        // Small delay between wallet creations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        results.push({ error: error.message });
      }
    }

    // Mine all pending registrations
    console.log('\n⛏️ Mining all pending wallet registrations...');
    await this.triggerMining();

    console.log('\n📊 Multiple Wallet Registration Summary:');
    console.log('========================================');
    const successful = results.filter(r => r.registered).length;
    console.log(`✅ Successfully registered: ${successful}/${count}`);
    console.log(`❌ Failed registrations: ${count - successful}/${count}`);
    
    return results;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new WalletRegistrationTester();
  
  console.log('🚀 Starting TOPAY Wallet Registration Tests\n');
  
  // Test single wallet registration
  const singleResult = await tester.testWalletRegistration();
  
  if (singleResult.success) {
    // Test multiple wallet registrations
    await tester.testMultipleWalletRegistrations(3);
  }
  
  console.log('\n🏁 All tests completed!');
}

export { WalletRegistrationTester };