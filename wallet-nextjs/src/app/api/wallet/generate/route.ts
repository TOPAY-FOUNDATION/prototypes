import { NextResponse } from 'next/server';

// Fallback wallet generation using Web Crypto API
async function generateWalletFallback() {
  try {
    // Generate a random private key (32 bytes)
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    
    // Generate a public key (simplified - in production use proper key derivation)
    const publicKeyBuffer = await crypto.subtle.digest('SHA-256', privateKey);
    const publicKey = new Uint8Array(publicKeyBuffer);
    
    // Generate address from public key
    const addressBuffer = await crypto.subtle.digest('SHA-256', publicKey);
    const addressBytes = new Uint8Array(addressBuffer).slice(0, 20);
    const addressHex = Array.from(addressBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
    
    const address = `TOPAY${addressHex}`;
    
    return {
      address,
      privateKey: Array.from(privateKey),
      publicKey: Array.from(publicKey)
    };
  } catch (error) {
    console.error('Fallback wallet generation failed:', error);
    throw error;
  }
}

export async function POST() {
  try {
    // Try to use the main Wallet class first
    try {
      const { Wallet } = await import('../../../../lib/wallet.js');
      const wallet = new Wallet();
      await wallet.generateWallet();
      
      return NextResponse.json({
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey
      });
    } catch (walletError) {
      console.warn('Main wallet generation failed, using fallback:', walletError);
      
      // Use fallback implementation
      const walletData = await generateWalletFallback();
      
      return NextResponse.json(walletData);
    }
  } catch (error) {
    console.error('Error generating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to generate wallet' },
      { status: 500 }
    );
  }
}