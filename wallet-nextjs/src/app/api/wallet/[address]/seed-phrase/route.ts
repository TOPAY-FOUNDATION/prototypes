import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { privateKey } = await request.json();

    if (!address || !privateKey) {
      return NextResponse.json(
        { error: 'Address and private key are required' },
        { status: 400 }
      );
    }

    // Generate deterministic seed phrase from private key
    const seedPhrase = await generateSeedPhraseFromPrivateKey(privateKey);

    return NextResponse.json({
      seedPhrase,
      address
    });
  } catch (error) {
    console.error('Error generating seed phrase:', error);
    return NextResponse.json(
      { error: 'Failed to generate seed phrase' },
      { status: 500 }
    );
  }
}

/**
 * Generate a deterministic 12-word seed phrase from private key
 */
async function generateSeedPhraseFromPrivateKey(privateKey: number[]): Promise<string[]> {
  // BIP39 word list (first 256 words for simplicity)
  const wordList = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
    'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
    'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'age',
    'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm',
    'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost',
    'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing',
    'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
    'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna',
    'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve',
    'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed',
    'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art',
    'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist',
    'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract',
    'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average',
    'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward',
    'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony',
    'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel',
    'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because',
    'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below',
    'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond',
    'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter',
    'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind',
    'blood', 'blossom', 'blow', 'blue', 'blur', 'blush', 'board', 'boat',
    'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border',
    'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket',
    'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge',
    'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom',
    'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build',
    'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst',
    'bus', 'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin'
  ];

  // Create deterministic hash from private key
  const privateKeyString = privateKey.join(',');
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKeyString);
  
  // Use Web Crypto API to create hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);

  // Generate 12 words deterministically
  const seedPhrase: string[] = [];
  for (let i = 0; i < 12; i++) {
    // Use pairs of bytes to get indices (0-255 range maps to word list)
    const byteIndex = (i * 2) % hashArray.length;
    const wordIndex = hashArray[byteIndex] % wordList.length;
    seedPhrase.push(wordList[wordIndex]);
  }

  return seedPhrase;
}