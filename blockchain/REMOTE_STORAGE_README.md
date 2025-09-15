# TOPAY Blockchain Remote Storage System

This system allows the TOPAY blockchain to run on cloud services like Render, Heroku, or Vercel that don't provide persistent storage by using multiple distributed storage devices that connect to the blockchain server.

## Architecture Overview

```example
                    ┌─────────────────────┐
                    │   Blockchain Server │
                    │  (Cloud Service)    │
                    │                     │
                    │ - Device Registry   │
                    │ - Health Monitoring │
                    │ - Load Balancing    │
                    │ - Callback System   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼─────────┐ ┌────▼────┐ ┌────────▼────────┐
    │  Storage Device 1 │ │ Device 2│ │  Storage Device N│
    │                   │ │         │ │                 │
    │ - Auto-registers  │ │ - ...   │ │ - Capabilities  │
    │ - Health reports  │ │         │ │ - Load tracking │
    │ - Persistent data │ │         │ │ - Error handling│
    └───────────────────┘ └─────────┘ └─────────────────┘
```

**Key Features:**

- **Device-Initiated Connections**: Storage devices connect TO the blockchain server
- **Automatic Registration**: Devices register themselves with capabilities
- **Health Monitoring**: Continuous health checks and error tracking
- **Load Balancing**: Multiple strategies (round-robin, least-loaded, random)
- **Callback System**: Blockchain can request operations from specific devices
- **Fault Tolerance**: Automatic failover and device redundancy

## Components

### 1. Storage Client (`storage-client.js`)

Runs on your local device or dedicated server with persistent storage. **Connects TO the blockchain server.**

- **Purpose**: Provides distributed storage services for blockchain data
- **Features**:
  - **Auto-registration**: Connects and registers with blockchain server
  - **Capability reporting**: Declares supported operations and storage limits
  - **Health reporting**: Continuous health status updates
  - **Graceful shutdown**: Proper unregistration on exit
  - RESTful API for data operations
  - Block and transaction storage
  - State management
  - Backup creation
  - Statistics and monitoring

### 2. Remote Storage Adapter (`src/storage/RemoteStorageAdapter.js`)

Manages multiple storage devices with advanced orchestration capabilities.

- **Purpose**: Device registry and storage operation orchestration
- **Features**:
  - **Device Registry**: Manages connected storage devices
  - **Health Monitoring**: Continuous health checks with configurable intervals
  - **Load Balancing**: Multiple strategies (round-robin, least-loaded, random)
  - **Callback System**: Request operations from specific devices
  - **Fault Tolerance**: Automatic failover and error handling
  - **Device Statistics**: Track usage, errors, and performance metrics
  - Local caching for performance
  - Retry logic with exponential backoff

### 3. Remote Blockchain Server (`blockchain-remote.js`)

Stateless blockchain server with comprehensive device management.

- **Purpose**: Cloud-deployable blockchain server with distributed storage
- **Features**:
  - **Device Management Endpoints**: Registration, unregistration, monitoring
  - **Health Check System**: Manual and automatic device health verification
  - **Storage Operation Callbacks**: Request operations from registered devices
  - **Load Balancing**: Automatic device selection for operations
  - All standard blockchain operations
  - RESTful API with comprehensive endpoints
  - Real-time device monitoring and statistics

## Quick Start

### Step 1: Install Dependencies

```bash
cd blockchain
npm install
```

### Step 2: Configure Environment (Recommended)

```bash
# Copy and customize environment variables
cp .env.example .env
# Edit .env file with your preferred settings
```

### Step 3: Start Blockchain Server (Cloud Service or Local)

```bash
# Start the blockchain server (uses environment variables)
npm run blockchain-remote

# Or with custom configuration via command line
node blockchain-remote.js --port 3000
```

### Step 4: Start Storage Devices (Connect TO Blockchain)

### Option A: Using Environment Variables (Recommended)

```bash
# Start first storage device
STORAGE_PORT=3002 node storage-client.js

# Start additional storage devices for redundancy
STORAGE_PORT=3003 node storage-client.js
STORAGE_PORT=3004 node storage-client.js
```

### Option B: Using Command Line Arguments

```bash
# Start first storage device (connects to blockchain server)
node storage-client.js --port 3002 --blockchain-url http://localhost:3000

# Start additional storage devices for redundancy
node storage-client.js --port 3003 --blockchain-url http://localhost:3000 --device-id storage-device-2
node storage-client.js --port 3004 --blockchain-url http://localhost:3000 --device-id storage-device-3
```

### Step 5: Verify Device Registration

```bash
# Check registered devices
curl http://localhost:3000/api/storage/devices

# Check device monitoring
curl http://localhost:3000/api/storage/monitoring
```

### Step 6: Development Setup (All-in-One)

```bash
# Quick setup with environment variables
npm run env:dev        # Sets up .env and starts both services

# Individual services with environment setup
npm run env:blockchain # Sets up .env and starts blockchain server
npm run env:storage    # Sets up .env and starts storage client

# Manual environment setup
npm run setup-env      # Creates .env from .env.example

# Legacy commands (without environment setup)
npm run remote-setup   # Runs blockchain server + multiple storage devices
```

## Configuration

### Environment Variables

The system supports configuration through environment variables. Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

**Key Environment Variables:**

- `PORT`: Blockchain server port (default: 3000)
- `BLOCKCHAIN_URL`: Blockchain server URL for storage clients (default: <http://localhost:3000>)
- `STORAGE_PORT`: Storage client port (default: 3002)
- `HEALTH_CHECK_INTERVAL`: Device health check interval in ms (default: 30000)
- `MAX_DEVICE_ERRORS`: Max errors before marking device unhealthy (default: 3)
- `LOAD_BALANCING`: Load balancing strategy - round-robin, least-loaded, random (default: round-robin)
- `MAX_STORAGE_SIZE`: Maximum storage capacity in bytes (default: 10GB)
- `STORAGE_CAPABILITIES`: Comma-separated capabilities (default: store,retrieve,backup)

### Command Line Options (Legacy)

**Storage Client Options:**

```bash
node storage-client.js [options]

Options:
  --port <number>           Port to listen on (overrides STORAGE_PORT)
  --blockchain-url <url>    Blockchain server URL to connect to (overrides BLOCKCHAIN_URL)
  --device-id <string>      Unique device identifier (default: auto-generated)
  --data-dir <path>         Data storage directory (default: ./storage-data)
  --max-storage <size>      Maximum storage size in bytes (overrides MAX_STORAGE_SIZE)
  --capabilities <list>     Comma-separated capabilities (overrides STORAGE_CAPABILITIES)
```

**Blockchain Server Options:**

```bash
node blockchain-remote.js [options]

Options:
  --port <number>           Port to listen on (overrides PORT)
  --health-check-interval   Device health check interval in ms (overrides HEALTH_CHECK_INTERVAL)
  --max-device-errors       Max consecutive errors before marking unhealthy (overrides MAX_DEVICE_ERRORS)
  --load-balancing          Load balancing strategy: round-robin|least-loaded|random (overrides LOAD_BALANCING)
```

## API Reference

### Storage Client Endpoints

#### Health Check

```http
GET /health
```

Returns storage client health status.

#### Authentication

```http
POST /api/auth/register
Content-Type: application/json

{
  "blockchainId": "topay-blockchain-123",
  "signature": "hash_signature",
  "timestamp": 1234567890
}
```

#### Store Block

```http
POST /api/storage/block
Authorization: Bearer <token>
Content-Type: application/json

{
  "block": {
    "hash": "block_hash",
    "index": 1,
    "timestamp": 1234567890,
    "transactions": [...]
  }
}
```

#### Get Block

```http
GET /api/storage/block/:hash
Authorization: Bearer <token>
```

#### Storage Statistics

```http
GET /api/storage/stats
Authorization: Bearer <token>
```

### Blockchain Server Endpoints

#### Server Health Status

```http
GET /health
```

#### Blockchain Info

```http
GET /api/blockchain/info
```

#### Create Transaction

```http
POST /api/blockchain/transaction
Content-Type: application/json

{
  "from": "sender_address",
  "to": "recipient_address",
  "amount": 100,
  "privateKey": "sender_private_key"
}
```

#### Mine Block

```http
POST /api/blockchain/mine
Content-Type: application/json

{
  "minerAddress": "miner_address"
}
```

#### Get Balance

```http
GET /api/blockchain/balance/:address
```

### Device Management Endpoints (Blockchain Server)

#### Get Registered Devices

```http
GET /api/storage/devices
```

Returns list of all registered storage devices with their status and capabilities.

#### Device Registration (Called by Storage Client)

```http
POST /api/storage/register
Content-Type: application/json

{
  "deviceId": "storage-device-1",
  "url": "http://192.168.1.100:3002",
  "capabilities": ["store", "retrieve", "backup"],
  "maxStorage": 10737418240,
  "metadata": {
    "version": "1.0.0",
    "location": "home-server"
  }
}
```

#### Device Unregistration

```http
POST /api/storage/unregister
Content-Type: application/json

{
  "deviceId": "storage-device-1"
}
```

#### Device Monitoring

```http
GET /api/storage/monitoring
```

Returns comprehensive device statistics, health status, and load balancing information.

#### Manual Health Check (Specific Device)

```http
POST /api/storage/health-check/:deviceId
```

#### Manual Health Check (All Devices)

```http
POST /api/storage/health-check-all
```

### Storage Operation Callbacks (Blockchain Server)

#### Request Operation from Specific Device

```http
POST /api/storage/callback/:deviceId/:operation
Content-Type: application/json

{
  "data": {
    "block": {
      "hash": "block_hash",
      "index": 1,
      "timestamp": 1234567890
    }
  }
}
```

#### Broadcast Operation to All Capable Devices

```http
POST /api/storage/broadcast/:operation
Content-Type: application/json

{
  "data": { /* operation data */ },
  "capability": "store" // optional filter
}
```

#### Auto Storage Operation (Smart Device Selection)

```http
POST /api/storage/auto/:operation
Content-Type: application/json

{
  "data": { /* operation data */ },
  "capability": "backup" // optional requirement
}
```

**Supported Operations:**

- `store-block` - Store blockchain block
- `get-block` - Retrieve blockchain block
- `store-transaction` - Store transaction
- `get-transaction` - Retrieve transaction
- `store-state` - Store blockchain state
- `get-state` - Retrieve blockchain state
- `backup` - Create backup
- `stats` - Get device statistics

## Deployment Guide

### Deploy to Render

1. **Prepare your repository**:

   ```bash
   git add .
   git commit -m "Add distributed storage system"
   git push origin main
   ```

2. **Create Render service**:
   - Connect your GitHub repository
   - Set build command: `cd blockchain && npm install`
   - Set start command: `cd blockchain && npm run blockchain-remote`
   - Add environment variables:
     - `NODE_ENV`: production
     - `PORT`: 10000 (or Render's assigned port)
     - `HEALTH_CHECK_INTERVAL`: 60000
     - `LOAD_BALANCING`: least-loaded
     - `MAX_DEVICE_ERRORS`: 5
     - `CALLBACK_TIMEOUT`: 15000
     - `ENABLE_CALLBACKS`: true

3. **Configure storage devices**:
   - Run storage clients on your local machines or VPS servers
   - Configure each device to connect to your Render URL:

     ```bash
     # Using environment variables (recommended)
     BLOCKCHAIN_URL=https://your-app.onrender.com node storage-client.js
     
     # Or using command line arguments
     node storage-client.js --blockchain-url https://your-app.onrender.com
     ```

   - Devices will automatically register themselves
   - No need for static IPs - devices connect TO the blockchain

### Deploy to Heroku

1. **Install Heroku CLI and login**
2. **Create a new Heroku app:**

   ```bash
   heroku create your-topay-blockchain
   ```

3. **Set environment variables:**

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set HEALTH_CHECK_INTERVAL=60000
   heroku config:set LOAD_BALANCING=least-loaded
   heroku config:set MAX_DEVICE_ERRORS=5
   heroku config:set CALLBACK_TIMEOUT=15000
   heroku config:set ENABLE_CALLBACKS=true
   heroku config:set DEVICE_TIMEOUT=12000
   ```

4. **Deploy:**

   ```bash
   git push heroku main
   ```

5. **Configure storage devices to connect to your Heroku app:**

   ```bash
   # Using environment variables (recommended)
   BLOCKCHAIN_URL=https://your-topay-blockchain.herokuapp.com node storage-client.js
   
   # Or using command line arguments
   node storage-client.js --blockchain-url https://your-topay-blockchain.herokuapp.com
   ```

### Deploy to Vercel

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json`**:

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "blockchain/blockchain-remote.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "blockchain/blockchain-remote.js"
       }
     ],
     "env": {
       "NODE_ENV": "production",
       "HEALTH_CHECK_INTERVAL": "60000",
       "LOAD_BALANCING": "least-loaded",
       "MAX_DEVICE_ERRORS": "5",
       "CALLBACK_TIMEOUT": "15000",
       "ENABLE_CALLBACKS": "true",
       "DEVICE_TIMEOUT": "10000",
       "MAX_CALLBACK_RETRIES": "3"
     }
   }
   ```

3. **Deploy**:

   ```bash
   vercel --prod
   ```

4. **Configure storage devices to connect to your Vercel deployment**:

   ```bash
   # Using environment variables (recommended)
   BLOCKCHAIN_URL=https://your-project.vercel.app node storage-client.js
   
   # Or using command line arguments
   node storage-client.js --blockchain-url https://your-project.vercel.app
   ```

## Security Considerations

### Device Authentication

- Storage devices authenticate with blockchain server during registration
- API key-based authentication for all operations
- Device identity verification and capability validation
- Automatic device deregistration on authentication failures

### Network Security

- Use HTTPS in production for all communications
- Implement proper firewall rules on storage devices
- Consider VPN for storage device access in sensitive environments
- Rate limiting on device registration and health check endpoints

### Device Management Security

- Health check system prevents compromised devices from serving data
- Automatic device isolation on consecutive failures
- Load balancing prevents single points of failure
- Callback system includes request validation and timeout protection

### Data Protection

- Regular backups are created automatically
- Data is stored in structured JSON format
- Implement encryption for sensitive data

## Monitoring and Maintenance

### Health Monitoring

```bash
# Check storage client health
curl http://your-storage-device:3002/health

# Check blockchain server health
curl http://your-blockchain-server:3000/health
```

### Storage Usage and Metrics

```bash
# Get detailed storage stats
curl -H "Authorization: Bearer <token>" \
     http://your-storage-device:3002/api/storage/stats
```

### Backup Management

```bash
# Create manual backup
curl -X POST -H "Authorization: Bearer <token>" \
     http://your-storage-device:3002/api/storage/backup
```

## Troubleshooting

### Common Issues

#### Connection Refused

```error
Error: Storage service not available at http://localhost:3002
```

**Solution**: Ensure storage client is running and accessible.

#### Authentication Failed

```error
Error: Unauthorized storage access
```

**Solution**: Check blockchain server authentication with storage client.

#### Network Timeout

```error
Error: Connection test failed: timeout of 5000ms exceeded
```

**Solution**: Check network connectivity and firewall settings.

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run blockchain-remote
DEBUG=* npm run storage-client
```

### Performance Optimization

1. **Increase cache size**:

   ```javascript
   const adapter = new RemoteStorageAdapter({
     cacheSize: 5000 // Increase from default 1000
   });
   ```

2. **Adjust retry settings**:

   ```javascript
   const adapter = new RemoteStorageAdapter({
     maxRetries: 3,
     retryDelay: 1000
   });
   ```

3. **Use compression** (future enhancement):
   - Implement gzip compression for large payloads
   - Use binary serialization for better performance

## Example Usage

### Complete Setup Example

1. **Terminal 1 - Storage Client**:

   ```bash
   cd blockchain
   node storage-client.js --port 3002
   ```

2. **Terminal 2 - Blockchain Server**:

   ```bash
   cd blockchain
   node blockchain-remote.js --port 3000 --storage-url http://localhost:3002
   ```

3. **Terminal 3 - Test Operations**:

   ```bash
   # Create wallet
   curl -X POST http://localhost:3000/api/wallet/create
   
   # Create transaction
   curl -X POST http://localhost:3000/api/blockchain/transaction \
        -H "Content-Type: application/json" \
        -d '{
          "from": "sender_address",
          "to": "recipient_address",
          "amount": 100,
          "privateKey": "private_key"
        }'
   
   # Mine block
   curl -X POST http://localhost:3000/api/blockchain/mine \
        -H "Content-Type: application/json" \
        -d '{"minerAddress": "miner_address"}'
   ```

## Future Enhancements

- [ ] Database backend support (PostgreSQL, MongoDB)
- [ ] Data compression and encryption
- [ ] Multi-storage client support (redundancy)
- [ ] WebSocket real-time synchronization
- [ ] Advanced caching strategies
- [ ] Metrics and alerting integration
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review logs for error details
3. Ensure network connectivity between components
4. Verify authentication tokens and signatures

---

**Note**: This remote storage system enables TOPAY blockchain deployment on any cloud service while maintaining data persistence through a separate storage device.
