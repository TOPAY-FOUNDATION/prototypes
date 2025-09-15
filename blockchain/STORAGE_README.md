# TOPAY Blockchain Storage System

A comprehensive blockchain data storage and RPC system that provides real blockchain-like data persistence, similar to Bitcoin Core, Ethereum, and other major blockchain implementations.

## 🏗️ Architecture Overview

The TOPAY storage system consists of several integrated components:

### Core Components

1. **DatabaseEngine** (`src/storage/DatabaseEngine.js`)
   - LevelDB-like key-value storage with multiple backend support
   - Efficient indexing and caching mechanisms
   - Data compression and integrity verification
   - Supports JSON, LevelDB simulation, and SQLite backends

2. **BlockchainStorage** (`src/storage/BlockchainStorage.js`)
   - High-level blockchain data operations
   - UTXO set management for efficient balance calculations
   - Account state persistence and tracking
   - Automatic backup and recovery systems

3. **DataSyncManager** (`src/storage/DataSyncManager.js`)
   - Real-time synchronization between blockchain and storage
   - Automatic data persistence and recovery
   - Integrity verification and maintenance operations
   - Comprehensive backup and restore functionality

4. **EnhancedRPCServer** (`src/rpc/EnhancedRPCServer.js`)
   - Advanced RPC methods for blockchain data transmission
   - Compatible with standard blockchain RPC interfaces
   - Enhanced query capabilities and data retrieval
   - Real-time blockchain data access

5. **TOPAYBlockchainStorageServer** (`blockchain-storage-server.js`)
   - Complete integrated storage server
   - Combines all components into a unified system
   - Production-ready blockchain node with storage

## 🚀 Quick Start

### Installation

```bash
# Navigate to the blockchain directory
cd blockchain

# Install dependencies
npm install
```

### Running the Storage Server

```bash
# Start the complete storage server (default port 3001)
npm run storage

# Start on a specific port
npm run storage:port  # Runs on port 8545

# Or specify custom port and options
node blockchain-storage-server.js 8545 --backend=json --compression=true

# Development mode with auto-restart
npm run storage:dev
```

### Running Enhanced RPC Server Only

```bash
# Start enhanced RPC server
npm run rpc

# Development mode
npm run rpc:dev
```

## 📡 RPC API Reference

### Standard Blockchain Methods

```javascript
// Get latest block number
POST /rpc
{
  "jsonrpc": "2.0",
  "method": "topay_getBlockNumber",
  "params": [],
  "id": 1
}

// Get account balance
{
  "jsonrpc": "2.0",
  "method": "topay_getBalance",
  "params": ["TOPAYtest1234567890abcdef1234567890abcdef12345678"],
  "id": 2
}

// Get block by index or hash
{
  "jsonrpc": "2.0",
  "method": "topay_getBlock",
  "params": [0], // or "latest" or block hash
  "id": 3
}
```

### Enhanced Data Transmission Methods

```javascript
// Get multiple blocks at once
{
  "jsonrpc": "2.0",
  "method": "topay_getBlockRange",
  "params": [0, 10, true], // start, end, includeTransactions
  "id": 4
}

// Get transactions by address with pagination
{
  "jsonrpc": "2.0",
  "method": "topay_getTransactionsByAddress",
  "params": ["address", 50, 0, "all"], // address, limit, offset, type
  "id": 5
}

// Get account state and history
{
  "jsonrpc": "2.0",
  "method": "topay_getAccountState",
  "params": ["address"],
  "id": 6
}

// Get comprehensive address statistics
{
  "jsonrpc": "2.0",
  "method": "topay_getAddressStats",
  "params": ["address"],
  "id": 7
}
```

### Storage Management Methods

```javascript
// Get storage statistics
{
  "jsonrpc": "2.0",
  "method": "topay_getStorageStats",
  "params": [],
  "id": 8
}

// Create backup
{
  "jsonrpc": "2.0",
  "method": "topay_createBackup",
  "params": ["./backups"],
  "id": 9
}

// Perform database maintenance
{
  "jsonrpc": "2.0",
  "method": "topay_performMaintenance",
  "params": [],
  "id": 10
}
```

## 🗄️ Data Storage Structure

The storage system organizes data in a hierarchical structure:

```tree
data/
├── blockchain/
│   ├── blocks/           # Individual block files
│   ├── transactions/     # Transaction data
│   ├── state/           # Account states
│   ├── indexes/         # Search indexes
│   ├── chain-state.json # Overall chain state
│   └── utxo-set.json   # UTXO set for balance calculations
├── wallets/             # Wallet data
├── legacy/              # Legacy persistence format
└── backups/             # Automatic backups
```

### Block Storage Format

Each block is stored as a JSON file with the following structure:

```json
{
  "key": "block:0",
  "data": {
    "index": 0,
    "hash": "000000000...",
    "previousHash": "0",
    "timestamp": 1640995200000,
    "transactions": [...],
    "merkleRoot": "abc123...",
    "nonce": 12345,
    "difficulty": 4,
    "size": 2048
  },
  "timestamp": 1640995200000,
  "checksum": "def456..."
}
```

### Transaction Storage Format

```json
{
  "key": "tx:abc123...",
  "data": {
    "hash": "abc123...",
    "from": "TOPAYtest1234...",
    "to": "TOPAYtest5678...",
    "amount": 100,
    "timestamp": 1640995200000,
    "signature": "def456...",
    "blockIndex": 1,
    "data": "Payment for services"
  },
  "timestamp": 1640995200000,
  "checksum": "ghi789..."
}
```

## 🔧 Configuration Options

### Command Line Options

```bash
# Basic usage
node blockchain-storage-server.js [port] [options]

# Available options:
--backend=json|leveldb-sim|sqlite    # Storage backend (default: json)
--compression=true|false             # Enable data compression (default: false)
--autoBackup=true|false             # Enable automatic backups (default: true)
--realTimeSync=true|false           # Enable real-time sync (default: true)
--dataPath=./custom/path            # Custom data directory (default: ./data)
```

### Environment Variables

```bash
# Set default port
export BLOCKCHAIN_PORT=8545

# Set data directory
export TOPAY_DATA_PATH=./blockchain-data
```

## 📊 Monitoring and Management

### Health Check Endpoint

```bash
curl http://localhost:3001/health
```

Response:

```json
{
  "status": "healthy",
  "rpcVersion": "2.0",
  "enhanced": true,
  "blockchain": {
    "blocks": 10,
    "difficulty": 4,
    "mempool": 2
  },
  "storage": {
    "initialized": true,
    "totalBlocks": 10,
    "totalTransactions": 25,
    "cacheHits": 150,
    "cacheMisses": 30
  },
  "timestamp": 1640995200000
}
```

### Storage Statistics

```bash
curl http://localhost:3001/api/storage/stats
```

### Signal Handling

The server supports Unix signals for management:

```bash
# Graceful shutdown
kill -INT <pid>

# Create backup
kill -USR1 <pid>

# Perform maintenance
kill -USR2 <pid>
```

## 🔄 Backup and Recovery

### Automatic Backups

The system automatically creates backups at regular intervals when `autoBackup` is enabled.

### Manual Backup

```bash
# Via RPC
curl -X POST http://localhost:3001/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "topay_createBackup",
    "params": ["./my-backups"],
    "id": 1
  }'

# Via REST API
curl -X POST http://localhost:3001/api/storage/backup \
  -H "Content-Type: application/json" \
  -d '{"path": "./my-backups"}'
```

### Recovery

To restore from a backup:

1. Stop the server
2. Replace the data directory with backup contents
3. Restart the server

The system will automatically detect and load the restored data.

## 🔍 Performance Optimization

### Caching

- In-memory LRU cache for frequently accessed data
- Configurable cache size (default: 1000-2000 entries)
- Cache hit/miss statistics available via RPC

### Indexing

- Automatic indexing of blocks by hash and number
- Transaction indexing by hash, from/to addresses
- Account state indexing for fast balance lookups
- Custom indexes for advanced queries

### Compression

Enable compression to reduce storage space:

```bash
node blockchain-storage-server.js --compression=true
```

## 🧪 Testing

### Sample Data Generation

The server automatically creates sample blockchain data on first run:

- 3 test wallets with initial funding
- Multiple transactions across 2+ blocks
- Realistic transaction patterns

### RPC Testing

Use the provided test scripts or tools like `curl`:

```bash
# Test basic RPC
curl -X POST http://localhost:3001/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "topay_getBlockNumber",
    "params": [],
    "id": 1
  }'
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Use a different port
   node blockchain-storage-server.js 8545
   ```

2. **Permission denied on data directory**

   ```bash
   # Ensure write permissions
   chmod 755 ./data
   ```

3. **Storage corruption**

   ```bash
   # Perform maintenance
   curl -X POST http://localhost:3001/rpc \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"topay_performMaintenance","params":[],"id":1}'
   ```

### Logs

The server provides detailed logging:

- 🚀 Startup and initialization
- 📦 Block and transaction storage
- 🔄 Synchronization status
- ❌ Error messages with context
- 📊 Performance statistics

## 🔗 Integration Examples

### JavaScript/Node.js

```javascript
import fetch from 'node-fetch';

class TOPAYClient {
  constructor(url = 'http://localhost:3001/rpc') {
    this.url = url;
  }
  
  async call(method, params = []) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      })
    });
    
    const result = await response.json();
    return result.result;
  }
  
  async getBalance(address) {
    return await this.call('topay_getBalance', [address]);
  }
  
  async getBlock(blockId) {
    return await this.call('topay_getBlock', [blockId]);
  }
  
  async getTransactionsByAddress(address, limit = 50) {
    return await this.call('topay_getTransactionsByAddress', [address, limit]);
  }
}

// Usage
const client = new TOPAYClient();
const balance = await client.getBalance('TOPAYtest1234...');
console.log('Balance:', balance);
```

### Python

```python
import requests
import json

class TOPAYClient:
    def __init__(self, url='http://localhost:3001/rpc'):
        self.url = url
    
    def call(self, method, params=None):
        if params is None:
            params = []
        
        payload = {
            'jsonrpc': '2.0',
            'method': method,
            'params': params,
            'id': 1
        }
        
        response = requests.post(self.url, json=payload)
        return response.json()['result']
    
    def get_balance(self, address):
        return self.call('topay_getBalance', [address])
    
    def get_block(self, block_id):
        return self.call('topay_getBlock', [block_id])

# Usage
client = TOPAYClient()
balance = client.get_balance('TOPAYtest1234...')
print(f'Balance: {balance}')
```

## 📈 Roadmap

### Planned Features

- [ ] WebSocket support for real-time updates
- [ ] GraphQL API for advanced queries
- [ ] Multi-node synchronization
- [ ] Sharding support for large datasets
- [ ] Advanced analytics and reporting
- [ ] Integration with external databases
- [ ] Performance monitoring dashboard

### Performance Improvements

- [ ] Parallel block processing
- [ ] Optimized indexing algorithms
- [ ] Memory usage optimization
- [ ] Disk I/O optimization
- [ ] Network protocol improvements

## 🤝 Contributing

Contributions are welcome! Please see the main project README for contribution guidelines.

## 📄 License

MIT License - see the main project LICENSE file for details.

---

**TOPAY Foundation** - Building the future of quantum-safe blockchain technology.
