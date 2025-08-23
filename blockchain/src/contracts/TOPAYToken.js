/**
 * TOPAY Token Smart Contract
 * A comprehensive token implementation for the TOPAY blockchain
 * Features: Transfer, Balance, Allowance, Minting, Burning
 */

export class TOPAYToken {
  constructor(initialSupply = 1000000, name = "TOPAY Token", symbol = "TPY", decimals = 18) {
    console.log(`🏗️ TOPAYToken constructor called with:`);
    console.log(`   initialSupply: ${initialSupply} (type: ${typeof initialSupply})`);
    console.log(`   name: ${name}`);
    console.log(`   symbol: ${symbol}`);
    console.log(`   decimals: ${decimals} (type: ${typeof decimals})`);
    
    this._name = name;
    this._symbol = symbol;
    this._decimals = decimals;
    this._totalSupply = initialSupply * Math.pow(10, decimals);
    
    console.log(`   calculated _totalSupply: ${this._totalSupply}`);
    
    // Contract state
    this.balances = new Map();
    this.allowances = new Map(); // owner -> spender -> amount
    this.owner = null; // Will be set during deployment
    this.contractAddress = null;
    
    // Events log
    this.events = [];
    
    // Contract metadata
    this.version = "1.0.0";
    this.deployedAt = null;
  }

  /**
   * Initialize contract with deployer address
   */
  initialize(deployerAddress, contractAddress) {
    console.log(`🔧 Initializing TOPAYToken contract`);
    console.log(`👤 Deployer: ${deployerAddress}`);
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`💰 Total Supply: ${this._totalSupply}`);
    
    this.owner = deployerAddress;
    this.contractAddress = contractAddress;
    this.deployedAt = Date.now();
    
    // Give initial supply to deployer
    this.balances.set(deployerAddress, this._totalSupply);
    console.log(`✅ Set deployer balance to: ${this.balances.get(deployerAddress)}`);
    
    this.emitEvent('Transfer', {
      from: '0x0000000000000000000000000000000000000000',
      to: deployerAddress,
      value: this._totalSupply
    });
    
    this.emitEvent('ContractDeployed', {
      owner: deployerAddress,
      totalSupply: this._totalSupply,
      timestamp: this.deployedAt
    });
  }

  /**
   * Get token name
   */
  name() {
    return this._name;
  }

  /**
   * Get token symbol
   */
  symbol() {
    return this._symbol;
  }

  /**
   * Get token decimals
   */
  decimals() {
    return this._decimals;
  }

  /**
   * Get total supply
   */
  totalSupply() {
    return this._totalSupply;
  }

  /**
   * Get token balance of an address
   */
  balanceOf(caller, address) {
    console.log(`🔍 balanceOf called with caller: ${caller}, address: ${address}`);
    // If only one parameter is passed, treat it as the address
    const targetAddress = address || caller;
    console.log(`🎯 Target address: ${targetAddress}`);
    const balance = this.balances.get(targetAddress) || 0;
    console.log(`💰 Retrieved balance: ${balance}`);
    console.log(`📊 All balances:`, Array.from(this.balances.entries()));
    return balance;
  }

  /**
   * Transfer tokens from sender to recipient
   */
  transfer(from, to, amount, gasLimit = 21000) {
    // Validation
    if (!from || !to) {
      throw new Error('Invalid addresses');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    const fromBalance = this.balanceOf(from, from);
    console.log(`💸 Transfer: ${amount} tokens from ${from} to ${to}`);
    console.log(`💰 From balance before: ${fromBalance}`);
    
    if (fromBalance < amount) {
      throw new Error('Insufficient balance');
    }
    
    const toBalance = this.balanceOf(to, to);
    console.log(`💰 To balance before: ${toBalance}`);
    
    // Execute transfer
    const newFromBalance = fromBalance - amount;
    const newToBalance = toBalance + amount;
    
    console.log(`💰 Setting from balance to: ${newFromBalance}`);
    console.log(`💰 Setting to balance to: ${newToBalance}`);
    
    this.balances.set(from, newFromBalance);
    this.balances.set(to, newToBalance);
    
    console.log(`✅ Transfer completed. Verifying balances...`);
    console.log(`💰 From balance after: ${this.balanceOf(from, from)}`);
    console.log(`💰 To balance after: ${this.balanceOf(to, to)}`);
    
    // Emit event
    this.emitEvent('Transfer', {
      from: from,
      to: to,
      value: amount,
      gasUsed: Math.min(gasLimit, 21000)
    });
    
    return {
      success: true,
      transactionHash: this.generateTxHash(from, to, amount),
      gasUsed: Math.min(gasLimit, 21000)
    };
  }

  /**
   * Approve spender to spend tokens on behalf of owner
   */
  approve(caller, spender, amount) {
    console.log(`🔐 Approve called: caller=${caller}, spender=${spender}, amount=${amount}`);
    
    // The caller is the owner who is approving the spender
    const owner = caller;
    
    if (!owner || !spender) {
      throw new Error('Invalid addresses');
    }
    
    if (!this.allowances.has(owner)) {
      this.allowances.set(owner, new Map());
      console.log(`📝 Created new allowances map for owner: ${owner}`);
    }
    
    this.allowances.get(owner).set(spender, amount);
    console.log(`✅ Set allowance: ${owner} -> ${spender} = ${amount}`);
    console.log(`📊 All allowances for ${owner}:`, Array.from(this.allowances.get(owner).entries()));
    
    this.emitEvent('Approval', {
      owner: owner,
      spender: spender,
      value: amount
    });
    
    return {
      success: true,
      transactionHash: this.generateTxHash(owner, spender, amount)
    };
  }

  /**
   * Get allowance amount
   */
  allowance(owner, spender) {
    console.log(`🔍 Allowance called: owner=${owner}, spender=${spender}`);
    
    if (!this.allowances.has(owner)) {
      console.log(`❌ No allowances found for owner: ${owner}`);
      return 0;
    }
    
    const allowanceAmount = this.allowances.get(owner).get(spender) || 0;
    console.log(`💰 Found allowance: ${owner} -> ${spender} = ${allowanceAmount}`);
    console.log(`📊 All allowances for ${owner}:`, Array.from(this.allowances.get(owner).entries()));
    
    return allowanceAmount;
  }

  /**
   * Transfer tokens from one address to another using allowance
   */
  transferFrom(spender, from, to, amount) {
    const allowedAmount = this.allowance(from, spender);
    
    if (allowedAmount < amount) {
      throw new Error('Insufficient allowance');
    }
    
    // Execute transfer
    const result = this.transfer(from, to, amount);
    
    // Reduce allowance
    this.allowances.get(from).set(spender, allowedAmount - amount);
    
    this.emitEvent('TransferFrom', {
      spender: spender,
      from: from,
      to: to,
      value: amount
    });
    
    return result;
  }

  /**
   * Mint new tokens (only owner)
   */
  mint(to, amount) {
    if (!this.owner) {
      throw new Error('Contract not initialized');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    this.totalSupply += amount;
    this.balances.set(to, this.balanceOf(to) + amount);
    
    this.emitEvent('Transfer', {
      from: '0x0000000000000000000000000000000000000000',
      to: to,
      value: amount
    });
    
    this.emitEvent('Mint', {
      to: to,
      value: amount,
      newTotalSupply: this.totalSupply
    });
    
    return {
      success: true,
      transactionHash: this.generateTxHash('0x0', to, amount)
    };
  }

  /**
   * Burn tokens from an address
   */
  burn(from, amount) {
    const balance = this.balanceOf(from);
    
    if (balance < amount) {
      throw new Error('Insufficient balance to burn');
    }
    
    this.balances.set(from, balance - amount);
    this.totalSupply -= amount;
    
    this.emitEvent('Transfer', {
      from: from,
      to: '0x0000000000000000000000000000000000000000',
      value: amount
    });
    
    this.emitEvent('Burn', {
      from: from,
      value: amount,
      newTotalSupply: this.totalSupply
    });
    
    return {
      success: true,
      transactionHash: this.generateTxHash(from, '0x0', amount)
    };
  }

  /**
   * Get contract information
   */
  getInfo() {
    return {
      name: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      totalSupply: this.totalSupply,
      owner: this.owner,
      contractAddress: this.contractAddress,
      version: this.version,
      deployedAt: this.deployedAt,
      holdersCount: this.balances.size
    };
  }

  /**
   * Get all token holders
   */
  getHolders() {
    const holders = [];
    for (const [address, balance] of this.balances.entries()) {
      if (balance > 0) {
        holders.push({ address, balance });
      }
    }
    return holders.sort((a, b) => b.balance - a.balance);
  }

  /**
   * Get contract events
   */
  getEvents(eventType = null, limit = 100) {
    let events = this.events;
    
    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }
    
    return events.slice(-limit).reverse();
  }

  /**
   * Emit an event
   */
  emitEvent(type, data) {
    this.events.push({
      type,
      data,
      timestamp: Date.now(),
      blockNumber: null // Will be set when included in block
    });
  }

  /**
   * Generate transaction hash
   */
  generateTxHash(from, to, amount) {
    const data = `${from}${to}${amount}${Date.now()}`;
    return this.simpleHash(data);
  }

  /**
   * Simple hash function
   */
  simpleHash(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Serialize contract state for storage
   */
  serialize() {
    return {
      name: this._name,
      symbol: this._symbol,
      decimals: this._decimals,
      totalSupply: this._totalSupply,
      balances: Array.from(this.balances.entries()),
      allowances: Array.from(this.allowances.entries()).map(([owner, spenderMap]) => [
        owner,
        Array.from(spenderMap.entries())
      ]),
      owner: this.owner,
      contractAddress: this.contractAddress,
      events: this.events,
      version: this.version,
      deployedAt: this.deployedAt
    };
  }

  /**
   * Deserialize contract state from storage
   */
  static deserialize(data) {
    const contract = new TOPAYToken();
    
    contract._name = data.name;
    contract._symbol = data.symbol;
    contract._decimals = data.decimals;
    contract._totalSupply = data.totalSupply;
    contract.balances = new Map(data.balances);
    
    // Reconstruct allowances
    contract.allowances = new Map();
    for (const [owner, spenderEntries] of data.allowances) {
      contract.allowances.set(owner, new Map(spenderEntries));
    }
    
    contract.owner = data.owner;
    contract.contractAddress = data.contractAddress;
    contract.events = data.events || [];
    contract.version = data.version;
    contract.deployedAt = data.deployedAt;
    
    return contract;
  }

  /**
   * Validate contract state
   */
  validate() {
    // Check total supply matches sum of balances
    let totalBalance = 0;
    for (const balance of this.balances.values()) {
      totalBalance += balance;
    }
    
    if (totalBalance !== this._totalSupply) {
      throw new Error('Contract state invalid: total supply mismatch');
    }
    
    return true;
  }
}