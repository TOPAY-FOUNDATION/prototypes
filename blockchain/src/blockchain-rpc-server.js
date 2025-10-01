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

    // TOPAY Token - Create new token
    this.app.post('/topay/tokens/create', async (req, res) => {
      try {
        const { name, symbol, totalSupply, owner } = req.body;
        
        if (!name || !symbol || !totalSupply || !owner) {
          return res.status(400).json({ 
            error: 'Token creation requires: name, symbol, totalSupply, owner' 
          });
        }

        const tokenTransaction = {
          type: 'CREATE_TOKEN',
          from: owner,
          data: {
            name,
            symbol,
            totalSupply
          },
          timestamp: Date.now()
        };

        const result = await this.blockchain.addTokenTransaction(tokenTransaction);
        
        if (result.success) {
          res.json({
            success: true,
            tokenId: result.transaction.tokenId,
            block: result.block,
            message: `Token ${symbol} created successfully`
          });
        } else {
          res.status(500).json({ error: result.error });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Token - Transfer tokens
    this.app.post('/topay/tokens/transfer', async (req, res) => {
      try {
        const { tokenId, from, to, amount } = req.body;
        
        if (!tokenId || !from || !to || !amount) {
          return res.status(400).json({ 
            error: 'Token transfer requires: tokenId, from, to, amount' 
          });
        }

        const tokenTransaction = {
          type: 'TRANSFER_TOKEN',
          tokenId,
          from,
          to,
          amount,
          timestamp: Date.now()
        };

        const result = await this.blockchain.addTokenTransaction(tokenTransaction);
        
        if (result.success) {
          res.json({
            success: true,
            block: result.block,
            message: `Transferred ${amount} tokens from ${from} to ${to}`
          });
        } else {
          res.status(500).json({ error: result.error });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Token - Get token information
    this.app.get('/topay/tokens/:tokenId', (req, res) => {
      try {
        const tokenId = req.params.tokenId;
        const tokenInfo = this.blockchain.getTokenInfo(tokenId);
        
        if (tokenInfo) {
          res.json(tokenInfo);
        } else {
          res.status(404).json({ error: 'Token not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Token - Get all tokens
    this.app.get('/topay/tokens', (req, res) => {
      try {
        const tokens = this.blockchain.tokenManager.getAllTokens();
        res.json(tokens);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Token - Get token balance for address
    this.app.get('/topay/tokens/:tokenId/balance/:address', (req, res) => {
      try {
        const { tokenId, address } = req.params;
        const balance = this.blockchain.getTokenBalance(tokenId, address);
        
        res.json({
          tokenId,
          address,
          balance
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Token - Get all token balances for address
    this.app.get('/topay/address/:address/tokens', (req, res) => {
      try {
        const address = req.params.address;
        const balances = this.blockchain.getAllTokenBalances(address);
        
        res.json({
          address,
          balances
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Wallet - Create new wallet with automatic token distribution
    this.app.post('/topay/wallet/create', async (req, res) => {
      try {
        const { label } = req.body;
        
        // Generate wallet address (simplified for demo)
        const timestamp = Date.now();
        const randomBytes = Math.random().toString(36).substring(2, 15);
        const address = `TOPAY${timestamp.toString(16).toUpperCase()}${randomBytes.toUpperCase()}`;
        
        // Generate public/private key pair (simplified for demo)
        const privateKey = Array.from(crypto.getRandomValues(new Uint8Array(32)));
        const publicKey = Array.from(crypto.getRandomValues(new Uint8Array(32)));
        
        // Record wallet creation on blockchain
        const walletCreationData = {
          type: 'wallet_creation',
          address: address,
          publicKey: publicKey,
          timestamp: timestamp,
          label: label || `Wallet ${timestamp.toString().slice(-4)}`
        };
        
        const result = await this.blockchain.addBlock(walletCreationData);
        
        if (result) {
          // Distribute 1000 TPY tokens from genesis wallet to new wallet
          try {
            const tokenDistribution = await this.blockchain.distributeGenesisTokens(address, 1000);
            
            if (tokenDistribution.success) {
              res.json({
                success: true,
                address: address,
                publicKey: publicKey,
                message: 'Wallet created successfully with 1000 TPY tokens',
                block: {
                  index: result.index,
                  hash: result.hash,
                  timestamp: result.timestamp
                },
                tokenDistribution: {
                  amount: tokenDistribution.amount,
                  symbol: tokenDistribution.symbol,
                  tokenId: tokenDistribution.tokenId,
                  block: tokenDistribution.block
                }
              });
            } else {
              // Wallet created but token distribution failed
              res.json({
                success: true,
                address: address,
                publicKey: publicKey,
                message: 'Wallet created successfully but token distribution failed',
                block: {
                  index: result.index,
                  hash: result.hash,
                  timestamp: result.timestamp
                },
                tokenError: tokenDistribution.error
              });
            }
          } catch (tokenError) {
            // Wallet created but token distribution failed
            res.json({
              success: true,
              address: address,
              publicKey: publicKey,
              message: 'Wallet created successfully but token distribution failed',
              block: {
                index: result.index,
                hash: result.hash,
                timestamp: result.timestamp
              },
              tokenError: tokenError.message
            });
          }
        } else {
           res.status(500).json({
             success: false,
             error: 'Failed to record wallet creation'
           });
         }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // TOPAY Wallet - Send tokens
    this.app.post('/topay/wallet/send', async (req, res) => {
      try {
        const { from, to, amount, tokenId } = req.body;
        
        if (!from || !to || !amount) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: from, to, amount'
          });
        }

        // Use native token if no tokenId specified
        const targetTokenId = tokenId || this.blockchain.nativeTokenId;
        
        if (!targetTokenId) {
          return res.status(400).json({
            success: false,
            error: 'Native token not available and no tokenId specified'
          });
        }

        // Create transfer transaction
        const transferTransaction = {
          type: 'TRANSFER_TOKEN',
          from: from,
          to: to,
          tokenId: targetTokenId,
          amount: parseInt(amount),
          timestamp: Date.now()
        };

        const result = await this.blockchain.addTokenTransaction(transferTransaction);
        
        if (result.success) {
          res.json({
            success: true,
            message: 'Tokens sent successfully',
            transaction: result.transaction,
            block: result.block
          });
        } else {
          res.status(400).json({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // TOPAY Wallet - Get balance
    this.app.get('/topay/wallet/:address/balance', (req, res) => {
      try {
        const { address } = req.params;
        const { tokenId } = req.query;
        
        if (tokenId) {
          // Get specific token balance
          const balance = this.blockchain.tokenManager.getBalance(tokenId, address);
          const tokenInfo = this.blockchain.tokenManager.getToken(tokenId);
          
          res.json({
            address: address,
            tokenId: tokenId,
            balance: balance,
            tokenInfo: tokenInfo,
            message: 'Token balance retrieved successfully'
          });
        } else {
          // Get native token balance
          const nativeTokenId = this.blockchain.nativeTokenId;
          if (!nativeTokenId) {
            return res.status(400).json({
              success: false,
              error: 'Native token not available'
            });
          }
          
          const balance = this.blockchain.tokenManager.getBalance(nativeTokenId, address);
          const tokenInfo = this.blockchain.tokenManager.getToken(nativeTokenId);
          
          res.json({
            address: address,
            balance: balance,
            symbol: 'TPY',
            tokenInfo: tokenInfo,
            message: 'Native token balance retrieved successfully'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // TOPAY Wallet - Receive tokens (for transaction history/notifications)
    this.app.get('/topay/wallet/:address/receive', (req, res) => {
      try {
        const { address } = req.params;
        const { limit = 10 } = req.query;
        
        // Get recent incoming transactions
        const allTokenBalances = this.blockchain.getAllTokenBalances(address);
        const transactions = [];
        
        // Search through recent blocks for incoming transactions
        const recentBlocks = this.blockchain.chain.slice(-50); // Last 50 blocks
        
        for (const block of recentBlocks.reverse()) {
          if (block.data && typeof block.data === 'object' && block.data.type === 'TOKEN_TRANSACTION') {
            const txData = block.data.transaction;
            if (txData && txData.to === address) {
              transactions.push({
                from: txData.from,
                to: txData.to,
                amount: txData.amount,
                tokenId: txData.tokenId,
                timestamp: block.timestamp,
                blockIndex: block.index,
                blockHash: block.hash
              });
              
              if (transactions.length >= limit) break;
            }
          }
        }
        
        res.json({
          address: address,
          incomingTransactions: transactions,
          totalReceived: transactions.length,
          message: 'Incoming transactions retrieved successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // TOPAY Wallet - Get wallet information
    this.app.get('/topay/wallet/:address', (req, res) => {
      try {
        const { address } = req.params;
        
        // Get wallet balance and token balances
        const tokenBalances = this.blockchain.getAllTokenBalances(address);
        
        res.json({
          address: address,
          tokenBalances: tokenBalances,
          message: 'Wallet information retrieved successfully'
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // TOPAY Wallet - API information
    this.app.get('/topay/wallet', (req, res) => {
      res.json({
        message: 'TOPAY Wallet API',
        endpoints: {
          'POST /topay/wallet/create': 'Create new wallet with 1000 TPY tokens',
          'POST /topay/wallet/send': 'Send tokens (requires: from, to, amount, optional: tokenId)',
          'GET /topay/wallet/:address/balance': 'Get wallet balance (optional query: tokenId)',
          'GET /topay/wallet/:address/receive': 'Get incoming transactions (optional query: limit)',
          'GET /topay/wallet/:address': 'Get wallet information and token balances'
        }
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
          'POST /topay/tokens/create': 'Create new token (requires: name, symbol, totalSupply, owner)',
          'POST /topay/tokens/transfer': 'Transfer tokens (requires: tokenId, from, to, amount)',
          'GET /topay/tokens': 'Get all tokens',
          'GET /topay/tokens/:tokenId': 'Get token information',
          'GET /topay/tokens/:tokenId/balance/:address': 'Get token balance for address',
          'GET /topay/address/:address/tokens': 'Get all token balances for address',
          'POST /topay/wallet/create': 'Create new wallet with 1000 TPY tokens',
          'POST /topay/wallet/send': 'Send tokens (requires: from, to, amount, optional: tokenId)',
          'GET /topay/wallet/:address/balance': 'Get wallet balance (optional query: tokenId)',
          'GET /topay/wallet/:address/receive': 'Get incoming transactions (optional query: limit)',
          'GET /topay/wallet/:address': 'Get wallet information and token balances',
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