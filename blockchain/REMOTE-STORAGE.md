# TOPAY Remote Storage System

## Overview

The TOPAY Remote Storage System enables blockchain nodes to store their data on remote validator nodes via RPC connections. This provides redundancy, backup capabilities, and distributed storage for the blockchain network. The system now supports dynamic URL configuration through environment variables.

## Architecture

```demo
┌─────────────────┐    HTTP/RPC     ┌─────────────────┐
│  Blockchain     │ ──────────────► │  Validator      │
│  Network Node   │                 │  Node 1         │
│                 │                 │  (Storage)      │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │           HTTP/RPC               │
         └─────────────────────────────────┘
                        │
                ┌─────────────────┐
                │  Validator      │
                │  Node 2         │
                │  (Backup)       │
                └─────────────────┘
```

## Environment Configuration

### Blockchain Project (.env)

Create a `.env` file in the blockchain directory:

```env
# Validator Configuration
VALIDATOR_NODES=http://localhost:8547,http://localhost:8548
PRIMARY_VALIDATOR=http://localhost:8547

# Remote Storage Settings
ENABLE_REMOTE_STORAGE=true
STORAGE_REPLICATION=true
BACKUP_ENABLED=true

# Network Configuration
NETWORK_TIMEOUT=5000
MAX_RETRIES=3
RETRY_DELAY=1000

# Node Configuration
NODE_ID=TOPAY-NODE-001
BLOCKCHAIN_PORT=3001
MINER_ADDRESS=TOPAYminer234567890abcdef1234567890abcdef12345678

# Mining Configuration
AUTO_MINING=false
MINING_INTERVAL=10000

# Debug Configuration
DEBUG_MODE=false
LOG_LEVEL=info
```

### Validator Project (.env)

Create a `.env` file in the validator directory:

```env
# Blockchain RPC Configuration
BLOCKCHAIN_RPC_PORT=8545
BLOCKCHAIN_RPC_URL=http://localhost:8545

# Validator API Configuration
VALIDATOR_API_PORT=8547
VALIDATOR_API_URL=http://localhost:8547

# Network Configuration
NETWORK_TIMEOUT=10000
MAX_RETRIES=3
RETRY_DELAY=1000

# Storage Configuration
STORAGE_PATH=./data
BACKUP_ENABLED=true
BACKUP_INTERVAL=3600000
MAX_BACKUPS=10

# Security Configuration
ENABLE_CORS=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
API_RATE_LIMIT=100

# Logging Configuration
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true

# Development Configuration
DEBUG_MODE=false
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Setup Instructions

### 1. Validator Service Setup

First, ensure your validator service is running and accessible:

```bash
cd validator
npm start
```

The validator service will start on the configured port (default 8547) and provide the following endpoints:

- `http://localhost:8547/api/status` - Service status
- `http://localhost:8547/api/storage/*` - Storage endpoints

### 2. Blockchain Network Configuration

Configure your blockchain network to use remote storage:

```bash
cd blockchain
# Start with environment configuration
npm start

# Or with command-line overrides
node src/network-node.js --validators http://localhost:8547,http://localhost:8548
```

## Configuration Options

### Command Line Arguments

- `--validators <urls>`: Comma-separated list of validator node URLs
  - Example: `--validators "http://localhost:8547,http://validator2:8547"`
  - Default: `http://localhost:8547`

### Environment Variables

You can also configure validator nodes using environment variables:

```bash
# Set in .env file or environment
VALIDATOR_NODES=http://localhost:8547,http://validator2:8547
```

## Testing Remote Storage

### 1. Test Connectivity

Run the remote storage test to verify connectivity:

```bash
npm run test:remote
```

This will:

- Test connectivity to all configured validator nodes
- Create a test blockchain
- Save blockchain data to remote storage
- Load blockchain data from remote storage
- Display storage statistics

### 2. Manual Testing

You can manually test the storage endpoints using PowerShell:

```powershell
# Test saving blockchain data
$blockchainData = @{
    chain = @(@{
        index = 0
        timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        data = "Genesis Block"
        hash = "0000000000000000000000000000000000000000000000000000000000000000"
    })
    difficulty = 4
    miningReward = 100
    mempool = @()
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri "http://localhost:8547/api/storage/blockchain" -Method POST -Body $blockchainData -ContentType "application/json"

# Test loading blockchain data
Invoke-WebRequest -Uri "http://localhost:8547/api/storage/blockchain" -Method GET
```

## Storage Features

### Data Replication

The remote persistence manager automatically replicates data across all configured validator nodes:

- **Primary Storage**: First available validator node
- **Backup Storage**: All other validator nodes
- **Automatic Failover**: Switches to backup nodes if primary fails

### Backup Management

Automatic backup creation:

```javascript
// Backups are created automatically when saving data
// Manual backup creation via API:
POST /api/storage/backup
{
    "type": "blockchain" // or "wallets", "config"
}
```

### Storage Statistics

Monitor storage usage:

```javascript
// Get storage statistics
GET /api/storage/stats

// Response includes:
{
    "dataPath": "./data",
    "files": {
        "blockchain.json": {
            "size": 1024,
            "modified": "2024-01-01T00:00:00.000Z",
            "exists": true
        }
    },
    "totalSize": 1024,
    "lastModified": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

The remote storage system includes comprehensive error handling:

- **Connection Failures**: Automatic retry with exponential backoff
- **Node Failures**: Automatic failover to backup nodes
- **Data Corruption**: Validation and recovery mechanisms
- **Network Issues**: Timeout handling and reconnection logic

## Security Considerations

- **Authentication**: Consider implementing API authentication for production
- **Encryption**: Data is transmitted over HTTP (consider HTTPS for production)
- **Access Control**: Restrict validator node access to authorized blockchain nodes
- **Data Validation**: All stored data is validated before persistence

## Monitoring

Monitor the remote storage system:

1. **Validator Node Health**: Check `/api/status` endpoint
2. **Storage Statistics**: Monitor `/api/storage/stats`
3. **Connection Status**: Check blockchain node logs for connectivity
4. **Data Integrity**: Regular validation of stored blockchain data

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure validator service is running
   - Check firewall settings
   - Verify correct port configuration

2. **Data Not Saving**
   - Check validator node logs
   - Verify API endpoints are accessible
   - Ensure sufficient disk space on validator

3. **Slow Performance**
   - Check network latency to validator nodes
   - Consider adding more validator nodes
   - Monitor validator node resource usage

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
DEBUG=topay:* node src/network-node.js
```

## Production Deployment

For production deployment:

1. **Multiple Validators**: Deploy at least 3 validator nodes
2. **Geographic Distribution**: Spread validators across different locations
3. **Load Balancing**: Use load balancers for validator endpoints
4. **Monitoring**: Implement comprehensive monitoring and alerting
5. **Backup Strategy**: Regular automated backups to external storage
6. **Security**: Implement proper authentication and encryption

## API Reference

### Blockchain Storage

```http
POST /api/storage/blockchain
Content-Type: application/json

{
    "chain": [...],
    "difficulty": 4,
    "miningReward": 100,
    "mempool": [...]
}
```

```http
GET /api/storage/blockchain
```

### Wallet Storage

```http
POST /api/storage/wallets
Content-Type: application/json

{
    "wallets": {...}
}
```

```http
GET /api/storage/wallets
```

### Configuration Storage

```http
POST /api/storage/config
Content-Type: application/json

{
    "config": {...}
}
```

```http
GET /api/storage/config
```

### Backup System Management

```http
POST /api/storage/backup
Content-Type: application/json

{
    "type": "blockchain"
}
```

### Storage Usage and Statistics

```http
GET /api/storage/stats
```

## Support

For issues or questions regarding remote storage configuration, please refer to the main project documentation or contact the TOPAY Foundation development team.
