/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Wallet Class for Key Management
 * 
 * Implements quantum-safe wallet functionality using TOPAY-Z512
 */

import {
  generateKeyPair,
  generateKeyPairFromSeed,
  deriveChildKeyPair,
  generateHDWallet,
  kemKeyGen,
  computeHash,
  secureRandom
} from '@topayfoundation/topayz512';

export class Wallet {
  constructor() {
    this.keyPair = null;
    this.kemKeyPair = null;
    this.address = null;
    this.balance = 0;
    this.transactionHistory = [];
    this.hdWallet = null;
    this.childKeys = new Map();
  }

  /**
   * Generate new wallet with quantum-safe keys
   */
  async generateWallet() {
    console.log('🔐 Generating quantum-safe wallet...');
    
    try {
      // Generate main key pair
      this.keyPair = await generateKeyPair();
      
      // Generate KEM key pair for encryption
      this.kemKeyPair = await kemKeyGen();
      
      // Generate address from public key
      this.address = await this.generateAddress();
      
      console.log(`✅ Wallet generated successfully!`);
      console.log(`   Address: ${this.address}`);
      
      return {
        address: this.address,
        publicKey: Array.from(this.keyPair.publicKey),
        kemPublicKey: Array.from(this.kemKeyPair.publicKey)
      };
      
    } catch (error) {
      console.error('❌ Wallet generation failed:', error);
      throw new Error('Failed to generate wallet');
    }
  }

  /**
   * Generate wallet from seed (deterministic)
   */
  async generateFromSeed(seed) {
    console.log('🌱 Generating wallet from seed...');
    
    try {
      if (typeof seed === 'string') {
        const encoder = new TextEncoder();
        seed = encoder.encode(seed);
      }
      
      // Ensure seed is 32 bytes
      if (seed.length < 32) {
        const paddedSeed = new Uint8Array(32);
        paddedSeed.set(seed);
        seed = paddedSeed;
      } else if (seed.length > 32) {
        seed = seed.slice(0, 32);
      }
      
      this.keyPair = await generateKeyPairFromSeed(seed);
      this.kemKeyPair = await kemKeyGen(); // KEM keys are random for security
      this.address = await this.generateAddress();
      
      console.log(`✅ Deterministic wallet generated!`);
      console.log(`   Address: ${this.address}`);
      
      return {
        address: this.address,
        publicKey: Array.from(this.keyPair.publicKey),
        kemPublicKey: Array.from(this.kemKeyPair.publicKey)
      };
      
    } catch (error) {
      console.error('❌ Seed wallet generation failed:', error);
      throw new Error('Failed to generate wallet from seed');
    }
  }

  /**
   * Generate HD wallet for multiple addresses
   */
  async generateHDWallet(count = 5) {
    console.log(`🌳 Generating HD wallet with ${count} addresses...`);
    
    try {
      const seed = await secureRandom(32);
      this.hdWallet = await generateHDWallet(seed, count);
      
      // Set main wallet to first key pair
      this.keyPair = this.hdWallet[0];
      this.kemKeyPair = await kemKeyGen();
      this.address = await this.generateAddress();
      
      // Store child keys
      for (let i = 1; i < this.hdWallet.length; i++) {
        const childAddress = await this.generateAddressFromPublicKey(this.hdWallet[i].publicKey);
        this.childKeys.set(i, {
          keyPair: this.hdWallet[i],
          address: childAddress
        });
      }
      
      console.log(`✅ HD wallet generated with ${count} addresses!`);
      console.log(`   Main address: ${this.address}`);
      
      return {
        mainAddress: this.address,
        childAddresses: Array.from(this.childKeys.values()).map(child => child.address),
        totalAddresses: count
      };
      
    } catch (error) {
      console.error('❌ HD wallet generation failed:', error);
      throw new Error('Failed to generate HD wallet');
    }
  }

  /**
   * Generate address from public key using TOPAY-Z512 hash
   */
  async generateAddress() {
    if (!this.keyPair) {
      throw new Error('No key pair available');
    }
    
    return await this.generateAddressFromPublicKey(this.keyPair.publicKey);
  }

  /**
   * Generate address from any public key
   */
  async generateAddressFromPublicKey(publicKey) {
    const hash = await computeHash(publicKey);
    
    // Take first 20 bytes and convert to hex with TO prefix and PAY suffix
    const addressBytes = hash.slice(0, 20);
    const addressHex = Array.from(addressBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
    
    return `TO${addressHex}PAY`;
  }

  /**
   * Get wallet balance (would connect to blockchain in real implementation)
   */
  getBalance() {
    return this.balance;
  }

  /**
   * Update balance (simplified for prototype)
   */
  updateBalance(amount) {
    this.balance += amount;
    console.log(`💰 Balance updated: ${this.balance} TOPAY`);
  }

  /**
   * Add transaction to history
   */
  addTransaction(transaction) {
    this.transactionHistory.push({
      ...transaction.toJSON(),
      timestamp: Date.now()
    });
  }

  /**
   * Get transaction history
   */
  getTransactionHistory() {
    return this.transactionHistory;
  }

  /**
   * Get child address by index (HD wallet)
   */
  getChildAddress(index) {
    return this.childKeys.get(index)?.address || null;
  }

  /**
   * Get all child addresses (HD wallet)
   */
  getAllChildAddresses() {
    return Array.from(this.childKeys.values()).map(child => ({
      index: Array.from(this.childKeys.keys())[Array.from(this.childKeys.values()).indexOf(child)],
      address: child.address
    }));
  }

  /**
   * Export wallet data (excluding private keys for security)
   */
  exportPublicData() {
    return {
      address: this.address,
      publicKey: this.keyPair ? Array.from(this.keyPair.publicKey) : null,
      kemPublicKey: this.kemKeyPair ? Array.from(this.kemKeyPair.publicKey) : null,
      balance: this.balance,
      transactionCount: this.transactionHistory.length,
      childAddresses: this.getAllChildAddresses(),
      isHDWallet: this.hdWallet !== null
    };
  }

  /**
   * Get wallet statistics
   */
  getStats() {
    return {
      address: this.address,
      balance: this.balance,
      transactionCount: this.transactionHistory.length,
      childAddressCount: this.childKeys.size,
      isHDWallet: this.hdWallet !== null,
      hasKEMKeys: this.kemKeyPair !== null,
      createdAt: this.keyPair?.timestamp || Date.now()
    };
  }

  /**
   * Validate wallet integrity
   */
  async isValid() {
    if (!this.keyPair || !this.address) {
      return false;
    }

    // Verify address matches public key
    const expectedAddress = await this.generateAddress();
    return this.address === expectedAddress;
  }

  /**
   * Secure wallet cleanup (in production, implement secure memory erasure)
   */
  secureErase() {
    console.log('🗑️ Securely erasing wallet data...');
    
    // In production, use secure memory erasure from TOPAY-Z512
    this.keyPair = null;
    this.kemKeyPair = null;
    this.hdWallet = null;
    this.childKeys.clear();
    this.transactionHistory = [];
    
    console.log('✅ Wallet data erased');
  }

  /**
   * Create backup data (public information only)
   */
  createBackup() {
    return {
      address: this.address,
      balance: this.balance,
      transactionHistory: this.transactionHistory,
      childAddresses: this.getAllChildAddresses(),
      createdAt: Date.now(),
      backupVersion: '1.0'
    };
  }

  /**
   * Restore from backup (public data only)
   */
  restoreFromBackup(backupData) {
    if (backupData.address !== this.address) {
      throw new Error('Backup address does not match wallet address');
    }
    
    this.balance = backupData.balance || 0;
    this.transactionHistory = backupData.transactionHistory || [];
    
    console.log('✅ Wallet restored from backup');
  }
}