# TOPAY Quantum-Safe Blockchain Wallet

A Next.js-based wallet application integrated with the TOPAY Foundation's quantum-safe blockchain workspace.

## 🚀 Features

- **Quantum-Safe Security**: Built with TOPAY's quantum-resistant cryptography
- **Workspace Integration**: Seamlessly connects to the main blockchain RPC server
- **Real-time Updates**: Live connection status and blockchain data
- **Modern UI**: Clean, responsive interface built with Next.js and React
- **Comprehensive API**: Full blockchain interaction capabilities

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- TOPAY Blockchain workspace (parent directory)

## 🛠️ Installation

1. **Navigate to the wallet directory:**

   ```bash
   cd "c:\Users\RealShahriya\Desktop\TOPAY FOUNDATION\Projects\topay-prototype\wallet-nextjs"
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

## 🚀 Quick Start

### Option 1: Start Complete Workspace (Recommended)

```bash
npm run workspace
```

This will start both the blockchain RPC server and the wallet application.

### Option 2: Start Services Separately

1. **Start the blockchain server (in parent directory):**

   ```bash
   npm run blockchain
   ```

2. **Start the wallet app (in a new terminal):**

   ```bash
   npm run dev
   ```

## 🌐 Access Points

- **Wallet Application**: <http://localhost:3000>
- **Blockchain RPC Server**: <http://localhost:3001/rpc>
- **Health Check**: <http://localhost:3001/health>

## 📁 Project Structure

```tree
wallet-nextjs/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   ├── blockchain/      # Blockchain info & mempool
│   │   │   ├── transactions/    # Transaction handling
│   │   │   └── wallet/          # Wallet operations
│   │   ├── components/          # React components
│   │   └── page.tsx            # Main wallet interface
│   └── lib/
│       ├── blockchain-client.js # RPC client for workspace
│       ├── blockchain.js        # Local blockchain (fallback)
│       ├── config.js           # Configuration settings
│       ├── storage.js          # Data persistence
│       ├── transaction.js      # Transaction handling
│       └── wallet.js           # Wallet operations
├── start-workspace.js          # Startup script
└── package.json
```

## 🔧 Configuration

The wallet is configured to connect to the main blockchain workspace. All URLs and settings are configurable through environment variables in `.env.local`:

### Environment Variables

```bash
# Blockchain RPC Server Configuration
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://localhost:3001/rpc
NEXT_PUBLIC_BLOCKCHAIN_HEALTH_URL=http://localhost:3001/health
NEXT_PUBLIC_BLOCKCHAIN_API_URL=http://localhost:3001/api

# Wallet Configuration
NEXT_PUBLIC_WALLET_URL=http://localhost:3000

# ChainGPT API Configuration
NEXT_PUBLIC_CHAINGPT_API_KEY=your_chaingpt_api_key_here
NEXT_PUBLIC_CHAINGPT_API_URL=https://api.chaingpt.org/chat/stream
```

### Default Settings (when environment variables are not set)

- **RPC Server**: `http://localhost:3001/rpc`
- **Health Check**: `http://localhost:3001/health`
- **Refresh Interval**: 5 seconds
- **Request Timeout**: 10 seconds

## 📡 API Endpoints

### Blockchain Operations

- `GET /api/blockchain/info` - Get blockchain information
- `GET /api/blockchain/mempool` - Get mempool status

### Wallet Operations

- `POST /api/wallet/generate` - Generate new wallet
- `POST /api/wallet/import` - Import existing wallet
- `GET /api/wallet/[address]/balance` - Get wallet balance
- `GET /api/wallet/[address]/transactions` - Get transaction history

### Transaction Operations

- `POST /api/transactions/send` - Send transaction

## 🔐 Security Features

- **Quantum-Safe Cryptography**: Uses TOPAY's quantum-resistant algorithms
- **Secure Key Management**: Private keys handled securely
- **Transaction Signing**: All transactions cryptographically signed
- **Data Encryption**: Sensitive data encrypted using KEM

## 🎯 Wallet Features

1. **Multi-Tab Interface**:
   - Wallet overview with balance
   - Send transactions
   - Transaction history
   - Account management
   - Settings and support

2. **Real-time Updates**:
   - Live balance updates
   - Transaction status monitoring
   - Connection status indicator

3. **Transaction Management**:
   - Send TOPAY tokens
   - View transaction history
   - Monitor pending transactions

## 🔄 Workspace Integration

The wallet integrates with the main blockchain workspace through:

1. **RPC Client**: `BlockchainClient` class handles all communication
2. **Health Monitoring**: Continuous connection status checking
3. **Fallback Handling**: Graceful degradation when server unavailable
4. **Error Recovery**: Automatic retry mechanisms

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Ensure blockchain server is running
   - Check if ports 3000 and 3001 are available
   - Verify firewall settings

2. **Wallet Not Loading**:
   - Run `npm install` to ensure dependencies
   - Check console for JavaScript errors
   - Verify Node.js version compatibility

3. **Transaction Failures**:
   - Check wallet balance
   - Verify recipient address format
   - Ensure blockchain server is synchronized

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=topay:* npm run dev
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run workspace` - Start complete workspace
- `npm run blockchain` - Start blockchain server only

### Adding Features

1. **New API Routes**: Add to `src/app/api/`
2. **UI Components**: Add to `src/app/components/`
3. **Blockchain Logic**: Extend `src/lib/blockchain-client.js`

## 📊 Monitoring

The wallet includes built-in monitoring:

- **Connection Status**: Visual indicator in UI
- **Health Checks**: Automatic server health monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Response time monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the TOPAY Foundation quantum-safe blockchain initiative.

## 🆘 Support

For support and questions:

- Check the troubleshooting section above
- Review console logs for error details
- Ensure all prerequisites are met
- Verify workspace configuration

---

**TOPAY Foundation** - Building the future of quantum-safe blockchain technology
