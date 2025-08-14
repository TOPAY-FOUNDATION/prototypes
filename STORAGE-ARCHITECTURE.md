# TOPAY Blockchain Storage Architecture

## Problem Identified

### ❌ Previous Issue: Shared Data Directory

The original implementation had a critical design flaw where **all blockchain nodes shared the same data directory**:

```text
📁 Project Root
└── blockchain/data/blockchain.json  ← ALL NODES USED THIS
└── validator/data/blockchain.json   ← VALIDATOR ALSO USED THIS
```

**Problems with this approach:**

- 🚫 **Data Conflicts**: Multiple nodes overwriting each other's data
- 🚫 **No True Distribution**: All nodes had identical blockchain state
- 🚫 **Development Issues**: Impossible to test multiple nodes locally
- 🚫 **Production Problems**: Nodes couldn't maintain independent state
- 🚫 **Security Risk**: Shared storage defeats blockchain's distributed nature

## ✅ Solution: Node-Specific Storage Paths

### New Storage Architecture

Each node now gets its own unique storage directory based on:

- **Node ID**: Unique identifier for the node
- **Port**: Network port the node runs on
- **User Directory**: Stored in user's home directory (not project folder)

### Storage Path Generation

```javascript
function getNodeStoragePath(nodeId, port) {
  // Check for custom path in environment
  const envStoragePath = process.env.STORAGE_PATH;
  if (envStoragePath && envStoragePath.trim()) {
    return path.resolve(envStoragePath.trim());
  }
  
  // Generate node-specific path
  const homeDir = os.homedir();
  const nodeSpecificDir = `TOPAY-Blockchain-${nodeId}-${port}`;
  const defaultPath = path.join(homeDir, 'TOPAY-Blockchain', nodeSpecificDir, 'data');
  
  return defaultPath;
}
```

### Example Storage Paths

**Windows:**

```tree
C:\Users\YourName\TOPAY-Blockchain\
├── TOPAY-Blockchain-TOPAY-NODE-001-8545\data\
│   ├── blockchain.json
│   ├── wallets.json
│   └── config.json
├── TOPAY-Blockchain-TOPAY-NODE-002-8546\data\
│   ├── blockchain.json
│   ├── wallets.json
│   └── config.json
└── TOPAY-Blockchain-TOPAY-VALIDATOR-001-8547\data\
    ├── blockchain.json
    ├── wallets.json
    └── config.json
```

**Linux/macOS:**

```tree
/home/username/TOPAY-Blockchain/
├── TOPAY-Blockchain-TOPAY-NODE-001-8545/data/
├── TOPAY-Blockchain-TOPAY-NODE-002-8546/data/
└── TOPAY-Blockchain-TOPAY-VALIDATOR-001-8547/data/
```

## Configuration Options

### Environment Variables

Add to your `.env` file:

```bash
# Custom storage path (optional)
STORAGE_PATH=/path/to/custom/blockchain/data

# Node identification
NODE_ID=TOPAY-NODE-001
BLOCKCHAIN_PORT=8545
```

### Examples

**Development Setup:**

```bash
# Node 1
NODE_ID=TOPAY-NODE-001
BLOCKCHAIN_PORT=8545
# Uses: ~/TOPAY-Blockchain/TOPAY-Blockchain-TOPAY-NODE-001-8545/data/

# Node 2  
NODE_ID=TOPAY-NODE-002
BLOCKCHAIN_PORT=8546
# Uses: ~/TOPAY-Blockchain/TOPAY-Blockchain-TOPAY-NODE-002-8546/data/
```

**Production Setup:**

```bash
# Custom storage location
STORAGE_PATH=/var/lib/topay-blockchain/node-001
NODE_ID=TOPAY-PROD-001
BLOCKCHAIN_PORT=8545
```

## Benefits

### ✅ True Distributed Operation

- Each node maintains its own blockchain state
- Nodes can have different blockchain lengths and data
- Proper peer-to-peer synchronization possible

### ✅ Development Friendly

- Run multiple nodes locally without conflicts
- Test network synchronization scenarios
- Debug individual node behavior

### ✅ Production Ready

- Nodes can be deployed independently
- Each server maintains its own data
- Proper backup and recovery per node

### ✅ Security Enhanced

- No shared storage vulnerabilities
- Each node controls its own data
- Proper isolation between network participants

## Migration Guide

### For Existing Nodes

1. **Backup Current Data:**

   ```bash
   cp -r ./blockchain/data ./backup-blockchain-data
   cp -r ./validator/data ./backup-validator-data
   ```

2. **Update Configuration:**
   - Set `NODE_ID` and `BLOCKCHAIN_PORT` in `.env`
   - Optionally set custom `STORAGE_PATH`

3. **Restart Nodes:**
   - Nodes will automatically create new storage directories
   - Import existing data if needed

### For New Deployments

1. **Set Environment Variables:**

   ```bash
   export NODE_ID=TOPAY-NODE-001
   export BLOCKCHAIN_PORT=8545
   export STORAGE_PATH=/opt/topay/data  # Optional
   ```

2. **Start Node:**

   ```bash
   npm start
   ```

3. **Verify Storage Location:**
   - Check logs for "Node storage path" message
   - Confirm data is being saved to correct location

## Implementation Details

### Files Modified

1. **`blockchain/src/network-node.js`**
   - Added `getNodeStoragePath()` method
   - Updated constructor to use node-specific paths
   - Added imports for `os` and `path` modules

2. **`blockchain/.env.example`**
   - Added `STORAGE_PATH` configuration option
   - Added documentation and examples

### Code Changes

```javascript
// Before (shared storage)
this.localPersistence = new PersistenceManager('./data');

// After (node-specific storage)
const storagePath = this.getNodeStoragePath();
console.log(`💾 Node storage path: ${storagePath}`);
this.localPersistence = new PersistenceManager(storagePath);
```

## Testing

Run the storage path test to verify the implementation:

```bash
node test-storage-paths.js
```

This will show:

- Default storage paths for different node configurations
- Custom storage path functionality
- Comparison between old and new approaches

## Conclusion

This storage architecture fix resolves the fundamental issue where all nodes shared the same data directory. Now each node operates independently with its own storage, enabling true distributed blockchain operation while maintaining data integrity and security.

The solution is:

- **Backward Compatible**: Existing configurations continue to work
- **Configurable**: Custom storage paths via environment variables
- **Scalable**: Supports unlimited nodes without conflicts
- **Secure**: Proper data isolation between nodes
- **User-Friendly**: Sensible defaults with clear configuration options
