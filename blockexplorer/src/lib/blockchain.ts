interface BlockchainConfig {
  apiUrl: string;
  networkName: string;
  chainId: number;
}

interface Block {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  data: string | object | null;
  nonce: number;
  difficulty: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockIndex: number;
  timestamp: number;
}

interface TokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  totalSupply: number;
  owner: string;
  holders: number;
}

interface TokenBalance {
  tokenId: string;
  address: string;
  balance: number;
}

interface Address {
  address: string;
  balance: string;
  transactionCount: number;
}

interface BlockchainStats {
  totalBlocks: number;
  difficulty: number;
  hashRate: string;
  networkName: string;
  version: string;
  totalTokens?: number;
}

class BlockchainClient {
  private config: BlockchainConfig;

  constructor(config?: Partial<BlockchainConfig>) {
    this.config = {
      apiUrl: config?.apiUrl || process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || 'http://localhost:3002',
      networkName: config?.networkName || 'TOPAY Network',
      chainId: config?.chainId || 1
    };
    console.log(`[DEBUG] BlockchainClient initialized with apiUrl: ${this.config.apiUrl}`);
  }

  private async makeAPICall(endpoint: string, options?: RequestInit): Promise<unknown> {
    try {
      const url = `${this.config.apiUrl}${endpoint}`;
      console.log(`[DEBUG] Making API call to URL: ${url}`);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });

      if (!response.ok) {
        console.error(`[DEBUG] API call failed: ${response.status} ${response.statusText} for URL: ${url}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[DEBUG] API call successful for URL: ${url}`);
      
      if (data.error) {
        throw new Error(data.error || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error(`[DEBUG] API call error for endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  async getLatestBlock(): Promise<Block> {
    const data = await this.makeAPICall('/topay/blocks') as unknown[];
    if (Array.isArray(data) && data.length > 0) {
      return this.formatBlock(data[data.length - 1]);
    }
    throw new Error('No blocks found');
  }

  async getBlockByNumber(blockIndex: number): Promise<Block> {
    const data = await this.makeAPICall(`/topay/blocks/${blockIndex}`) as { block: unknown };
    return this.formatBlock(data.block);
  }

  async getBlockByHash(blockHash: string): Promise<Block> {
    // Search for block by hash using the search endpoint
    const data = await this.makeAPICall(`/topay/search?q=${blockHash}`) as { results?: unknown[] };
    if (data.results && data.results.length > 0) {
      return this.formatBlock(data.results[0]);
    }
    throw new Error('Block not found');
  }

  async getBlocks(limit: number = 10): Promise<Block[]> {
    const data = await this.makeAPICall('/topay/blocks') as { blocks?: unknown[] } | unknown[];
    if (Array.isArray(data)) {
      return data.slice(-limit).map((block: unknown) => this.formatBlock(block));
    } else if (data && typeof data === 'object' && 'blocks' in data && Array.isArray(data.blocks)) {
      return data.blocks.slice(-limit).map((block: unknown) => this.formatBlock(block));
    }
    return [];
  }

  async getBlockchainStats(): Promise<BlockchainStats> {
    const data = await this.makeAPICall('/topay/stats') as {
      totalBlocks?: number;
      difficulty?: number;
      hashRate?: string;
      version?: string;
    };
    
    // Get token count
    let totalTokens = 0;
    try {
      const tokens = await this.getAllTokens();
      totalTokens = tokens.length;
    } catch (error) {
      console.warn('Failed to get token count:', error);
    }
    
    return {
      totalBlocks: data.totalBlocks || 0,
      difficulty: data.difficulty || 1,
      hashRate: data.hashRate || '0 H/s',
      networkName: this.config.networkName,
      version: data.version || '1.0.0',
      totalTokens
    };
  }

  async searchBlocks(query: string): Promise<Block[]> {
    const data = await this.makeAPICall(`/topay/search?q=${encodeURIComponent(query)}`) as { results?: unknown[] };
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results.map((block: unknown) => this.formatBlock(block));
    }
    return [];
  }

  async addTransaction(transactionData: { from: string; to: string; value: string; data?: string }): Promise<Block> {
    const data = await this.makeAPICall('/topay/transaction', {
      method: 'POST',
      body: JSON.stringify({ data: transactionData })
    }) as { block: unknown };
    return this.formatBlock(data.block);
  }

  async validateBlockchain(): Promise<boolean> {
    const data = await this.makeAPICall('/topay/validate') as { valid?: boolean };
    return data.valid || false;
  }

  async getTransaction(txHash: string): Promise<Transaction> {
    // Since the blockchain service doesn't have individual transaction endpoints,
    // we'll search for the transaction in blocks
    const blocks = await this.getBlocks(50); // Get recent blocks
    for (const block of blocks) {
      if (block.data && typeof block.data === 'object' && 'hash' in block.data) {
        const txData = block.data as { hash?: string; from?: string; to?: string; value?: string };
        if (txData.hash === txHash) {
          return this.formatTransaction({
            hash: txHash,
            from: txData.from || 'unknown',
            to: txData.to || 'unknown',
            value: txData.value || '0',
            blockIndex: block.index,
            timestamp: block.timestamp
          });
        }
      }
    }
    throw new Error('Transaction not found');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAddressBalance(_address: string): Promise<string> {
    // Since the blockchain service doesn't have address-specific endpoints,
    // we'll return a placeholder for now
    return '0';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAddressTransactionCount(_address: string): Promise<number> {
    // Since the blockchain service doesn't have address-specific endpoints,
    // we'll return 0 for now
    return 0;
  }

  // Token-related methods
  async getAllTokens(): Promise<TokenInfo[]> {
    const data = await this.makeAPICall('/topay/tokens') as TokenInfo[] | { tokens?: TokenInfo[] };
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object' && 'tokens' in data && Array.isArray(data.tokens)) {
      return data.tokens;
    }
    return [];
  }

  async getTokenInfo(tokenId: string): Promise<TokenInfo> {
    const data = await this.makeAPICall(`/topay/tokens/${tokenId}`) as TokenInfo;
    return data;
  }

  async getTokenBalance(tokenId: string, address: string): Promise<TokenBalance> {
    const data = await this.makeAPICall(`/topay/tokens/${tokenId}/balance/${address}`) as TokenBalance;
    return data;
  }

  async getAddressTokenBalances(address: string): Promise<TokenBalance[]> {
    const data = await this.makeAPICall(`/topay/address/${address}/tokens`) as TokenBalance[] | { balances?: TokenBalance[] };
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object' && 'balances' in data && Array.isArray(data.balances)) {
      return data.balances;
    }
    return [];
  }

  async createToken(tokenData: { name: string; symbol: string; totalSupply: number; owner: string }): Promise<{ tokenId: string; block: Block }> {
    const data = await this.makeAPICall('/topay/tokens/create', {
      method: 'POST',
      body: JSON.stringify(tokenData)
    }) as { tokenId: string; block: unknown };
    return {
      tokenId: data.tokenId,
      block: this.formatBlock(data.block)
    };
  }

  async transferToken(transferData: { tokenId: string; from: string; to: string; amount: number }): Promise<Block> {
    const data = await this.makeAPICall('/topay/tokens/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData)
    }) as { block: unknown };
    return this.formatBlock(data.block);
  }

  async getNetworkInfo() {
    try {
      const stats = await this.getBlockchainStats();
      
      return {
        chainId: this.config.chainId,
        latestBlock: stats.totalBlocks - 1, // Latest block index
        networkName: this.config.networkName
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      throw error;
    }
  }

  async validateTransactionHash(txHash: string): Promise<boolean> {
    try {
      if (!txHash || txHash.trim() === '') {
        return false;
      }
      
      const transaction = await this.getTransaction(txHash);
      return transaction && transaction.hash === txHash;
    } catch (error) {
      console.error('Transaction validation failed:', error);
      return false;
    }
  }

  async validateWalletAddress(address: string): Promise<boolean> {
    try {
      if (!address || address.trim() === '') {
        return false;
      }
      
      // For now, we'll consider any non-empty address as valid
      // since the blockchain service doesn't have address validation
      return address.length > 0;
    } catch (error) {
      console.error('Address validation failed:', error);
      return false;
    }
  }
  private formatBlock(blockData: unknown): Block {
    const data = blockData as {
      index?: number;
      hash?: string;
      previousHash?: string;
      timestamp?: number;
      data?: string | object | null;
      nonce?: number;
      difficulty?: number;
    };
    
    return {
      index: data.index || 0,
      hash: data.hash || '',
      previousHash: data.previousHash || '',
      timestamp: data.timestamp || Date.now(),
      data: data.data || null,
      nonce: data.nonce || 0,
      difficulty: data.difficulty || 1
    };
  }

  private formatTransaction(txData: unknown): Transaction {
    const tx = txData as {
      hash: string;
      from: string;
      to: string;
      value: string;
      blockIndex: number;
      timestamp: number;
    };
    return {
      hash: tx.hash || '',
      from: tx.from || '',
      to: tx.to || '',
      value: tx.value || '0',
      blockIndex: tx.blockIndex || 0,
      timestamp: tx.timestamp || Date.now()
    };
  }
}

export { BlockchainClient, type Block, type Transaction, type Address, type BlockchainStats, type TokenBalance, type TokenInfo };
export default BlockchainClient;