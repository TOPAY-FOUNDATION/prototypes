import { NextResponse } from 'next/server.js';

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

// Create wallet using blockchain RPC
async function createWalletOnBlockchain(options: { label?: string } = {}) {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001';
    
    const requestBody = {
      label: options.label || `Wallet ${Date.now().toString().slice(-4)}`
    };
    
    console.log('🔗 Creating wallet on blockchain:', requestBody);
    
    const response = await fetch(`${rpcUrl}/topay/wallet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      console.log('🔍 Blockchain error response:', result.error);
      throw new Error(`Blockchain error: ${result.error}`);
    }

    console.log(`✅ Wallet created on blockchain with token allocation:`, result);
    return result;
    
  } catch (error) {
    console.error('Failed to create wallet on blockchain:', error);
    throw error;
  }
}

export async function POST() {
  try {
    // Try to create wallet using blockchain RPC first
    try {
      const walletData = await createWalletOnBlockchain({
        label: `Wallet ${Date.now().toString().slice(-4)}`
      });
      
      console.log(`✅ Wallet ${walletData.address} created successfully via blockchain`);
      
      return NextResponse.json({
        address: walletData.address,
        publicKey: walletData.publicKey,
        // Don't return private key for security
        blockchainRegistration: {
          registered: true,
          timestamp: Date.now(),
          transactionHash: walletData.block?.hash || null
        },
        message: walletData.message,
        tokenDistribution: walletData.tokenDistribution || null,
        welcomeTokens: walletData.tokenDistribution ? {
          amount: walletData.tokenDistribution.amount,
          symbol: walletData.tokenDistribution.symbol,
          tokenId: walletData.tokenDistribution.tokenId
        } : null
      });
      
    } catch (blockchainError) {
      console.warn('Blockchain wallet creation failed, using fallback:', blockchainError);
      
      // Fallback to local wallet generation
      let walletData;
      
      try {
        const { Wallet } = await import('../../../../lib/wallet.js');
        const wallet = new Wallet();
        await wallet.generateWallet();
        
        walletData = {
          address: wallet.address,
          privateKey: wallet.privateKey,
          publicKey: wallet.publicKey
        };
      } catch (walletError) {
        console.warn('Main wallet generation failed, using Web Crypto fallback:', walletError);
        walletData = await generateWalletFallback();
      }
      
      return NextResponse.json({
        ...walletData,
        blockchainRegistration: {
          registered: false,
          error: 'Blockchain connection failed',
          timestamp: Date.now()
        }
      });
    }
    
  } catch (error) {
    console.error('Error generating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to generate wallet' },
      { status: 500 }
    );
  }
}