#!/usr/bin/env node

/**
 * Test script to demonstrate node-specific storage paths
 * This shows how different nodes will use different storage directories
 */

import os from 'os';
import path from 'path';

console.log('🧪 TOPAY Blockchain Storage Path Test');
console.log('=' .repeat(50));

// Simulate the getNodeStoragePath function
function getNodeStoragePath(nodeId, port) {
  // Check for explicit storage path in environment
  const envStoragePath = process.env.STORAGE_PATH;
  if (envStoragePath && envStoragePath.trim()) {
    return path.resolve(envStoragePath.trim());
  }
  
  // Generate node-specific path in user's home directory
  const homeDir = os.homedir();
  const nodeSpecificDir = `TOPAY-Blockchain-${nodeId}-${port}`;
  const defaultPath = path.join(homeDir, 'TOPAY-Blockchain', nodeSpecificDir, 'data');
  
  return defaultPath;
}

// Test different node configurations
const testConfigurations = [
  {
    nodeId: 'TOPAY-NODE-001',
    port: 8545,
    description: 'Default Node 1'
  },
  {
    nodeId: 'TOPAY-NODE-002', 
    port: 8546,
    description: 'Default Node 2'
  },
  {
    nodeId: 'TOPAY-VALIDATOR-001',
    port: 8547,
    description: 'Validator Node'
  }
];

console.log(`🏠 User Home Directory: ${os.homedir()}`);
console.log(`💻 Operating System: ${os.platform()}`);
console.log('');

// Test each configuration
testConfigurations.forEach((config, index) => {
  console.log(`📁 Test ${index + 1}: ${config.description}`);
  console.log(`   Node ID: ${config.nodeId}`);
  console.log(`   Port: ${config.port}`);
  
  const storagePath = getNodeStoragePath(config.nodeId, config.port);
  console.log(`   Storage Path: ${storagePath}`);
  console.log('');
});

// Test with custom storage path
console.log('🔧 Testing Custom Storage Path:');
process.env.STORAGE_PATH = 'C:\\CustomBlockchainData\\MyNode';

const customStoragePath = getNodeStoragePath('TOPAY-CUSTOM-001', 9000);
console.log(`   Custom Storage Path: ${customStoragePath}`);
console.log('');

// Clean up environment
delete process.env.STORAGE_PATH;

console.log('✅ Storage path test completed!');
console.log('');
console.log('📝 Key Benefits:');
console.log('   • Each node gets its own unique storage directory');
console.log('   • Storage paths include node ID and port for uniqueness');
console.log('   • Data is stored in user home directory by default');
console.log('   • Custom storage paths can be configured via STORAGE_PATH env var');
console.log('   • No more shared data conflicts between nodes');
console.log('');
console.log('🔄 Current Issue Fixed:');
console.log(`   • OLD: All nodes shared ${path.resolve('./data')}`);
console.log('   • NEW: Each node has its own directory in user home folder');
console.log('   • This prevents data conflicts and enables true distributed operation');