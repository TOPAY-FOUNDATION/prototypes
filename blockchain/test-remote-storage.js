/**
 * Test Remote Storage Functionality
 * Tests the connection between blockchain network and validator nodes
 */

import dotenv from 'dotenv';
import { RemotePersistenceManager } from './src/storage/remote-persistence.js';
import { Blockchain } from './src/blockchain/blockchain.js';

// Load environment variables
dotenv.config();

async function testRemoteStorage() {
    console.log('🧪 Testing Remote Storage System with Validator Codes...');
    console.log('=' .repeat(50));
    
    // Get configuration from environment variables
    const validatorCodes = process.env.VALIDATOR_CODES ? 
        process.env.VALIDATOR_CODES.split(',').map(code => code.trim()) : 
        ['TOPAY-VAL-LOCAL-001', 'TOPAY-VAL-LOCAL-002'];
    
    const primaryValidatorCode = process.env.PRIMARY_VALIDATOR_CODE || validatorCodes[0];
    
    const config = {
        timeout: parseInt(process.env.NETWORK_TIMEOUT) || 10000,
        maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
        retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
        replicationFactor: parseInt(process.env.STORAGE_REPLICATION) || 2,
        enableBackup: process.env.BACKUP_ENABLED === 'true',
        enableReplication: process.env.STORAGE_REPLICATION && parseInt(process.env.STORAGE_REPLICATION) > 1,
        debugMode: process.env.DEBUG_MODE === 'true'
    };

    console.log('📋 Configuration:');
    console.log(`   Validator Codes: ${validatorCodes.join(', ')}`);
    console.log(`   Primary Validator Code: ${primaryValidatorCode}`);
    console.log(`   Network Timeout: ${config.timeout}ms`);
    console.log(`   Max Retries: ${config.maxRetries}`);
    console.log(`   Retry Delay: ${config.retryDelay}ms`);
    console.log(`   Replication Factor: ${config.replicationFactor}`);
    console.log(`   Backup Enabled: ${config.enableBackup}`);
    console.log(`   Replication Enabled: ${config.enableReplication}`);
    console.log(`   Debug Mode: ${config.debugMode}`);
    
    try {
        // Initialize remote persistence manager with validator codes
        const remotePersistence = new RemotePersistenceManager(validatorCodes, config);
        await remotePersistence.initialize();
        
        console.log('✅ Remote persistence manager initialized');
        
        // Test connectivity to validator nodes
        console.log('\n🔍 Testing validator node connectivity...');
        for (const node of validatorNodes) {
            const isConnected = await remotePersistence.testNodeConnectivity(node);
            console.log(`${isConnected ? '✅' : '❌'} ${node}: ${isConnected ? 'Connected' : 'Failed'}`);
        }
        
        // Test validator registry status
        console.log('\n📊 Testing validator registry status...');
        const validatorStatus = remotePersistence.getValidatorStatus();
        console.log('Validator Status:', JSON.stringify(validatorStatus, null, 2));

        // Test blockchain operations
        console.log('\n📦 Testing blockchain operations...');
        
        // Create a test blockchain
        const blockchain = new Blockchain();
        
        // Add some test transactions
        blockchain.createTransaction({ from: 'alice', to: 'bob', amount: 50 });
        blockchain.createTransaction({ from: 'bob', to: 'charlie', amount: 25 });
        
        // Mine a block
        console.log('⛏️ Mining block...');
        blockchain.minePendingTransactions('miner1');
        
        console.log(`📊 Blockchain stats: ${blockchain.chain.length} blocks, ${blockchain.pendingTransactions.length} pending transactions`);
        
        // Save blockchain to remote storage
        console.log('\n💾 Saving blockchain to remote storage...');
        await remotePersistence.saveBlockchain(blockchain);
        
        // Load blockchain from remote storage
        console.log('\n📥 Loading blockchain from remote storage...');
        const loadedData = await remotePersistence.loadBlockchain();
        
        if (loadedData) {
            console.log(`✅ Successfully loaded blockchain with ${loadedData.blocks?.length || 0} blocks`);
        } else {
            console.log('📭 No blockchain data found in remote storage');
        }
        
        // Test storage statistics
        console.log('\n📈 Getting storage statistics...');
        const stats = await remotePersistence.getStorageStats();
        console.log('📊 Storage Statistics:');
        console.log(`   Total Size: ${stats.totalSize} bytes`);
        console.log(`   Files: ${Object.keys(stats.files).length}`);
        console.log(`   Last Modified: ${stats.lastModified || 'N/A'}`);
        
        console.log('\n🎉 Remote storage test completed successfully!');
        
        // Cleanup
        console.log('\n🧹 Cleaning up resources...');
        remotePersistence.destroy();
        
    } catch (error) {
        console.error('❌ Remote storage test failed:', error.message);
        console.error('💡 Make sure the validator service is running on port 8547');
        console.error('💡 Start validator with: npm run start:validator');
    }
}

// Run the test
testRemoteStorage().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});