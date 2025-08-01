# TOPAY Blockchain Network Node

This document describes how to run the TOPAY blockchain as a production network node with full RPC functionality.

## Quick Start

### Basic Network Node

```bash
npm start
```

This starts the blockchain network with:

- Genesis block mining
- RPC server on port 8545
- Full blockchain persistence
- Mainnet-like RPC functionality

### Auto-Mining Node

```bash
npm run start:miner
```

This starts the network with automatic mining enabled using a predefined miner address.

### Custom Port

```bash
npm run start:port 3001
```

This starts the network on a custom port.

## Command Line Options

```bash
node src/network-node.js [options]
```

### Available Options

- `--port <number>` - RPC server port (default: 8545)
- `--miner <address>` - Enable auto-mining with specified address
- `--auto-mine` - Enable auto-mining (requires miner address)
- `--mining-interval <seconds>` - Mining interval in seconds (default: 30)
- `--node-id <id>` - Custom node identifier
- `--help` - Show help information

### Examples

```bash
# Start with custom port
node src/network-node.js --port 3001

# Start with auto-mining
node src/network-node.js --miner TOPAYminer234567890abcdef1234567890abcdef12345678 --auto-mine

# Start with custom mining interval (60 seconds)
node src/network-node.js --miner TOPAYminer234567890abcdef1234567890abcdef12345678 --auto-mine --mining-interval 60

# Start with custom node ID
node src/network-node.js --node-id "topay-mainnet-node-1"
```

## Network Features

### Genesis Block Mining

- Automatically mines the genesis block on first startup
- Creates initial mining reward for the genesis miner
- Validates and saves the blockchain state

### RPC Server

The network node provides a full JSON-RPC 2.0 compatible server with mainnet-like functionality:

**Endpoint:** `http://localhost:8545/rpc`

### Standard RPC Methods

#### Blockchain Information

- `topay_getBlockNumber` - Get latest block number
- `topay_getBlock(blockId)` - Get block by index or hash
- `topay_getBlockByHash(hash)` - Get block by hash
- `topay_getBlockByNumber(number)` - Get block by number
- `topay_getChainInfo()` - Get comprehensive blockchain info
- `topay_validateChain()` - Validate entire blockchain

#### Account and Balance

- `topay_getBalance(address)` - Get address balance
- `topay_getTransactionCount(address)` - Get transaction count for address
- `topay_getTransactionHistory(address, limit, offset)` - Get transaction history

#### Transactions

- `topay_getTransaction(hash)` - Get transaction by hash
- `topay_getTransactionByHash(hash)` - Alias for getTransaction
- `topay_sendTransaction(txData)` - Send new transaction
- `topay_sendRawTransaction(rawTx)` - Send raw transaction
- `topay_getMempool()` - Get pending transactions

#### Mining

- `topay_mine(minerAddress)` - Mine pending transactions
- `topay_mining()` - Get mining status
- `topay_hashrate()` - Get estimated hashrate
- `topay_coinbase()` - Get current coinbase (miner) address

#### Network

- `topay_getPeerCount()` - Get number of connected peers
- `topay_syncing()` - Get synchronization status
- `topay_getNetworkStats()` - Get network statistics

#### Gas and Fees (Future Compatibility)

- `topay_getGasPrice()` - Get current gas price
- `topay_estimateGas(txData)` - Estimate gas for transaction

#### Smart Contracts (Future Compatibility)

- `topay_getCode(address)` - Get contract code
- `topay_call(txData)` - Execute contract call

### Example RPC Calls

#### Get Latest Block Number

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "topay_getBlockNumber",
    "params": [],
    "id": 1
  }'
```

#### Get Balance

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "topay_getBalance",
    "params": ["TOPAYminer234567890abcdef1234567890abcdef12345678"],
    "id": 1
  }'
```

#### Send Transaction

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "topay_sendTransaction",
    "params": [{
      "from": "TOPAYtest1234567890abcdef1234567890abcdef12345678",
      "to": "TOPAYtest2234567890abcdef1234567890abcdef12345678",
      "amount": 10,
      "memo": "Test payment"
    }],
    "id": 1
  }'
```

#### Mine Block

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "topay_mine",
    "params": ["TOPAYminer234567890abcdef1234567890abcdef12345678"],
    "id": 1
  }'
```

## Network Endpoints

### Health Check

`GET http://localhost:8545/health`

Returns network health status and basic blockchain information.

### Available Methods

`GET http://localhost:8545/api/rpc/methods`

Returns list of all available RPC methods.

## Data Persistence

The network node automatically:

- Saves blockchain state to disk
- Loads existing blockchain on startup
- Auto-saves every 30 seconds
- Performs graceful shutdown with final save

## Auto-Mining

When auto-mining is enabled:

- Automatically mines blocks when transactions are in mempool
- Configurable mining interval (default: 30 seconds)
- Provides mining rewards to specified miner address
- Logs mining activity and performance

## Network Synchronization

The network node is designed for:

- Multi-node network operation
- Peer-to-peer synchronization (future enhancement)
- Network consensus mechanisms
- Real-time transaction broadcasting

## Production Considerations

### Security

- Use secure miner addresses in production
- Implement proper authentication for RPC access
- Configure firewall rules for network access
- Monitor for suspicious transaction patterns

### Performance

- Adjust mining difficulty based on network hashrate
- Configure appropriate mining intervals
- Monitor memory usage for large blockchains
- Implement block pruning for long-running nodes

### Monitoring

- Monitor RPC endpoint health
- Track mining performance and rewards
- Monitor network synchronization status
- Log transaction processing metrics

## Troubleshooting

### Common Issues

1. **Port Already in Use**

   ```err
   Error: listen EADDRINUSE :::8545
   ```

   Solution: Use a different port with `--port` option

2. **Mining Fails**

   ```err
   Error: No transactions to mine
   ```

   Solution: Add transactions to mempool before mining

3. **Invalid Address**

   ```err
   Error: Valid address parameter required
   ```

   Solution: Use properly formatted TOPAY addresses

### Debug Mode

Run with additional logging:

```bash
DEBUG=topay:* node src/network-node.js
```

## Integration

The network node can be integrated with:

- Wallet applications
- Block explorers
- Trading platforms
- DeFi protocols
- Mobile applications

For wallet integration, see the wallet application in the `../wallet` directory.
