/**
 * Example Environment Configuration Script
 * Demonstrates how to use environment variables for dynamic URL configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 TOPAY Environment Configuration Example');
console.log('=' .repeat(50));

// Display current environment configuration
console.log('\n📋 Current Environment Variables:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`   VALIDATOR_NODES: ${process.env.VALIDATOR_NODES || 'Not set'}`);
console.log(`   PRIMARY_VALIDATOR: ${process.env.PRIMARY_VALIDATOR || 'Not set'}`);
console.log(`   ENABLE_REMOTE_STORAGE: ${process.env.ENABLE_REMOTE_STORAGE || 'Not set'}`);
console.log(`   BLOCKCHAIN_PORT: ${process.env.BLOCKCHAIN_PORT || 'Not set'}`);
console.log(`   NETWORK_TIMEOUT: ${process.env.NETWORK_TIMEOUT || 'Not set'}`);
console.log(`   DEBUG_MODE: ${process.env.DEBUG_MODE || 'Not set'}`);

// Parse validator nodes
let validatorNodes = [];
if (process.env.VALIDATOR_NODES) {
    validatorNodes = process.env.VALIDATOR_NODES.split(',').map(url => url.trim());
    console.log('\n🔗 Parsed Validator Nodes:');
    validatorNodes.forEach((node, index) => {
        console.log(`   ${index + 1}. ${node}`);
    });
} else {
    console.log('\n⚠️  No VALIDATOR_NODES configured, using default: http://localhost:8547');
    validatorNodes = ['http://localhost:8547'];
}

// Configuration object
const config = {
    nodeId: process.env.NODE_ID || 'TOPAY-NODE-DEFAULT',
    blockchainPort: parseInt(process.env.BLOCKCHAIN_PORT) || 3001,
    validatorNodes: validatorNodes,
    primaryValidator: process.env.PRIMARY_VALIDATOR || validatorNodes[0],
    enableRemoteStorage: process.env.ENABLE_REMOTE_STORAGE !== 'false',
    networkTimeout: parseInt(process.env.NETWORK_TIMEOUT) || 5000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
    storageReplication: process.env.STORAGE_REPLICATION !== 'false',
    backupEnabled: process.env.BACKUP_ENABLED !== 'false',
    debugMode: process.env.DEBUG_MODE === 'true',
    logLevel: process.env.LOG_LEVEL || 'info'
};

console.log('\n⚙️  Resolved Configuration:');
console.log(JSON.stringify(config, null, 2));

// Example usage scenarios
console.log('\n📝 Example Usage Scenarios:');
console.log('1. Development (single validator):');
console.log('   VALIDATOR_NODES=http://localhost:8547');
console.log('   ENABLE_REMOTE_STORAGE=true');
console.log('   DEBUG_MODE=true');

console.log('\n2. Production (multiple validators):');
console.log('   VALIDATOR_NODES=http://validator1.topay.network:8547,http://validator2.topay.network:8547');
console.log('   PRIMARY_VALIDATOR=http://validator1.topay.network:8547');
console.log('   STORAGE_REPLICATION=true');
console.log('   BACKUP_ENABLED=true');

console.log('\n3. Testing (local setup):');
console.log('   VALIDATOR_NODES=http://localhost:8547,http://localhost:8548');
console.log('   NETWORK_TIMEOUT=10000');
console.log('   MAX_RETRIES=5');

console.log('\n✅ Environment configuration example completed!');
console.log('💡 Tip: Copy the .env.example file and customize it for your environment.');