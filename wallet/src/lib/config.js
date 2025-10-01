/**
 * TOPAY Wallet Configuration
 * Configuration for connecting to the main blockchain workspace
 * Uses environment variables for flexible deployment
 */

export const config = {
  // Main blockchain RPC server configuration
  blockchain: {
    rpcUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3002',
    healthUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3002',
    apiUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3002',
    baseUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3002',
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 10000
  },

  // Wallet configuration
  wallet: {
    defaultDerivationPath: "m/44'/0'/0'/0/0",
    supportedNetworks: ['mainnet', 'testnet'],
    defaultNetwork: 'testnet'
  },

  // UI configuration
  ui: {
    refreshInterval: 5000, // 5 seconds
    maxTransactionsDisplay: 50,
    defaultCurrency: 'TOPAY'
  },

  // Development configuration
  development: {
    enableDebugLogs: false,
    mockDataWhenOffline: false,
    autoStartServer: false
  },

  // Application URLs
  app: {
    walletUrl: 'http://localhost:3000',
    explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'http://localhost:3001'
  }
};

export default config;