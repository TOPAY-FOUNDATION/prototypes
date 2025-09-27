import { NextRequest, NextResponse } from 'next/server';
import BlockchainClient from '@/lib/blockchain';

const blockchain = new BlockchainClient();

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const { searchParams } = new URL(request.url);
  const blockNumber = searchParams.get('number');
  const blockHash = searchParams.get('hash');
  const latest = searchParams.get('latest');
  const limit = searchParams.get('limit');
  
  console.log(`[API DEBUG] /api/blocks called at ${timestamp} with params:`, {
    blockNumber, blockHash, latest, limit
  });
  
  try {

    // Handle multiple recent blocks request
    if (limit) {
      const maxLimit = Math.min(parseInt(limit, 10), 20); // Cap at 20 blocks
      
      const blocks = await blockchain.getBlocks(maxLimit);
      
      if (!blocks || blocks.length === 0) {
        return NextResponse.json(
          { error: 'No blocks found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        blocks,
        total: blocks.length,
        latestBlock: blocks.length > 0 ? blocks[0].index : 0
      });
    }

    // Handle single block requests
    let block;

    if (latest === 'true') {
      block = await blockchain.getLatestBlock();
    } else if (blockNumber) {
      block = await blockchain.getBlockByNumber(parseInt(blockNumber));
    } else if (blockHash) {
      block = await blockchain.getBlockByHash(blockHash);
    } else {
      return NextResponse.json(
        { error: 'Please provide block number, hash, limit, or set latest=true' },
        { status: 400 }
      );
    }

    return NextResponse.json({ block });
  } catch (error) {
    console.error('Error fetching block:', error);
    return NextResponse.json(
      { error: 'Failed to fetch block data' },
      { status: 500 }
    );
  }
}