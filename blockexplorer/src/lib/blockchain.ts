// Define proper response types
interface ExplorerResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

interface BlockResponse {
  success: boolean;
  block: unknown;
}

interface TransactionResponse {
  success: boolean;
  transaction: unknown;
}

interface TransactionReceiptResponse {
  success: boolean;
  receipt: unknown;
}

interface BlocksResponse {
  success: boolean;
  blocks: unknown[];
}

interface TransactionsResponse {
  success: boolean;
  transactions: unknown[];
}

interface BalanceResponse {
  success: boolean;
  balance: string;
}

interface NonceResponse {
  success: boolean;
  nonce: string;
}

interface CodeResponse {
  success: boolean;
  code: string;
}

interface NetworkResponse {
  success: boolean;
  network: unknown;
}

interface SearchResponse {
  success: boolean;
  query: string;
  blocks?: unknown[];
  transactions?: unknown[];
  addresses?: unknown[];
  totalResults: number;
}

interface LatestBlockResponse {
  success: boolean;
  blockNumber: string;
  decimal: number;
}

interface BlockchainConfig {
  apiUrl: string;
  networkName: string;
  chainId: number;
}

interface Block {
  index: number;
  number?: number; // For compatibility with old API responses
  hash: string;
  previousHash: string;
  timestamp: number;
  data: string | object | null;
  nonce: number;
  difficulty: number;
  transactions?: Transaction[];
  gasUsed?: number;
  gasLimit?: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockIndex: number;
  blockNumber?: number; // Block number where transaction is included
  blockHash?: string; // Block hash where transaction is included
  transactionIndex?: number; // Index of transaction within the block
  timestamp: number;
  gas?: number; // Gas limit for the transaction
  gasPrice?: number; // Gas price in wei
  gasUsed?: number; // Gas actually used
  nonce?: number; // Transaction nonce
  input?: string; // Transaction input data
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
      console.log(`[DEBUG] Raw API response data:`, JSON.stringify(data, null, 2));
      
      if (data.error) {
        throw new Error(data.error || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error(`[DEBUG] API call error for endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get block by number using new explorer API with fallback
   */
  async getBlockByNumber(blockNumber: number | string, fullTransactions = false): Promise<Block> {
    // Handle 'latest' block request
    if (typeof blockNumber === 'string' && blockNumber === 'latest') {
      const data = await this.makeAPICall('/explorer/block/latest') as LatestBlockResponse;
      if (data.success) {
        const latestBlockNumber = data.decimal || parseInt(data.blockNumber || '0', 16);
        return await this.getBlockByNumber(latestBlockNumber, fullTransactions);
      }
    }
    
    // Try new explorer API first
    try {
      const data = await this.makeAPICall(`/explorer/block/number/${blockNumber}?fullTransactions=${fullTransactions}`) as BlockResponse;
      if (data.success && data.block) {
        return this.formatBlock(data.block);
      }
    } catch (error) {
      console.warn('New API failed, trying old API:', error);
    }
    
    // Fallback to old API
    const data = await this.makeAPICall(`/topay/blocks/${blockNumber}`) as unknown;
    console.log(`[DEBUG] Block data received:`, data);
    
    // Handle both wrapped and direct responses
    const blockData = (data as { block?: unknown })?.block || data;
    return this.formatBlock(blockData);
  }

  /**
   * Get block by hash using new explorer API with fallback
   */
  async getBlockByHash(blockHash: string, fullTransactions = false): Promise<Block> {
    // Try new explorer API first
    try {
      const data = await this.makeAPICall(`/explorer/block/hash/${blockHash}?fullTransactions=${fullTransactions}`) as ExplorerResponse;
      if (data.success && data.block) {
        return this.formatBlock(data.block);
      }
    } catch (error) {
      console.warn('New API failed, trying old API:', error);
    }
    
    // Fallback to old search API
    const data = await this.makeAPICall(`/topay/search?q=${blockHash}`) as { results?: unknown[] };
    if (data.results && data.results.length > 0) {
      return this.formatBlock(data.results[0]);
    }
    throw new Error('Block not found');
  }

  /**
   * Get latest block number using new explorer API
   */
  async getLatestBlockNumber(): Promise<number> {
    const data = await this.makeAPICall('/explorer/block/latest') as LatestBlockResponse;
    if (!data.success) {
      throw new Error('Failed to get latest block number');
    }
    return data.decimal || parseInt(data.blockNumber || '0', 16);
  }

  /**
   * Get recent blocks using new explorer API
   */
  async getRecentBlocks(limit = 10): Promise<Block[]> {
    const data = await this.makeAPICall(`/explorer/blocks/recent?limit=${limit}`) as BlocksResponse;
    if (!data.success || !data.blocks) {
      throw new Error('Failed to get recent blocks');
    }
    return data.blocks.map((block: unknown) => this.formatBlock(block));
  }

  /**
   * Get transaction by hash using new explorer API
   */
  async getTransactionByHash(txHash: string): Promise<Transaction> {
    const data = await this.makeAPICall(`/explorer/transaction/${txHash}`) as TransactionResponse;
    if (!data.success || !data.transaction) {
      throw new Error('Transaction not found');
    }
    return this.formatTransaction(data.transaction);
  }

  /**
   * Get transaction receipt using new explorer API
   */
  async getTransactionReceipt(txHash: string): Promise<unknown> {
    const data = await this.makeAPICall(`/explorer/transaction/${txHash}/receipt`) as TransactionReceiptResponse;
    if (!data.success || !data.receipt) {
      throw new Error('Transaction receipt not found');
    }
    return data.receipt;
  }

  /**
   * Get recent transactions using new explorer API
   */
  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    const data = await this.makeAPICall(`/explorer/transactions/recent?limit=${limit}`) as TransactionsResponse;
    if (!data.success || !data.transactions) {
      throw new Error('Failed to get recent transactions');
    }
    return data.transactions.map((tx: unknown) => this.formatTransaction(tx));
  }

  /**
   * Get account balance using new explorer API
   */
  async getBalance(address: string, blockNumber = 'latest'): Promise<string> {
    const data = await this.makeAPICall(`/explorer/account/${address}/balance?blockNumber=${blockNumber}`) as BalanceResponse;
    if (!data.success) {
      throw new Error('Failed to get balance');
    }
    return data.balance;
  }

  /**
   * Get transaction count for address using new explorer API
   */
  async getTransactionCount(address: string, blockNumber = 'latest'): Promise<number> {
    const data = await this.makeAPICall(`/explorer/account/${address}/nonce?blockNumber=${blockNumber}`) as NonceResponse;
    if (!data.success) {
      throw new Error('Failed to get transaction count');
    }
    return parseInt(data.nonce, 16);
  }

  /**
   * Get contract code using new explorer API
   */
  async getCode(address: string, blockNumber = 'latest'): Promise<string> {
    const data = await this.makeAPICall(`/explorer/account/${address}/code?blockNumber=${blockNumber}`) as CodeResponse;
    if (!data.success) {
      throw new Error('Failed to get code');
    }
    return data.code;
  }

  /**
   * Get network information using new explorer API
   */
  async getNetworkInfo(): Promise<unknown> {
    const data = await this.makeAPICall('/explorer/network') as NetworkResponse;
    if (!data.success || !data.network) {
      throw new Error('Failed to get network info');
    }
    return data.network;
  }

  /**
   * Search blockchain data using new explorer API
   */
  async search(query: string): Promise<SearchResponse> {
    const data = await this.makeAPICall(`/explorer/search?q=${encodeURIComponent(query)}`) as SearchResponse;
    if (!data.success) {
      throw new Error('Search failed');
    }
    return {
      success: data.success,
      query: data.query,
      blocks: data.blocks?.map((block: unknown) => this.formatBlock(block)) || [],
      transactions: data.transactions?.map((tx: unknown) => this.formatTransaction(tx)) || [],
      addresses: data.addresses || [],
      totalResults: data.totalResults || 0
    };
  }

  async getLatestBlock(): Promise<Block> {
    return await this.getBlockByNumber('latest');
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
    try {
      const response = await this.makeAPICall('/topay/stats') as { 
        totalBlocks: number; 
        difficulty: number; 
        hashingAlgorithm: string; 
        networkName: string; 
        version: string;
        totalTokens?: number;
      };
      
      return {
        totalBlocks: response.totalBlocks,
        difficulty: response.difficulty,
        hashRate: response.hashingAlgorithm || 'TOPAY-Z512',
        networkName: response.networkName,
        version: response.version || '2.0.0',
        totalTokens: response.totalTokens
      };
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      throw error;
    }
  }

  async getMarketData(): Promise<{
    price: number;
    marketCap: number;
    volume24h: number;
    change24h: number;
    totalSupply: number;
    circulatingSupply: number;
    maxSupply: number;
    lastUpdated: number;
  }> {
    try {
      const response = await this.makeAPICall('/topay/market') as {
        success: boolean;
        data: {
          price: number;
          marketCap: number;
          volume24h: number;
          change24h: number;
          totalSupply: number;
          circulatingSupply: number;
          maxSupply: number;
          lastUpdated: number;
        };
      };
      
      if (!response.success) {
        throw new Error('Failed to fetch market data');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
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

  async getAddressBalance(address: string): Promise<string> {
    try {
      const data = await this.makeAPICall(`/explorer/account/${address}/balance`) as BalanceResponse;
      if (!data.success) {
        throw new Error('Failed to get balance');
      }
      // Return the raw wei balance as decimal string - formatBalance will handle the conversion
      const balanceWei = BigInt(data.balance);
      return balanceWei.toString();
    } catch (error) {
      console.error('Error fetching address balance:', error);
      return '0';
    }
  }

  async getAddressTransactionCount(address: string): Promise<number> {
    try {
      const data = await this.makeAPICall(`/explorer/account/${address}/nonce`) as NonceResponse;
      if (!data.success) {
        throw new Error('Failed to get transaction count');
      }
      return parseInt(data.nonce, 16);
    } catch (error) {
      console.error('Error fetching address transaction count:', error);
      return 0;
    }
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
      number?: string;
      hash?: string;
      parentHash?: string;
      previousHash?: string;
      timestamp?: number | string;
      data?: string | object | null;
      nonce?: number | string;
      difficulty?: number | string;
      transactions?: Transaction[];
      gasUsed?: number | string;
      gasLimit?: number | string;
    };
    
    return {
      index: data.index || (data.number ? parseInt(data.number, 16) : 0),
      hash: data.hash || '',
      previousHash: data.previousHash || data.parentHash || '',
      timestamp: typeof data.timestamp === 'string' ? parseInt(data.timestamp, 16) : (data.timestamp || Date.now()),
      data: data.data || null,
      nonce: typeof data.nonce === 'string' ? parseInt(data.nonce, 16) : (data.nonce || 0),
      difficulty: typeof data.difficulty === 'string' ? parseInt(data.difficulty, 16) : (data.difficulty || 1),
      transactions: data.transactions || [],
      gasUsed: typeof data.gasUsed === 'string' ? parseInt(data.gasUsed, 16) : (data.gasUsed || 0),
      gasLimit: typeof data.gasLimit === 'string' ? parseInt(data.gasLimit, 16) : (data.gasLimit || 21000)
    };
  }

  private formatTransaction(txData: unknown): Transaction {
    const tx = txData as {
      hash?: string;
      from?: string;
      to?: string;
      value?: string | number;
      blockIndex?: number;
      blockNumber?: string | number;
      timestamp?: number;
      transactionIndex?: string | number;
    };
    
    const blockNumber = tx.blockNumber ? 
      (typeof tx.blockNumber === 'string' ? parseInt(tx.blockNumber, 16) : tx.blockNumber) : 
      (tx.blockIndex || 0);
    
    return {
      hash: tx.hash || '',
      from: tx.from || '',
      to: tx.to || '',
      value: typeof tx.value === 'number' ? tx.value.toString() : (tx.value || '0'),
      blockIndex: blockNumber,
      timestamp: tx.timestamp || Date.now()
    };
  }
}

export { BlockchainClient, type Block, type Transaction, type Address, type BlockchainStats, type TokenBalance, type TokenInfo };
export default BlockchainClient;