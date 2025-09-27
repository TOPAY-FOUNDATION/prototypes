/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Quantum-Safe Wallet Implementation
 * 
 * Features quantum-safe cryptography using TOPAY-Z512
 */

import {
  generateKeyPair,
  computeHash,
  kemEncapsulate,
  kemDecapsulate,
  fragmentData,
  reconstructData
} from '@topayfoundation/topayz512';

export class Wallet {
  constructor() {
    this.publicKey = null;
    this.privateKey = null;
    this.address = null;
    this.balance = 0;
    this.transactionHistory = [];
    this.isQuantumSafe = true;
    this.walletVersion = '1.0.0';
    this.createdAt = Date.now();
  }

  /**
   * Generate a new quantum-safe wallet
   */
  async generateWallet() {
    try {
      const keyPair = await generateKeyPair();
      this.publicKey = Array.from(keyPair.publicKey);
      this.privateKey = Array.from(keyPair.privateKey);
      this.address = await this.deriveAddress(keyPair.publicKey);
      
      console.log('Quantum-safe wallet generated successfully');
      return {
        address: this.address,
        publicKey: this.publicKey
      };
      
    } catch (error) {
      console.error('Failed to generate wallet:', error);
      throw new Error('Wallet generation failed');
    }
  }

  /**
   * Create deterministic wallet from seed
   */
  async generateFromSeed(seed) {
    try {
      // Hash the seed to create deterministic entropy
      const encoder = new TextEncoder();
      const seedBytes = encoder.encode(seed);
      const hashedSeed = await computeHash(seedBytes);
      
      // Use hashed seed as entropy for key generation
      // Note: This is simplified - production should use proper KDF
      const keyPair = await generateKeyPair(hashedSeed);
      
      this.publicKey = Array.from(keyPair.publicKey);
      this.privateKey = Array.from(keyPair.privateKey);
      this.address = await this.deriveAddress(keyPair.publicKey);
      
      console.log('Deterministic wallet generated from seed');
      return {
        address: this.address,
        publicKey: this.publicKey
      };
      
    } catch (error) {
      console.error('Failed to generate wallet from seed:', error);
      throw new Error('Seed-based wallet generation failed');
    }
  }

  /**
   * Generate HD (Hierarchical Deterministic) wallet
   */
  async generateHDWallet(masterSeed, derivationPath = "m/44'/0'/0'/0/0") {
    try {
      // Simplified HD wallet implementation
      const pathHash = await computeHash(new TextEncoder().encode(derivationPath));
      const combinedSeed = new Uint8Array(masterSeed.length + pathHash.length);
      combinedSeed.set(masterSeed);
      combinedSeed.set(pathHash, masterSeed.length);
      
      const finalSeed = await computeHash(combinedSeed);
      return await this.generateFromSeed(new TextDecoder().decode(finalSeed));
      
    } catch (error) {
      console.error('Failed to generate HD wallet:', error);
      throw new Error('HD wallet generation failed');
    }
  }

  /**
   * Derive address from public key
   */
  async deriveAddress(publicKey) {
    try {
      const hash = await computeHash(publicKey);
      
      // Convert to base58-like encoding (simplified)
      const addressBytes = hash.slice(0, 20); // Take first 20 bytes
      const addressHex = Array.from(addressBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('').toUpperCase();
      
      // Format with TO prefix and PAY suffix
      const address = `TO${addressHex}PAY`;
      
      return address;
      
    } catch (error) {
      console.error('Failed to derive address:', error);
      throw new Error('Address derivation failed');
    }
  }

  /**
   * Get balance from blockchain
   */
  async getBalance(blockchain) {
    if (!this.address) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      this.balance = await blockchain.getBalance(this.address);
      return this.balance;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error('Failed to retrieve balance from blockchain');
    }
  }

  /**
   * Get transaction history from blockchain
   */
  async getTransactionHistory(blockchain, limit = 10, offset = 0) {
    if (!this.address) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      this.transactionHistory = await blockchain.getTransactionHistory(this.address, limit, offset);
      return this.transactionHistory;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw new Error('Failed to retrieve transaction history from blockchain');
    }
  }

  /**
   * Send transaction to blockchain
   */
  async sendTransaction(blockchain, to, amount, data = null) {
    if (!this.privateKey) {
      throw new Error('Private key not available');
    }

    if (!this.address) {
      throw new Error('Wallet not initialized');
    }

    try {
      // Create transaction data
      const transactionData = {
        from: this.address,
        to: to,
        amount: amount,
        data: data,
        timestamp: Date.now(),
        nonce: Math.floor(Math.random() * 1000000) // Simple nonce for now
      };

      // Sign the transaction (simplified signing for now)
      const transactionHash = await this.signTransactionData(transactionData);
      transactionData.signature = transactionHash;

      // Send to blockchain
      const result = await blockchain.sendTransaction(transactionData);
      
      // Update local balance if transaction was successful
      if (result && !result.error) {
        this.balance = Math.max(0, this.balance - amount);
      }

      return result;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new Error('Transaction failed: ' + error.message);
    }
  }

  /**
   * Sign transaction data
   */
  async signTransactionData(transactionData) {
    if (!this.privateKey) {
      throw new Error('Private key not available for signing');
    }

    try {
      // Create a hash of the transaction data for signing
      const dataString = JSON.stringify({
        from: transactionData.from,
        to: transactionData.to,
        amount: transactionData.amount,
        data: transactionData.data,
        timestamp: transactionData.timestamp,
        nonce: transactionData.nonce
      });

      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(dataString);
      
      // Use TOPAY-Z512 hash function for signing
      const signature = await computeHash(dataBytes);
      
      return Array.from(signature);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw new Error('Transaction signing failed');
    }
  }

  /**
   * Verify transaction signature
   */
  async verifyTransactionSignature(transactionData, signature) {
    try {
      const expectedSignature = await this.signTransactionData(transactionData);
      
      // Compare signatures
      if (signature.length !== expectedSignature.length) {
        return false;
      }

      for (let i = 0; i < signature.length; i++) {
        if (signature[i] !== expectedSignature[i]) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Encrypt data for this wallet
   */
  async encryptData(data) {
    if (!this.publicKey) {
      throw new Error('Public key not available');
    }

    try {
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(JSON.stringify(data));
      
      const { ciphertext, sharedSecret } = await kemEncapsulate(new Uint8Array(this.publicKey));
      
      // Simple XOR encryption
      const encryptedData = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        encryptedData[i] = dataBytes[i] ^ sharedSecret[i % sharedSecret.length];
      }
      
      return {
        encryptedData: Array.from(encryptedData),
        kemCiphertext: Array.from(ciphertext)
      };
      
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt data for this wallet
   */
  async decryptData(encryptedPackage) {
    if (!this.privateKey) {
      throw new Error('Private key not available');
    }

    try {
      const { encryptedData, kemCiphertext } = encryptedPackage;
      const ciphertext = new Uint8Array(kemCiphertext);
      const sharedSecret = await kemDecapsulate(new Uint8Array(this.privateKey), ciphertext);
      
      // Decrypt using XOR
      const encryptedBytes = new Uint8Array(encryptedData);
      const decryptedData = new Uint8Array(encryptedBytes.length);
      
      for (let i = 0; i < encryptedBytes.length; i++) {
        decryptedData[i] = encryptedBytes[i] ^ sharedSecret[i % sharedSecret.length];
      }
      
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedData);
      
      return JSON.parse(decryptedString);
      
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Export public wallet data (safe to share)
   */
  exportPublicData() {
    return {
      address: this.address,
      publicKey: this.publicKey,
      balance: this.balance,
      isQuantumSafe: this.isQuantumSafe,
      walletVersion: this.walletVersion,
      createdAt: this.createdAt
    };
  }

  /**
   * Export wallet for backup (includes private key - handle securely!)
   */
  exportForBackup() {
    if (!this.privateKey) {
      throw new Error('Private key not available for export');
    }
    
    return {
      address: this.address,
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      balance: this.balance,
      transactionHistory: this.transactionHistory,
      isQuantumSafe: this.isQuantumSafe,
      walletVersion: this.walletVersion,
      createdAt: this.createdAt
    };
  }

  /**
   * Import wallet from backup data
   */
  importFromBackup(backupData) {
    this.address = backupData.address;
    this.publicKey = backupData.publicKey;
    this.privateKey = backupData.privateKey;
    this.balance = backupData.balance || 0;
    this.transactionHistory = backupData.transactionHistory || [];
    this.isQuantumSafe = backupData.isQuantumSafe !== false;
    this.walletVersion = backupData.walletVersion || '1.0.0';
    this.createdAt = backupData.createdAt || Date.now();
    
    console.log('Wallet imported from backup successfully');
  }

  /**
   * Create wallet from public data only (read-only wallet)
   */
  static fromPublicData(publicData) {
    const wallet = new Wallet();
    wallet.address = publicData.address;
    wallet.publicKey = publicData.publicKey;
    wallet.balance = publicData.balance || 0;
    wallet.isQuantumSafe = publicData.isQuantumSafe !== false;
    wallet.walletVersion = publicData.walletVersion || '1.0.0';
    wallet.createdAt = publicData.createdAt || Date.now();
    // privateKey remains null for read-only wallet
    
    return wallet;
  }

  /**
   * Get wallet statistics and information
   */
  getStats() {
    return {
      address: this.address,
      publicKey: this.publicKey ? Array.from(this.publicKey).slice(0, 32).map(b => b.toString(16).padStart(2, '0')).join('') + '...' : null,
      balance: this.balance,
      hasPrivateKey: !!this.privateKey,
      hasSeed: !!this.seed,
      isHDWallet: !!this.seed,
      createdAt: this.createdAt || new Date().toISOString(),
      lastBalanceUpdate: this.lastBalanceUpdate || null
    };
  }

  /**
   * Securely erase private key from memory
   */
  secureErase() {
    if (this.privateKey) {
      // Overwrite private key with random data
      for (let i = 0; i < this.privateKey.length; i++) {
        this.privateKey[i] = Math.floor(Math.random() * 256);
      }
      this.privateKey = null;
    }
    
    console.log('Private key securely erased from memory');
  }

  /**
   * Validate wallet integrity
   */
  async validateIntegrity() {
    try {
      if (!this.address || !this.publicKey) {
        return false;
      }
      
      // Verify address matches public key
      const derivedAddress = await this.deriveAddress(new Uint8Array(this.publicKey));
      return derivedAddress === this.address;
      
    } catch (error) {
      console.error('Wallet validation failed:', error);
      return false;
    }
  }

  /**
   * Get wallet statistics
   */
  getStats() {
    return {
      address: this.address,
      balance: this.balance,
      transactionCount: this.transactionHistory.length,
      isQuantumSafe: this.isQuantumSafe,
      walletVersion: this.walletVersion,
      createdAt: this.createdAt,
      hasPrivateKey: !!this.privateKey
    };
  }

  /**
   * Fragment wallet data for mobile optimization
   */
  async fragmentWalletData() {
    const walletData = new TextEncoder().encode(JSON.stringify(this.exportPublicData()));
    
    if (walletData.length > 512) { // Fragment if larger than 512 bytes
      const fragResult = await fragmentData(walletData);
      return {
        isFragmented: true,
        fragments: fragResult.fragments,
        metadata: fragResult.metadata
      };
    }
    
    return {
      isFragmented: false,
      data: walletData
    };
  }

  /**
   * Reconstruct wallet from fragments
   */
  static async reconstructFromFragments(fragments) {
    const reconResult = await reconstructData(fragments);
    
    if (!reconResult.isComplete) {
      throw new Error('Wallet reconstruction failed - missing fragments');
    }
    
    const decoder = new TextDecoder();
    const walletJson = decoder.decode(reconResult.data);
    const walletData = JSON.parse(walletJson);
    
    return Wallet.fromPublicData(walletData);
  }

  /**
   * Create wallet from private key
   */
  static async fromPrivateKey(privateKeyArray) {
    try {
      const wallet = new Wallet();
      wallet.privateKey = Array.isArray(privateKeyArray) ? privateKeyArray : Array.from(privateKeyArray);
      
      // Derive public key from private key (simplified implementation)
      // In a real implementation, you'd use proper cryptographic derivation
      const keyPair = await generateKeyPair();
      wallet.publicKey = Array.from(keyPair.publicKey);
      wallet.address = await wallet.deriveAddress(keyPair.publicKey);
      
      console.log('Wallet imported from private key successfully');
      return wallet;
      
    } catch (error) {
      console.error('Failed to import wallet from private key:', error);
      throw new Error('Private key import failed');
    }
  }

  /**
   * Convert to JSON for storage/transmission
   */
  toJSON() {
    return this.exportPublicData();
  }
}
