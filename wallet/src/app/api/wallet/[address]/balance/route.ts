import { NextRequest, NextResponse } from 'next/server.js';
import BlockchainClient from '../../../../../lib/blockchain-client.js';

const blockchainClient = new BlockchainClient('http://localhost:8545');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    // Check if main blockchain server is running
    const isServerRunning = await blockchainClient.isServerRunning();
    
    if (!isServerRunning) {
      return NextResponse.json(
        { 
          error: 'Can not connect to mainnet',
          suggestion: 'Run: node src/blockchain-rpc-server.js in the main project directory'
        },
        { status: 503 }
      );
    }
    
    // Get balance from main workspace
    const balance = await blockchainClient.getBalance(address);
    
    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error getting balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get balance from main blockchain workspace',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}