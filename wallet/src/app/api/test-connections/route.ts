import { NextResponse } from 'next/server';
import BlockchainClient from '../../../lib/blockchain-client.js';

const blockchainClient = new BlockchainClient(process.env.BLOCKCHAIN_URL || 'http://localhost:3000');

/**
 * Test API endpoint to verify connections between wallet, blockchain, and validator
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    wallet: {
      status: 'running',
      port: parseInt(process.env.NEXT_PUBLIC_WALLET_URL?.split(':')[2] || '3001'),
      url: process.env.NEXT_PUBLIC_WALLET_URL || 'http://localhost:3001'
    },
    blockchain: {
      status: 'unknown' as 'unknown' | 'running' | 'stopped' | 'error',
      port: parseInt(process.env.BLOCKCHAIN_URL?.split(':')[2] || '3000'),
      url: process.env.BLOCKCHAIN_URL || 'http://localhost:3000',
      connected: false,
      blockCount: 0,
      error: null as string | null
    },
    validator: {
      status: 'unknown' as 'unknown' | 'running' | 'error',
      port: parseInt(process.env.VALIDATOR_URL?.split(':')[2] || '8547'),
      url: process.env.VALIDATOR_URL || 'http://localhost:8547',
      connected: false,
      error: null as string | null
    },
    connections: {
      walletToBlockchain: false,
      blockchainToValidator: false,
      allConnected: false
    }
  };

  // Test blockchain connection
  try {
    const isBlockchainRunning = await blockchainClient.isServerRunning();
    if (isBlockchainRunning) {
      results.blockchain.status = 'running';
      results.blockchain.connected = true;
      results.connections.walletToBlockchain = true;
      
      // Get blockchain info
      const chainInfo = await blockchainClient.getChainInfo();
      results.blockchain.blockCount = chainInfo.blockHeight || 0;
    } else {
      results.blockchain.status = 'stopped';
      results.blockchain.error = 'Blockchain server not responding';
    }
  } catch (error) {
    results.blockchain.status = 'error';
    results.blockchain.error = (error as Error).message;
  }

  // Test validator connection
  try {
    const validatorResponse = await fetch(`${process.env.VALIDATOR_URL || 'http://localhost:8547'}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (validatorResponse.ok) {
      results.validator.status = 'running';
      results.validator.connected = true;
    } else {
      results.validator.status = 'error';
      results.validator.error = `HTTP ${validatorResponse.status}`;
    }
  } catch (error) {
    results.validator.status = 'error';
    results.validator.error = (error as Error).message;
  }

  // Test blockchain-validator connection
  if (results.blockchain.connected) {
    try {
      // Try to get blockchain info to test connection
      const blockchainInfo = await blockchainClient.getBlockchainInfo();
      if (blockchainInfo && blockchainInfo.chainValid !== false) {
        results.connections.blockchainToValidator = true;
      }
    } catch (error) {
      console.log('Could not get blockchain info for validator test:', (error as Error).message);
    }
  }

  // Overall connection status
  results.connections.allConnected = 
    results.connections.walletToBlockchain && 
    results.validator.connected;

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}