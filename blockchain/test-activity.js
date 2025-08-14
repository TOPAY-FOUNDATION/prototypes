/**
 * Simple test script to verify blockchain activity generation
 */

import fetch from 'node-fetch';

const RPC_URL = 'http://localhost:8545/rpc';
let requestId = 1;

// Simple RPC call function
async function rpcCall(method, params = []) {
  try {
    console.log(`🔄 Making RPC call: ${method}`);
    
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: requestId++
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    console.log(`✅ RPC call successful: ${method}`);
    return data.result;
  } catch (error) {
    console.error(`❌ RPC call failed for ${method}:`, error.message);
    throw error;
  }
}

// Test function
async function testBlockchainActivity() {
  console.log('🚀 Testing TOPAY Blockchain Activity');
  console.log('=' .repeat(40));
  
  try {
    // Test connection
    console.log('\n1. Testing connection...');
    const blockNumber = await rpcCall('topay_getBlockNumber');
    console.log(`   Current block number: ${blockNumber}`);
    
    // Get chain info
    console.log('\n2. Getting chain info...');
    const chainInfo = await rpcCall('topay_getChainInfo');
    console.log(`   Blocks: ${chainInfo.blockCount}`);
    console.log(`   Total Transactions: ${chainInfo.totalTransactions}`);
    console.log(`   Mempool Size: ${chainInfo.mempoolSize}`);
    
    // Create a test transaction with proper structure (using miner address that has balance)
    console.log('\n3. Creating test transaction...');
    const txData = {
      from: 'TOPAYminer234567890abcdef1234567890abcdef12345678', // Miner address with 100 TOPAY balance
      to: 'TOPAY2345678901bcdef2345678901bcdef23456789',
      amount: 10,
      memo: 'Test transaction from activity generator'
    };
    
    const txResult = await rpcCall('topay_sendTransaction', [txData]);
    console.log(`   Transaction created: ${txResult.transactionHash}`);
    
    // Check mempool
    console.log('\n4. Checking mempool...');
    const mempool = await rpcCall('topay_getMempool');
    console.log(`   Mempool size: ${mempool.count}`);
    
    // Mine if there are transactions
    if (mempool.count > 0) {
      console.log('\n5. Mining block...');
      const minerAddress = 'TOPAYminer234567890abcdef1234567890abcdef12345678';
      const mineResult = await rpcCall('topay_mine', [minerAddress]);
      console.log(`   Block mined: #${mineResult.blockIndex}`);
      console.log(`   Block hash: ${mineResult.blockHash}`);
      console.log(`   Transactions: ${mineResult.transactions}`);
      
      // Create another transaction to test continuous activity
        console.log('\n6. Creating second transaction...');
        const txData2 = {
          from: 'TOPAY2345678901bcdef2345678901bcdef23456789', // This address should now have 10 TOPAY
          to: 'TOPAY3456789012cdef3456789012cdef34567890ab',
          amount: 5,
          memo: 'Second test transaction'
        };
       
       const txResult2 = await rpcCall('topay_sendTransaction', [txData2]);
       console.log(`   Second transaction created: ${txResult2.transactionHash}`);
    } else {
      console.log('\n5. No transactions in mempool to mine.');
    }
    
    // Final status
    console.log('\n7. Final status...');
    const finalChainInfo = await rpcCall('topay_getChainInfo');
    console.log(`   Final blocks: ${finalChainInfo.blockCount}`);
    console.log(`   Final transactions: ${finalChainInfo.totalTransactions}`);
    
    // Check final mempool
    const finalMempool = await rpcCall('topay_getMempool');
    console.log(`   Final mempool size: ${finalMempool.count}`);
    
    if (finalMempool.count > 0) {
      console.log('\n8. Mining final block...');
      const finalMineResult = await rpcCall('topay_mine', ['TOPAYminer234567890abcdef1234567890abcdef12345678']);
      console.log(`   Final block mined: #${finalMineResult.blockIndex}`);
    }
    
    console.log('\n✅ Blockchain activity test completed successfully!');
    console.log('\n💡 Now check your miner application to see if it detected these activities!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n🔧 Make sure the blockchain server is running:');
    console.error('   cd blockchain && npm start');
  }
}

// Run the test
testBlockchainActivity().catch(console.error);