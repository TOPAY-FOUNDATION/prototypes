import { NextRequest, NextResponse } from 'next/server.js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001/rpc';
    
    // Get wallet balance using blockchain RPC
    const requestBody = {
      jsonrpc: '2.0',
      method: 'topay_getBalance',
      params: [address],
      id: 1
    };
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to blockchain',
          suggestion: 'Make sure the blockchain server is running on port 3001'
        },
        { status: 503 }
      );
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return NextResponse.json({
      address: result.result.address,
      balance: result.result.balance,
      found: result.result.found
    });
    
  } catch (error) {
    console.error('Error getting balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get wallet balance',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}