import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    address: string;
  };
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  totalSupply?: number;
  price?: number;
  priceChange24h?: number;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = params;
    
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
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
          method: 'topay_getTokenBalances',
          params: [address],
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Blockchain request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Blockchain error');
      }

      const tokens = data.result || [];

      return NextResponse.json({
        address,
        tokens,
        timestamp: Date.now()
      });
    } catch (blockchainError) {
      console.error('Blockchain connection error:', blockchainError);
      
      // Return mock tokens for development
      const mockTokens = generateMockTokens();
      
      return NextResponse.json({
        address,
        tokens: mockTokens,
        timestamp: Date.now(),
        mock: true,
        note: 'Using mock data - blockchain not available'
      });
    }
  } catch (error) {
    console.error('Tokens API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = params;
    const body = await request.json();
    const { tokenAddress, action, amount, spender, recipient } = body;
    
    if (!address || !tokenAddress || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Connect to blockchain client
    const blockchainUrl = process.env.BLOCKCHAIN_URL || 'http://localhost:3000';
    
    let method = '';
    let rpcParams = [];
    
    switch (action) {
      case 'transfer':
        method = 'topay_transferToken';
        rpcParams = [address, tokenAddress, recipient, amount];
        break;
      case 'approve':
        method = 'topay_approveToken';
        rpcParams = [address, tokenAddress, spender, amount];
        break;
      case 'allowance':
        method = 'topay_getTokenAllowance';
        rpcParams = [tokenAddress, address, spender];
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    try {
      const response = await fetch(`${blockchainUrl}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params: rpcParams,
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`Blockchain request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Blockchain error');
      }

      return NextResponse.json({
        success: true,
        result: data.result,
        timestamp: Date.now()
      });
    } catch (blockchainError) {
      console.error('Blockchain connection error:', blockchainError);
      
      // Return mock success for development
      return NextResponse.json({
        success: true,
        result: action === 'allowance' ? '1000000000000000000' : `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: Date.now(),
        mock: true,
        note: 'Using mock data - blockchain not available'
      });
    }
  } catch (error) {
    console.error('Token action API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform token action' },
      { status: 500 }
    );
  }
}

function generateMockTokens(): Token[] {
  return [
    {
      address: '0x1234567890123456789012345678901234567890',
      symbol: 'TPY',
      name: 'TOPAY Token',
      decimals: 18,
      balance: Math.random() * 10000,
      totalSupply: 1000000000,
      price: 0.85 + Math.random() * 0.3,
      priceChange24h: (Math.random() - 0.5) * 20
    },
    {
      address: '0x2345678901234567890123456789012345678901',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      balance: Math.random() * 1000,
      totalSupply: 50000000000,
      price: 1.0,
      priceChange24h: (Math.random() - 0.5) * 2
    },
    {
      address: '0x3456789012345678901234567890123456789012',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      balance: Math.random() * 10,
      totalSupply: 7000000,
      price: 2500 + Math.random() * 500,
      priceChange24h: (Math.random() - 0.5) * 10
    }
  ];
}