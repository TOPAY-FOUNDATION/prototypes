# TOPAY Validator Code System

## Overview

The TOPAY blockchain now uses a **code-based validator system** instead of direct URL connections. This provides better security, abstraction, and management of validator nodes.

## Key Features

### 🔐 Security Benefits

- **No Direct URL Exposure**: Validator URLs are abstracted behind secure codes
- **Access Control**: Only authorized codes can connect to validators
- **Dynamic URL Management**: URLs can be changed without affecting client code

### 🏛️ Validator Registry

- **Centralized Management**: All validators managed through a single registry
- **Health Monitoring**: Automatic health checks and status tracking
- **Load Balancing**: Intelligent selection of best validators for operations

### 📊 Performance Optimization

- **Response Time Tracking**: Monitors validator performance
- **Health Scoring**: Ranks validators based on reliability
- **Automatic Failover**: Switches to healthy validators when others fail

## Validator Code Format

```e
TOPAY-VAL-{REGION}-{NUMBER}
```

### Examples

- `TOPAY-VAL-LOCAL-001` - Local validator #1
- `TOPAY-VAL-PROD-001` - Production validator #1
- `TOPAY-VAL-TEST-001` - Test validator #1

## Configuration

### Environment Variables

```bash
# Validator Codes (New System)
VALIDATOR_CODES=TOPAY-VAL-LOCAL-001,TOPAY-VAL-LOCAL-002,TOPAY-VAL-LOCAL-003
PRIMARY_VALIDATOR_CODE=TOPAY-VAL-LOCAL-001

# Validator URLs (for registry mapping)
VALIDATOR_URLS=http://localhost:8547,http://localhost:8548,http://localhost:8549

# Registry Configuration
VALIDATOR_REGION=local
NETWORK_TIMEOUT=10000
MAX_RETRIES=3
RETRY_DELAY=1000
```

### Validator Registry Configuration

```javascript
import { ValidatorRegistry } from './src/storage/validator-registry.js';

const registry = new ValidatorRegistry({
    timeout: 10000,
    maxRetries: 3,
    retryDelay: 1000,
    healthCheckInterval: 30000
});

// Register validators
registry.registerValidator({
    code: 'TOPAY-VAL-LOCAL-001',
    name: 'Local Validator 1',
    url: 'http://localhost:8547',
    region: 'local',
    tier: 'primary'
});
```

## Usage Examples

### Basic Connection

```javascript
import { RemotePersistenceManager } from './src/storage/remote-persistence.js';

// Use validator codes instead of URLs
const persistence = new RemotePersistenceManager([
    'TOPAY-VAL-LOCAL-001',
    'TOPAY-VAL-LOCAL-002'
]);

await persistence.initialize();
```

### Advanced Configuration

```javascript
const persistence = new RemotePersistenceManager(
    ['TOPAY-VAL-PROD-001', 'TOPAY-VAL-PROD-002'],
    {
        timeout: 15000,
        maxRetries: 5,
        retryDelay: 2000,
        replicationFactor: 3,
        enableBackup: true,
        debugMode: false
    }
);
```

### Dynamic Validator Management

```javascript
// Add new validator
persistence.addValidator({
    code: 'TOPAY-VAL-NEW-001',
    name: 'New Validator',
    url: 'http://new-validator:8547',
    region: 'cloud',
    tier: 'secondary'
});

// Remove validator
persistence.removeValidator('TOPAY-VAL-OLD-001');

// Get validator status
const status = persistence.getValidatorStatus();
console.log('Active validators:', status.activeValidators);
```

## Validator Registry Features

### Health Monitoring

```javascript
// Automatic health checks every 30 seconds
registry.startHealthCheck();

// Manual health check
await registry.connectToValidator('TOPAY-VAL-LOCAL-001');

// Get health status
registry.displayHealthStatus();
```

### Best Validator Selection

```javascript
// Get best validators by health score
const bestValidators = registry.getBestValidators(2, 'health');

// Get best validators by response time
const fastestValidators = registry.getBestValidators(2, 'response');

// Get validators by tier (primary first)
const primaryValidators = registry.getBestValidators(2, 'tier');
```

### Data Operations

```javascript
// Save data to multiple validators
const results = await registry.saveToValidators(
    ['TOPAY-VAL-LOCAL-001', 'TOPAY-VAL-LOCAL-002'],
    '/api/blockchain',
    blockchainData
);

// Load data from best available validator
const data = await registry.loadFromValidators(
    ['TOPAY-VAL-LOCAL-001', 'TOPAY-VAL-LOCAL-002'],
    '/api/blockchain'
);
```

## Migration from URL System

### Old System (URLs)

```javascript
const persistence = new RemotePersistenceManager([
    'http://localhost:8547',
    'http://localhost:8548'
]);
```

### New System (Codes)

```javascript
const persistence = new RemotePersistenceManager([
    'TOPAY-VAL-LOCAL-001',
    'TOPAY-VAL-LOCAL-002'
]);
```

### Environment Variable Migration

**Before:**

```bash
VALIDATOR_NODES=http://localhost:8547,http://localhost:8548
PRIMARY_VALIDATOR=http://localhost:8547
```

**After:**

```bash
VALIDATOR_CODES=TOPAY-VAL-LOCAL-001,TOPAY-VAL-LOCAL-002
PRIMARY_VALIDATOR_CODE=TOPAY-VAL-LOCAL-001
VALIDATOR_URLS=http://localhost:8547,http://localhost:8548
```

## Testing

### Test Script

```bash
# Test the new validator code system
npm run test:remote-storage
```

### Test Configuration

```javascript
// test-remote-storage.js
const validatorCodes = [
    'TOPAY-VAL-LOCAL-001',
    'TOPAY-VAL-LOCAL-002'
];

const persistence = new RemotePersistenceManager(validatorCodes, {
    debugMode: true,
    timeout: 5000
});
```

## Benefits of Code System

### 1. **Security**

- URLs are not exposed in client code
- Access control through code validation
- Secure validator discovery

### 2. **Flexibility**

- Easy to change validator URLs without code changes
- Support for multiple environments (dev, test, prod)
- Dynamic validator registration

### 3. **Management**

- Centralized validator configuration
- Health monitoring and status tracking
- Automatic failover and load balancing

### 4. **Scalability**

- Easy to add/remove validators
- Support for validator tiers (primary, secondary)
- Regional validator support

## Troubleshooting

### Common Issues

1. **Validator Not Found**

   ```err
   Error: Connection timeout after 10000ms
   ```

   Error: Validator TOPAY-VAL-LOCAL-001 not found in registry

   ```err

   Error: Validator TOPAY-VAL-LOCAL-001 not found in registry

   ```err

   - Check if validator code is registered
   - Verify environment variables are set correctly

2. **No Active Validators**

   ```err
   Error: No active validators available
   ```

   - Check validator URLs are accessible
   - Verify network connectivity
   - Check validator service status

3. **Connection Timeout**

   ```err
   Error: Request timeout
   ```

   - Increase timeout value in configuration
   - Check validator response time
   - Verify network stability

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG_MODE=true
```

```javascript
const persistence = new RemotePersistenceManager(codes, {
    debugMode: true
});
```

## Future Enhancements

- **Validator Discovery**: Automatic validator discovery
- **Load Balancing**: Advanced load balancing algorithms
- **Encryption**: End-to-end encryption for validator communication
- **Monitoring**: Advanced monitoring and alerting
- **Clustering**: Validator clustering and sharding support

---

*This document describes the new validator code system for TOPAY blockchain. For more information, see the source code in `src/storage/validator-registry.js` and `src/storage/remote-persistence.js`.*
