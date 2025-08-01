import { NextRequest, NextResponse } from 'next/server.js';

import { Wallet } from '../../../../lib/wallet.js';

// BIP39 word list (first 100 words for validation)
const BIP39_WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'age',
  'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol',
  'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also',
  'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient',
  'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna',
  'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'area',
  'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive'
];

function validateSeedPhrase(seedPhrase: string): boolean {
  const words = seedPhrase.trim().toLowerCase().split(/\s+/);
  
  // Check if it's 12 words
  if (words.length !== 12) {
    return false;
  }
  
  // Check if all words are valid (simplified validation)
  return words.every(word => BIP39_WORDS.includes(word));
}

export async function POST(request: NextRequest) {
  try {
    const { privateKey, seedPhrase } = await request.json();
    
    let wallet;
    
    if (seedPhrase) {
      // Import from seed phrase
      if (!validateSeedPhrase(seedPhrase)) {
        return NextResponse.json(
          { error: 'Invalid seed phrase. Please enter a valid 12-word seed phrase.' },
          { status: 400 }
        );
      }
      
      wallet = new Wallet();
      await wallet.generateFromSeed(seedPhrase);
      
    } else if (privateKey) {
      // Import from private key
      wallet = await Wallet.fromPrivateKey(privateKey);
      
    } else {
      return NextResponse.json(
        { error: 'Either private key or seed phrase is required' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      address: wallet.address,
      publicKey: wallet.publicKey
    });
  } catch (error) {
    console.error('Error importing wallet:', error);
    return NextResponse.json(
      { error: 'Failed to import wallet: ' + (error as Error).message },
      { status: 500 }
    );
  }
}