# TOPAY Foundation Simple Blockchain

A simplified quantum-safe blockchain implementation with 512-bit hashing for demonstration purposes.

## 🌟 Features

- **512-bit Quantum-Safe Hashing**: Using TOPAY-Z512 library
- **Proof of Work Mining**: Simple difficulty-based mining
- **File-Based Caching**: Persistent blockchain data storage
- **REST API**: Complete blockchain operations via HTTP endpoints
- **Real-time Statistics**: Live blockchain metrics and validation

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm package manager

### Local Installation

1. Navigate to the project directory:

```bash
cd blockchain
```

1. Install dependencies:

```bash
npm install
```

1. Start the server:

```bash
npm start
```

1. Access the API:

- Health check: <http://localhost:3001/health>
- API documentation: <http://localhost:3001/api>
- Blockchain stats: <http://localhost:3001/api/stats>

## 🌐 Deployment

### Render Deployment

This project is ready for deployment on Render.com:

1. **Connect Repository**: Link your GitHub repository to Render
2. **Auto-Deploy**: The included `render.yaml` configures automatic deployment
3. **Environment**: Uses Node.js with automatic PORT configuration
4. **Health Checks**: Built-in health monitoring at `/health` endpoint

### Vercel Deployment

This project is also ready for deployment on Vercel:

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Auto-Deploy**: The included `vercel.json` configures serverless deployment
3. **Serverless Functions**: Optimized for Vercel's serverless environment
4. **Instant Scaling**: Automatic scaling based on demand

**Vercel Features:**

- ✅ Serverless function architecture
- ✅ Automatic HTTPS and CDN
- ✅ Environment variable support
- ✅ Zero-config deployment
- ✅ Global edge network

**Deployment Features (Both Platforms):**

- ✅ Environment PORT variable support
- ✅ Bind to all interfaces (0.0.0.0)
- ✅ Health check endpoint
- ✅ Persistent file-based caching
- ✅ Production-ready configuration

### Manual Deployment Steps

**For Render:**

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Render will automatically detect the `render.yaml` configuration
5. Deploy with one click!

**For Vercel:**

1. Push your code to GitHub
2. Import your project on Vercel
3. Vercel will automatically detect the `vercel.json` configuration
4. Deploy instantly with zero configuration!

## 📡 API Endpoints

### Base URL: `/topay`

All API endpoints are now prefixed with `/topay` for better organization and branding.

### Core Blockchain Operations

- `GET /health` - Health check and status (root level for monitoring)
- `GET /topay` - API documentation and endpoint list
- `GET /topay/stats` - Blockchain statistics and validation status
- `GET /topay/blocks` - Get all blocks in the blockchain
- `GET /topay/blocks/:index` - Get specific block by index
- `GET /topay/validate` - Validate entire blockchain integrity

### Transaction Processing

- `POST /topay/transaction` - Process new transaction/add block

  ```json
  {
    "data": "Your transaction data here"
  }
  ```

### Wallet Operations

- `GET /topay/wallet` - Wallet API information (coming soon)

### Mining & Difficulty

- `POST /topay/mining/difficulty` - Set mining difficulty (1-6)

  ```json
  {
    "difficulty": 2
  }
  ```

### Search & Discovery

- `GET /topay/search?q=term` - Search blocks by content

### Data Management

- `GET /topay/export` - Export complete blockchain data
- `POST /topay/import` - Import blockchain data
- `POST /topay/admin/reset` - Reset blockchain to genesis block

### Cache Management

- `GET /topay/cache` - Get cache information and status
- `POST /topay/cache/clear` - Clear cache and reset blockchain
- `GET /topay/cache/export` - Export cache data
- `POST /topay/cache/import` - Import cache data

### Development & Testing

- `POST /topay/test-data` - Add sample test blocks for demonstration

### Legacy Support

- `GET /api` - Redirects to `/topay` for backward compatibility

## 🔧 Configuration

The blockchain automatically creates a `cache/` directory for data persistence. All blockchain data, including blocks and configuration, is stored locally and persists between server restarts.

## 🛡️ Security

- **Quantum-Safe**: 512-bit hashing with TOPAY-Z512
- **Proof of Work**: Mining-based consensus mechanism
- **Data Integrity**: Block validation and chain verification
- **Persistent Storage**: Secure file-based caching system
