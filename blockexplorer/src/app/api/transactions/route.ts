import { NextRequest, NextResponse } from 'next/server';
import BlockchainClient from '@/lib/blockchain';

const blockchain = new BlockchainClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('hash');

    if (!txHash) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    const transaction = await blockchain.getTransaction(txHash);

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction data' },
      { status: 500 }
    );
  }
}