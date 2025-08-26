/**
 * TOPAY Wallet Configuration
 * Configuration for connecting to the main blockchain workspace
 * Uses environment variables for flexible deployment
 */

export const config = {
  // Main blockchain RPC server configuration
  blockchain: {
    rpcUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8546/rpc',
    healthUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_HEALTH_URL || 'http://localhost:8546/health',
    apiUrl: process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || 'http://localhost:8546/api',
    retryAttempts: parseInt(process.env.NEXT_PUBLIC_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.NEXT_PUBLIC_RETRY_DELAY) || 1000,
    timeout: parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT) || 10000
  },

  // Wallet configuration
  wallet: {
    defaultDerivationPath: process.env.NEXT_PUBLIC_DEFAULT_DERIVATION_PATH || "m/44'/0'/0'/0/0",
    supportedNetworks: process.env.NEXT_PUBLIC_SUPPORTED_NETWORKS?.split(',') || ['mainnet', 'testnet'],
    defaultNetwork: process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'testnet'
  },

  // UI configuration
  ui: {
    refreshInterval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL) || 5000, // 5 seconds
    maxTransactionsDisplay: parseInt(process.env.NEXT_PUBLIC_MAX_TRANSACTIONS_DISPLAY) || 50,
    defaultCurrency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'TOPAY'
  },

  // Development configuration
  development: {
    enableDebugLogs: process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true',
    mockDataWhenOffline: process.env.NEXT_PUBLIC_MOCK_DATA_WHEN_OFFLINE === 'true',
    autoStartServer: process.env.NEXT_PUBLIC_AUTO_START_SERVER === 'true'
  },

  // Application URLs
  app: {
    walletUrl: process.env.NEXT_PUBLIC_WALLET_URL || 'http://localhost:3000'
  }
};

export default config;