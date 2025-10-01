import { NextResponse } from 'next/server.js';

interface IncomingTransaction {
  from: string;
  to: string;
  amount: number;
  tokenId: string;
  timestamp: number;
  blockIndex: number;
  blockHash: string;
}

interface ReceiveResponse {
  address: string;
  incomingTransactions: IncomingTransaction[];
  totalReceived: number;
  message: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '20';
    const page = url.searchParams.get('page') || '1';
    
    const blockchainUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001';
    
    // Get incoming transactions using the new receive endpoint
    const receiveResponse = await fetch(`${blockchainUrl}/topay/wallet/${address}/receive?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!receiveResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to blockchain',
          suggestion: 'Make sure the blockchain server is running on port 3001'
        },
        { status: 503 }
      );
    }

    const receiveResult = await receiveResponse.json() as ReceiveResponse;
    
    // Transform the data to match the expected transaction format
    const transactions = receiveResult.incomingTransactions.map((tx: IncomingTransaction) => ({
      hash: `${tx.blockHash}_${tx.from}_${tx.to}`,
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      tokenId: tx.tokenId,
      timestamp: tx.timestamp,
      blockIndex: tx.blockIndex,
      blockHash: tx.blockHash,
      type: 'receive',
      status: 'confirmed'
    }));
    
    // For pagination, we'll slice the results (basic implementation)
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    
    return NextResponse.json({
      transactions: paginatedTransactions,
      count: transactions.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(transactions.length / limitNum),
      address: address,
      hasMore: endIndex < transactions.length
    });
    
  } catch (error) {
    console.error('Error getting transactions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get transaction history',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}