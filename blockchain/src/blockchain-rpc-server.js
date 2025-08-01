import express from 'express';
import cors from 'cors';
import { Blockchain } from './blockchain/blockchain.js';
import { Transaction } from './blockchain/transaction.js';
import { PersistenceManager } from './storage/persistence.js';

/**
 * TOPAY Blockchain RPC Server
 * Provides JSON-RPC 2.0 compatible interface for blockchain interaction
 */
class BlockchainRPCServer {
  constructor(port = process.env.BLOCKCHAIN_PORT || 3001) {
    this.app = express();
    this.port = port;
    this.blockchain = new Blockchain();
    this.persistence = new PersistenceManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    this.app.use(express.json({ limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        rpcVersion: '2.0',
        blockchain: {
          blocks: this.blockchain.chain.length,
          difficulty: this.blockchain.difficulty,
          mempool: this.blockchain.mempool.length
        },
        timestamp: Date.now()
      });
    });

    // Main RPC endpoint
    this.app.post('/rpc', async (req, res) => {
      try {
        const { jsonrpc, method, params, id } = req.body;

        // Validate JSON-RPC 2.0 format
        if (jsonrpc !== '2.0' || !method) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32600, message: 'Invalid Request' },
            id: id || null
          });
        }

        const result = await this.handleRPCMethod(method, params || []);
        
        res.json({
          jsonrpc: '2.0',
          result,
          id
        });

      } catch (error) {
        console.error('RPC Error:', error);
        res.json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message
          },
          id: req.body.id || null
        });
      }
    });

    // REST endpoints for easy testing
    this.app.get('/api/rpc/methods', (req, res) => {
      res.json({
        methods: [
          'topay_getBlockNumber',
          'topay_getBalance',
          'topay_getBlock',
          'topay_getTransaction',
          'topay_sendTransaction',
          'topay_getMempool',
          'topay_mine',
          'topay_getChainInfo',
          'topay_validateChain',
          'topay_getTransactionHistory',
          'topay_getNetworkStats',
          'topay_addTestData',
          'topay_resetChain'
        ]
      });
    });

    // WebSocket endpoint for real-time updates (future enhancement)
    this.app.get('/ws', (req, res) => {
      res.json({
        message: 'WebSocket endpoint for real-time blockchain updates',
        status: 'planned'
      });
    });
  }

  async handleRPCMethod(method, params) {
    switch (method) {
      case 'topay_getBlockNumber':
        return this.blockchain.chain.length - 1;

      case 'topay_getBalance':
        const address = params[0];
        if (!address || address === 'null' || address === null) {
          throw new Error('Valid address parameter required');
        }
        return this.blockchain.getBalance(address);

      case 'topay_getBlock':
        const blockId = params[0];
        if (blockId === undefined) throw new Error('Block identifier required');
        
        let block;
        if (typeof blockId === 'number') {
          block = this.blockchain.chain[blockId];
        } else if (blockId === 'latest') {
          block = this.blockchain.getLatestBlock();
        } else {
          block = this.blockchain.chain.find(b => b.hash === blockId);
        }
        
        if (!block) throw new Error('Block not found');
        
        return {
          index: block.index,
          hash: block.hash,
          previousHash: block.previousHash,
          timestamp: block.timestamp,
          transactions: block.transactions.map(tx => tx.toJSON()),
          difficulty: block.difficulty,
          nonce: block.nonce,
          merkleRoot: block.merkleRoot
        };

      case 'topay_getTransaction':
        if (!params[0]) throw new Error('Transaction hash required');
        
        // Search in blocks
        for (const block of this.blockchain.chain) {
          const tx = block.transactions.find(t => t.hash === params[0]);
          if (tx) {
            return {
              ...tx.toJSON(),
              blockIndex: block.index,
              blockHash: block.hash,
              confirmations: this.blockchain.chain.length - block.index
            };
          }
        }
        
        // Search in mempool
        const mempoolTx = this.blockchain.mempool.find(tx => tx.hash === params[0]);
        if (mempoolTx) {
          return {
            ...mempoolTx.toJSON(),
            blockIndex: null,
            blockHash: null,
            confirmations: 0,
            status: 'pending'
          };
        }
        
        throw new Error('Transaction not found');

      case 'topay_sendTransaction':
        const { from, to, amount, memo, signature, publicKey } = params[0] || {};
        if (!from || !to || amount === undefined) {
          throw new Error('Missing required transaction parameters');
        }
        
        const transaction = new Transaction(from, to, amount, memo);
        if (signature) transaction.signature = signature;
        if (publicKey) transaction.publicKey = publicKey;
        
        await this.blockchain.addTransaction(transaction);
        await this.persistence.saveBlockchain(this.blockchain);
        
        return {
          transactionHash: transaction.hash,
          status: 'pending',
          message: 'Transaction added to mempool'
        };

      case 'topay_getMempool':
        return {
          transactions: this.blockchain.mempool.map(tx => tx.toJSON()),
          count: this.blockchain.mempool.length
        };

      case 'topay_mine':
        const minerAddress = params[0];
        if (!minerAddress) throw new Error('Miner address required');
        
        if (this.blockchain.mempool.length === 0) {
          throw new Error('No transactions to mine');
        }
        
        console.log(`🚀 Mining block for ${minerAddress}...`);
        const minedBlock = await this.blockchain.minePendingTransactions(minerAddress);
        await this.persistence.saveBlockchain(this.blockchain);
        
        return {
          blockIndex: minedBlock.index,
          blockHash: minedBlock.hash,
          transactions: minedBlock.transactions.length,
          reward: this.blockchain.miningReward,
          difficulty: minedBlock.difficulty
        };

      case 'topay_getChainInfo':
        const totalTransactions = this.blockchain.chain.reduce(
          (sum, block) => sum + block.transactions.length, 0
        );
        
        return {
          blockCount: this.blockchain.chain.length,
          totalTransactions,
          mempoolSize: this.blockchain.mempool.length,
          difficulty: this.blockchain.difficulty,
          miningReward: this.blockchain.miningReward,
          latestBlock: this.blockchain.getLatestBlock(),
          isValid: await this.blockchain.isChainValid()
        };

      case 'topay_validateChain':
        return {
          isValid: await this.blockchain.isChainValid(),
          timestamp: Date.now()
        };

      case 'topay_getTransactionHistory':
        if (!params[0]) throw new Error('Address parameter required');
        const limit = params[1] || 50;
        const offset = params[2] || 0;
        
        const history = this.blockchain.getTransactionHistory(params[0]);
        const paginatedHistory = history.slice(offset, offset + limit);
        
        return {
          address: params[0],
          transactions: paginatedHistory,
          total: history.length,
          limit,
          offset
        };

      case 'topay_getNetworkStats':
        return {
          blocks: this.blockchain.chain.length,
          transactions: this.blockchain.chain.reduce((sum, block) => sum + block.transactions.length, 0),
          mempool: this.blockchain.mempool.length,
          difficulty: this.blockchain.difficulty,
          miningReward: this.blockchain.miningReward,
          averageBlockTime: this.calculateAverageBlockTime(),
          estimatedHashRate: this.estimateHashRate()
        };

      case 'topay_addTestData':
        return await this.addTestData();

      case 'topay_resetChain':
        this.blockchain = new Blockchain();
        await this.persistence.saveBlockchain(this.blockchain);
        return {
          message: 'Blockchain reset successfully',
          blocks: this.blockchain.chain.length
        };

      default:
        throw new Error(`Method '${method}' not found`);
    }
  }

  async addTestData() {
    console.log('🧪 Adding test data to blockchain...');
    
    // Use the same test addresses from setup script that have balances
    const testAddress1 = 'TOPAYtest1234567890abcdef1234567890abcdef12345678';
    const testAddress2 = 'TOPAYtest2234567890abcdef1234567890abcdef12345678';
    const testAddress3 = 'TOPAYtest3234567890abcdef1234567890abcdef12345678';
    
    // Demo private keys for signing (same as setup script)
    const demoKey1 = 'demo_private_key_1';
    const demoKey2 = 'demo_private_key_2';
    const demoKey3 = 'demo_private_key_3';
    
    // Check current balances
    const balance1 = this.blockchain.getBalance(testAddress1);
    const balance2 = this.blockchain.getBalance(testAddress2);
    const balance3 = this.blockchain.getBalance(testAddress3);
    
    console.log(`💰 Current balances: ${testAddress1}=${balance1}, ${testAddress2}=${balance2}, ${testAddress3}=${balance3}`);
    
    // Add some test transactions with proper signing (smaller amounts to ensure sufficient balance)
    const transactions = [
      new Transaction(testAddress1, testAddress2, 10, 'Test payment 1'),
      new Transaction(testAddress2, testAddress3, 5, 'Test payment 2'),
      new Transaction(testAddress3, testAddress1, 3, 'Test payment 3'),
      new Transaction(testAddress1, testAddress3, 7, 'Test payment 4'),
      new Transaction(testAddress2, testAddress1, 4, 'Test payment 5')
    ];
    
    // Sign transactions
    await transactions[0].signTransaction(demoKey1);
    await transactions[1].signTransaction(demoKey2);
    await transactions[2].signTransaction(demoKey3);
    await transactions[3].signTransaction(demoKey1);
    await transactions[4].signTransaction(demoKey2);
    
    // Add transactions to mempool
    for (const tx of transactions) {
      await this.blockchain.addTransaction(tx);
    }
    
    // Mine a few blocks
    await this.blockchain.minePendingTransactions(testAddress1);
    await this.blockchain.minePendingTransactions(testAddress2);
    
    // Add more transactions
    const moreTx = [
      new Transaction(testAddress1, testAddress2, 8, 'Test payment 6'),
      new Transaction(testAddress3, testAddress2, 6, 'Test payment 7')
    ];
    
    // Sign additional transactions
    await moreTx[0].signTransaction(demoKey1);
    await moreTx[1].signTransaction(demoKey3);
    
    for (const tx of moreTx) {
      await this.blockchain.addTransaction(tx);
    }
    
    await this.persistence.saveBlockchain(this.blockchain);
    
    return {
      message: 'Test data added successfully',
      testAddresses: [
        { address: testAddress1, role: 'miner1', balance: this.blockchain.getBalance(testAddress1) },
        { address: testAddress2, role: 'miner2', balance: this.blockchain.getBalance(testAddress2) },
        { address: testAddress3, role: 'user', balance: this.blockchain.getBalance(testAddress3) }
      ],
      blocks: this.blockchain.chain.length,
      mempool: this.blockchain.mempool.length,
      totalTransactions: this.blockchain.chain.reduce((sum, block) => sum + block.transactions.length, 0)
    };
  }

  calculateAverageBlockTime() {
    if (this.blockchain.chain.length < 2) return 0;
    
    const recentBlocks = this.blockchain.chain.slice(-10);
    let totalTime = 0;
    
    for (let i = 1; i < recentBlocks.length; i++) {
      totalTime += recentBlocks[i].timestamp - recentBlocks[i-1].timestamp;
    }
    
    return Math.round(totalTime / (recentBlocks.length - 1) / 1000);
  }

  estimateHashRate() {
    return Math.pow(2, this.blockchain.difficulty) / 10;
  }

  async initialize() {
    console.log('🚀 Initializing TOPAY Blockchain RPC Server...');
    
    await this.persistence.initialize();
    
    const existingBlockchain = await this.persistence.loadBlockchain();
    if (existingBlockchain) {
      console.log('📂 Loading existing blockchain...');
      try {
        this.blockchain.importChain(existingBlockchain);
        console.log(`✅ Blockchain loaded: ${this.blockchain.chain.length} blocks`);
      } catch (error) {
        console.error('❌ Failed to load blockchain, creating new one:', error);
        this.blockchain = new Blockchain();
        await this.persistence.saveBlockchain(this.blockchain);
      }
    } else {
      console.log('🆕 Creating new blockchain...');
      await this.persistence.saveBlockchain(this.blockchain);
    }

    // Auto-save every 30 seconds
    setInterval(async () => {
      try {
        await this.persistence.saveBlockchain(this.blockchain);
        console.log('💾 Auto-saved blockchain state');
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, 30000);
  }

  async start() {
    await this.initialize();
    
    this.app.listen(this.port, () => {
      console.log(`\n🌐 TOPAY Blockchain RPC Server running on port ${this.port}`);
      console.log(`🔗 RPC URL: http://localhost:${this.port}/rpc`);
      console.log(`📋 Methods: http://localhost:${this.port}/api/rpc/methods`);
      console.log(`💚 Health: http://localhost:${this.port}/health`);
      console.log(`\n📋 Available RPC Methods:`);
      console.log(`   topay_getBlockNumber`);
      console.log(`   topay_getBalance(address)`);
      console.log(`   topay_getBlock(blockId)`);
      console.log(`   topay_getTransaction(hash)`);
      console.log(`   topay_sendTransaction(txData)`);
      console.log(`   topay_getMempool()`);
        console.log(`   topay_mine(minerAddress)`);
        console.log(`   topay_getChainInfo()`);
        console.log(`   topay_validateChain()`);
        console.log(`   topay_getTransactionHistory(address)`);
        console.log(`   topay_getNetworkStats()`);
        console.log(`   topay_addTestData()`);
        console.log(`   topay_resetChain()`);
        console.log(`\n⚠️  Note: Wallet creation should be handled by external wallet applications`);
      console.log(`\n🚀 Ready for RPC calls!`);
    });
  }
}

// Auto-start if run directly
if (process.argv[1].endsWith('blockchain-rpc-server.js')) {
  const port = process.argv[2] ? parseInt(process.argv[2]) : 8545;
  const server = new BlockchainRPCServer(port);
  server.start().catch(console.error);
}

export { BlockchainRPCServer };