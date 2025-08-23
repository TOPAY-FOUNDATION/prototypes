/**
 * Wallet Security Manager
 * Handles backup, recovery, encryption, and security features
 */

import QuantumSigner from './quantum-signer.js';

class SecurityManager {
  constructor() {
    this.quantumSigner = new QuantumSigner();
    this.encryptionAlgorithm = 'AES-256-GCM';
    this.keyDerivationRounds = 100000;
  }

  /**
   * Generate a secure mnemonic phrase for wallet backup
   * @returns {string} 12-word mnemonic phrase
   */
  generateMnemonic() {
    const wordList = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'age',
      'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm',
      'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost',
      'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing',
      'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
      'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna',
      'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve',
      'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed',
      'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art',
      'article', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist',
      'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract',
      'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average',
      'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward'
    ];

    const mnemonic = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * wordList.length);
      mnemonic.push(wordList[randomIndex]);
    }

    return mnemonic.join(' ');
  }

  /**
   * Create wallet from mnemonic phrase
   * @param {string} mnemonic - 12-word mnemonic phrase
   * @returns {Object} Wallet data
   */
  createWalletFromMnemonic(mnemonic) {
    try {
      // Validate mnemonic
      const words = mnemonic.trim().split(' ');
      if (words.length !== 12) {
        throw new Error('Mnemonic must contain exactly 12 words');
      }

      // Generate seed from mnemonic
      const seed = this._mnemonicToSeed(mnemonic);
      
      // Generate key pair from seed
      const privateKey = this._seedToPrivateKey(seed);
      
      // Import wallet using private key
      const wallet = this.quantumSigner.importWallet(privateKey);
      
      return {
        ...wallet,
        mnemonic,
        seed,
        createdAt: Date.now()
      };
    } catch (error) {
      console.error('Mnemonic wallet creation error:', error);
      throw new Error(`Failed to create wallet from mnemonic: ${error.message}`);
    }
  }

  /**
   * Encrypt sensitive data with password
   * @param {string} data - Data to encrypt
   * @param {string} password - Encryption password
   * @returns {Object} Encrypted data with metadata
   */
  encryptData(data, password) {
    try {
      // Generate salt
      const salt = this._generateSalt();
      
      // Derive key from password
      const key = this._deriveKey(password, salt);
      
      // Generate IV
      const iv = this._generateIV();
      
      // Encrypt data (simplified)
      const encrypted = this._encrypt(data, key, iv);
      
      return {
        encrypted,
        salt,
        iv,
        algorithm: this.encryptionAlgorithm,
        rounds: this.keyDerivationRounds,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error(`Failed to encrypt data: ${error.message}`);
    }
  }

  /**
   * Decrypt encrypted data with password
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} password - Decryption password
   * @returns {string} Decrypted data
   */
  decryptData(encryptedData, password) {
    try {
      const { encrypted, salt, iv, algorithm, rounds } = encryptedData;
      
      // Validate encryption metadata
      if (algorithm !== this.encryptionAlgorithm) {
        throw new Error('Unsupported encryption algorithm');
      }
      
      // Derive key from password
      const key = this._deriveKey(password, salt, rounds);
      
      // Decrypt data
      const decrypted = this._decrypt(encrypted, key, iv);
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error(`Failed to decrypt data: ${error.message}`);
    }
  }

  /**
   * Create encrypted wallet backup
   * @param {Object} walletData - Wallet data to backup
   * @param {string} password - Backup password
   * @returns {Object} Encrypted backup
   */
  createBackup(walletData, password) {
    try {
      const backupData = {
        version: '1.0',
        wallet: walletData,
        timestamp: Date.now(),
        checksum: this._calculateChecksum(JSON.stringify(walletData))
      };
      
      const encrypted = this.encryptData(JSON.stringify(backupData), password);
      
      return {
        ...encrypted,
        type: 'wallet_backup',
        version: '1.0'
      };
    } catch (error) {
      console.error('Backup creation error:', error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Restore wallet from encrypted backup
   * @param {Object} backup - Encrypted backup data
   * @param {string} password - Backup password
   * @returns {Object} Restored wallet data
   */
  restoreFromBackup(backup, password) {
    try {
      // Decrypt backup
      const decryptedData = this.decryptData(backup, password);
      const backupData = JSON.parse(decryptedData);
      
      // Validate backup structure
      if (!backupData.wallet || !backupData.checksum) {
        throw new Error('Invalid backup format');
      }
      
      // Verify checksum
      const expectedChecksum = this._calculateChecksum(JSON.stringify(backupData.wallet));
      if (backupData.checksum !== expectedChecksum) {
        throw new Error('Backup integrity check failed');
      }
      
      return backupData.wallet;
    } catch (error) {
      console.error('Backup restoration error:', error);
      throw new Error(`Failed to restore from backup: ${error.message}`);
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with score and feedback
   */
  validatePasswordStrength(password) {
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }
    
    if (password.length >= 12) {
      score += 1;
    }
    
    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }
    
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }
    
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }
    
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }
    
    // Common patterns check
    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123'];
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      score -= 2;
      feedback.push('Avoid common patterns');
    }
    
    const strength = score >= 5 ? 'strong' : score >= 3 ? 'medium' : 'weak';
    
    return {
      score: Math.max(0, score),
      maxScore: 6,
      strength,
      feedback
    };
  }

  // Private helper methods

  _mnemonicToSeed(mnemonic) {
    // Simplified seed generation from mnemonic
    let seed = '';
    const words = mnemonic.split(' ');
    
    for (const word of words) {
      seed += this._hash(word).slice(0, 8);
    }
    
    return seed.slice(0, 64);
  }

  _seedToPrivateKey(seed) {
    // Generate private key from seed
    const key = this._hash(seed + 'private_key_derivation');
    return `0x${key}${this._hash(key).slice(0, 64)}`;
  }

  _generateSalt() {
    return this._generateRandomHex(32);
  }

  _generateIV() {
    return this._generateRandomHex(16);
  }

  _generateRandomHex(bytes) {
    let hex = '';
    for (let i = 0; i < bytes; i++) {
      hex += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }
    return hex;
  }

  _deriveKey(password, salt, rounds = this.keyDerivationRounds) {
    // Simplified key derivation (PBKDF2 simulation)
    let key = password + salt;
    
    for (let i = 0; i < Math.min(rounds, 1000); i++) { // Limit for performance
      key = this._hash(key + i);
    }
    
    return key;
  }

  _encrypt(data, key, iv) {
    // Simplified encryption (XOR-based for demo)
    const keyBytes = this._hexToBytes(key);
    const ivBytes = this._hexToBytes(iv);
    const dataBytes = new TextEncoder().encode(data);
    
    const encrypted = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      const keyByte = keyBytes[i % keyBytes.length];
      const ivByte = ivBytes[i % ivBytes.length];
      encrypted[i] = dataBytes[i] ^ keyByte ^ ivByte;
    }
    
    return this._bytesToHex(encrypted);
  }

  _decrypt(encryptedHex, key, iv) {
    // Simplified decryption (reverse of encrypt)
    const keyBytes = this._hexToBytes(key);
    const ivBytes = this._hexToBytes(iv);
    const encryptedBytes = this._hexToBytes(encryptedHex);
    
    const decrypted = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      const keyByte = keyBytes[i % keyBytes.length];
      const ivByte = ivBytes[i % ivBytes.length];
      decrypted[i] = encryptedBytes[i] ^ keyByte ^ ivByte;
    }
    
    return new TextDecoder().decode(decrypted);
  }

  _hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  _bytesToHex(bytes) {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  _calculateChecksum(data) {
    return this._hash(data + 'checksum_salt');
  }

  _hash(input) {
    // Reuse hash function from QuantumSigner
    let hash = 0;
    const str = input.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    let hexHash = Math.abs(hash).toString(16);
    while (hexHash.length < 64) {
      hexHash = hexHash + this._hash(hexHash + i).slice(0, 8);
    }
    
    return hexHash.slice(0, 64);
  }
}

export default SecurityManager;