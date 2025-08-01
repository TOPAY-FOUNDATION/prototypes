import { NextRequest, NextResponse } from 'next/server';
import { blockchainClient } from '../../../../lib/blockchain-client.js';
import { Transaction } from '../../../../lib/transaction.js';

export async function POST(request: NextRequest) {
  try {
    const { from, to, amount, privateKey, data } = await request.json();
    
    // Validate input
    if (!from || !to || !amount || !privateKey) {
      return NextResponse.json(
        { error: 'Missing required fields: from, to, amount, privateKey' },
        { status: 400 }
      );
    }
    
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if main blockchain server is running
    const isServerRunning = await blockchainClient.isServerRunning();
    
    if (!isServerRunning) {
      return NextResponse.json(
        { 
          error: 'Main blockchain server is not running. Please start the blockchain workspace.',
          suggestion: 'Run: node src/blockchain-rpc-server.js in the main project directory'
        },
        { status: 503 }
      );
    }
    
    // Check balance using main blockchain
    const balance = await blockchainClient.getBalance(from);
    if (balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }
    
    // Create and sign transaction
    const transaction = new Transaction(from, to, amount, data);
    await transaction.signTransaction();
    
    // Validate transaction
    const isValid = await transaction.isValid();
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid transaction signature' },
        { status: 400 }
      );
    }
    
    // Send transaction to main blockchain workspace
    const result = await blockchainClient.sendTransaction({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      data: transaction.data,
      signature: transaction.signature,
      hash: transaction.hash,
      timestamp: transaction.timestamp
    });
    
    return NextResponse.json({
      success: true,
      transactionId: transaction.hash,
      message: 'Transaction sent to main blockchain workspace successfully',
      result: result
    });
    
  } catch (error) {
    console.error('Error sending transaction:', error);
    return NextResponse.json(
      { error: 'Failed to send transaction to main blockchain workspace: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

