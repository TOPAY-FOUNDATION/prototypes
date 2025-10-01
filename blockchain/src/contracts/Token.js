/**
 * TOPAY Foundation Token Contract
 * Simple token implementation with transfer functionality
 */

export class Token {
  constructor(name, symbol, totalSupply, owner) {
    this.name = name;
    this.symbol = symbol;
    this.totalSupply = totalSupply;
    this.owner = owner;
    this.balances = new Map();
    this.allowances = new Map();
    
    // Give all initial supply to owner
    this.balances.set(owner, totalSupply);
    
    console.log(`🪙 Token created: ${name} (${symbol}) - Total Supply: ${totalSupply}`);
  }

  /**
   * Get balance of an address
   * @param {string} address - Address to check balance for
   * @returns {number} Balance amount
   */
  balanceOf(address) {
    return this.balances.get(address) || 0;
  }

  /**
   * Transfer tokens from one address to another
   * @param {string} from - Sender address
   * @param {string} to - Recipient address
   * @param {number} amount - Amount to transfer
   * @returns {boolean} Success status
   */
  transfer(from, to, amount) {
    // Validate inputs
    if (!from || !to || amount <= 0) {
      throw new Error('Invalid transfer parameters');
    }

    if (from === to) {
      throw new Error('Cannot transfer to same address');
    }

    const fromBalance = this.balanceOf(from);
    
    if (fromBalance < amount) {
      throw new Error(`Insufficient balance. Available: ${fromBalance}, Required: ${amount}`);
    }

    // Perform transfer
    this.balances.set(from, fromBalance - amount);
    this.balances.set(to, this.balanceOf(to) + amount);

    console.log(`💸 Transfer: ${amount} ${this.symbol} from ${from} to ${to}`);
    return true;
  }

  /**
   * Mint new tokens (only owner can mint)
   * @param {string} to - Address to mint tokens to
   * @param {number} amount - Amount to mint
   * @param {string} minter - Address attempting to mint
   * @returns {boolean} Success status
   */
  mint(to, amount, minter) {
    if (minter !== this.owner) {
      throw new Error('Only owner can mint tokens');
    }

    if (amount <= 0) {
      throw new Error('Mint amount must be positive');
    }

    this.totalSupply += amount;
    this.balances.set(to, this.balanceOf(to) + amount);

    console.log(`🏭 Minted: ${amount} ${this.symbol} to ${to}`);
    return true;
  }

  /**
   * Burn tokens from an address
   * @param {string} from - Address to burn tokens from
   * @param {number} amount - Amount to burn
   * @param {string} burner - Address attempting to burn
   * @returns {boolean} Success status
   */
  burn(from, amount, burner) {
    if (burner !== this.owner && burner !== from) {
      throw new Error('Can only burn own tokens or owner can burn any');
    }

    const balance = this.balanceOf(from);
    if (balance < amount) {
      throw new Error(`Insufficient balance to burn. Available: ${balance}, Required: ${amount}`);
    }

    this.totalSupply -= amount;
    this.balances.set(from, balance - amount);

    console.log(`🔥 Burned: ${amount} ${this.symbol} from ${from}`);
    return true;
  }

  /**
   * Get all addresses with balances
   * @returns {Array} Array of {address, balance} objects
   */
  getAllBalances() {
    const balances = [];
    for (const [address, balance] of this.balances.entries()) {
      if (balance > 0) {
        balances.push({ address, balance });
      }
    }
    return balances;
  }

  /**
   * Get token information
   * @returns {Object} Token details
   */
  getTokenInfo() {
    return {
      name: this.name,
      symbol: this.symbol,
      totalSupply: this.totalSupply,
      owner: this.owner,
      holders: this.getAllBalances().length
    };
  }

  /**
   * Export token state to JSON
   * @returns {Object} Token state
   */
  toJSON() {
    return {
      name: this.name,
      symbol: this.symbol,
      totalSupply: this.totalSupply,
      owner: this.owner,
      balances: Object.fromEntries(this.balances),
      allowances: Object.fromEntries(this.allowances)
    };
  }

  /**
   * Create token from JSON data
   * @param {Object} data - Token data
   * @returns {Token} Token instance
   */
  static fromJSON(data) {
    const token = new Token(data.name, data.symbol, 0, data.owner);
    token.totalSupply = data.totalSupply;
    token.balances = new Map(Object.entries(data.balances || {}));
    token.allowances = new Map(Object.entries(data.allowances || {}));
    return token;
  }
}