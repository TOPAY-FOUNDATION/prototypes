import express from 'express';
import cors from 'cors';
import { Blockchain } from './blockchain/blockchain.js';
import { Transaction } from './blockchain/transaction.js';
import { PersistenceManager } from './storage/persistence.js';

/**
 * TOPAY Wallet API Server
 * Provides REST API for independent wallet applications
 */
class WalletAPIServer {
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.blockchain = new Blockchain();
    this.persistence = new PersistenceManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Enable CORS for wallet applications
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    this.app.use(express.json());
    this.app.use(express.static('public'));

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
        timestamp: Date.now(),
        blockchain: {
          blocks: this.blockchain.chain.length,
          difficulty: this.blockchain.difficulty,
          mempool: this.blockchain.mempool.length
        }
      });
    });

    // Blockchain info
    this.app.get('/api/blockchain/info', (req, res) => {
      res.json({
        blocks: this.blockchain.chain.length,
        difficulty: this.blockchain.difficulty,
        miningReward: this.blockchain.miningReward,
        mempool: this.blockchain.mempool.length,
        latestBlock: this.blockchain.getLatestBlock()
      });
    });

    // Get balance for address
    this.app.get('/api/wallet/:address/balance', (req, res) => {
      try {
        const { address } = req.params;
        const balance = this.blockchain.getBalance(address);
        
        res.json({
          address,
          balance,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get transaction history for address
    this.app.get('/api/wallet/:address/transactions', (req, res) => {
      try {
        const { address } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        const transactions = this.blockchain.getTransactionHistory(address);
        const paginatedTx = transactions.slice(offset, offset + parseInt(limit));
        
        res.json({
          address,
          transactions: paginatedTx,
          total: transactions.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Submit transaction
    this.app.post('/api/transaction/submit', async (req, res) => {
      try {
        const { from, to, amount, signature, publicKey, memo } = req.body;

        if (!from || !to || !amount || !signature || !publicKey) {
          return res.status(400).json({ 
            error: 'Missing required fields: from, to, amount, signature, publicKey' 
          });
        }

        // Create transaction
        const transaction = new Transaction(from, to, amount, memo);
        
        // Set signature and public key (in production, verify signature)
        transaction.signature = signature;
        transaction.publicKey = publicKey;

        // Add to mempool
        await this.blockchain.addTransaction(transaction);

        res.json({
          success: true,
          transactionId: transaction.hash,
          message: 'Transaction added to mempool',
          transaction: transaction.toJSON()
        });

      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get transaction by hash
    this.app.get('/api/transaction/:hash', (req, res) => {
      try {
        const { hash } = req.params;
        
        // Search through all blocks
        for (const block of this.blockchain.chain) {
          const transaction = block.transactions.find(tx => tx.hash === hash);
          if (transaction) {
            return res.json({
              transaction: transaction.toJSON(),
              block: {
                index: block.index,
                hash: block.hash,
                timestamp: block.timestamp
              },
              confirmations: this.blockchain.chain.length - block.index
            });
          }
        }

        // Check mempool
        const mempoolTx = this.blockchain.mempool.find(tx => tx.hash === hash);
        if (mempoolTx) {
          return res.json({
            transaction: mempoolTx.toJSON(),
            status: 'pending',
            confirmations: 0
          });
        }

        res.status(404).json({ error: 'Transaction not found' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get mempool transactions
    this.app.get('/api/mempool', (req, res) => {
      res.json({
        transactions: this.blockchain.mempool.map(tx => tx.toJSON()),
        count: this.blockchain.mempool.length
      });
    });

    // Get latest blocks
    this.app.get('/api/blocks', (req, res) => {
      try {
        const { limit = 10, offset = 0 } = req.query;
        const blocks = this.blockchain.chain
          .slice(-parseInt(limit) - parseInt(offset), -parseInt(offset) || undefined)
          .reverse();

        res.json({
          blocks: blocks.map(block => ({
            index: block.index,
            hash: block.hash,
            previousHash: block.previousHash,
            timestamp: block.timestamp,
            transactions: block.transactions.length,
            difficulty: block.difficulty,
            nonce: block.nonce
          })),
          total: this.blockchain.chain.length
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get specific block
    this.app.get('/api/block/:identifier', (req, res) => {
      try {
        const { identifier } = req.params;
        let block;

        // Try to find by index or hash
        if (/^\d+$/.test(identifier)) {
          const index = parseInt(identifier);
          block = this.blockchain.chain[index];
        } else {
          block = this.blockchain.chain.find(b => b.hash === identifier);
        }

        if (!block) {
          return res.status(404).json({ error: 'Block not found' });
        }

        res.json({
          index: block.index,
          hash: block.hash,
          previousHash: block.previousHash,
          timestamp: block.timestamp,
          transactions: block.transactions.map(tx => tx.toJSON()),
          difficulty: block.difficulty,
          nonce: block.nonce,
          merkleRoot: block.merkleRoot
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Mine a block (for testing)
    this.app.post('/api/mine', async (req, res) => {
      try {
        const { minerAddress } = req.body;
        
        if (!minerAddress) {
          return res.status(400).json({ error: 'Miner address required' });
        }

        console.log(`🚀 Mining block for ${minerAddress}...`);
        const block = await this.blockchain.minePendingTransactions(minerAddress);
        
        // Save blockchain state
        await this.persistence.saveBlockchain(this.blockchain);

        res.json({
          success: true,
          block: {
            index: block.index,
            hash: block.hash,
            transactions: block.transactions.length,
            reward: this.blockchain.miningReward
          },
          message: 'Block mined successfully'
        });

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Validate address format
    this.app.get('/api/validate/address/:address', (req, res) => {
      const { address } = req.params;
      const isValid = address.startsWith('TOPAY') && address.length === 45;
      
      res.json({
        address,
        valid: isValid,
        format: 'TOPAY + 40 hex characters'
      });
    });

    // Network statistics
    this.app.get('/api/stats', (req, res) => {
      const totalTransactions = this.blockchain.chain.reduce(
        (sum, block) => sum + block.transactions.length, 0
      );

      const totalSupply = this.blockchain.chain.length * this.blockchain.miningReward;

      res.json({
        blocks: this.blockchain.chain.length,
        transactions: totalTransactions,
        mempool: this.blockchain.mempool.length,
        difficulty: this.blockchain.difficulty,
        miningReward: this.blockchain.miningReward,
        totalSupply,
        averageBlockTime: this.calculateAverageBlockTime(),
        networkHashRate: this.estimateHashRate()
      });
    });

    // Serve wallet application
    this.app.get('/wallet', (req, res) => {
      res.sendFile('wallet-app.html', { root: '.' });
    });

    // Error handling
    this.app.use((error, req, res, next) => {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  calculateAverageBlockTime() {
    if (this.blockchain.chain.length < 2) return 0;
    
    const recentBlocks = this.blockchain.chain.slice(-10);
    let totalTime = 0;
    
    for (let i = 1; i < recentBlocks.length; i++) {
      totalTime += recentBlocks[i].timestamp - recentBlocks[i-1].timestamp;
    }
    
    return Math.round(totalTime / (recentBlocks.length - 1) / 1000); // seconds
  }

  estimateHashRate() {
    // Simple hash rate estimation based on difficulty
    return Math.pow(2, this.blockchain.difficulty) / 10; // hashes per second
  }

  async initialize() {
    console.log('🚀 Initializing TOPAY Wallet API Server...');
    
    // Initialize persistence
    await this.persistence.initialize();
    
    // Load existing blockchain
    const existingBlockchain = await this.persistence.loadBlockchain();
    if (existingBlockchain) {
      console.log('📂 Loading existing blockchain...');
      try {
        // Use the blockchain's importChain method to properly reconstruct Block objects
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
      console.log(`\n🌐 TOPAY Wallet API Server running on port ${this.port}`);
      console.log(`📱 Wallet App: http://localhost:${this.port}/wallet`);
      console.log(`🔗 API Docs: http://localhost:${this.port}/health`);
      console.log(`\n📋 Available Endpoints:`);
      console.log(`   GET  /api/blockchain/info`);
      console.log(`   GET  /api/wallet/:address/balance`);
      console.log(`   GET  /api/wallet/:address/transactions`);
      console.log(`   POST /api/transaction/submit`);
      console.log(`   GET  /api/transaction/:hash`);
      console.log(`   GET  /api/mempool`);
      console.log(`   GET  /api/blocks`);
      console.log(`   GET  /api/block/:identifier`);
      console.log(`   POST /api/mine`);
      console.log(`   GET  /api/stats`);
      console.log(`\n🚀 Ready to serve wallet applications!`);
    });
  }
}

// Auto-start if run directly
if (process.argv[1].endsWith('wallet-api-server.js')) {
  const server = new WalletAPIServer();
  server.start().catch(console.error);
}

export { WalletAPIServer };