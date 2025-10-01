/**
 * TOPAY Foundation Token Manager
 * Manages multiple tokens and their operations
 */

import { Token } from './Token.js';

export class TokenManager {
  constructor() {
    this.tokens = new Map(); // tokenId -> Token instance
    this.tokenCounter = 0;
    
    console.log('🏦 Token Manager initialized');
  }

  /**
   * Create a new token
   * @param {string} name - Token name
   * @param {string} symbol - Token symbol
   * @param {number} totalSupply - Initial total supply
   * @param {string} owner - Owner address
   * @returns {string} Token ID
   */
  createToken(name, symbol, totalSupply, owner) {
    // Validate inputs
    if (!name || !symbol || !owner) {
      throw new Error('Name, symbol, and owner are required');
    }

    if (totalSupply <= 0) {
      throw new Error('Total supply must be positive');
    }

    // Check if symbol already exists
    for (const [, token] of this.tokens) {
      if (token.symbol === symbol) {
        throw new Error(`Token with symbol ${symbol} already exists`);
      }
    }

    const tokenId = `token_${this.tokenCounter++}`;
    const token = new Token(name, symbol, totalSupply, owner);
    
    this.tokens.set(tokenId, token);
    
    console.log(`🆕 Token created with ID: ${tokenId}`);
    return tokenId;
  }

  /**
   * Get token by ID
   * @param {string} tokenId - Token ID
   * @returns {Token|null} Token instance or null
   */
  getToken(tokenId) {
    return this.tokens.get(tokenId) || null;
  }

  /**
   * Get token by symbol
   * @param {string} symbol - Token symbol
   * @returns {Token|null} Token instance or null
   */
  getTokenBySymbol(symbol) {
    for (const [, token] of this.tokens) {
      if (token.symbol === symbol) {
        return token;
      }
    }
    return null;
  }

  /**
   * Transfer tokens between addresses
   * @param {string} tokenId - Token ID
   * @param {string} from - Sender address
   * @param {string} to - Recipient address
   * @param {number} amount - Amount to transfer
   * @returns {boolean} Success status
   */
  transferToken(tokenId, from, to, amount) {
    const token = this.getToken(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }

    return token.transfer(from, to, amount);
  }

  /**
   * Get token balance for an address
   * @param {string} tokenId - Token ID
   * @param {string} address - Address to check
   * @returns {number} Balance amount
   */
  getBalance(tokenId, address) {
    const token = this.getToken(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }

    return token.balanceOf(address);
  }

  /**
   * Get all balances for an address across all tokens
   * @param {string} address - Address to check
   * @returns {Array} Array of {tokenId, symbol, balance} objects
   */
  getAllBalancesForAddress(address) {
    const balances = [];
    
    for (const [tokenId, token] of this.tokens) {
      const balance = token.balanceOf(address);
      if (balance > 0) {
        balances.push({
          tokenId,
          symbol: token.symbol,
          name: token.name,
          balance
        });
      }
    }
    
    return balances;
  }

  /**
   * Get all tokens
   * @returns {Array} Array of token information
   */
  getAllTokens() {
    const tokens = [];
    
    for (const [tokenId, token] of this.tokens) {
      tokens.push({
        tokenId,
        ...token.getTokenInfo()
      });
    }
    
    return tokens;
  }

  /**
   * Mint tokens (only owner can mint)
   * @param {string} tokenId - Token ID
   * @param {string} to - Address to mint to
   * @param {number} amount - Amount to mint
   * @param {string} minter - Address attempting to mint
   * @returns {boolean} Success status
   */
  mintToken(tokenId, to, amount, minter) {
    const token = this.getToken(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }

    return token.mint(to, amount, minter);
  }

  /**
   * Burn tokens
   * @param {string} tokenId - Token ID
   * @param {string} from - Address to burn from
   * @param {number} amount - Amount to burn
   * @param {string} burner - Address attempting to burn
   * @returns {boolean} Success status
   */
  burnToken(tokenId, from, amount, burner) {
    const token = this.getToken(tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }

    return token.burn(from, amount, burner);
  }

  /**
   * Process a token transaction
   * @param {Object} transaction - Transaction object
   * @returns {Object} Transaction result
   */
  processTransaction(transaction) {
    const { type, tokenId, from, to, amount, data } = transaction;

    try {
      switch (type) {
        case 'CREATE_TOKEN':
          const newTokenId = this.createToken(
            data.name,
            data.symbol,
            data.totalSupply,
            from
          );
          return {
            success: true,
            tokenId: newTokenId,
            message: `Token ${data.symbol} created successfully`
          };

        case 'TRANSFER_TOKEN':
          this.transferToken(tokenId, from, to, amount);
          return {
            success: true,
            message: `Transferred ${amount} tokens from ${from} to ${to}`
          };

        case 'MINT_TOKEN':
          this.mintToken(tokenId, to, amount, from);
          return {
            success: true,
            message: `Minted ${amount} tokens to ${to}`
          };

        case 'BURN_TOKEN':
          this.burnToken(tokenId, from, amount, from);
          return {
            success: true,
            message: `Burned ${amount} tokens from ${from}`
          };

        default:
          throw new Error(`Unknown transaction type: ${type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export all tokens to JSON
   * @returns {Object} All tokens data
   */
  toJSON() {
    const tokensData = {};
    
    for (const [tokenId, token] of this.tokens) {
      tokensData[tokenId] = token.toJSON();
    }
    
    return {
      tokens: tokensData,
      tokenCounter: this.tokenCounter
    };
  }

  /**
   * Load tokens from JSON data
   * @param {Object} data - Tokens data
   */
  fromJSON(data) {
    if (!data || !data.tokens) return;
    
    this.tokenCounter = data.tokenCounter || 0;
    this.tokens.clear();
    
    for (const [tokenId, tokenData] of Object.entries(data.tokens)) {
      const token = Token.fromJSON(tokenData);
      this.tokens.set(tokenId, token);
    }
    
    console.log(`📥 Loaded ${this.tokens.size} tokens from cache`);
  }
}