/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Core Transaction Class
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

class Transaction {
  constructor(from, to, amount, data = null) {
    this.from = from; // Public key or address
    this.to = to; // Public key or address
    this.amount = amount;
    this.data = data; // Optional data payload
    this.timestamp = Date.now();
    this.signature = null;
    this.encryptedData = null;
    this.kemCiphertext = null;
    this.id = null;
  }

  /**
   * Calculate transaction hash using TOPAY-Z512
   */
  async calculateHash() {
    const transactionString = JSON.stringify({
      from: this.from,
      to: this.to,
      amount: this.amount,
      timestamp: this.timestamp,
      data: this.data
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(transactionString);
    const hash = await computeHash(data);
    
    // Convert hash to hex string
    return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt transaction data using KEM
   */
  async encryptData(recipientPublicKey) {
    if (!this.data) return;

    try {
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(JSON.stringify(this.data));
      
      // Use KEM for quantum-safe encryption
      const { ciphertext, sharedSecret } = await kemEncapsulate(recipientPublicKey);
      
      // Simple XOR encryption with shared secret (in production, use AES)
      const encryptedData = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        encryptedData[i] = dataBytes[i] ^ sharedSecret[i % sharedSecret.length];
      }
      
      this.encryptedData = Array.from(encryptedData);
      this.kemCiphertext = Array.from(ciphertext);
      
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt transaction data');
    }
  }

  /**
   * Decrypt transaction data using KEM
   */
  async decryptData(recipientSecretKey) {
    if (!this.encryptedData || !this.kemCiphertext) {
      return null;
    }

    try {
      const ciphertext = new Uint8Array(this.kemCiphertext);
      const sharedSecret = await kemDecapsulate(recipientSecretKey, ciphertext);
      
      // Decrypt using XOR
      const encryptedBytes = new Uint8Array(this.encryptedData);
      const decryptedData = new Uint8Array(encryptedBytes.length);
      
      for (let i = 0; i < encryptedBytes.length; i++) {
        decryptedData[i] = encryptedBytes[i] ^ sharedSecret[i % sharedSecret.length];
      }
      
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedData);
      
      return JSON.parse(decryptedString);
      
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Sign transaction (simplified - in production use proper digital signatures)
   */
  async signTransaction(privateKey) {
    const hash = await this.calculateHash();
    // Simplified signing - in production, implement proper TOPAY-Z512 signatures
    this.signature = hash; // Placeholder
    this.id = hash;
  }

  /**
   * Validate transaction
   */
  async isValid() {
    if (!this.signature) return false;
    if (this.amount <= 0) return false;
    
    // Validate from address (allow null for mining rewards)
    if (this.from !== null && (!this.from || this.from.trim() === '')) return false;
    if (!this.to || this.to.trim() === '') return false;
    
    const hash = await this.calculateHash();
    return this.signature === hash; // Simplified validation
  }

  /**
   * Fragment large transaction data for mobile optimization
   */
  async fragmentTransaction() {
    const transactionData = new TextEncoder().encode(JSON.stringify(this));
    
    if (transactionData.length > 1024) { // Fragment if larger than 1KB
      const fragResult = await fragmentData(transactionData);
      return {
        isFragmented: true,
        fragments: fragResult.fragments,
        metadata: fragResult.metadata
      };
    }
    
    return {
      isFragmented: false,
      data: transactionData
    };
  }

  /**
   * Reconstruct transaction from fragments
   */
  static async reconstructFromFragments(fragments) {
    const reconResult = await reconstructData(fragments);
    
    if (!reconResult.isComplete) {
      throw new Error('Transaction reconstruction failed - missing fragments');
    }
    
    const decoder = new TextDecoder();
    const transactionJson = decoder.decode(reconResult.data);
    const transactionData = JSON.parse(transactionJson);
    
    // Recreate transaction object
    const transaction = new Transaction(
      transactionData.from,
      transactionData.to,
      transactionData.amount,
      transactionData.data
    );
    
    transaction.timestamp = transactionData.timestamp;
    transaction.signature = transactionData.signature;
    transaction.encryptedData = transactionData.encryptedData;
    transaction.kemCiphertext = transactionData.kemCiphertext;
    transaction.id = transactionData.id;
    
    return transaction;
  }

  /**
   * Convert to JSON for storage/transmission
   */
  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      amount: this.amount,
      data: this.data,
      timestamp: this.timestamp,
      signature: this.signature,
      encryptedData: this.encryptedData,
      kemCiphertext: this.kemCiphertext
    };
  }

  /**
   * Create transaction from JSON
   */
  static fromJSON(json) {
    const transaction = new Transaction(json.from, json.to, json.amount, json.data);
    transaction.id = json.id;
    transaction.timestamp = json.timestamp;
    transaction.signature = json.signature;
    transaction.encryptedData = json.encryptedData;
    transaction.kemCiphertext = json.kemCiphertext;
    return transaction;
  }
}

export { Transaction };