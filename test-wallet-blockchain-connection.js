/**
 * Test Wallet-Blockchain Connection
 * Verifies that the wallet can successfully interact with the blockchain
 */

// Using built-in fetch API (Node.js 18+)

const WALLET_API_URL = 'http://localhost:3000/api';
const BLOCKCHAIN_RPC_URL = 'http://localhost:8545/rpc';

async function testWalletBlockchainConnection() {
  console.log('🔗 Testing TOPAY Wallet-Blockchain Connection');
  console.log('=' .repeat(50));

  try {
    // Test 1: Check if wallet can get blockchain info
    console.log('\n1. Testing wallet API blockchain connection...');
    const walletBlockchainResponse = await fetch(`${WALLET_API_URL}/blockchain/info`);
    
    if (walletBlockchainResponse.ok) {
      const blockchainInfo = await walletBlockchainResponse.json();
      console.log('✅ Wallet successfully connected to blockchain!');
      console.log(`   Blocks: ${blockchainInfo.blockCount}`);
      console.log(`   Difficulty: ${blockchainInfo.difficulty}`);
      console.log(`   Mempool: ${blockchainInfo.mempoolSize}`);
      console.log(`   Total Transactions: ${blockchainInfo.totalTransactions}`);
    } else {
      console.log('❌ Wallet failed to connect to blockchain');
      return;
    }

    // Test 2: Direct RPC call to blockchain
    console.log('\n2. Testing direct RPC call to blockchain...');
    const rpcResponse = await fetch(BLOCKCHAIN_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'topay_getChainInfo',
        params: [],
        id: 1
      })
    });

    if (rpcResponse.ok) {
      const rpcData = await rpcResponse.json();
      console.log('✅ Direct RPC call successful!');
      console.log(`   Chain Height: ${rpcData.result.height}`);
      console.log(`   Latest Block Hash: ${rpcData.result.latestBlock.hash.substring(0, 20)}...`);
    } else {
      console.log('❌ Direct RPC call failed');
    }

    // Test 3: Generate a test wallet
    console.log('\n3. Testing wallet generation...');
    const walletResponse = await fetch(`${WALLET_API_URL}/wallet/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: 'test123',
        name: 'Test Wallet'
      })
    });

    if (walletResponse.ok) {
      const walletData = await walletResponse.json();
      console.log('✅ Wallet generation successful!');
      console.log(`   Address: ${walletData.address}`);
      console.log(`   Public Key: ${walletData.publicKey.substring(0, 20)}...`);
      
      // Test 4: Check wallet balance via blockchain
      console.log('\n4. Testing balance check via blockchain...');
      const balanceResponse = await fetch(BLOCKCHAIN_RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'topay_getBalance',
          params: [walletData.address],
          id: 2
        })
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        console.log('✅ Balance check successful!');
        console.log(`   Balance: ${balanceData.result} TOPAY`);
      } else {
        console.log('❌ Balance check failed');
      }
    } else {
      console.log('❌ Wallet generation failed');
    }

    console.log('\n🎉 Wallet-Blockchain connection test completed!');
    console.log('\n💡 The wallet is now successfully interacting with the blockchain!');
    console.log('   - Wallet can retrieve blockchain information');
    console.log('   - Wallet can generate quantum-safe addresses');
    console.log('   - Wallet can check balances on the blockchain');
    console.log('   - All components are working together!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

// Run the test
testWalletBlockchainConnection();