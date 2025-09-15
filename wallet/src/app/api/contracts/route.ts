import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../../lib/config.js';

/**
 * GET /api/contracts - Get all deployed contracts
 */
export async function GET() {
  try {
    const rpcUrl = config.blockchain.rpcUrl;
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'topay_getAllContracts',
        params: [],
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC Error');
    }

    return NextResponse.json({
      success: true,
      contracts: data.result || []
    });
  } catch (error) {
    console.error('❌ Failed to get contracts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        contracts: []
      },
      { status: 500 }
    );
  }
}