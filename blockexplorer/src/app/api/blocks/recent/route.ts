import { NextResponse } from 'next/server';
import { BlockchainClient } from '@/lib/blockchain';

const client = new BlockchainClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const maxLimit = Math.min(limit, 20); // Cap at 20 blocks

    // Get the latest block first
    const latestBlock = await client.getLatestBlock();
    
    if (!latestBlock) {
      return NextResponse.json(
        { error: 'No blocks found' },
        { status: 404 }
      );
    }

    const blocks = [latestBlock];
    const latestBlockNumber = latestBlock.number;

    // Fetch previous blocks
    for (let i = 1; i < maxLimit && (latestBlockNumber - i) >= 0; i++) {
      try {
        const blockNumber = latestBlockNumber - i;
        const block = await client.getBlockByNumber(blockNumber);
        if (block) {
          blocks.push(block);
        }
      } catch (error) {
        console.error(`Error fetching block ${latestBlockNumber - i}:`, error);
        // Continue with other blocks even if one fails
      }
    }

    return NextResponse.json({
      blocks,
      total: blocks.length,
      latestBlock: latestBlockNumber
    });
  } catch (error) {
    console.error('Error fetching recent blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent blocks' },
      { status: 500 }
    );
  }
}