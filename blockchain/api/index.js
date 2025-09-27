/**
 * Vercel Serverless Function Entry Point
 * TOPAY Foundation Simple Blockchain API
 */

import { SimpleBlockchainRPCServer } from '../src/blockchain-rpc-server.js';

// Create a single instance of the blockchain server
let serverInstance = null;

export default async function handler(req, res) {
  try {
    // Initialize server instance if not exists
    if (!serverInstance) {
      serverInstance = new SimpleBlockchainRPCServer();
      await serverInstance.initialize();
    }

    // Handle the request using the Express app
    return serverInstance.app(req, res);
  } catch (error) {
    console.error('Vercel function error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}