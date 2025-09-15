import express from 'express';
import cors from 'cors';
import { Blockchain } from './blockchain/blockchain.js';
import { Transaction } from './blockchain/transaction.js';
import { ContractEngine } from './contracts/ContractEngine.js';

/**
 * TOPAY Blockchain RPC Server
 * Provides JSON-RPC 2.0 compatible interface for blockchain interaction
 */
class BlockchainRPCServer {
  constructor(port = process.env.BLOCKCHAIN_PORT || 3001) {
    this.app = express();
    this.port = port;
    this.blockchain = new Blockchain();
    this.contractEngine = new ContractEngine(this.blockchain);
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
          // Standard blockchain RPC methods
          'topay_getBlockNumber',
          'topay_getBalance',
          'topay_getBlock',
          'topay_getBlockByHash',
          'topay_getBlockByNumber',
          'topay_getTransaction',
          'topay_getTransactionByHash',
          'topay_sendTransaction',
          'topay_sendRawTransaction',
          'topay_getMempool',
          'topay_getChainInfo',
          'topay_validateChain',
          'topay_getTransactionHistory',
          'topay_getNetworkStats',
          'topay_getPeerCount',
          'topay_getGasPrice',
          'topay_estimateGas',
          'topay_getTransactionCount',
          'topay_getCode',
          'topay_call',
          // Network and node management
          'topay_syncing',
          // Wallet methods
          'topay_createWallet',
          'topay_getWallet',
          'topay_getWalletBalance',
          'topay_listWallets',
          'topay_fundWallet',
          'topay_getGenesisWallet',
          'topay_exportWallet',
          'topay_importWallet',
          // Smart contract methods
          'topay_deployContract',
          'topay_callContract',
          'topay_getContract',
          'topay_getAllContracts',
          'topay_getContractsByType',
          'topay_getContractsByDeployer',
          // Development and testing methods
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
        import('fs').then(fs => {
          const rpcLogData = `\n[${new Date().toISOString()}] RPC topay_sendTransaction: ${JSON.stringify(params)}`;
          fs.appendFileSync('C:\\Users\\RealShahriya\\Desktop\\TOPAY FOUNDATION\\Projects\\topay-prototype\\blockchain\\rpc.log', rpcLogData);
        }).catch(() => {});
        
        console.log('🔍 Received sendTransaction RPC call with params:', params[0]);
        const { from, to, amount, memo, data, signature, publicKey } = params[0] || {};
        if (!from || !to || amount === undefined) {
          console.log('❌ Missing required transaction parameters:', { from, to, amount });
          throw new Error('Missing required transaction parameters');
        }
        
        // Use data field if provided, otherwise fall back to memo
        const transactionData = data || memo;
        console.log('🔍 Creating transaction with:', {
          from,
          to,
          amount,
          transactionData,
          signature,
          publicKey
        });
        const transaction = new Transaction(from, to, amount, transactionData);
        if (signature) {
          transaction.signature = signature;
        } else {
          // Auto-sign transaction for testing purposes
          await transaction.signTransaction('dummy_private_key');
        }
        if (publicKey) transaction.publicKey = publicKey;
        
        await this.blockchain.addTransaction(transaction);
        // No central persistence - miners handle their own data storage
        

        
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





      case 'topay_getChainInfo':
        const totalTransactions = this.blockchain.chain.reduce(
          (sum, block) => sum + block.transactions.length, 0
        );
        
        return {
          blockCount: this.blockchain.chain.length,
          totalTransactions,
          mempoolSize: this.blockchain.mempool.length,
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
          averageBlockTime: this.calculateAverageBlockTime()
        };

      case 'topay_addTestData':
        return await this.addTestData();

      case 'topay_getBlockByHash':
        const blockHash = params[0];
        if (!blockHash) throw new Error('Block hash required');
        
        const blockByHash = this.blockchain.getBlockByHash(blockHash);
        if (!blockByHash) throw new Error('Block not found');
        
        return {
          index: blockByHash.index,
          hash: blockByHash.hash,
          previousHash: blockByHash.previousHash,
          timestamp: blockByHash.timestamp,
          transactions: blockByHash.transactions.map(tx => tx.toJSON()),
          difficulty: blockByHash.difficulty,
          nonce: blockByHash.nonce,
          merkleRoot: blockByHash.merkleRoot
        };

      case 'topay_getBlockByNumber':
        const blockNumber = params[0];
        if (blockNumber === undefined) throw new Error('Block number required');
        
        const blockByNumber = this.blockchain.getBlock(blockNumber);
        if (!blockByNumber) throw new Error('Block not found');
        
        return {
          index: blockByNumber.index,
          hash: blockByNumber.hash,
          previousHash: blockByNumber.previousHash,
          timestamp: blockByNumber.timestamp,
          transactions: blockByNumber.transactions.map(tx => tx.toJSON()),
          difficulty: blockByNumber.difficulty,
          nonce: blockByNumber.nonce,
          merkleRoot: blockByNumber.merkleRoot
        };

      case 'topay_getTransactionByHash':
        return await this.handleRPCMethod('topay_getTransaction', params);

      case 'topay_sendRawTransaction':
        const rawTx = params[0];
        if (!rawTx) throw new Error('Raw transaction data required');
        
        // Parse raw transaction (simplified for demo)
        try {
          const txData = JSON.parse(rawTx);
          return await this.handleRPCMethod('topay_sendTransaction', [txData]);
        } catch (error) {
          throw new Error('Invalid raw transaction format');
        }

      case 'topay_getPeerCount':
        return this.blockchain.networkNodes.size;

      case 'topay_getGasPrice':
        // Return a fixed gas price for now (in wei equivalent)
        return '0x3b9aca00'; // 1 Gwei in hex

      case 'topay_estimateGas':
        // Return estimated gas for transaction
        return '0x5208'; // 21000 gas in hex (standard transfer)

      case 'topay_getTransactionCount':
        const accountAddress = params[0];
        if (!accountAddress) throw new Error('Address required');
        
        // Count transactions from this address
        let txCount = 0;
        for (const block of this.blockchain.chain) {
          for (const tx of block.transactions) {
            if (tx.from === accountAddress) txCount++;
          }
        }
        
        // Add pending transactions
        for (const tx of this.blockchain.mempool) {
          if (tx.from === accountAddress) txCount++;
        }
        
        return `0x${txCount.toString(16)}`;

      case 'topay_getCode':
        // Return empty code for now (no smart contracts yet)
        return '0x';

      case 'topay_call':
        // Simulate contract call (return empty for now)
        return '0x';

      case 'topay_syncing':
        // Return syncing status
        return {
          syncing: false,
          currentBlock: this.blockchain.chain.length - 1,
          highestBlock: this.blockchain.chain.length - 1,
          startingBlock: 0
        };



      case 'topay_resetChain':
        this.blockchain = new Blockchain();
        // No central persistence - miners handle their own data storage
        return {
          message: 'Blockchain reset successfully',
          blocks: this.blockchain.chain.length
        };



      // Wallet RPC Methods
      case 'topay_createWallet':
        const walletOptions = params[0] || {};
        const newWallet = await this.blockchain.createWallet(walletOptions);
        return {
          address: newWallet.address,
          publicKey: newWallet.publicKey,
          label: newWallet.metadata.label,
          isGenesis: newWallet.isGenesis,
          createdAt: newWallet.createdAt,
          message: 'Wallet created successfully'
        };

      case 'topay_getWallet':
        const walletAddress = params[0];
        if (!walletAddress) throw new Error('Wallet address required');
        
        const wallet = this.blockchain.getWallet(walletAddress);
        if (!wallet) throw new Error('Wallet not found');
        
        return {
          address: wallet.address,
          publicKey: wallet.publicKey,
          label: wallet.metadata.label,
          isGenesis: wallet.isGenesis,
          balance: wallet.getBalance(this.blockchain),
          createdAt: wallet.createdAt,
          lastUsed: wallet.metadata.lastUsed
        };

      case 'topay_getWalletBalance':
        const balanceAddress = params[0];
        if (!balanceAddress) throw new Error('Wallet address required');
        
        const balanceWallet = this.blockchain.getWallet(balanceAddress);
        if (!balanceWallet) {
          // Return 0 balance for unknown addresses
          return {
            address: balanceAddress,
            balance: 0,
            found: false
          };
        }
        
        return {
          address: balanceAddress,
          balance: balanceWallet.getBalance(this.blockchain),
          found: true
        };

      case 'topay_listWallets':
        const walletManager = this.blockchain.getWalletManager();
        const allWallets = walletManager.listWallets();
        const walletBalances = walletManager.getWalletBalances(this.blockchain);
        
        return {
          wallets: allWallets.map(w => ({
            address: w.address,
            label: w.metadata.label,
            isGenesis: w.isGenesis,
            balance: walletBalances[w.address]?.balance || 0,
            createdAt: w.createdAt
          })),
          count: allWallets.length
        };

      case 'topay_fundWallet':
        const { targetAddress, amount: fundAmount } = params[0] || {};
        if (!targetAddress || !fundAmount) {
          throw new Error('Target address and amount required');
        }
        
        const fundingTx = await this.blockchain.fundWalletFromGenesis(targetAddress, fundAmount);
        await this.blockchain.addTransaction(fundingTx);
        
        return {
          transactionHash: fundingTx.hash,
          from: fundingTx.from,
          to: fundingTx.to,
          amount: fundingTx.amount,
          status: 'pending',
          message: 'Wallet funded successfully'
        };

      case 'topay_getGenesisWallet':
        const genesisWallet = this.blockchain.getGenesisWallet();
        if (!genesisWallet) throw new Error('Genesis wallet not found');
        
        return {
          address: genesisWallet.address,
          publicKey: genesisWallet.publicKey,
          label: genesisWallet.metadata.label,
          balance: genesisWallet.getBalance(this.blockchain),
          isGenesis: true,
          createdAt: genesisWallet.createdAt
        };

      case 'topay_exportWallet':
        const exportAddress = params[0];
        const includePrivateKey = params[1] || false;
        
        if (!exportAddress) throw new Error('Wallet address required');
        
        const exportWallet = this.blockchain.getWallet(exportAddress);
        if (!exportWallet) throw new Error('Wallet not found');
        
        return exportWallet.exportWallet(includePrivateKey);

      case 'topay_importWallet':
        const walletData = params[0];
        if (!walletData) throw new Error('Wallet data required');
        
        const walletManager2 = this.blockchain.getWalletManager();
        const importedWallet = await walletManager2.importWallet(walletData);
        
        return {
          address: importedWallet.address,
          label: importedWallet.metadata.label,
          isGenesis: importedWallet.isGenesis,
          message: 'Wallet imported successfully'
        };

      case 'topay_deployContract':
        const { contractType, constructorArgs, deployer, gasLimit } = params[0] || {};
        if (!contractType || !deployer) {
          throw new Error('Contract type and deployer address required');
        }
        
        const deployResult = await this.contractEngine.deployContract(
          contractType,
          constructorArgs || [],
          deployer,
          gasLimit || 100000
        );
        
        if (!deployResult.success) {
          throw new Error(deployResult.error);
        }
        
        return {
          contractAddress: deployResult.contractAddress,
          transactionHash: deployResult.transactionHash,
          gasUsed: deployResult.gasUsed,
          contractInfo: deployResult.contractInfo,
          status: 'deployed'
        };

      case 'topay_callContract':
        const { contractAddress, functionName, args, caller, gasLimit: callGasLimit } = params[0] || {};
        console.log(`🔧 RPC topay_callContract: ${functionName} on ${contractAddress}`);
        console.log(`📋 RPC Args: [${(args || []).join(', ')}], Caller: ${caller}`);
        
        if (!contractAddress || !functionName) {
          throw new Error('Contract address and function name required');
        }
        
        const callResult = await this.contractEngine.callContract(
          contractAddress,
          functionName,
          args || [],
          caller || 'anonymous',
          callGasLimit || 21000
        );
        
        console.log(`✅ RPC Contract call result:`, callResult);
        
        if (!callResult.success) {
          throw new Error(callResult.error);
        }
        
        return {
          result: callResult.result,
          gasUsed: callResult.gasUsed,
          transactionHash: callResult.transactionHash,
          status: 'success'
        };

      case 'topay_getContract':
        const contractAddr = params[0];
        if (!contractAddr) throw new Error('Contract address required');
        
        const contract = this.contractEngine.getContract(contractAddr);
        if (!contract) throw new Error('Contract not found');
        
        return contract;

      case 'topay_getAllContracts':
        return this.contractEngine.getAllContracts();

      case 'topay_getContractsByType':
        const type = params[0];
        if (!type) throw new Error('Contract type required');
        
        return this.contractEngine.getContractsByType(type);

      case 'topay_getContractsByDeployer':
        const deployerAddr = params[0];
        if (!deployerAddr) throw new Error('Deployer address required');
        
        return this.contractEngine.getContractsByDeployer(deployerAddr);

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
    
    // No central persistence - miners handle their own data storage
    
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



  async initialize() {
    console.log('🚀 Initializing TOPAY Blockchain RPC Server...');
    
    // Create fresh blockchain instance
    console.log('🆕 Creating new blockchain instance...');
    this.blockchain = new Blockchain();
    console.log(`✅ Blockchain initialized: ${this.blockchain.chain.length} blocks`);
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