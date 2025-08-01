import fetch from 'node-fetch';

/**
 * TOPAY Blockchain RPC Client
 * Test client for interacting with the RPC server
 */
class TopayRPCClient {
  constructor(rpcUrl = 'http://localhost:8545/rpc') {
    this.rpcUrl = rpcUrl;
    this.requestId = 1;
  }

  async call(method, params = []) {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: this.requestId++
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`RPC Error: ${result.error.message}`);
    }
    
    return result.result;
  }

  // Convenience methods
  async getBlockNumber() {
    return await this.call('topay_getBlockNumber');
  }

  async getBalance(address) {
    return await this.call('topay_getBalance', [address]);
  }

  async getBlock(blockId) {
    return await this.call('topay_getBlock', [blockId]);
  }

  async getTransaction(hash) {
    return await this.call('topay_getTransaction', [hash]);
  }

  async sendTransaction(txData) {
    return await this.call('topay_sendTransaction', [txData]);
  }

  async getMempool() {
    return await this.call('topay_getMempool');
  }

  async mine(minerAddress) {
    return await this.call('topay_mine', [minerAddress]);
  }

  async getChainInfo() {
    return await this.call('topay_getChainInfo');
  }

  async validateChain() {
    return await this.call('topay_validateChain');
  }

  async getTransactionHistory(address, limit = 50, offset = 0) {
    return await this.call('topay_getTransactionHistory', [address, limit, offset]);
  }

  async getNetworkStats() {
    return await this.call('topay_getNetworkStats');
  }

  async addTestData() {
    return await this.call('topay_addTestData');
  }

  async resetChain() {
    return await this.call('topay_resetChain');
  }
}

/**
 * Test Suite for TOPAY Blockchain RPC
 */
async function runTests() {
  console.log('🧪 Starting TOPAY Blockchain RPC Tests\n');
  
  const client = new TopayRPCClient();
  
  try {
    // Test 1: Get initial chain info
    console.log('📊 Test 1: Getting chain info...');
    const chainInfo = await client.getChainInfo();
    console.log(`   Blocks: ${chainInfo.blockCount}`);
    console.log(`   Transactions: ${chainInfo.totalTransactions}`);
    console.log(`   Mempool: ${chainInfo.mempoolSize}`);
    console.log(`   Valid: ${chainInfo.isValid}\n`);

    // Test 2: Use predefined test addresses (wallets should be created externally)
    console.log('👛 Test 2: Using predefined test addresses...');
    const address1 = 'TOPAYtest1234567890abcdef1234567890abcdef12345678';
    const address2 = 'TOPAYtest2234567890abcdef1234567890abcdef12345678';
    const address3 = 'TOPAYtest3234567890abcdef1234567890abcdef12345678';
    
    console.log(`   Address 1: ${address1}`);
    console.log(`   Address 2: ${address2}`);
    console.log(`   Address 3: ${address3}`);
    console.log('   ⚠️  Note: In production, wallets should be created using external wallet applications\n');

    // Test 3: Check initial balances
    console.log('💰 Test 3: Checking initial balances...');
    const balance1 = await client.getBalance(address1);
    const balance2 = await client.getBalance(address2);
    const balance3 = await client.getBalance(address3);
    
    console.log(`   ${address1}: ${balance1} TOPAY`);
    console.log(`   ${address2}: ${balance2} TOPAY`);
    console.log(`   ${address3}: ${balance3} TOPAY\n`);

    // Test 4: Add test data
    console.log('🧪 Test 4: Adding test data...');
    const testDataResult = await client.addTestData();
    console.log(`   ${testDataResult.message}`);
    console.log(`   Blocks: ${testDataResult.blocks}`);
    console.log(`   Mempool: ${testDataResult.mempool}`);
    console.log(`   Total Transactions: ${testDataResult.totalTransactions}\n`);

    // Test 5: Check updated chain info
    console.log('📊 Test 5: Getting updated chain info...');
    const updatedChainInfo = await client.getChainInfo();
    console.log(`   Blocks: ${updatedChainInfo.blockCount}`);
    console.log(`   Transactions: ${updatedChainInfo.totalTransactions}`);
    console.log(`   Mempool: ${updatedChainInfo.mempoolSize}\n`);

    // Test 6: Get latest block
    console.log('🧱 Test 6: Getting latest block...');
    const latestBlock = await client.getBlock('latest');
    console.log(`   Block #${latestBlock.index}`);
    console.log(`   Hash: ${latestBlock.hash}`);
    console.log(`   Transactions: ${latestBlock.transactions.length}`);
    console.log(`   Timestamp: ${new Date(latestBlock.timestamp).toISOString()}\n`);

    // Test 7: Send a new transaction
    console.log('💸 Test 7: Sending new transaction...');
    const txResult = await client.sendTransaction({
      from: address1,
      to: address2,
      amount: 25,
      memo: 'RPC Test Transaction'
    });
    console.log(`   Transaction Hash: ${txResult.transactionHash}`);
    console.log(`   Status: ${txResult.status}\n`);

    // Test 8: Check mempool
    console.log('🔄 Test 8: Checking mempool...');
    const mempool = await client.getMempool();
    console.log(`   Pending transactions: ${mempool.count}`);
    if (mempool.count > 0) {
      console.log(`   Latest TX: ${mempool.transactions[mempool.count - 1].hash}\n`);
    }

    // Test 9: Mine a block
    console.log('⛏️  Test 9: Mining a block...');
    if (mempool.count > 0) {
      const mineResult = await client.mine(address3);
      console.log(`   Mined Block #${mineResult.blockIndex}`);
      console.log(`   Block Hash: ${mineResult.blockHash}`);
      console.log(`   Transactions: ${mineResult.transactions}`);
      console.log(`   Reward: ${mineResult.reward} TOPAY\n`);
    } else {
      console.log('   No transactions to mine\n');
    }

    // Test 10: Check final balances
    console.log('💰 Test 10: Checking final balances...');
    const finalBalance1 = await client.getBalance(address1);
    const finalBalance2 = await client.getBalance(address2);
    const finalBalance3 = await client.getBalance(address3);
    
    console.log(`   ${address1}: ${finalBalance1} TOPAY`);
    console.log(`   ${address2}: ${finalBalance2} TOPAY`);
    console.log(`   ${address3}: ${finalBalance3} TOPAY\n`);

    // Test 11: Get transaction history
    console.log('📜 Test 11: Getting transaction history...');
    const history1 = await client.getTransactionHistory(address1, 10);
    console.log(`   ${address1} has ${history1.total} transactions`);
    if (history1.transactions.length > 0) {
      console.log(`   Latest: ${history1.transactions[0].hash}\n`);
    }

    // Test 12: Validate chain
    console.log('✅ Test 12: Validating blockchain...');
    const validation = await client.validateChain();
    console.log(`   Chain is valid: ${validation.isValid}\n`);

    // Test 13: Get network stats
    console.log('📈 Test 13: Getting network statistics...');
    const stats = await client.getNetworkStats();
    console.log(`   Blocks: ${stats.blocks}`);
    console.log(`   Transactions: ${stats.transactions}`);
    console.log(`   Difficulty: ${stats.difficulty}`);
    console.log(`   Mining Reward: ${stats.miningReward} TOPAY`);
    console.log(`   Average Block Time: ${stats.averageBlockTime}s`);
    console.log(`   Estimated Hash Rate: ${stats.estimatedHashRate} H/s\n`);

    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Interactive RPC Demo
 */
async function interactiveDemo() {
  console.log('🎮 TOPAY Blockchain RPC Interactive Demo\n');
  
  const client = new TopayRPCClient();
  
  try {
    // Reset chain for clean demo
    console.log('🔄 Resetting blockchain for demo...');
    await client.resetChain();
    
    // Create demo addresses (wallets should be created externally)
    console.log('👛 Using predefined demo addresses...');
    const alice = 'TOPAYalice234567890abcdef1234567890abcdef12345678';
    const bob = 'TOPAYbob2234567890abcdef1234567890abcdef12345678';
    const charlie = 'TOPAYcharlie234567890abcdef1234567890abcdef12345678';
    
    console.log(`   Alice: ${alice}`);
    console.log(`   Bob: ${bob}`);
    console.log(`   Charlie: ${charlie}`);
    console.log('   ⚠️  Note: In production, wallets should be created using external wallet applications\n');
    
    // Simulate some activity
    console.log('💸 Simulating blockchain activity...');
    
    // Send transactions
    await client.sendTransaction({
      from: alice,
      to: bob,
      amount: 100,
      memo: 'Payment for services'
    });
    
    await client.sendTransaction({
      from: bob,
      to: charlie,
      amount: 50,
      memo: 'Freelance work payment'
    });
    
    await client.sendTransaction({
      from: charlie,
      to: alice,
      amount: 25,
      memo: 'Refund'
    });
    
    console.log('   ✅ 3 transactions added to mempool');
    
    // Mine blocks
    console.log('⛏️  Mining blocks...');
    await client.mine(alice.address);
    console.log('   ✅ Block 1 mined by Alice');
    
    // Add more transactions
    await client.sendTransaction({
      from: alice.address,
      to: charlie.address,
      amount: 75,
      memo: 'Investment'
    });
    
    await client.mine(bob.address);
    console.log('   ✅ Block 2 mined by Bob');
    
    // Final stats
    console.log('\n📊 Final Demo Results:');
    const finalStats = await client.getNetworkStats();
    console.log(`   Total Blocks: ${finalStats.blocks}`);
    console.log(`   Total Transactions: ${finalStats.transactions}`);
    
    const aliceBalance = await client.getBalance(alice.address);
    const bobBalance = await client.getBalance(bob.address);
    const charlieBalance = await client.getBalance(charlie.address);
    
    console.log(`\n💰 Final Balances:`);
    console.log(`   Alice: ${aliceBalance} TOPAY`);
    console.log(`   Bob: ${bobBalance} TOPAY`);
    console.log(`   Charlie: ${charlieBalance} TOPAY`);
    
    console.log('\n🎉 Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Export for use in other modules
export { TopayRPCClient, runTests, interactiveDemo };

// Run tests if executed directly
if (process.argv[1].endsWith('rpc-test.js')) {
  const mode = process.argv[2] || 'test';
  
  if (mode === 'demo') {
    interactiveDemo().catch(console.error);
  } else {
    runTests().catch(console.error);
  }
}