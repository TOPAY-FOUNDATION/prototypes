import { NextRequest, NextResponse } from 'next/server.js';

interface TokenBalance {
  tokenId: string;
  balance: number;
}

interface WalletResponse {
  address: string;
  tokenBalances: TokenBalance[];
  message: string;
}

interface NativeBalanceResponse {
  address: string;
  balance: number;
  symbol: string;
  tokenInfo: {
    name: string;
    symbol: string;
    totalSupply: number;
    owner: string;
  };
  message: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const blockchainUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001';
    
    // Get native token balance using the new balance endpoint
    const balanceResponse = await fetch(`${blockchainUrl}/topay/wallet/${address}/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!balanceResponse.ok) {
      if (balanceResponse.status === 404) {
        // Wallet not found, return zero balance
        return NextResponse.json({
          address: address,
          balance: 0,
          found: false,
          tokenBalances: []
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Cannot connect to blockchain',
          suggestion: 'Make sure the blockchain server is running on port 3001'
        },
        { status: 503 }
      );
    }

    const nativeBalanceResult = await balanceResponse.json() as NativeBalanceResponse;
    
    // Get all token balances using the wallet info endpoint
    const walletResponse = await fetch(`${blockchainUrl}/topay/wallet/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    let tokenBalances: TokenBalance[] = [];
    if (walletResponse.ok) {
      const walletResult = await walletResponse.json() as WalletResponse;
      tokenBalances = walletResult.tokenBalances || [];
    }
    
    return NextResponse.json({
      address: address,
      balance: nativeBalanceResult.balance || 0,
      symbol: nativeBalanceResult.symbol || 'TPY',
      found: true,
      tokenBalances: tokenBalances,
      nativeTokenInfo: nativeBalanceResult.tokenInfo
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