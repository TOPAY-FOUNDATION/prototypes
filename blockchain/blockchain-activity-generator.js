/**
 * TOPAY Blockchain Activity Generator
 * 
 * This script generates various blockchain activities to test if the miner
 * properly detects, saves, and mines transactions and blocks.
 * 
 * Features:
 * - Creates multiple transactions
 * - Triggers mining operations
 * - Monitors blockchain state
 * - Tests miner responsiveness
 */

import fetch from 'node-fetch';
import { Transaction } from './src/blockchain/transaction.js';

class BlockchainActivityGenerator {
  constructor(rpcUrl = 'http://localhost:8545/rpc') {
    this.rpcUrl = rpcUrl;
    this.requestId = 1;
    this.testAddresses = [
      'TOPAY1234567890abcdef1234567890abcdef12345678',
      'TOPAY2345678901bcdef2345678901bcdef23456789',
      'TOPAY3456789012cdef3456789012cdef34567890',
      'TOPAY4567890123def4567890123def45678901',
      'TOPAY5678901234ef5678901234ef567890123'
    ];
    this.minerAddress = 'TOPAYminer234567890abcdef1234567890abcdef12345678';
  }

  /**
   * Make RPC call to blockchain
   */
  async rpcCall(method, params = []) {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: this.requestId++
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error(`❌ RPC call failed for ${method}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if blockchain RPC server is running
   */
  async checkConnection() {
    try {
      const blockNumber = await this.rpcCall('topay_getBlockNumber');
      console.log(`✅ Connected to blockchain RPC server (Block #${blockNumber})`);
      return true;
    } catch (error) {
      console.error('❌ Cannot connect to blockchain RPC server');
      console.error('   Make sure to start the blockchain server first:');
      console.error('   cd blockchain && npm start');
      return false;
    }
  }

  /**
   * Get current blockchain status
   */
  async getBlockchainStatus() {
    try {
      const chainInfo = await this.rpcCall('topay_getChainInfo');
      const mempool = await this.rpcCall('topay_getMempool');
      
      console.log('\n📊 Current Blockchain Status:');
      console.log(`   Blocks: ${chainInfo.blockCount}`);
      console.log(`   Total Transactions: ${chainInfo.totalTransactions}`);
      console.log(`   Mempool Size: ${mempool.count}`);
      console.log(`   Difficulty: ${chainInfo.difficulty}`);
      console.log(`   Mining Reward: ${chainInfo.miningReward} TOPAY`);
      console.log(`   Chain Valid: ${chainInfo.isValid}`);
      
      return chainInfo;
    } catch (error) {
      console.error('❌ Failed to get blockchain status:', error.message);
      throw error;
    }
  }

  /**
   * Create a random transaction
   */
  async createRandomTransaction() {
    const fromIndex = Math.floor(Math.random() * this.testAddresses.length);
    let toIndex = Math.floor(Math.random() * this.testAddresses.length);
    
    // Ensure from and to are different
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * this.testAddresses.length);
    }
    
    const from = this.testAddresses[fromIndex];
    const to = this.testAddresses[toIndex];
    const amount = Math.floor(Math.random() * 100) + 1; // 1-100 TOPAY
    const memo = `Test transaction ${Date.now()}`;
    
    const txData = {
      from,
      to,
      amount,
      memo
    };
    
    try {
      const result = await this.rpcCall('topay_sendTransaction', [txData]);
      console.log(`💸 Created transaction: ${from.slice(0, 12)}... → ${to.slice(0, 12)}... (${amount} TOPAY)`);
      console.log(`   Hash: ${result.transactionHash}`);
      return result;
    } catch (error) {
      console.error('❌ Failed to create transaction:', error.message);
      throw error;
    }
  }

  /**
   * Create multiple transactions
   */
  async createMultipleTransactions(count = 5) {
    console.log(`\n🔄 Creating ${count} random transactions...`);
    const transactions = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const tx = await this.createRandomTransaction();
        transactions.push(tx);
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to create transaction ${i + 1}:`, error.message);
      }
    }
    
    console.log(`✅ Created ${transactions.length} transactions`);
    return transactions;
  }

  /**
   * Trigger mining operation
   */
  async triggerMining() {
    try {
      console.log('\n⛏️  Triggering mining operation...');
      const result = await this.rpcCall('topay_mine', [this.minerAddress]);
      
      console.log('✅ Block mined successfully!');
      console.log(`   Block Index: ${result.blockIndex}`);
      console.log(`   Block Hash: ${result.blockHash}`);
      console.log(`   Transactions: ${result.transactions}`);
      console.log(`   Mining Reward: ${result.reward} TOPAY`);
      console.log(`   Difficulty: ${result.difficulty}`);
      
      return result;
    } catch (error) {
      console.error('❌ Mining failed:', error.message);
      throw error;
    }
  }

  /**
   * Enable auto-mining
   */
  async enableAutoMining() {
    try {
      console.log('\n🤖 Enabling auto-mining...');
      const result = await this.rpcCall('topay_startAutoMining', [this.minerAddress]);
      console.log('✅ Auto-mining enabled');
      return result;
    } catch (error) {
      console.error('❌ Failed to enable auto-mining:', error.message);
      throw error;
    }
  }

  /**
   * Disable auto-mining
   */
  async disableAutoMining() {
    try {
      console.log('\n🛑 Disabling auto-mining...');
      const result = await this.rpcCall('topay_stopAutoMining');
      console.log('✅ Auto-mining disabled');
      return result;
    } catch (error) {
      console.error('❌ Failed to disable auto-mining:', error.message);
      throw error;
    }
  }

  /**
   * Monitor blockchain activity for a period
   */
  async monitorActivity(durationMs = 30000) {
    console.log(`\n👀 Monitoring blockchain activity for ${durationMs / 1000} seconds...`);
    
    const startTime = Date.now();
    const initialStatus = await this.getBlockchainStatus();
    
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const currentStatus = await this.getBlockchainStatus();
          
          const blocksDiff = currentStatus.blockCount - initialStatus.blockCount;
          const txDiff = currentStatus.totalTransactions - initialStatus.totalTransactions;
          
          if (blocksDiff > 0 || txDiff > 0) {
            console.log(`📈 Activity detected: +${blocksDiff} blocks, +${txDiff} transactions`);
          }
          
          if (Date.now() - startTime >= durationMs) {
            clearInterval(interval);
            console.log('✅ Monitoring completed');
            resolve({
              blocksAdded: blocksDiff,
              transactionsAdded: txDiff,
              finalStatus: currentStatus
            });
          }
        } catch (error) {
          console.error('❌ Monitoring error:', error.message);
        }
      }, 2000); // Check every 2 seconds
    });
  }

  /**
   * Run comprehensive blockchain activity test
   */
  async runActivityTest() {
    console.log('🚀 Starting TOPAY Blockchain Activity Test');
    console.log('=' .repeat(50));
    
    try {
      // 1. Check connection
      const connected = await this.checkConnection();
      if (!connected) {
        throw new Error('Cannot connect to blockchain');
      }
      
      // 2. Get initial status
      console.log('\n📊 Initial blockchain status:');
      const initialStatus = await this.getBlockchainStatus();
      
      // 3. Create transactions
      await this.createMultipleTransactions(3);
      
      // 4. Check mempool
      const mempool = await this.rpcCall('topay_getMempool');
      console.log(`\n📝 Mempool now contains ${mempool.count} pending transactions`);
      
      // 5. Manual mining
      if (mempool.count > 0) {
        await this.triggerMining();
      }
      
      // 6. Enable auto-mining and create more transactions
      await this.enableAutoMining();
      
      console.log('\n🔄 Creating more transactions with auto-mining enabled...');
      await this.createMultipleTransactions(2);
      
      // 7. Monitor activity
      await this.monitorActivity(15000); // Monitor for 15 seconds
      
      // 8. Disable auto-mining
      await this.disableAutoMining();
      
      // 9. Final status
      console.log('\n📊 Final blockchain status:');
      const finalStatus = await this.getBlockchainStatus();
      
      // 10. Summary
      console.log('\n📈 Test Summary:');
      console.log(`   Blocks added: ${finalStatus.blockCount - initialStatus.blockCount}`);
      console.log(`   Transactions added: ${finalStatus.totalTransactions - initialStatus.totalTransactions}`);
      console.log(`   Final mempool size: ${finalStatus.mempoolSize}`);
      
      console.log('\n✅ Blockchain activity test completed successfully!');
      console.log('\n💡 Now check your miner application to see if it detected and processed these activities!');
      
    } catch (error) {
      console.error('\n❌ Activity test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new BlockchainActivityGenerator();
  generator.runActivityTest().catch(console.error);
}

export { BlockchainActivityGenerator };