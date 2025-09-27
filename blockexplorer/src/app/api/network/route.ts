import { NextResponse } from 'next/server';
import BlockchainClient from '@/lib/blockchain';

const blockchain = new BlockchainClient();

export async function GET() {
  const timestamp = new Date().toISOString();
  console.log(`[API DEBUG] /api/network called at ${timestamp}`);
  
  try {
    const networkInfo = await blockchain.getNetworkInfo();
    const stats = await blockchain.getBlockchainStats();

    return NextResponse.json({ 
      network: {
        ...networkInfo,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching network info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network information' },
      { status: 500 }
    );
  }
}