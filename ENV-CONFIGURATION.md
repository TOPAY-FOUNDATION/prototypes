# TOPAY Environment Variable Configuration System

## Overview

The TOPAY blockchain and validator projects now support dynamic URL configuration through environment variables. This allows for flexible deployment across different environments without code changes.

## Quick Start

### 1. Copy Example Files

**For Blockchain Project:**

```bash
cd blockchain
cp .env.example .env
```

**For Validator Project:**

```bash
cd validator
cp .env.example .env
```

### 2. Customize Configuration

Edit the `.env` files to match your environment:

```env
# Example: Multiple validators
VALIDATOR_NODES=http://validator1.example.com:8547,http://validator2.example.com:8547
PRIMARY_VALIDATOR=http://validator1.example.com:8547
ENABLE_REMOTE_STORAGE=true
```

### 3. Start Services

```bash
# Start validator
cd validator
npm start

# Start blockchain (in another terminal)
cd blockchain
npm start
```

## Key Environment Variables

### Blockchain Project

| Variable | Description | Default |
|----------|-------------|---------|
| `VALIDATOR_NODES` | Comma-separated validator URLs | `http://localhost:8547` |
| `PRIMARY_VALIDATOR` | Primary validator URL | First in VALIDATOR_NODES |
| `ENABLE_REMOTE_STORAGE` | Enable remote storage | `true` |
| `NETWORK_TIMEOUT` | Network timeout (ms) | `5000` |
| `DEBUG_MODE` | Enable debug logging | `false` |

### Validator Project

| Variable | Description | Default |
|----------|-------------|---------|
| `VALIDATOR_API_PORT` | API server port | `8547` |
| `BLOCKCHAIN_RPC_URL` | Blockchain RPC URL | `http://localhost:8545` |
| `STORAGE_PATH` | Data storage path | `./data` |
| `BACKUP_ENABLED` | Enable backups | `true` |
| `LOG_LEVEL` | Logging level | `info` |

## Usage Examples

### Development Environment

```env
# .env (blockchain)
VALIDATOR_NODES=http://localhost:8547
DEBUG_MODE=true
LOG_LEVEL=debug

# .env (validator)
VALIDATOR_API_PORT=8547
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Production Environment

```env
# .env (blockchain)
VALIDATOR_NODES=http://validator1.prod.com:8547,http://validator2.prod.com:8547
STORAGE_REPLICATION=true
BACKUP_ENABLED=true
LOG_LEVEL=info

# .env (validator)
VALIDATOR_API_PORT=8547
BACKUP_ENABLED=true
BACKUP_INTERVAL=1800000
LOG_LEVEL=info
```

### Testing Environment

```env
# .env (blockchain)
VALIDATOR_NODES=http://localhost:8547,http://localhost:8548
NETWORK_TIMEOUT=10000
MAX_RETRIES=5

# .env (validator)
VALIDATOR_API_PORT=8547
NETWORK_TIMEOUT=5000
DEBUG_MODE=true
```

## Testing Configuration

Run the environment configuration example:

```bash
cd blockchain
npm run example:env
```

This will display your current environment configuration and provide usage examples.

## Command Line Overrides

You can still override environment variables with command-line arguments:

```bash
# Override validator nodes
node src/network-node.js --validators http://custom-validator:8547

# Override with multiple validators
node src/network-node.js --validators http://val1:8547,http://val2:8547
```

## Benefits

✅ **Flexible Deployment**: Easy configuration for different environments  
✅ **No Code Changes**: Switch between dev/test/prod without rebuilding  
✅ **Security**: Keep sensitive URLs out of source code  
✅ **Scalability**: Easy addition of new validator nodes  
✅ **Backward Compatibility**: Command-line arguments still work  

## Migration Guide

If you're upgrading from the previous version:

1. Create `.env` files using the provided examples
2. Move your configuration from command-line arguments to environment variables
3. Test with `npm run example:env` to verify configuration
4. Start services normally with `npm start`

## Troubleshooting

**Issue**: Service can't connect to validators  
**Solution**: Check `VALIDATOR_NODES` URLs and ensure validators are running

**Issue**: Configuration not loading  
**Solution**: Ensure `.env` file is in the project root directory

**Issue**: Environment variables not working  
**Solution**: Restart the service after changing `.env` files

For more detailed information, see:

- [REMOTE-STORAGE.md](blockchain/REMOTE-STORAGE.md) - Remote storage documentation
- [.env.example](blockchain/.env.example) - Blockchain configuration template
- [.env.example](validator/.env.example) - Validator configuration template
