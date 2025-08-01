import { NextRequest, NextResponse } from 'next/server.js';

import { Blockchain } from '../../../../lib/blockchain.js';
import { Storage } from '../../../../lib/storage.js';

let blockchain: Blockchain | null = null;
let storage: Storage | null = null;

// Initialize blockchain
const initializeBlockchain = async (): Promise<Blockchain> => {
  if (!blockchain) {
    storage = new Storage();
    
    try {
      // Try to load existing blockchain
      blockchain = await storage.loadBlockchain();
      console.log(`Loaded blockchain with ${blockchain.chain.length} blocks`);
    } catch (error) {
      console.error('Failed to load blockchain:', error);
      // Create new blockchain if loading fails
      blockchain = new Blockchain();
      await storage.saveBlockchain(blockchain);
      console.log('Created new blockchain');
    }
  }
  return blockchain;
};

export async function GET(request: NextRequest) {
  try {
    const bc = await initializeBlockchain();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Define block interface for type safety
    interface Block {
      index: number;
      hash: string;
      previousHash: string;
      timestamp: number;
      transactions: unknown[];
      nonce: number;
      difficulty: number;
    }
    
type BlockData = Block;
    
    // Get blocks in reverse order (latest first)
    const blocks = bc.chain
      .slice()
      .reverse()
      .slice(offset, offset + limit)
      .map((block: Block): BlockData => ({
        index: block.index,
        hash: block.hash,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        transactions: block.transactions,
        nonce: block.nonce,
        difficulty: block.difficulty
      }));
    
    return NextResponse.json({
      blocks,
      total: bc.chain.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting blocks:', error);
    return NextResponse.json(
      { error: 'Failed to get blocks' },
      { status: 500 }
    );
  }
}