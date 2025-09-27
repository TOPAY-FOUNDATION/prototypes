/**
 * TOPAY Foundation Simple Blockchain RPC Server
 * Basic API server for the simplified blockchain with 512-bit hashing
 */

import express from 'express';
import cors from 'cors';
import { Blockchain } from './blockchain/blockchain.js';

class SimpleBlockchainRPCServer {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.blockchain = new Blockchain();
    this.initialized = false;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Initialize the blockchain (for serverless environments)
   */
  async initialize() {
    if (!this.initialized) {
      console.log('🚀 Initializing TOPAY Simple Blockchain...');
      // Blockchain initialization is handled in constructor
      console.log(`📊 Blockchain initialized with ${this.blockchain.getChainLength()} blocks`);
      this.initialized = true;
    }
    return this;
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
    // Health check (keep at root for monitoring)
    this.app.get('/health', async (req, res) => {
      const stats = this.blockchain.getStats();
      const isValid = await this.blockchain.isChainValid();
      
      res.json({
        status: 'healthy',
        blockchain: {
          ...stats,
          chainValid: isValid
        },
        timestamp: Date.now()
      });
    });

    // TOPAY API Base - Get blockchain stats
    this.app.get('/topay/stats', async (req, res) => {
      try {
        const stats = this.blockchain.getStats();
        const isValid = await this.blockchain.isChainValid();
        stats.chainValid = isValid;
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Blockchain - Get all blocks
    this.app.get('/topay/blocks', (req, res) => {
      try {
        const blocks = this.blockchain.getAllBlocks();
        res.json(blocks);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Blockchain - Get specific block by index
    this.app.get('/topay/blocks/:index', (req, res) => {
      try {
        const index = parseInt(req.params.index);
        const block = this.blockchain.getBlock(index);
        
        if (block) {
          res.json(block.toJSON());
        } else {
          res.status(404).json({ error: 'Block not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Transaction - Add new block/transaction
    this.app.post('/topay/transaction', async (req, res) => {
      try {
        const { data } = req.body;
        
        if (!data) {
          return res.status(400).json({ error: 'Transaction data is required' });
        }

        const newBlock = await this.blockchain.addBlock(data);
        res.json({
          success: true,
          block: newBlock.toJSON(),
          message: `Transaction processed in block ${newBlock.index}`
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Search - Search blocks
    this.app.get('/topay/search', (req, res) => {
      try {
        const { q } = req.query;
        
        if (!q) {
          return res.status(400).json({ error: 'Search query is required' });
        }

        const results = this.blockchain.searchBlocks(q);
        res.json({
          query: q,
          results: results,
          count: results.length
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Mining - Set mining difficulty
    this.app.post('/topay/mining/difficulty', (req, res) => {
      try {
        const { difficulty } = req.body;
        
        if (!difficulty || difficulty < 1 || difficulty > 6) {
          return res.status(400).json({ error: 'Difficulty must be between 1 and 6' });
        }

        this.blockchain.setDifficulty(difficulty);
        res.json({
          success: true,
          difficulty: difficulty,
          message: `Mining difficulty set to ${difficulty}`
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Export - Export blockchain
    this.app.get('/topay/export', (req, res) => {
      try {
        const chainData = this.blockchain.exportChain();
        res.json(chainData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Import - Import blockchain
    this.app.post('/topay/import', (req, res) => {
      try {
        const chainData = req.body;
        const success = this.blockchain.importChain(chainData);
        
        if (success) {
          res.json({
            success: true,
            message: 'Blockchain imported successfully',
            blocks: this.blockchain.getChainLength()
          });
        } else {
          res.status(400).json({ error: 'Failed to import blockchain' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Admin - Reset blockchain
    this.app.post('/topay/admin/reset', (req, res) => {
      try {
        this.blockchain.reset();
        res.json({
          success: true,
          message: 'Blockchain reset to genesis block'
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Validate - Validate blockchain
    this.app.get('/topay/validate', async (req, res) => {
      try {
        const isValid = await this.blockchain.isChainValid();
        res.json({
          valid: isValid,
          message: isValid ? 'Blockchain is valid' : 'Blockchain validation failed'
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Test - Add test data
    this.app.post('/topay/test-data', async (req, res) => {
      try {
        console.log('🧪 Adding test data to blockchain...');
        
        await this.blockchain.addBlock('First test block');
        await this.blockchain.addBlock('Second test block');
        await this.blockchain.addBlock({ message: 'Third block with JSON data', timestamp: Date.now() });
        
        res.json({
          success: true,
          message: 'Test data added successfully',
          blocks: this.blockchain.getChainLength()
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Cache - Get cache information
    this.app.get('/topay/cache', (req, res) => {
      try {
        const cacheInfo = this.blockchain.cache.getCacheInfo();
        res.json(cacheInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Cache - Clear cache
    this.app.post('/topay/cache/clear', (req, res) => {
      try {
        const success = this.blockchain.cache.clearCache();
        if (success) {
          // Reset blockchain after clearing cache
          this.blockchain.reset();
          res.json({
            success: true,
            message: 'Cache cleared and blockchain reset'
          });
        } else {
          res.status(500).json({ error: 'Failed to clear cache' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Cache - Export cache
    this.app.get('/topay/cache/export', (req, res) => {
      try {
        const cacheData = this.blockchain.cache.exportCache();
        res.json(cacheData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Cache - Import cache
    this.app.post('/topay/cache/import', (req, res) => {
      try {
        const cacheData = req.body;
        const success = this.blockchain.cache.importCache(cacheData);
        
        if (success) {
          // Reload blockchain from imported cache
          this.blockchain.loadFromCache();
          res.json({
            success: true,
            message: 'Cache imported and blockchain reloaded',
            blocks: this.blockchain.getChainLength()
          });
        } else {
          res.status(400).json({ error: 'Failed to import cache' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Wallet - Placeholder for future wallet functionality
    this.app.get('/topay/wallet', (req, res) => {
      res.json({
        message: 'TOPAY Wallet API - Coming Soon',
        features: [
          'Create wallet',
          'Check balance',
          'Send transactions',
          'Transaction history'
        ]
      });
    });

    // TOPAY API Documentation
    this.app.get('/topay', (req, res) => {
      res.json({
        name: 'TOPAY Blockchain API',
        version: '2.0.0',
        description: 'Quantum-safe blockchain with 512-bit hashing using TOPAY-Z512',
        baseUrl: '/topay',
        endpoints: {
          'GET /health': 'Health check and blockchain status',
          'GET /topay/stats': 'Get blockchain statistics',
          'GET /topay/blocks': 'Get all blocks',
          'GET /topay/blocks/:index': 'Get specific block by index',
          'POST /topay/transaction': 'Process new transaction (requires: data)',
          'GET /topay/search?q=term': 'Search blocks by content',
          'POST /topay/mining/difficulty': 'Set mining difficulty (requires: difficulty 1-6)',
          'GET /topay/export': 'Export blockchain data',
          'POST /topay/import': 'Import blockchain data',
          'POST /topay/admin/reset': 'Reset blockchain to genesis',
          'GET /topay/validate': 'Validate entire blockchain',
          'POST /topay/test-data': 'Add test blocks for demonstration',
          'GET /topay/wallet': 'Wallet API information',
          'GET /topay/cache': 'Get cache information',
          'POST /topay/cache/clear': 'Clear cache and reset blockchain',
          'GET /topay/cache/export': 'Export cache data',
          'POST /topay/cache/import': 'Import cache data'
        }
      });
    });

    // Legacy API redirect for backward compatibility
    this.app.get('/api', (req, res) => {
      res.redirect(301, '/topay');
    });

    // Catch all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: 'Visit /topay for available endpoints'
      });
    });
  }

  async start() {
    try {
      console.log('🚀 Starting TOPAY Simple Blockchain RPC Server...');
      console.log(`📊 Blockchain initialized with ${this.blockchain.getChainLength()} blocks`);
      
      const PORT = process.env.PORT || this.port;
      this.server = this.app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📖 API documentation available at /api`);
        console.log(`❤️  Health check available at /health`);
        console.log('🔗 Ready to accept blockchain operations!');
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 Server stopped');
    }
  }
}

// Start server if this file is run directly
if (process.argv[1].endsWith('blockchain-rpc-server.js')) {
  const port = process.argv[2] ? parseInt(process.argv[2]) : 3001;
  const server = new SimpleBlockchainRPCServer(port);
  server.start().catch(console.error);
}

export { SimpleBlockchainRPCServer };