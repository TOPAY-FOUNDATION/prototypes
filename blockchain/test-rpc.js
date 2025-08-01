// Simple RPC test to verify functionality and update the chain
import fetch from 'node-fetch';

const RPC_URL = 'http://localhost:8545/rpc';

async function rpcCall(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now()
    })
  });
  
  const result = await response.json();
  if (result.error) {
    throw new Error(`RPC Error: ${result.error.message}`);
  }
  return result.result;
}

async function testAndUpdateChain() {
  console.log('🧪 Testing TOPAY Blockchain RPC...\n');
  
  try {
    // 1. Get chain info
    console.log('📊 Getting chain info...');
    const chainInfo = await rpcCall('topay_getChainInfo');
    console.log(`   Blocks: ${chainInfo.blockCount}`);
    console.log(`   Difficulty: ${chainInfo.difficulty}`);
    console.log(`   Mining Reward: ${chainInfo.miningReward}\n`);
    
    // 2. Use predefined test address (wallets should be created externally)
    console.log('👛 Using predefined test address...');
    const testAddress = 'TOPAYtest1234567890abcdef1234567890abcdef12345678';
    console.log(`   Address: ${testAddress}`);
    console.log('   ⚠️  Note: In production, wallets should be created using external wallet applications\n');
    
    // 3. Check balance
    console.log('💰 Checking address balance...');
    const balance = await rpcCall('topay_getBalance', [testAddress]);
    console.log(`   Balance: ${balance} TOPAY\n`);
    
    // 4. Add test data to the chain
    console.log('📝 Adding test data to blockchain...');
    await rpcCall('topay_addTestData');
    console.log('   ✅ Test data added\n');
    
    // 5. Mine a new block
    console.log('⛏️  Mining new block...');
    const mineResult = await rpcCall('topay_mine', [testAddress]);
    console.log(`   ✅ Block mined: ${mineResult.hash}`);
    console.log(`   Block number: ${mineResult.blockNumber}`);
    console.log(`   Transactions: ${mineResult.transactionCount}\n`);
    
    // 6. Check updated chain info
    console.log('📊 Getting updated chain info...');
    const updatedChainInfo = await rpcCall('topay_getChainInfo');
    console.log(`   Blocks: ${updatedChainInfo.blockCount}`);
    console.log(`   Total transactions: ${updatedChainInfo.totalTransactions}\n`);
    
    // 7. Check updated balance (should have mining reward)
    console.log('💰 Checking updated address balance...');
    const updatedBalance = await rpcCall('topay_getBalance', [testAddress]);
    console.log(`   Balance: ${updatedBalance} TOPAY\n`);
    
    // 8. Get transaction history
    console.log('📜 Getting transaction history...');
    const history = await rpcCall('topay_getTransactionHistory', [testAddress, 10, 0]);
    console.log(`   Transactions found: ${history.length}\n`);
    
    // 9. Get network stats
    console.log('📈 Getting network statistics...');
    const stats = await rpcCall('topay_getNetworkStats');
    console.log(`   Total supply: ${stats.totalSupply} TOPAY`);
    console.log(`   Active addresses: ${stats.activeAddresses}`);
    console.log(`   Average block time: ${stats.averageBlockTime}s\n`);
    
    console.log('🎉 RPC test completed successfully!');
    console.log('🔗 RPC URL: http://localhost:8545/rpc');
    console.log('📋 Available methods: http://localhost:8545/api/rpc/methods');
    console.log('⚠️  Note: Wallet creation should be handled by external wallet applications');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAndUpdateChain();