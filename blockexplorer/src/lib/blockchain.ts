interface BlockchainConfig {
  rpcUrl: string;
  networkName: string;
  chainId: number;
}

interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  transactions: Transaction[];
  miner: string;
  gasUsed: number;
  gasLimit: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: number;
  gasPrice: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  timestamp: number;
}

interface Address {
  address: string;
  balance: string;
  transactionCount: number;
}

class BlockchainClient {
  private config: BlockchainConfig;

  constructor(config?: Partial<BlockchainConfig>) {
    this.config = {
      rpcUrl: config?.rpcUrl || 'http://localhost:8545/rpc',
      networkName: config?.networkName || 'TOPAY Network',
      chainId: config?.chainId || 1
    };
  }

  private async makeRPCCall(method: string, params: unknown[] = []): Promise<unknown> {
    try {
      const response = await fetch(this.config.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC call failed');
      }

      return data.result;
    } catch (error) {
      console.error('RPC call failed:', error);
      throw error;
    }
  }

  async getLatestBlock(): Promise<Block> {
    const blockData = await this.makeRPCCall('topay_getBlock', ['latest']);
    return this.formatBlock(blockData);
  }

  async getBlockByNumber(blockNumber: number): Promise<Block> {
    const blockData = await this.makeRPCCall('topay_getBlock', [blockNumber]);
    return this.formatBlock(blockData);
  }

  async getBlockByHash(blockHash: string): Promise<Block> {
    const blockData = await this.makeRPCCall('topay_getBlockByHash', [blockHash]);
    return this.formatBlock(blockData);
  }

  async getTransaction(txHash: string): Promise<Transaction> {
    const txData = await this.makeRPCCall('topay_getTransactionByHash', [txHash]);
    return this.formatTransaction(txData);
  }

  async getAddressBalance(address: string): Promise<string> {
    const balance = await this.makeRPCCall('topay_getBalance', [address]);
    return balance as string;
  }

  async getAddressTransactionCount(address: string): Promise<number> {
    const count = await this.makeRPCCall('topay_getTransactionCount', [address]);
    return typeof count === 'number' ? count : parseInt(count as string, 10);
  }

  async getNetworkInfo() {
    try {
      const [chainInfo, blockNumber] = await Promise.all([
        this.makeRPCCall('topay_getChainInfo'),
        this.makeRPCCall('topay_getBlockNumber')
      ]);
      
      const chainData = chainInfo as { chainId?: number; networkName?: string };
      
      return {
        chainId: chainData.chainId || this.config.chainId,
        latestBlock: typeof blockNumber === 'number' ? blockNumber : parseInt(blockNumber as string, 10),
        networkName: chainData.networkName || this.config.networkName
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      throw error;
    }
  }

  private formatBlock(blockData: unknown): Block {
    const block = blockData as {
      number: string | number;
      hash: string;
      parentHash: string;
      timestamp: string | number;
      transactions: unknown[];
      miner: string;
      gasUsed: string | number;
      gasLimit: string | number;
    };
    return {
      number: typeof block.number === 'number' ? block.number : (block.number ? parseInt(block.number, 16) : 0),
      hash: block.hash || '',
      parentHash: block.parentHash || '',
      timestamp: typeof block.timestamp === 'number' ? block.timestamp : (block.timestamp ? parseInt(block.timestamp, 16) : Date.now()),
      transactions: (block.transactions || []).map((tx: unknown) => this.formatTransaction(tx)),
      miner: block.miner || '',
      gasUsed: typeof block.gasUsed === 'number' ? block.gasUsed : (block.gasUsed ? parseInt(block.gasUsed, 16) : 0),
      gasLimit: typeof block.gasLimit === 'number' ? block.gasLimit : (block.gasLimit ? parseInt(block.gasLimit, 16) : 0)
    };
  }

  private formatTransaction(txData: unknown): Transaction {
    const tx = txData as {
      hash: string;
      from: string;
      to: string;
      value: string;
      gas: string | number;
      gasPrice: string;
      blockNumber: string | number;
      blockHash: string;
      transactionIndex: string | number;
    };
    return {
      hash: tx.hash || '',
      from: tx.from || '',
      to: tx.to || '',
      value: tx.value || '0',
      gas: typeof tx.gas === 'number' ? tx.gas : (tx.gas ? parseInt(tx.gas, 16) : 0),
      gasPrice: tx.gasPrice || '0',
      blockNumber: typeof tx.blockNumber === 'number' ? tx.blockNumber : (tx.blockNumber ? parseInt(tx.blockNumber, 16) : 0),
      blockHash: tx.blockHash || '',
      transactionIndex: typeof tx.transactionIndex === 'number' ? tx.transactionIndex : (tx.transactionIndex ? parseInt(tx.transactionIndex, 16) : 0),
      timestamp: 0 // Will be filled from block data
    };
  }
}

export { BlockchainClient, type Block, type Transaction, type Address };
export default BlockchainClient;