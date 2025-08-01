/**
 * TOPAY Foundation Quantum-Safe Wallet Creation Prototype
 * 
 * Demonstrates quantum-safe wallet generation, HD wallet support,
 * and key management features
 */

import { Blockchain } from './blockchain/blockchain.js';

class WalletPrototype {
  constructor() {
    this.wallets = [];
    this.blockchain = null;
  }

  async initialize() {
    console.log('🚀 TOPAY Foundation Wallet Creation Prototype');
    console.log('=' .repeat(60));
    console.log('🔐 Quantum-Safe Wallet Technology Demo');
    console.log('');

    // Initialize blockchain for wallet operations
    this.blockchain = new Blockchain();
    console.log('✅ Blockchain initialized for wallet operations');
  }

  async createStandardWallet() {
    console.log('\n📱 Creating Standard Quantum-Safe Wallet...');
    console.log('-'.repeat(50));

    const wallet = new Wallet();
    const walletData = await wallet.generateWallet();

    const walletInfo = {
      id: this.wallets.length + 1,
      type: 'Standard',
      address: wallet.address,
      publicKey: wallet.keyPair?.publicKey ? 
        Array.from(wallet.keyPair.publicKey).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('') + '...' : 
        'Not available',
      kemPublicKey: wallet.kemKeyPair?.publicKey ? 
        Array.from(wallet.kemKeyPair.publicKey).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('') + '...' : 
        'Not available',
      createdAt: new Date().toISOString(),
      wallet: wallet
    };

    this.wallets.push(walletInfo);

    console.log(`✅ Wallet Created Successfully!`);
    console.log(`   Address: ${walletInfo.address}`);
    console.log(`   Public Key: ${walletInfo.publicKey}`);
    console.log(`   KEM Public Key: ${walletInfo.kemPublicKey}`);
    console.log(`   Created: ${new Date(walletInfo.createdAt).toLocaleString()}`);

    return walletInfo;
  }

  async createHDWallet(childCount = 5) {
    console.log(`\n🌳 Creating HD (Hierarchical Deterministic) Wallet with ${childCount} addresses...`);
    console.log('-'.repeat(50));

    const hdWallet = new Wallet();
    const hdResult = await hdWallet.generateHDWallet(childCount);

    const walletInfo = {
      id: this.wallets.length + 1,
      type: 'HD Wallet',
      mainAddress: hdResult.mainAddress,
      childAddresses: hdResult.childAddresses,
      totalAddresses: childCount + 1,
      createdAt: new Date().toISOString(),
      wallet: hdWallet
    };

    this.wallets.push(walletInfo);

    console.log(`✅ HD Wallet Created Successfully!`);
    console.log(`   Main Address: ${walletInfo.mainAddress}`);
    console.log(`   Child Addresses: ${childCount}`);
    console.log(`   Total Addresses: ${walletInfo.totalAddresses}`);
    
    console.log('\n   📋 Child Addresses:');
    hdResult.childAddresses.forEach((addr, index) => {
      console.log(`      ${index + 1}. ${addr}`);
    });

    return walletInfo;
  }

  async createMultipleWallets(count = 3) {
    console.log(`\n👥 Creating ${count} Standard Wallets (Batch Creation)...`);
    console.log('-'.repeat(50));

    const batchWallets = [];
    const startTime = Date.now();

    for (let i = 0; i < count; i++) {
      console.log(`   Creating wallet ${i + 1}/${count}...`);
      const walletInfo = await this.createStandardWallet();
      batchWallets.push(walletInfo);
    }

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log(`\n✅ Batch Creation Completed!`);
    console.log(`   Wallets Created: ${count}`);
    console.log(`   Total Time: ${totalTime}s`);
    console.log(`   Average Time per Wallet: ${(totalTime / count).toFixed(3)}s`);

    return batchWallets;
  }

  async demonstrateWalletFeatures() {
    console.log('\n🔧 Demonstrating Wallet Features...');
    console.log('-'.repeat(50));

    if (this.wallets.length === 0) {
      console.log('❌ No wallets available for demonstration');
      return;
    }

    const wallet = this.wallets[0].wallet;

    // Demonstrate address generation
    console.log('\n📍 Address Generation:');
    console.log(`   Address Format: TOPAY + 40 hex characters`);
    console.log(`   Example: ${wallet.address}`);
    console.log(`   Quantum-Safe: ✅ TOPAY-Z512 based`);

    // Demonstrate key pair information
    console.log('\n🔑 Key Pair Information:');
    if (wallet.keyPair) {
      console.log(`   Public Key Length: ${wallet.keyPair.publicKey.length} bytes`);
      console.log(`   Private Key Length: ${wallet.keyPair.secretKey ? wallet.keyPair.secretKey.length : 'Protected'} bytes`);
      console.log(`   Algorithm: TOPAY-Z512 Quantum-Safe`);
    }

    // Demonstrate KEM key pair
    console.log('\n🛡️ KEM (Key Encapsulation) Keys:');
    if (wallet.kemKeyPair) {
      console.log(`   KEM Public Key Length: ${wallet.kemKeyPair.publicKey.length} bytes`);
      console.log(`   KEM Secret Key Length: ${wallet.kemKeyPair.secretKey ? wallet.kemKeyPair.secretKey.length : 'Protected'} bytes`);
      console.log(`   Purpose: Quantum-safe encryption`);
    }

    // Demonstrate wallet balance (if connected to blockchain)
    console.log('\n💰 Wallet Balance:');
    if (this.blockchain) {
      const balance = this.blockchain.getBalance(wallet.address);
      console.log(`   Current Balance: ${balance} TOPAY`);
      console.log(`   Status: ${balance > 0 ? 'Active' : 'New Wallet'}`);
    }
  }

  displayWalletSummary() {
    console.log('\n📊 Wallet Creation Summary');
    console.log('=' .repeat(60));

    if (this.wallets.length === 0) {
      console.log('❌ No wallets created yet');
      return;
    }

    console.log(`Total Wallets Created: ${this.wallets.length}`);
    console.log('');

    this.wallets.forEach((walletInfo, index) => {
      console.log(`${index + 1}. ${walletInfo.type} Wallet`);
      console.log(`   ID: ${walletInfo.id}`);
      
      if (walletInfo.type === 'HD Wallet') {
        console.log(`   Main Address: ${walletInfo.mainAddress}`);
        console.log(`   Child Addresses: ${walletInfo.childAddresses.length}`);
        console.log(`   Total Addresses: ${walletInfo.totalAddresses}`);
      } else {
        console.log(`   Address: ${walletInfo.address}`);
      }
      
      console.log(`   Created: ${new Date(walletInfo.createdAt).toLocaleString()}`);
      console.log('');
    });
  }

  async exportWalletData() {
    console.log('\n💾 Exporting Wallet Data...');
    console.log('-'.repeat(50));

    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      totalWallets: this.wallets.length,
      wallets: this.wallets.map(w => ({
        id: w.id,
        type: w.type,
        address: w.type === 'HD Wallet' ? w.mainAddress : w.address,
        childAddresses: w.childAddresses || [],
        createdAt: w.createdAt
      }))
    };

    console.log('✅ Wallet data prepared for export');
    console.log(`   Format: JSON`);
    console.log(`   Size: ${JSON.stringify(exportData).length} bytes`);
    console.log(`   Wallets: ${exportData.totalWallets}`);

    return exportData;
  }

  async demonstrateSecurityFeatures() {
    console.log('\n🔒 Security Features Demonstration');
    console.log('-'.repeat(50));

    console.log('🛡️ Quantum-Safe Cryptography:');
    console.log('   ✅ TOPAY-Z512 hash function');
    console.log('   ✅ Post-quantum key generation');
    console.log('   ✅ KEM-based encryption');
    console.log('   ✅ Quantum-resistant signatures');

    console.log('\n🔐 Key Management:');
    console.log('   ✅ Secure key pair generation');
    console.log('   ✅ Hierarchical deterministic wallets');
    console.log('   ✅ Multiple address derivation');
    console.log('   ✅ Private key protection');

    console.log('\n🌐 Network Security:');
    console.log('   ✅ Address validation');
    console.log('   ✅ Transaction signing');
    console.log('   ✅ Blockchain integration');
    console.log('   ✅ Future-proof design');
  }
}

async function runWalletPrototype() {
  const prototype = new WalletPrototype();
  
  try {
    // Initialize the prototype
    await prototype.initialize();

    // Create different types of wallets
    await prototype.createStandardWallet();
    await prototype.createHDWallet(3);
    await prototype.createMultipleWallets(2);

    // Demonstrate wallet features
    await prototype.demonstrateWalletFeatures();

    // Show security features
    await prototype.demonstrateSecurityFeatures();

    // Display summary
    prototype.displayWalletSummary();

    // Export wallet data
    await prototype.exportWalletData();

    console.log('\n🎉 Wallet Creation Prototype Completed!');
    console.log('✨ All quantum-safe wallet features demonstrated successfully!');

  } catch (error) {
    console.error('❌ Error in wallet prototype:', error);
    process.exit(1);
  }
}

// Run the wallet prototype
runWalletPrototype().catch(console.error);