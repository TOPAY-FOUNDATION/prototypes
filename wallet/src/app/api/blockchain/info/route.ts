import { NextResponse } from 'next/server.js';

export async function GET() {
  try {
    const blockchainUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001';
    
    // Use the new REST endpoints instead of JSON-RPC
    const [statsResponse, blocksResponse] = await Promise.all([
      fetch(`${blockchainUrl}/topay/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${blockchainUrl}/topay/blocks`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    ]);
    
    if (!statsResponse.ok || !blocksResponse.ok) {
      throw new Error('Failed to fetch blockchain info');
    }

    const stats = await statsResponse.json();
    const blocks = await blocksResponse.json();
    
    return NextResponse.json({
      chainInfo: {
        blockHeight: stats.blockHeight || blocks.length || 0,
        difficulty: stats.difficulty || 2,
        totalTransactions: stats.totalTransactions || 0,
        networkHashRate: stats.networkHashRate || '0 H/s',
        lastBlockTime: stats.lastBlockTime || Date.now()
      },
      mempool: {
        size: 0, // Mempool not implemented in current blockchain
        totalFees: 0
      },
      connected: true
    });
    
  } catch (error) {
    console.error('Error getting blockchain info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to blockchain',
        connected: false,
        suggestion: 'Make sure the blockchain server is running on port 3001'
      },
      { status: 503 }
    );
  }
}