# TOPAY Blockchain Explorer API Documentation

## Overview

The TOPAY Blockchain Explorer API provides standard blockchain data access methods following Ethereum JSON-RPC conventions. This API enables block explorers, wallets, and other applications to interact with the TOPAY blockchain.

## Base URL

```
http://localhost:3002/explorer
```

## API Endpoints

### Block Operations

#### Get Block by Number
```http
GET /explorer/block/number/{blockNumber}?fullTransactions={boolean}
```

**Parameters:**
- `blockNumber` (string): Block number (decimal) or "latest"
- `fullTransactions` (query, boolean): Include full transaction objects (default: false)

**Example:**
```bash
curl "http://localhost:3002/explorer/block/number/0"
curl "http://localhost:3002/explorer/block/number/latest?fullTransactions=true"
```

#### Get Block by Hash
```http
GET /explorer/block/hash/{blockHash}?fullTransactions={boolean}
```

**Parameters:**
- `blockHash` (string): Block hash (64+ hex characters)
- `fullTransactions` (query, boolean): Include full transaction objects (default: false)

**Example:**
```bash
curl "http://localhost:3002/explorer/block/hash/000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
```

#### Get Latest Block Number
```http
GET /explorer/block/latest
```

**Example:**
```bash
curl "http://localhost:3002/explorer/block/latest"
```

### Transaction Operations

#### Get Transaction by Hash
```http
GET /explorer/transaction/{txHash}
```

**Parameters:**
- `txHash` (string): Transaction hash

**Example:**
```bash
curl "http://localhost:3002/explorer/transaction/0x1234567890abcdef..."
```

#### Get Transaction Receipt
```http
GET /explorer/transaction/{txHash}/receipt
```

**Parameters:**
- `txHash` (string): Transaction hash

**Example:**
```bash
curl "http://localhost:3002/explorer/transaction/0x1234567890abcdef.../receipt"
```

### Account Operations

#### Get Account Balance
```http
GET /explorer/account/{address}/balance?blockNumber={blockNumber}
```

**Parameters:**
- `address` (string): Account address
- `blockNumber` (query, string): Block number or "latest" (default: "latest")

**Example:**
```bash
curl "http://localhost:3002/explorer/account/TOPAY_GENESIS_WALLET_000000000000/balance"
```

#### Get Transaction Count (Nonce)
```http
GET /explorer/account/{address}/nonce?blockNumber={blockNumber}
```

**Parameters:**
- `address` (string): Account address
- `blockNumber` (query, string): Block number or "latest" (default: "latest")

**Example:**
```bash
curl "http://localhost:3002/explorer/account/TOPAY_GENESIS_WALLET_000000000000/nonce"
```

#### Get Contract Code
```http
GET /explorer/account/{address}/code?blockNumber={blockNumber}
```

**Parameters:**
- `address` (string): Contract address
- `blockNumber` (query, string): Block number or "latest" (default: "latest")

**Example:**
```bash
curl "http://localhost:3002/explorer/account/0x1234567890abcdef.../code"
```

### Network Information

#### Get Network Info
```http
GET /explorer/network
```

**Example:**
```bash
curl "http://localhost:3002/explorer/network"
```

**Response:**
```json
{
  "success": true,
  "network": {
    "networkId": "0x1",
    "chainId": "0x1",
    "networkName": "TOPAY Foundation Network",
    "blockNumber": 2,
    "difficulty": 2,
    "totalBlocks": 3,
    "totalTransactions": 0,
    "chainValid": true,
    "hashingAlgorithm": "TOPAY-Z512",
    "consensusAlgorithm": "Proof of Work",
    "blockTime": 10,
    "timestamp": 1759343328579
  }
}
```

### Search Operations

#### Search Blockchain Data
```http
GET /explorer/search?q={query}
```

**Parameters:**
- `q` (query, string): Search query (block number, hash, or address)

**Example:**
```bash
curl "http://localhost:3002/explorer/search?q=0"
curl "http://localhost:3002/explorer/search?q=TOPAY_GENESIS_WALLET_000000000000"
```

### Recent Data

#### Get Recent Blocks
```http
GET /explorer/blocks/recent?limit={limit}
```

**Parameters:**
- `limit` (query, number): Number of blocks to return (default: 10, max: 100)

**Example:**
```bash
curl "http://localhost:3002/explorer/blocks/recent?limit=5"
```

#### Get Recent Transactions
```http
GET /explorer/transactions/recent?limit={limit}
```

**Parameters:**
- `limit` (query, number): Number of transactions to return (default: 10, max: 100)

**Example:**
```bash
curl "http://localhost:3002/explorer/transactions/recent?limit=5"
```

## JSON-RPC 2.0 Endpoint

### Standard JSON-RPC Methods
```http
POST /explorer/rpc
```

**Supported Methods:**
- `eth_blockNumber` - Get latest block number
- `eth_getBlockByNumber` - Get block by number
- `eth_getBlockByHash` - Get block by hash
- `eth_getTransactionByHash` - Get transaction by hash
- `eth_getTransactionReceipt` - Get transaction receipt
- `eth_getBalance` - Get account balance
- `eth_getTransactionCount` - Get transaction count
- `eth_getCode` - Get contract code
- `net_version` - Get network version
- `web3_clientVersion` - Get client version

**Example Request:**
```bash
curl -X POST "http://localhost:3002/explorer/rpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

**Example Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x2"
}
```

## Response Format

### Standard Response
All endpoints return responses in this format:

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message description"
}
```

### Block Response Format
```json
{
  "number": "0x0",
  "hash": "0x...",
  "parentHash": "0x...",
  "nonce": "0x0",
  "timestamp": "0x199a0cce6f1",
  "difficulty": "0x2",
  "size": 654,
  "gasLimit": "0x1c9c380",
  "gasUsed": "0x0",
  "miner": "TOPAY_GENESIS_WALLET_000000000000",
  "transactions": [],
  "transactionsRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "stateRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "receiptsRoot": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

### Transaction Response Format
```json
{
  "hash": "0x...",
  "blockNumber": "0x1",
  "blockHash": "0x...",
  "transactionIndex": "0x0",
  "from": "0x...",
  "to": "0x...",
  "value": "0x0",
  "gas": "0x5208",
  "gasPrice": "0x3b9aca00",
  "input": "0x",
  "nonce": "0x0",
  "v": "0x1c",
  "r": "0x0",
  "s": "0x0"
}
```

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get latest block
const getLatestBlock = async () => {
  const response = await axios.get('http://localhost:3002/explorer/block/latest');
  return response.data;
};

// Get block by number
const getBlock = async (blockNumber) => {
  const response = await axios.get(`http://localhost:3002/explorer/block/number/${blockNumber}`);
  return response.data.block;
};

// Search blockchain
const search = async (query) => {
  const response = await axios.get(`http://localhost:3002/explorer/search?q=${query}`);
  return response.data;
};
```

### Python
```python
import requests

# Get network information
def get_network_info():
    response = requests.get('http://localhost:3002/explorer/network')
    return response.json()

# Get account balance
def get_balance(address):
    response = requests.get(f'http://localhost:3002/explorer/account/{address}/balance')
    return response.json()
```

### cURL Examples
```bash
# Get API documentation
curl "http://localhost:3002/explorer"

# Get genesis block
curl "http://localhost:3002/explorer/block/number/0"

# Get network status
curl "http://localhost:3002/explorer/network"

# Search for genesis wallet
curl "http://localhost:3002/explorer/search?q=TOPAY_GENESIS_WALLET_000000000000"

# Get recent blocks
curl "http://localhost:3002/explorer/blocks/recent?limit=3"
```

## Error Codes

- `400` - Bad Request (invalid parameters)
- `404` - Not Found (block/transaction/address not found)
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing rate limiting based on your requirements.

## Security Considerations

- This API is designed for development and testing
- For production use, implement proper authentication and authorization
- Consider using HTTPS for secure communication
- Validate all input parameters to prevent injection attacks

## Support

For questions or issues with the TOPAY Blockchain Explorer API, please refer to the main project documentation or contact the development team.