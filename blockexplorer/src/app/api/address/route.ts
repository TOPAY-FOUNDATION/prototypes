import { NextRequest, NextResponse } from 'next/server';
import BlockchainClient from '@/lib/blockchain';

const blockchain = new BlockchainClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const [balance, transactionCount] = await Promise.all([
      blockchain.getAddressBalance(address),
      blockchain.getAddressTransactionCount(address)
    ]);

    return NextResponse.json({
      address: {
        address,
        balance,
        transactionCount
      }
    });
  } catch (error) {
    console.error('Error fetching address data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address data' },
      { status: 500 }
    );
  }
}