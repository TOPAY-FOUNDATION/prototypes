#!/usr/bin/env node

import { BlockchainRPCServer } from './src/blockchain-rpc-server.js';
import { runTests, interactiveDemo } from './src/rpc-test.js';

/**
 * TOPAY Blockchain RPC Launcher
 * Easy way to start the RPC server and run tests
 */

const args = process.argv.slice(2);
const command = args[0] || 'server';

async function main() {
  console.log('🚀 TOPAY Blockchain RPC Launcher\n');

  switch (command) {
    case 'server':
    case 'start':
      console.log('Starting RPC Server...');
      const port = args[1] ? parseInt(args[1]) : 8545;
      const server = new BlockchainRPCServer(port);
      await server.start();
      break;

    case 'test':
      console.log('Running RPC Tests...');
      // Wait a bit for server to be ready if it was just started
      await new Promise(resolve => setTimeout(resolve, 2000));
      await runTests();
      break;

    case 'demo':
      console.log('Running Interactive Demo...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await interactiveDemo();
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log('TOPAY Blockchain RPC Commands:');
      console.log('');
      console.log('  npm run rpc:server [port]  - Start RPC server (default port: 8545)');
      console.log('  npm run rpc:test          - Run RPC test suite');
      console.log('  npm run rpc:demo          - Run interactive demo');
      console.log('  npm run rpc:help          - Show this help');
      console.log('');
      console.log('Examples:');
      console.log('  npm run rpc:server        - Start server on port 8545');
      console.log('  npm run rpc:server 9000   - Start server on port 9000');
      console.log('  npm run rpc:test          - Test the RPC endpoints');
      console.log('  npm run rpc:demo          - Run blockchain demo');
      console.log('');
      console.log('RPC URL: http://localhost:8545/rpc');
      console.log('Health Check: http://localhost:8545/health');
      console.log('Available Methods: http://localhost:8545/api/rpc/methods');
      break;

    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('Run "npm run rpc:help" for available commands');
      process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});