/**
 * TOPAY Foundation Simple Blockchain RPC Server
 * Basic API server for the simplified blockchain with 512-bit hashing
 */

import express from 'express';
import cors from 'cors';
import { Blockchain } from './blockchain/blockchain.js';
import { ExplorerMethods } from './rpc/explorer-methods.js';

class SimpleBlockchainRPCServer {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.blockchain = new Blockchain();
    this.explorerMethods = new ExplorerMethods(this.blockchain);
    this.initialized = false;
    
    // Security enforcement storage
    this.securityActions = new Map(); // walletAddress -> SecurityAction
    this.blockedWallets = new Set();
    this.restrictedWallets = new Map(); // walletAddress -> restrictions
    
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

    // TOPAY API - Get market data (mock for now, would connect to real price feeds)
    this.app.get('/topay/market', async (req, res) => {
      try {
        const stats = this.blockchain.getStats();
        
        // Mock market data - in production this would come from price feeds
        const marketData = {
          price: 0.00, // USD price per TOPAY
          marketCap: 0.00, // Total market cap in USD
          volume24h: 0.00, // 24h trading volume in USD
          change24h: 0.00, // 24h price change percentage
          totalSupply: stats.totalTokens || 1000000, // Total TOPAY tokens in circulation
          circulatingSupply: stats.totalTokens || 1000000, // Circulating supply
          maxSupply: 1000000000, // Maximum possible supply
          lastUpdated: Date.now()
        };
        
        res.json({
          success: true,
          data: marketData
        });
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error.message 
        });
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

    // ========================================
    // BLOCKCHAIN EXPLORER API ENDPOINTS
    // Standard blockchain API methods following Ethereum JSON-RPC conventions
    // ========================================

    // Get block by number (standard: eth_getBlockByNumber)
    this.app.get('/explorer/block/number/:blockNumber', async (req, res) => {
      try {
        const { blockNumber } = req.params;
        const { fullTransactions = false } = req.query;
        
        const block = await this.explorerMethods.getBlockByNumber(
          blockNumber, 
          fullTransactions === 'true'
        );
        
        if (block) {
          res.json({ success: true, block });
        } else {
          res.status(404).json({ error: 'Block not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get block by hash (standard: eth_getBlockByHash)
    this.app.get('/explorer/block/hash/:blockHash', async (req, res) => {
      try {
        const { blockHash } = req.params;
        const { fullTransactions = false } = req.query;
        
        const block = await this.explorerMethods.getBlockByHash(
          blockHash, 
          fullTransactions === 'true'
        );
        
        if (block) {
          res.json({ success: true, block });
        } else {
          res.status(404).json({ error: 'Block not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get transaction by hash (standard: eth_getTransactionByHash)
    this.app.get('/explorer/transaction/:txHash', async (req, res) => {
      try {
        const { txHash } = req.params;
        
        const transaction = await this.explorerMethods.getTransactionByHash(txHash);
        
        if (transaction) {
          res.json({ success: true, transaction });
        } else {
          res.status(404).json({ error: 'Transaction not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get transaction receipt (standard: eth_getTransactionReceipt)
    this.app.get('/explorer/transaction/:txHash/receipt', async (req, res) => {
      try {
        const { txHash } = req.params;
        
        const receipt = await this.explorerMethods.getTransactionReceipt(txHash);
        
        if (receipt) {
          res.json({ success: true, receipt });
        } else {
          res.status(404).json({ error: 'Transaction receipt not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get account balance (standard: eth_getBalance)
    this.app.get('/explorer/account/:address/balance', async (req, res) => {
      try {
        const { address } = req.params;
        const { blockNumber = 'latest' } = req.query;
        
        const balance = await this.explorerMethods.getBalance(address, blockNumber);
        
        res.json({ 
          success: true, 
          address,
          balance,
          blockNumber: blockNumber === 'latest' ? await this.explorerMethods.getBlockNumber() : blockNumber
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get transaction count (standard: eth_getTransactionCount)
    this.app.get('/explorer/account/:address/nonce', async (req, res) => {
      try {
        const { address } = req.params;
        const { blockNumber = 'latest' } = req.query;
        
        const nonce = await this.explorerMethods.getTransactionCount(address, blockNumber);
        
        res.json({ 
          success: true, 
          address,
          nonce,
          blockNumber: blockNumber === 'latest' ? await this.explorerMethods.getBlockNumber() : blockNumber
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get code at address (standard: eth_getCode)
    this.app.get('/explorer/account/:address/code', async (req, res) => {
      try {
        const { address } = req.params;
        const { blockNumber = 'latest' } = req.query;
        
        const code = await this.explorerMethods.getCode(address, blockNumber);
        
        res.json({ 
          success: true, 
          address,
          code,
          blockNumber: blockNumber === 'latest' ? await this.explorerMethods.getBlockNumber() : blockNumber
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get latest block number (standard: eth_blockNumber)
    this.app.get('/explorer/block/latest', async (req, res) => {
      try {
        const blockNumber = await this.explorerMethods.getBlockNumber();
        
        res.json({ 
          success: true, 
          blockNumber,
          decimal: parseInt(blockNumber, 16)
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get network information
    this.app.get('/explorer/network', async (req, res) => {
      try {
        const networkInfo = await this.explorerMethods.getNetworkInfo();
        
        res.json({ 
          success: true, 
          network: networkInfo
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Search blockchain data
    this.app.get('/explorer/search', async (req, res) => {
      try {
        const { q } = req.query;
        
        if (!q) {
          return res.status(400).json({ error: 'Search query parameter "q" is required' });
        }
        
        const results = await this.explorerMethods.search(q);
        
        res.json({ 
          success: true, 
          ...results
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get recent blocks
    this.app.get('/explorer/blocks/recent', async (req, res) => {
      try {
        const { limit = 10 } = req.query;
        const parsedLimit = Math.min(parseInt(limit) || 10, 100); // Max 100 blocks
        
        const blocks = await this.explorerMethods.getRecentBlocks(parsedLimit);
        
        res.json({ 
          success: true, 
          blocks,
          count: blocks.length
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get recent transactions
    this.app.get('/explorer/transactions/recent', async (req, res) => {
      try {
        const { limit = 10 } = req.query;
        const parsedLimit = Math.min(parseInt(limit) || 10, 100); // Max 100 transactions
        
        const transactions = await this.explorerMethods.getRecentTransactions(parsedLimit);
        
        res.json({ 
          success: true, 
          transactions,
          count: transactions.length
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // JSON-RPC 2.0 endpoint for standard blockchain methods
    this.app.post('/explorer/rpc', async (req, res) => {
      try {
        const { method, params = [], id = 1, jsonrpc = '2.0' } = req.body;
        
        let result;
        
        switch (method) {
          case 'eth_blockNumber':
            result = await this.explorerMethods.getBlockNumber();
            break;
            
          case 'eth_getBlockByNumber':
            result = await this.explorerMethods.getBlockByNumber(params[0], params[1] || false);
            break;
            
          case 'eth_getBlockByHash':
            result = await this.explorerMethods.getBlockByHash(params[0], params[1] || false);
            break;
            
          case 'eth_getTransactionByHash':
            result = await this.explorerMethods.getTransactionByHash(params[0]);
            break;
            
          case 'eth_getTransactionReceipt':
            result = await this.explorerMethods.getTransactionReceipt(params[0]);
            break;
            
          case 'eth_getBalance':
            result = await this.explorerMethods.getBalance(params[0], params[1] || 'latest');
            break;
            
          case 'eth_getTransactionCount':
            result = await this.explorerMethods.getTransactionCount(params[0], params[1] || 'latest');
            break;
            
          case 'eth_getCode':
            result = await this.explorerMethods.getCode(params[0], params[1] || 'latest');
            break;
            
          case 'net_version':
            result = '1'; // TOPAY mainnet
            break;
            
          case 'web3_clientVersion':
            result = 'TOPAY/v2.0.0/blockchain-rpc-server';
            break;
            
          default:
            return res.json({
              jsonrpc,
              id,
              error: {
                code: -32601,
                message: 'Method not found'
              }
            });
        }
        
        res.json({
          jsonrpc,
          id,
          result
        });
      } catch (error) {
        res.json({
          jsonrpc: req.body.jsonrpc || '2.0',
          id: req.body.id || 1,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message
          }
        });
      }
    });

    // Explorer API documentation
    this.app.get('/explorer', (req, res) => {
      res.json({
        name: 'TOPAY Blockchain Explorer API',
        version: '1.0.0',
        description: 'Standard blockchain explorer API following Ethereum JSON-RPC conventions',
        baseUrl: '/explorer',
        endpoints: {
          'GET /explorer/block/number/:blockNumber': 'Get block by number (query: fullTransactions=true/false)',
          'GET /explorer/block/hash/:blockHash': 'Get block by hash (query: fullTransactions=true/false)',
          'GET /explorer/block/latest': 'Get latest block number',
          'GET /explorer/transaction/:txHash': 'Get transaction by hash',
          'GET /explorer/transaction/:txHash/receipt': 'Get transaction receipt',
          'GET /explorer/account/:address/balance': 'Get account balance (query: blockNumber)',
          'GET /explorer/account/:address/nonce': 'Get transaction count/nonce (query: blockNumber)',
          'GET /explorer/account/:address/code': 'Get contract code (query: blockNumber)',
          'GET /explorer/network': 'Get network information',
          'GET /explorer/search?q=term': 'Search blocks, transactions, and addresses',
          'GET /explorer/blocks/recent?limit=10': 'Get recent blocks',
          'GET /explorer/transactions/recent?limit=10': 'Get recent transactions',
          'POST /explorer/rpc': 'JSON-RPC 2.0 endpoint for standard methods'
        },
        jsonRpcMethods: [
          'eth_blockNumber',
          'eth_getBlockByNumber',
          'eth_getBlockByHash', 
          'eth_getTransactionByHash',
          'eth_getTransactionReceipt',
          'eth_getBalance',
          'eth_getTransactionCount',
          'eth_getCode',
          'net_version',
          'web3_clientVersion'
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

    // Security Enforcement API
    this.setupSecurityRoutes();

    // Catch all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: 'Visit /topay for available endpoints'
      });
    });
  }

  /**
   * Setup security enforcement routes
   */
  setupSecurityRoutes() {
    // Enforce security action on a wallet
    this.app.post('/security/enforce', (req, res) => {
      try {
        const { walletAddress, action, severity, reason, duration, restrictions } = req.body;

        if (!walletAddress || !action || !severity || !reason) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: walletAddress, action, severity, reason'
          });
        }

        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid wallet address format'
          });
        }

        const securityAction = {
          walletAddress,
          action,
          severity,
          reason,
          duration,
          restrictions: restrictions || [],
          timestamp: new Date().toISOString(),
          expiresAt: duration ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString() : null
        };

        // Store security action
        this.securityActions.set(walletAddress, securityAction);

        // Apply enforcement
        switch (action) {
          case 'block':
            this.blockedWallets.add(walletAddress);
            break;
          case 'restrict':
            this.restrictedWallets.set(walletAddress, {
              restrictions: restrictions || [],
              expiresAt: securityAction.expiresAt
            });
            break;
          case 'monitor':
            // Enhanced monitoring - just log for now
            console.log(`🔍 Enhanced monitoring enabled for wallet: ${walletAddress}`);
            break;
        }

        console.log(`🚨 Security action applied: ${action} on ${walletAddress} - ${reason}`);

        res.json({
          success: true,
          message: `Security action '${action}' applied to wallet ${walletAddress}`,
          action: securityAction
        });

      } catch (error) {
        console.error('Security enforcement error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to enforce security action'
        });
      }
    });

    // Get security status for a wallet
    this.app.get('/security/status/:walletAddress', (req, res) => {
      try {
        const { walletAddress } = req.params;

        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid wallet address format'
          });
        }

        const securityAction = this.securityActions.get(walletAddress);
        const isBlocked = this.blockedWallets.has(walletAddress);
        const restrictions = this.restrictedWallets.get(walletAddress);

        // Check if restrictions have expired
        if (restrictions && restrictions.expiresAt && new Date() > new Date(restrictions.expiresAt)) {
          this.restrictedWallets.delete(walletAddress);
          this.securityActions.delete(walletAddress);
        }

        res.json({
          success: true,
          walletAddress,
          isBlocked,
          isRestricted: !!restrictions,
          restrictions: restrictions?.restrictions || [],
          securityAction: securityAction || null,
          status: isBlocked ? 'blocked' : restrictions ? 'restricted' : 'normal'
        });

      } catch (error) {
        console.error('Security status check error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to check security status'
        });
      }
    });

    // Remove security action (unblock/unrestrict)
    this.app.delete('/security/enforce/:walletAddress', (req, res) => {
      try {
        const { walletAddress } = req.params;
        const { reason } = req.body;

        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid wallet address format'
          });
        }

        const hadAction = this.securityActions.has(walletAddress);
        
        // Remove all security measures
        this.securityActions.delete(walletAddress);
        this.blockedWallets.delete(walletAddress);
        this.restrictedWallets.delete(walletAddress);

        console.log(`✅ Security action removed for wallet: ${walletAddress} - ${reason || 'Manual removal'}`);

        res.json({
          success: true,
          message: hadAction 
            ? `Security measures removed for wallet ${walletAddress}` 
            : `No security measures found for wallet ${walletAddress}`,
          walletAddress
        });

      } catch (error) {
        console.error('Security removal error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to remove security action'
        });
      }
    });

    // List all security actions
    this.app.get('/security/actions', (req, res) => {
      try {
        const actions = Array.from(this.securityActions.entries()).map(([address, action]) => ({
          walletAddress: address,
          ...action
        }));

        res.json({
          success: true,
          totalActions: actions.length,
          blockedWallets: Array.from(this.blockedWallets),
          restrictedWallets: Array.from(this.restrictedWallets.keys()),
          actions
        });

      } catch (error) {
        console.error('Security actions list error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve security actions'
        });
      }
    });
  }

  /**
   * Check if a wallet is allowed to perform a transaction
   */
  isWalletAllowed(walletAddress, transactionAmount = 0) {
    // Check if wallet is blocked
    if (this.blockedWallets.has(walletAddress)) {
      return {
        allowed: false,
        reason: 'Wallet is blocked due to security concerns'
      };
    }

    // Check restrictions
    const restrictions = this.restrictedWallets.get(walletAddress);
    if (restrictions) {
      // Check if restrictions have expired
      if (restrictions.expiresAt && new Date() > new Date(restrictions.expiresAt)) {
        this.restrictedWallets.delete(walletAddress);
        this.securityActions.delete(walletAddress);
        return { allowed: true };
      }

      // Apply transaction limits (simplified example)
      if (transactionAmount > 1) { // 1 TOPAY limit for restricted wallets
        return {
          allowed: false,
          reason: 'Transaction amount exceeds limit for restricted wallet'
        };
      }
    }

    return { allowed: true };
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