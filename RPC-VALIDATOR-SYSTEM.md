# RPC Validator Registration System

## Overview

The RPC Validator Registration System allows validators to dynamically register themselves with the blockchain by generating their own codes and sending them via RPC calls. This system makes the blockchain adaptable to validators rather than requiring pre-configured validator lists.

## Key Features

- **Dynamic Registration**: Validators can register themselves at runtime
- **Self-Generated Codes**: Validators generate their own unique codes
- **IP-Based URL Capture**: Blockchain captures the validator's IP and port automatically
- **Local Storage**: Validator information is stored in JSON files locally
- **Health Monitoring**: Automatic health checks and status updates
- **Graceful Unregistration**: Validators can cleanly unregister themselves

## Architecture

```demo
┌─────────────────┐    RPC Call     ┌─────────────────┐
│   Validator     │ ──────────────> │   Blockchain    │
│                 │                 │                 │
│ - Generates Code│                 │ - Captures IP   │
│ - Self Register │                 │ - Stores Info   │
│ - Status Updates│                 │ - Health Checks │
└─────────────────┘                 └─────────────────┘
```

## File Structure

```tree
blockchain/
├── src/
│   ├── rpc/
│   │   └── validator-registration-rpc.js    # RPC system for registration
│   └── storage/
│       └── validator-registry.js            # Enhanced registry with RPC
├── validator-registry.json                  # Local validator storage
└── example-rpc-validator-system.js         # Blockchain example

validator/
├── src/
│   └── rpc/
│       └── validator-client.js              # Validator self-registration
├── validator-info.json                      # Local validator info
└── example-validator-registration.js       # Validator example
```

## RPC Endpoints

### Blockchain Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rpc/validator/register` | Register a new validator |
| POST | `/rpc/validator/status` | Update validator status |
| GET | `/rpc/validator/list` | Get all registered validators |
| POST | `/rpc/validator/unregister` | Unregister a validator |

### Validator Registration Request

```json
{
  "code": "TOPAY-VAL-8547-ABC123",  // Optional: auto-generated if not provided
  "name": "My Validator Node",
  "port": 8547,
  "region": "us-east",
  "tier": "primary",
  "capabilities": ["storage", "validation", "consensus"],
  "metadata": {
    "version": "1.0.0",
    "nodeType": "validator"
  }
}
```

### Registration Response

```json
{
  "success": true,
  "message": "Validator registered successfully",
  "validator": {
    "code": "TOPAY-VAL-8547-ABC123",
    "name": "My Validator Node",
    "url": "http://192.168.1.100:8547/code/TOPAY-VAL-8547-ABC123",
    "status": "active",
    "registeredAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Usage Examples

### 1. Start the Blockchain with RPC System

```bash
cd blockchain
npm run example:rpc
```

This starts the blockchain server with RPC endpoints enabled on `http://localhost:3000`.

### 2. Start a Self-Registering Validator

```bash
cd validator
npm run example:register
```

This starts a validator that automatically:

- Generates a unique code
- Registers with the blockchain
- Starts sending periodic status updates

### 3. Manual Validator Registration

```bash
curl -X POST http://localhost:3000/rpc/validator/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual Validator",
    "port": 8549,
    "region": "eu-west",
    "tier": "secondary"
  }'
```

### 4. Check Registered Validators

```bash
curl http://localhost:3000/status
```

## Code Generation

Validators generate codes using this format:

```err
TOPAY-VAL-{PORT}-{TIMESTAMP}-{RANDOM}
```

Example: `TOPAY-VAL-8547-L2K9M3-A7B2C4`

## URL Structure

When a validator registers, the blockchain creates a URL:

```err
http://{VALIDATOR_IP}:{PORT}/code/{VALIDATOR_CODE}
```

Example: `http://192.168.1.100:8547/code/TOPAY-VAL-8547-L2K9M3-A7B2C4`

## Local Storage

### Blockchain Storage (`validator-registry.json`)

```json
{
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "totalValidators": 2,
  "validators": {
    "TOPAY-VAL-8547-ABC123": {
      "code": "TOPAY-VAL-8547-ABC123",
      "name": "Validator 1",
      "ip": "192.168.1.100",
      "port": 8547,
      "url": "http://192.168.1.100:8547/code/TOPAY-VAL-8547-ABC123",
      "status": "active",
      "healthScore": 95,
      "registeredAt": "2024-01-15T10:30:00.000Z",
      "lastSeen": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

### Validator Storage (`validator-info.json`)

```json
{
  "code": "TOPAY-VAL-8547-ABC123",
  "name": "My Validator",
  "port": 8547,
  "isRegistered": true,
  "registrationInfo": {
    "code": "TOPAY-VAL-8547-ABC123",
    "url": "http://192.168.1.100:8547/code/TOPAY-VAL-8547-ABC123",
    "status": "active"
  },
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

## Integration with Existing System

The RPC system integrates seamlessly with the existing validator registry:

```javascript
// Enhanced ValidatorRegistry with RPC support
const validatorRegistry = new ValidatorRegistry({
  enableRPC: true,  // Enable RPC registration
  rpcOptions: {
    maxValidators: 100,
    allowedIPs: [],  // Empty = allow all
    requireAuth: false
  }
});

// Setup RPC routes on Express app
validatorRegistry.setupRPCRoutes(app);

// Get all validators (includes RPC-registered ones)
const activeValidators = validatorRegistry.getActiveValidators();
```

## Security Features

- **IP Verification**: Only the registering IP can update/unregister
- **Code Uniqueness**: Prevents duplicate validator codes
- **Rate Limiting**: Maximum validator limits
- **Health Monitoring**: Automatic detection of offline validators
- **Graceful Cleanup**: Proper unregistration process

## Benefits

1. **Dynamic Scalability**: Add validators without blockchain restart
2. **Self-Management**: Validators manage their own lifecycle
3. **Automatic Discovery**: No manual configuration required
4. **Real-time Updates**: Live status monitoring
5. **Fault Tolerance**: Automatic handling of validator failures
6. **Simple Integration**: Easy to add to existing systems

## Environment Variables

### Blockchain

```bash
PORT=3000                    # Blockchain server port
VALIDATOR_MAX_COUNT=100      # Maximum allowed validators
VALIDATOR_HEALTH_INTERVAL=30000  # Health check interval (ms)
```

### Validator

```bash
VALIDATOR_PORT=8547          # Validator server port
BLOCKCHAIN_URL=http://localhost:3000  # Blockchain RPC URL
VALIDATOR_NAME="My Validator"  # Validator display name
VALIDATOR_REGION="local"     # Validator region
VALIDATOR_TIER="secondary"   # Validator tier (primary/secondary)
```

## Testing the System

1. **Start Blockchain**:

   ```bash
   cd blockchain
   npm run example:rpc
   ```

2. **Start Multiple Validators**:

   ```bash
   # Terminal 1
   cd validator
   VALIDATOR_PORT=8547 npm run example:register
   
   # Terminal 2
   cd validator
   VALIDATOR_PORT=8548 npm run example:register
   
   # Terminal 3
   cd validator
   VALIDATOR_PORT=8549 npm run example:register
   ```

3. **Check Status**:

   ```bash
   curl http://localhost:3000/status
   ```

4. **Monitor Validators**:

   ```bash
   curl http://localhost:8547/status
   curl http://localhost:8548/status
   curl http://localhost:8549/status
   ```

## Error Handling

The system handles various error scenarios:

- **Duplicate Codes**: Returns 409 Conflict
- **IP Mismatch**: Returns 403 Forbidden  
- **Validator Not Found**: Returns 404 Not Found
- **Max Validators**: Returns 429 Too Many Requests
- **Network Errors**: Automatic retry with exponential backoff

## Future Enhancements

- **Authentication**: JWT-based validator authentication
- **Load Balancing**: Intelligent validator selection
- **Clustering**: Multi-blockchain support
- **Metrics**: Advanced performance monitoring
- **Auto-scaling**: Dynamic validator provisioning

This RPC system transforms the blockchain from a static validator configuration to a dynamic, self-organizing network where validators can join and leave seamlessly.
