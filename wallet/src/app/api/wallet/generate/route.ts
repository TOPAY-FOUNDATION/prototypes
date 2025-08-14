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

// Submit wallet registration transaction to blockchain
async function registerWalletOnBlockchain(walletData: {
  address: string;
  publicKey: string;
  privateKey: string;
}) {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545/rpc';
    
    // Create wallet registration transaction
    const registrationTransaction = {
      from: 'SYSTEM', // System transaction
      to: walletData.address,
      amount: 1, // Minimal amount for validation
      data: {
        type: 'WALLET_REGISTRATION',
        publicKey: walletData.publicKey,
        timestamp: Date.now(),
        version: '1.0.0'
      },
      signature: 'system_signature_' + Date.now() // System signature for registration
    };

    // Submit transaction to blockchain
    console.log('🔗 Sending registration transaction:', registrationTransaction);
    const requestBody = {
      jsonrpc: '2.0',
      method: 'topay_sendTransaction',
      params: [registrationTransaction],
      id: 1
    };
    console.log('🔗 Full RPC request:', requestBody);
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🔗 Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      console.log('🔍 Full RPC error response:', result.error);
      const errorMessage = result.error.data || result.error.message;
      throw new Error(`RPC error: ${errorMessage}`);
    }

    console.log(`✅ Wallet ${walletData.address} registered on blockchain`);
    return result.result;
    
  } catch (error) {
    console.error('Failed to register wallet on blockchain:', error);
    // Don't throw error - wallet creation should succeed even if blockchain registration fails
    return null;
  }
}

export async function POST() {
  try {
    let walletData;
    
    // Try to use the main Wallet class first
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
      console.warn('Main wallet generation failed, using fallback:', walletError);
      
      // Use fallback implementation
      walletData = await generateWalletFallback();
    }
    
    // Register wallet on blockchain
    console.log(`🔗 Registering wallet ${walletData.address} on blockchain...`);
    const registrationResult = await registerWalletOnBlockchain(walletData);
    
    // Add registration info to response
    const response = {
      ...walletData,
      blockchainRegistration: {
        registered: registrationResult !== null,
        transactionHash: registrationResult?.hash || null,
        timestamp: Date.now()
      }
    };
    
    if (registrationResult) {
      console.log(`✅ Wallet ${walletData.address} successfully registered on blockchain`);
    } else {
      console.log(`⚠️ Wallet ${walletData.address} created but blockchain registration failed`);
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error generating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to generate wallet' },
      { status: 500 }
    );
  }
}