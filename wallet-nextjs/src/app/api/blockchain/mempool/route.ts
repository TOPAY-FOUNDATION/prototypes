import { NextResponse } from 'next/server';
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
    
    // Get mempool from main blockchain workspace
    const mempool = await blockchainClient.getMempool();
    
    return NextResponse.json(mempool);
  } catch (error) {
    console.error('Error getting mempool:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get mempool from main blockchain workspace',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}