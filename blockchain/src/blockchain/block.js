/**
 * TOPAY Foundation Quantum-Safe Blockchain Prototype
 * Core Block Class
 * 
 * Implements quantum-safe block structure with TOPAY-Z512 hashing
 */

import { computeHash, computeMerkleRoot, fragmentData, reconstructData } from '@topayfoundation/topayz512';
import { Transaction } from './transaction.js';

export class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.index = 0;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = '';
    this.merkleRoot = '';
    this.difficulty = 2; // Default difficulty
    this.validator = null; // For future PoS implementation
    this.fragmentedData = null;
  }

  /**
   * Calculate block hash using TOPAY-Z512
   */
  async calculateHash() {
    const blockString = JSON.stringify({
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions.map(tx => tx.toJSON()),
      previousHash: this.previousHash,
      nonce: this.nonce,
      merkleRoot: this.merkleRoot
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(blockString);
    const hash = await computeHash(data);
    
    // Convert to hex string
    return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Calculate Merkle root of transactions using TOPAY-Z512
   */
  async calculateMerkleRoot() {
    if (this.transactions.length === 0) {
      this.merkleRoot = '0'.repeat(128); // Empty merkle root
      return this.merkleRoot;
    }

    // Get transaction hashes
    const txHashes = [];
    for (const tx of this.transactions) {
      const txHash = await tx.calculateHash();
      txHashes.push(new TextEncoder().encode(txHash));
    }

    // Calculate merkle root using TOPAY-Z512
    const merkleRoot = await computeMerkleRoot(txHashes);
    this.merkleRoot = Array.from(merkleRoot).map(b => b.toString(16).padStart(2, '0')).join('');
    return this.merkleRoot;
  }

  /**
   * Mine block using Proof of Work with TOPAY-Z512
   */
  async mineBlock(difficulty = this.difficulty) {
    console.log(`🔨 Mining block with difficulty ${difficulty}...`);
    const startTime = Date.now();
    
    // Calculate merkle root first
    this.merkleRoot = await this.calculateMerkleRoot();
    
    const target = '0'.repeat(difficulty);
    
    while (true) {
      this.hash = await this.calculateHash();
      
      if (this.hash.substring(0, difficulty) === target) {
        const miningTime = (Date.now() - startTime) / 1000;
        console.log(`✅ Block mined in ${miningTime}s! Hash: ${this.hash}`);
        console.log(`   Nonce: ${this.nonce}`);
        console.log(`   Merkle Root: ${this.merkleRoot}`);
        break;
      }
      
      this.nonce++;
      
      // Progress indicator every 10000 attempts
      if (this.nonce % 10000 === 0) {
        console.log(`   Attempt ${this.nonce}, current hash: ${this.hash.substring(0, 10)}...`);
      }
    }
  }

  /**
   * Validate block integrity
   */
  async isValid() {
    // Check if hash is correct
    const calculatedHash = await this.calculateHash();
    if (this.hash !== calculatedHash) {
      console.log('❌ Block hash is invalid');
      return false;
    }

    // Check merkle root (only if we have transactions)
    if (this.transactions.length > 0) {
      const calculatedMerkleRoot = await this.calculateMerkleRoot();
      if (this.merkleRoot !== calculatedMerkleRoot) {
        console.log('❌ Merkle root is invalid');
        console.log(`   Expected: ${this.merkleRoot}`);
        console.log(`   Calculated: ${calculatedMerkleRoot}`);
        return false;
      }
    }

    // Validate all transactions
    for (const transaction of this.transactions) {
      if (!(await transaction.isValid())) {
        console.log('❌ Invalid transaction found in block');
        return false;
      }
    }

    // Check proof of work
    const target = '0'.repeat(this.difficulty);
    if (this.hash.substring(0, this.difficulty) !== target) {
      console.log('❌ Block does not meet difficulty requirement');
      return false;
    }

    return true;
  }

  /**
   * Fragment block data for mobile optimization
   */
  async fragmentBlock() {
    const blockData = new TextEncoder().encode(JSON.stringify(this.toJSON()));
    
    if (blockData.length > 2048) { // Fragment if larger than 2KB
      console.log(`📦 Fragmenting block (${blockData.length} bytes)...`);
      const fragResult = await fragmentData(blockData);
      
      this.fragmentedData = {
        isFragmented: true,
        fragments: fragResult.fragments,
        metadata: fragResult.metadata,
        originalSize: blockData.length
      };
      
      console.log(`   Created ${fragResult.fragments.length} fragments`);
      return this.fragmentedData;
    }
    
    return {
      isFragmented: false,
      data: blockData
    };
  }

  /**
   * Reconstruct block from fragments
   */
  static async reconstructFromFragments(fragments) {
    console.log(`🔧 Reconstructing block from ${fragments.length} fragments...`);
    
    const reconResult = await reconstructData(fragments);
    
    if (!reconResult.isComplete) {
      throw new Error(`Block reconstruction failed - missing fragments: ${reconResult.missingFragments}`);
    }
    
    if (!reconResult.integrityVerified) {
      throw new Error('Block reconstruction failed - integrity check failed');
    }
    
    const decoder = new TextDecoder();
    const blockJson = decoder.decode(reconResult.data);
    const blockData = JSON.parse(blockJson);
    
    // Recreate block object
    const transactions = blockData.transactions.map(txData => Transaction.fromJSON(txData));
    const block = new Block(blockData.timestamp, transactions, blockData.previousHash);
    
    block.index = blockData.index;
    block.nonce = blockData.nonce;
    block.hash = blockData.hash;
    block.merkleRoot = blockData.merkleRoot;
    block.difficulty = blockData.difficulty;
    block.validator = blockData.validator;
    
    console.log(`✅ Block reconstructed successfully`);
    return block;
  }

  /**
   * Get block size in bytes
   */
  getSize() {
    return new TextEncoder().encode(JSON.stringify(this.toJSON())).length;
  }

  /**
   * Get block statistics
   */
  getStats() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactionCount: this.transactions.length,
      size: this.getSize(),
      difficulty: this.difficulty,
      nonce: this.nonce,
      hash: this.hash,
      merkleRoot: this.merkleRoot,
      isFragmented: this.fragmentedData?.isFragmented || false,
      fragmentCount: this.fragmentedData?.fragments?.length || 0
    };
  }

  /**
   * Convert to JSON for storage/transmission
   */
  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions.map(tx => tx.toJSON()),
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash,
      merkleRoot: this.merkleRoot,
      difficulty: this.difficulty,
      validator: this.validator,
      fragmentedData: this.fragmentedData
    };
  }

  /**
   * Create block from JSON
   */
  static fromJSON(json) {
    const transactions = json.transactions.map(txData => Transaction.fromJSON(txData));
    const block = new Block(json.timestamp, transactions, json.previousHash);
    
    block.index = json.index;
    block.nonce = json.nonce;
    block.hash = json.hash;
    block.merkleRoot = json.merkleRoot;
    block.difficulty = json.difficulty;
    block.validator = json.validator;
    block.fragmentedData = json.fragmentedData;
    
    return block;
  }
}