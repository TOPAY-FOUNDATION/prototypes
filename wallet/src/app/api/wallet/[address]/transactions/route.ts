import { NextResponse } from 'next/server.js';
import { blockchainClient } from '../../../../../lib/blockchain-client.js';

export async function GET(
  request: Request,
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
    
    // Get transaction history from main blockchain workspace
    const transactions = await blockchainClient.getTransactionHistory(address);
    
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get transactions from main blockchain workspace',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}