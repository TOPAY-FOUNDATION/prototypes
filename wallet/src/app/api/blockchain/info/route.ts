import { NextResponse } from 'next/server.js';

export async function GET() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3000/rpc';
    
    // Get blockchain info using RPC calls
    const chainInfoRequest = {
      jsonrpc: '2.0',
      method: 'topay_getChainInfo',
      params: [],
      id: 1
    };
    
    const mempoolRequest = {
      jsonrpc: '2.0',
      method: 'topay_getMempool',
      params: [],
      id: 2
    };
    
    // Make parallel requests
    const [chainResponse, mempoolResponse] = await Promise.all([
      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chainInfoRequest)
      }),
      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mempoolRequest)
      })
    ]);
    
    if (!chainResponse.ok || !mempoolResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to blockchain',
          suggestion: 'Make sure the blockchain server is running on port 3000'
        },
        { status: 503 }
      );
    }
    
    const chainResult = await chainResponse.json();
    const mempoolResult = await mempoolResponse.json();
    
    if (chainResult.error || mempoolResult.error) {
      throw new Error(chainResult.error?.message || mempoolResult.error?.message);
    }
    
    const info = {
      blockCount: chainResult.result.blockCount || 0,
      height: chainResult.result.height || 0,
      difficulty: chainResult.result.difficulty || 1,
      latestBlock: chainResult.result.latestBlock || null,
      mempoolSize: mempoolResult.result.count || 0,
      totalTransactions: chainResult.result.totalTransactions || 0,
      networkNodes: chainResult.result.networkNodes || 1,
      isConnectedToWorkspace: true
    };

    return NextResponse.json(info);
  } catch (error) {
    console.error('Error getting blockchain info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get blockchain information',
        details: (error as Error).message,
        isConnectedToWorkspace: false
      },
      { status: 500 }
    );
  }
}