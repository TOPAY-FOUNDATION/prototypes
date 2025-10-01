import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001';
    
    console.log('🔗 Creating wallet on blockchain via RPC:', rpcUrl);
    
    const response = await fetch(`${rpcUrl}/topay/wallet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        label: `Wallet ${Date.now().toString().slice(-4)}`
      })
    });

    if (!response.ok) {
      throw new Error(`Blockchain RPC error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.address) {
      throw new Error('No address returned from blockchain');
    }

    return NextResponse.json({
      success: true,
      address: data.address,
      message: 'Wallet created successfully'
    });

  } catch (error) {
    console.error('❌ Wallet creation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}