/**
 * TOPAY Foundation Simple Blockchain
 * Basic Block Class with 512-bit Hashing
 */

import { computeHash, computeMerkleRoot } from '@topayfoundation/topayz512';

export class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data; // Simple data field instead of complex transactions
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = '';
  }

  /**
   * Calculate block hash using TOPAY-Z512 (512-bit)
   */
  async calculateHash() {
    const blockString = JSON.stringify({
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
      nonce: this.nonce
    });
    
    const encoder = new TextEncoder();
    const blockData = encoder.encode(blockString);
    const hashBuffer = await computeHash(blockData);
    
    // Convert to hex string (512-bit = 64 bytes = 128 hex characters)
    return Array.from(hashBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Mine block using simple Proof of Work
   */
  async mineBlock(difficulty = 2) {
    console.log(`🔨 Mining block ${this.index} with difficulty ${difficulty}...`);
    const startTime = Date.now();
    
    const target = '0'.repeat(difficulty);
    
    while (true) {
      this.hash = await this.calculateHash();
      
      if (this.hash.substring(0, difficulty) === target) {
        const miningTime = (Date.now() - startTime) / 1000;
        console.log(`✅ Block ${this.index} mined in ${miningTime}s!`);
        console.log(`   Hash: ${this.hash.substring(0, 20)}...`);
        console.log(`   Nonce: ${this.nonce}`);
        break;
      }
      
      this.nonce++;
      
      // Progress indicator every 5000 attempts
      if (this.nonce % 5000 === 0) {
        console.log(`   Attempt ${this.nonce}, hash: ${this.hash.substring(0, 10)}...`);
      }
    }
  }

  /**
   * Validate block hash
   */
  async isValid() {
    const calculatedHash = await this.calculateHash();
    return this.hash === calculatedHash;
  }

  /**
   * Convert block to JSON
   */
  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash
    };
  }

  /**
   * Create block from JSON
   */
  static fromJSON(json) {
    const block = new Block(json.index, json.timestamp, json.data, json.previousHash);
    block.nonce = json.nonce;
    block.hash = json.hash;
    return block;
  }
}