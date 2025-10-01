import { NextRequest, NextResponse } from 'next/server';

interface SendTransactionRequest {
  from: string;
  to: string;
  amount: number;
  tokenId?: string;
}

interface SendTransactionResponse {
  success: boolean;
  message: string;
  transaction: {
    success: boolean;
    message: string;
  };
  block: {
    index: number;
    hash: string;
    timestamp: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SendTransactionRequest = await request.json();
    const { from, to, amount, tokenId } = body;
    
    // Validate required fields
    if (!from || !to || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, amount' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Connect to blockchain RPC server
    const blockchainUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001';
    
    try {
      // Use the new wallet send endpoint
      const response = await fetch(`${blockchainUrl}/topay/wallet/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          amount: parseInt(amount.toString()),
          tokenId: tokenId || undefined // Let the backend use native token if not specified
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json() as SendTransactionResponse;
      
      if (!data.success) {
        throw new Error(data.message || 'Transaction failed');
      }

      return NextResponse.json({
        success: true,
        transactionHash: data.block?.hash || 'unknown',
        from,
        to,
        amount,
        tokenId,
        blockIndex: data.block?.index,
        timestamp: data.block?.timestamp || Date.now(),
        status: 'confirmed',
        message: data.message
      });
    } catch (blockchainError) {
      console.error('Blockchain connection error:', blockchainError);
      
      return NextResponse.json(
        { 
          success: false,
          error: `Transaction failed: ${(blockchainError as Error).message}`,
          suggestion: 'Make sure the blockchain server is running and the wallet has sufficient balance'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Send transaction API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process transaction request' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const txHash = searchParams.get('hash');
  
  if (!txHash) {
    return NextResponse.json(
      { error: 'Transaction hash is required' },
      { status: 400 }
    );
  }

  // Connect to blockchain client
  const blockchainUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001';
  
  try {
    // Search for the transaction in recent blocks
    const response = await fetch(`${blockchainUrl}/topay/search?q=${encodeURIComponent(txHash)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Blockchain request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const transaction = data.results[0];
      return NextResponse.json({
        transactionHash: txHash,
        status: 'confirmed',
        blockNumber: transaction.blockIndex,
        blockHash: transaction.blockHash,
        timestamp: transaction.timestamp,
        found: true
      });
    } else {
      return NextResponse.json({
        transactionHash: txHash,
        status: 'not_found',
        found: false,
        message: 'Transaction not found in blockchain'
      });
    }
  } catch (blockchainError) {
    console.error('Blockchain connection error:', blockchainError);
    
    return NextResponse.json({
      transactionHash: txHash,
      status: 'unknown',
      error: 'Unable to check transaction status',
      message: 'Blockchain server not available'
    });
  }
}