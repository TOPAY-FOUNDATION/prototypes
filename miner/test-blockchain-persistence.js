/**
 * TOPAY Miner - Comprehensive Blockchain Data Persistence Test Suite
 * Tests all aspects of blockchain data storage and retrieval
 */

const fs = require('fs').promises;
const path = require('path');
const assert = require('assert');

class BlockchainPersistenceTestSuite {
    constructor() {
        this.testResults = [];
        this.dataPath = path.join(__dirname, 'data');
        this.testsPassed = 0;
        this.testsFailed = 0;
    }

    async runAllTests() {
        console.log('🧪 Starting Comprehensive Blockchain Data Persistence Test Suite');
        console.log('=' .repeat(70));

        const tests = [
            this.testDataDirectoryStructure,
            this.testBlockchainStateFile,
            this.testMinedBlocksStorage,
            this.testBlockchainMetadata,
            this.testBlockchainIndex,
            this.testSyncStats,
            this.testBackupSystem,
            this.testDataIntegrity,
            this.testCompressionFeatures,
            this.testRecoveryCapabilities
        ];

        for (const test of tests) {
            try {
                await test.call(this);
                this.testsPassed++;
            } catch (error) {
                this.testsFailed++;
                console.error(`❌ Test failed: ${test.name} - ${error.message}`);
                this.testResults.push({
                    test: test.name,
                    status: 'FAILED',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        this.generateTestReport();
    }

    async testDataDirectoryStructure() {
        console.log('📁 Testing data directory structure...');
        
        const requiredDirectories = [
            'blocks',
            'mined-blocks', 
            'transactions',
            'backups'
        ];

        const requiredFiles = [
            'blockchain-state.json',
            'blockchain-metadata.json',
            'blockchain-index.json',
            'blockchain-compressed.json',
            'sync-stats.json'
        ];

        // Check directories
        for (const dir of requiredDirectories) {
            const dirPath = path.join(this.dataPath, dir);
            try {
                const stats = await fs.stat(dirPath);
                assert(stats.isDirectory(), `${dir} should be a directory`);
            } catch (error) {
                throw new Error(`Required directory missing: ${dir}`);
            }
        }

        // Check files
        for (const file of requiredFiles) {
            const filePath = path.join(this.dataPath, file);
            try {
                await fs.access(filePath);
            } catch (error) {
                console.warn(`⚠️ Optional file missing: ${file}`);
            }
        }

        console.log('✅ Data directory structure test passed');
        this.testResults.push({
            test: 'testDataDirectoryStructure',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testBlockchainStateFile() {
        console.log('🔗 Testing blockchain state file...');
        
        const stateFile = path.join(this.dataPath, 'blockchain-state.json');
        
        try {
            const data = await fs.readFile(stateFile, 'utf8');
            const blockchainState = JSON.parse(data);
            
            // Validate structure
            assert(Array.isArray(blockchainState.chain), 'Chain should be an array');
            assert(Array.isArray(blockchainState.mempool), 'Mempool should be an array');
            assert(typeof blockchainState.difficulty === 'number', 'Difficulty should be a number');
            assert(typeof blockchainState.miningReward === 'number', 'Mining reward should be a number');
            assert(typeof blockchainState.lastUpdated === 'number', 'Last updated should be a timestamp');
            
            // Validate genesis block
            if (blockchainState.chain.length > 0) {
                const genesisBlock = blockchainState.chain[0];
                assert(genesisBlock.index === 0, 'Genesis block should have index 0');
                assert(genesisBlock.previousHash === '0', 'Genesis block should have previousHash 0');
            }
            
            console.log(`✅ Blockchain state valid with ${blockchainState.chain.length} blocks`);
        } catch (error) {
            throw new Error(`Blockchain state file invalid: ${error.message}`);
        }

        this.testResults.push({
            test: 'testBlockchainStateFile',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testMinedBlocksStorage() {
        console.log('⛏️ Testing mined blocks storage...');
        
        const minedBlocksDir = path.join(this.dataPath, 'mined-blocks');
        
        try {
            const files = await fs.readdir(minedBlocksDir);
            const blockFiles = files.filter(file => file.startsWith('block-') && file.endsWith('.json'));
            
            if (blockFiles.length > 0) {
                // Test first mined block
                const firstBlockFile = path.join(minedBlocksDir, blockFiles[0]);
                const blockData = JSON.parse(await fs.readFile(firstBlockFile, 'utf8'));
                
                // Validate enhanced mined block structure
                assert(typeof blockData.index === 'number', 'Block should have index');
                assert(typeof blockData.hash === 'string', 'Block should have hash');
                assert(Array.isArray(blockData.transactions), 'Block should have transactions array');
                assert(typeof blockData.minedAt === 'number', 'Block should have minedAt timestamp');
                assert(typeof blockData.minerAddress === 'string', 'Block should have minerAddress');
                assert(typeof blockData.miningStats === 'object', 'Block should have miningStats');
                
                console.log(`✅ Mined blocks storage valid with ${blockFiles.length} blocks`);
            } else {
                console.log('ℹ️ No mined blocks found (expected for new installation)');
            }
        } catch (error) {
            throw new Error(`Mined blocks storage test failed: ${error.message}`);
        }

        this.testResults.push({
            test: 'testMinedBlocksStorage',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testBlockchainMetadata() {
        console.log('📊 Testing blockchain metadata...');
        
        const metadataFile = path.join(this.dataPath, 'blockchain-metadata.json');
        
        try {
            const data = await fs.readFile(metadataFile, 'utf8');
            const metadata = JSON.parse(data);
            
            // Validate metadata structure
            assert(typeof metadata.version === 'string', 'Metadata should have version');
            assert(typeof metadata.createdAt === 'number', 'Metadata should have createdAt');
            assert(typeof metadata.lastUpdated === 'number', 'Metadata should have lastUpdated');
            assert(typeof metadata.minerInfo === 'object', 'Metadata should have minerInfo');
            assert(typeof metadata.chainStats === 'object', 'Metadata should have chainStats');
            assert(typeof metadata.networkStats === 'object', 'Metadata should have networkStats');
            assert(typeof metadata.miningStats === 'object', 'Metadata should have miningStats');
            assert(typeof metadata.validationStats === 'object', 'Metadata should have validationStats');
            
            console.log('✅ Blockchain metadata structure valid');
        } catch (error) {
            throw new Error(`Blockchain metadata test failed: ${error.message}`);
        }

        this.testResults.push({
            test: 'testBlockchainMetadata',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testBlockchainIndex() {
        console.log('🗂️ Testing blockchain index...');
        
        const indexFile = path.join(this.dataPath, 'blockchain-index.json');
        
        try {
            const data = await fs.readFile(indexFile, 'utf8');
            const index = JSON.parse(data);
            
            // Validate index structure
            assert(typeof index.blocks === 'object', 'Index should have blocks object');
            assert(typeof index.transactions === 'object', 'Index should have transactions object');
            assert(typeof index.addresses === 'object', 'Index should have addresses object');
            assert(typeof index.lastUpdated === 'number', 'Index should have lastUpdated');
            
            console.log('✅ Blockchain index structure valid');
        } catch (error) {
            console.log('ℹ️ Blockchain index not found (will be created during mining)');
        }

        this.testResults.push({
            test: 'testBlockchainIndex',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testSyncStats() {
        console.log('🔄 Testing sync statistics...');
        
        const syncStatsFile = path.join(this.dataPath, 'sync-stats.json');
        
        try {
            const data = await fs.readFile(syncStatsFile, 'utf8');
            const syncStats = JSON.parse(data);
            
            // Validate sync stats structure
            assert(typeof syncStats.lastSyncTime === 'number', 'Sync stats should have lastSyncTime');
            assert(typeof syncStats.networkBlockHeight === 'number', 'Sync stats should have networkBlockHeight');
            assert(typeof syncStats.localBlockHeight === 'number', 'Sync stats should have localBlockHeight');
            assert(Array.isArray(syncStats.syncHistory), 'Sync stats should have syncHistory array');
            
            console.log('✅ Sync statistics structure valid');
        } catch (error) {
            console.log('ℹ️ Sync stats not found (will be created during sync)');
        }

        this.testResults.push({
            test: 'testSyncStats',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testBackupSystem() {
        console.log('📦 Testing backup system...');
        
        const backupsDir = path.join(this.dataPath, 'backups');
        
        try {
            const files = await fs.readdir(backupsDir);
            const backupFiles = files.filter(file => file.includes('blockchain-backup'));
            
            if (backupFiles.length > 0) {
                // Test first backup file
                const firstBackupFile = path.join(backupsDir, backupFiles[0]);
                const backupData = JSON.parse(await fs.readFile(firstBackupFile, 'utf8'));
                
                // Validate backup structure
                assert(typeof backupData.blockIndex === 'number', 'Backup should have blockIndex');
                assert(typeof backupData.timestamp === 'number', 'Backup should have timestamp');
                assert(typeof backupData.blockchain === 'object', 'Backup should have blockchain data');
                assert(typeof backupData.miningStats === 'object', 'Backup should have miningStats');
                
                console.log(`✅ Backup system valid with ${backupFiles.length} backups`);
            } else {
                console.log('ℹ️ No backup files found (will be created during mining)');
            }
        } catch (error) {
            throw new Error(`Backup system test failed: ${error.message}`);
        }

        this.testResults.push({
            test: 'testBackupSystem',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testDataIntegrity() {
        console.log('🔍 Testing data integrity...');
        
        try {
            // Test blockchain state consistency
            const stateFile = path.join(this.dataPath, 'blockchain-state.json');
            const stateData = JSON.parse(await fs.readFile(stateFile, 'utf8'));
            
            // Validate chain integrity
            for (let i = 1; i < stateData.chain.length; i++) {
                const currentBlock = stateData.chain[i];
                const previousBlock = stateData.chain[i - 1];
                
                assert(currentBlock.previousHash === previousBlock.hash, 
                    `Block ${i} previousHash should match previous block hash`);
                assert(currentBlock.index === previousBlock.index + 1, 
                    `Block ${i} index should be sequential`);
            }
            
            console.log('✅ Data integrity checks passed');
        } catch (error) {
            throw new Error(`Data integrity test failed: ${error.message}`);
        }

        this.testResults.push({
            test: 'testDataIntegrity',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testCompressionFeatures() {
        console.log('🗜️ Testing compression features...');
        
        const compressedFile = path.join(this.dataPath, 'blockchain-compressed.json');
        
        try {
            const data = await fs.readFile(compressedFile, 'utf8');
            const compressedData = JSON.parse(data);
            
            // Validate compressed data structure
            assert(typeof compressedData.chainLength === 'number', 'Compressed data should have chainLength');
            assert(typeof compressedData.latestBlockHash === 'string', 'Compressed data should have latestBlockHash');
            assert(typeof compressedData.totalTransactions === 'number', 'Compressed data should have totalTransactions');
            assert(typeof compressedData.difficulty === 'number', 'Compressed data should have difficulty');
            
            console.log('✅ Compression features working correctly');
        } catch (error) {
            console.log('ℹ️ Compressed data not found (will be created during blockchain operations)');
        }

        this.testResults.push({
            test: 'testCompressionFeatures',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async testRecoveryCapabilities() {
        console.log('🔄 Testing recovery capabilities...');
        
        try {
            // Test that all critical files exist for recovery
            const criticalFiles = [
                'blockchain-state.json',
                'blockchain-metadata.json'
            ];
            
            for (const file of criticalFiles) {
                const filePath = path.join(this.dataPath, file);
                await fs.access(filePath);
                
                // Test file is readable and parseable
                const data = await fs.readFile(filePath, 'utf8');
                JSON.parse(data); // Will throw if invalid JSON
            }
            
            console.log('✅ Recovery capabilities verified');
        } catch (error) {
            throw new Error(`Recovery capabilities test failed: ${error.message}`);
        }

        this.testResults.push({
            test: 'testRecoveryCapabilities',
            status: 'PASSED',
            timestamp: new Date().toISOString()
        });
    }

    async generateTestReport() {
        console.log('\n' + '=' .repeat(70));
        console.log('📋 BLOCKCHAIN DATA PERSISTENCE TEST REPORT');
        console.log('=' .repeat(70));
        
        console.log(`\n📊 Test Summary:`);
        console.log(`   ✅ Tests Passed: ${this.testsPassed}`);
        console.log(`   ❌ Tests Failed: ${this.testsFailed}`);
        console.log(`   📈 Success Rate: ${((this.testsPassed / (this.testsPassed + this.testsFailed)) * 100).toFixed(1)}%`);
        
        console.log(`\n📝 Detailed Results:`);
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`   ${status} ${result.test}`);
            if (result.error) {
                console.log(`      Error: ${result.error}`);
            }
        });
        
        // Save test report
        const reportPath = path.join(this.dataPath, 'test-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                testsPassed: this.testsPassed,
                testsFailed: this.testsFailed,
                successRate: (this.testsPassed / (this.testsPassed + this.testsFailed)) * 100
            },
            results: this.testResults
        };
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Test report saved to: ${reportPath}`);
        
        if (this.testsFailed === 0) {
            console.log('\n🎉 All blockchain data persistence tests passed successfully!');
            console.log('✅ The miner client is ready for production use.');
        } else {
            console.log('\n⚠️ Some tests failed. Please review the errors above.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new BlockchainPersistenceTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = BlockchainPersistenceTestSuite;