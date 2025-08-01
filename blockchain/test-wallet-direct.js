// Test wallet creation directly
import { Wallet } from './src/blockchain/Wallet.js';

async function testWalletCreation() {
  console.log('🧪 Testing direct wallet creation...\n');
  
  try {
    console.log('1. Creating Wallet instance...');
    const wallet = new Wallet();
    console.log('   ✅ Wallet instance created');
    
    console.log('2. Generating wallet...');
    const walletData = await wallet.generateWallet();
    console.log('   ✅ Wallet generated');
    
    console.log('3. Wallet details:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Has keyPair: ${!!wallet.keyPair}`);
    console.log(`   Has kemKeyPair: ${!!wallet.kemKeyPair}`);
    console.log(`   Public key length: ${walletData.publicKey?.length || 'null'}`);
    console.log(`   KEM public key length: ${walletData.kemPublicKey?.length || 'null'}`);
    
  } catch (error) {
    console.error('❌ Direct wallet test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testWalletCreation();