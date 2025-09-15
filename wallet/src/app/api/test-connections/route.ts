import { NextResponse } from 'next/server';
import BlockchainClient from '../../../lib/blockchain-client.js';

const blockchainClient = new BlockchainClient('http://localhost:3001');

/**
 * Test API endpoint to verify connections between wallet, blockchain, and validator
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    wallet: {
      status: 'running',
      port: 3000,
      url: 'http://localhost:3000'
    },
    blockchain: {
      status: 'unknown' as 'unknown' | 'running' | 'stopped' | 'error',
      port: 3001,
      url: 'http://localhost:3001',
      connected: false,
      blockCount: 0,
      error: null as string | null
    },
    validator: {
      status: 'unknown' as 'unknown' | 'running' | 'error',
      port: 8547,
      url: 'http://localhost:8547',
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
      results.blockchain.blockCount = chainInfo.blockCount || 0;
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
    const validatorResponse = await fetch('http://localhost:8547/api/status', {
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
      const networkStats = await blockchainClient.rpcCall('topay_getNetworkStats');
      if (networkStats && networkStats.validators) {
        results.connections.blockchainToValidator = networkStats.validators.active > 0;
      }
    } catch (error) {
      console.log('Could not get validator stats from blockchain:', (error as Error).message);
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