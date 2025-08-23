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
      
      // Get the latest block first
      const latestBlock = await blockchain.getLatestBlock();
      
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
          const blockNum = latestBlockNumber - i;
          const block = await blockchain.getBlockByNumber(blockNum);
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