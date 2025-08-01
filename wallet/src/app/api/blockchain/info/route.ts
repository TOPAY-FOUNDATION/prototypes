import { NextResponse } from 'next/server.js';
import { blockchainClient } from '../../../../lib/blockchain-client.js';

export async function GET() {
  try {
    // Check if main blockchain server is running
    const isServerRunning = await blockchainClient.isServerRunning();
    
    if (!isServerRunning) {
      return NextResponse.json(
        { 
          error: 'Main blockchain server is not running. Please start the blockchain workspace.',
          suggestion: 'Run: node src/blockchain-rpc-server.js in the main project directory'
        },
        { status: 503 }
      );
    }

    // Get blockchain info from main workspace
    const chainInfo = await blockchainClient.getChainInfo();
    const mempool = await blockchainClient.getMempool();
    
    const info = {
      blockCount: chainInfo.blockCount,
      height: chainInfo.height,
      difficulty: chainInfo.difficulty,
      latestBlock: chainInfo.latestBlock,
      mempoolSize: mempool.count,
      totalTransactions: chainInfo.totalTransactions,
      networkNodes: chainInfo.networkNodes || 1,
      isConnectedToWorkspace: true
    };

    return NextResponse.json(info);
  } catch (error) {
    console.error('Error getting blockchain info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to main blockchain workspace',
        details: (error as Error).message,
        isConnectedToWorkspace: false
      },
      { status: 500 }
    );
  }
}