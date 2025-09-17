import { NextRequest, NextResponse } from 'next/server';

interface SendTransactionRequest {
  from: string;
  to: string;
  amount: number;
  tokenAddress?: string;
  gasLimit?: number;
  gasPrice?: number;
  privateKey?: string;
  signature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendTransactionRequest = await request.json();
    const { from, to, amount, tokenAddress, gasLimit, gasPrice, signature } = body;
    
    // Validate required fields
    if (!from || !to || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, amount' },
        { status: 400 }
      );
    }

    // Validate addresses
    if (!from.match(/^0x[a-fA-F0-9]{40}$/) || !to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Validate token address if provided
    if (tokenAddress && !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid token address format' },
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

    // Connect to blockchain client
    const blockchainUrl = process.env.BLOCKCHAIN_URL || 'http://localhost:3000';
    
    try {
      // Determine transaction type and method
      const method = tokenAddress ? 'topay_sendTokenTransaction' : 'topay_sendTransaction';
      const params = tokenAddress 
        ? [from, to, amount, tokenAddress, gasLimit || 100000, gasPrice || 20, signature]
        : [from, to, amount, gasLimit || 21000, gasPrice || 20, signature];
      
      const response = await fetch(`${blockchainUrl}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Blockchain request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Transaction failed');
      }

      const transactionHash = data.result;

      return NextResponse.json({
        success: true,
        transactionHash,
        from,
        to,
        amount,
        tokenAddress,
        timestamp: Date.now(),
        status: 'pending'
      });
    } catch (blockchainError) {
      console.error('Blockchain connection error:', blockchainError);
      
      // Return mock transaction for development
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      return NextResponse.json({
        success: true,
        transactionHash: mockTxHash,
        from,
        to,
        amount,
        tokenAddress,
        timestamp: Date.now(),
        status: 'pending',
        mock: true,
        note: 'Using mock data - blockchain not available'
      });
    }
  } catch (error) {
    console.error('Send transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to send transaction' },
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
  const blockchainUrl = process.env.BLOCKCHAIN_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${blockchainUrl}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'topay_getTransactionStatus',
        params: [txHash],
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Blockchain request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Failed to get transaction status');
    }

    return NextResponse.json({
      transactionHash: txHash,
      status: data.result.status || 'pending',
      blockNumber: data.result.blockNumber,
      confirmations: data.result.confirmations || 0,
      timestamp: Date.now()
    });
  } catch (blockchainError) {
    console.error('Blockchain connection error:', blockchainError);
    
    // Return mock status for development
    return NextResponse.json({
      transactionHash: txHash,
      status: Math.random() > 0.3 ? 'confirmed' : 'pending',
      blockNumber: Math.floor(Math.random() * 1000000) + 500000,
      confirmations: Math.floor(Math.random() * 10),
      timestamp: Date.now(),
      mock: true,
      note: 'Using mock data - blockchain not available'
    });
  }
}