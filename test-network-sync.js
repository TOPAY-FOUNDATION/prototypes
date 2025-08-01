#!/usr/bin/env node

/**
 * TOPAY Network Synchronization Test Suite
 * Tests the synchronization between blockchain, validator, wallet, and block explorer
 */

const fetch = require('node-fetch');
const WebSocket = require('ws');

class NetworkSyncTester {
    constructor() {
        // Load environment variables
        require('dotenv').config();
        
        // Network configuration with environment variable support
        this.config = {
            blockchain: { port: process.env.BLOCKCHAIN_PORT || 3001, rpcPort: process.env.BLOCKCHAIN_RPC_PORT || 8545 },
            validator: { 
                port: process.env.VALIDATOR_PORT || 8547, 
                wsPort: process.env.VALIDATOR_WS_PORT || 8548 
            },
            wallet: { port: process.env.WALLET_PORT || 3000 },
            blockExplorer: { port: process.env.EXPLORER_PORT || 3002 }
        };
        
        this.testResults = [];
        this.wsConnections = [];
    }

    async runAllTests() {
        console.log('🧪 Starting TOPAY Network Synchronization Tests');
        console.log('═══════════════════════════════════════════════');

        try {
            // Test 1: Component Health Checks
            await this.testComponentHealth();
            
            // Test 2: RPC Communication
            await this.testRPCCommunication();
            
            // Test 3: WebSocket Connectivity
            await this.testWebSocketConnectivity();
            
            // Test 4: Transaction Synchronization
            await this.testTransactionSync();
            
            // Test 5: Block Mining Synchronization
            await this.testBlockMiningSync();
            
            // Test 6: Chain State Consistency
            await this.testChainStateConsistency();
            
            // Display Results
            this.displayTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        } finally {
            this.cleanup();
        }
    }

    async testComponentHealth() {
        console.log('\n📊 Testing Component Health...');
        
        const healthChecks = [
            { name: 'Blockchain RPC', url: `http://localhost:${this.config.blockchain.port}/health` },
            { name: 'Validator API', url: `http://localhost:${this.config.validator.port}/api/status` },
            { name: 'Wallet App', url: `http://localhost:${this.config.wallet.port}/api/health` },
            { name: 'Block Explorer', url: `http://localhost:${this.config.blockExplorer.port}/health` }
        ];

        for (const check of healthChecks) {
            try {
                const response = await fetch(check.url, { timeout: 5000 });
                const status = response.ok ? '✅ HEALTHY' : '⚠️ UNHEALTHY';
                console.log(`   ${check.name}: ${status}`);
                this.testResults.push({
                    test: `Health Check - ${check.name}`,
                    status: response.ok ? 'PASS' : 'FAIL',
                    details: `Status: ${response.status}`
                });
            } catch (error) {
                console.log(`   ${check.name}: ❌ OFFLINE`);
                this.testResults.push({
                    test: `Health Check - ${check.name}`,
                    status: 'FAIL',
                    details: error.message
                });
            }
        }
    }

    async testRPCCommunication() {
        console.log('\n🔗 Testing RPC Communication...');
        
        const rpcTests = [
            { method: 'topay_getChainInfo', params: [] },
            { method: 'topay_getBlockNumber', params: [] },
            { method: 'topay_getMempool', params: [] },
            { method: 'topay_getNetworkInfo', params: [] }
        ];

        for (const test of rpcTests) {
            try {
                const response = await this.makeRPCCall(test.method, test.params);
                const status = response.result ? '✅ SUCCESS' : '❌ FAILED';
                console.log(`   ${test.method}: ${status}`);
                this.testResults.push({
                    test: `RPC - ${test.method}`,
                    status: response.result ? 'PASS' : 'FAIL',
                    details: JSON.stringify(response, null, 2)
                });
            } catch (error) {
                console.log(`   ${test.method}: ❌ ERROR`);
                this.testResults.push({
                    test: `RPC - ${test.method}`,
                    status: 'FAIL',
                    details: error.message
                });
            }
        }
    }

    async testWebSocketConnectivity() {
        console.log('\n🌐 Testing WebSocket Connectivity...');
        
        return new Promise((resolve) => {
            const wsUrl = `ws://localhost:${this.config.validator.wsPort}`;
            const ws = new WebSocket(wsUrl);
            
            const timeout = setTimeout(() => {
                console.log('   Validator WebSocket: ❌ TIMEOUT');
                this.testResults.push({
                    test: 'WebSocket - Validator',
                    status: 'FAIL',
                    details: 'Connection timeout'
                });
                ws.close();
                resolve();
            }, 5000);

            ws.on('open', () => {
                clearTimeout(timeout);
                console.log('   Validator WebSocket: ✅ CONNECTED');
                this.testResults.push({
                    test: 'WebSocket - Validator',
                    status: 'PASS',
                    details: 'Connection established'
                });
                this.wsConnections.push(ws);
                
                // Test message sending
                ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                resolve();
            });

            ws.on('error', (error) => {
                clearTimeout(timeout);
                console.log('   Validator WebSocket: ❌ ERROR');
                this.testResults.push({
                    test: 'WebSocket - Validator',
                    status: 'FAIL',
                    details: error.message
                });
                resolve();
            });
        });
    }

    async testTransactionSync() {
        console.log('\n💸 Testing Transaction Synchronization...');
        
        try {
            // Create a test transaction
            const txData = {
                from: 'test_address_1',
                to: 'test_address_2',
                amount: 100,
                timestamp: Date.now()
            };

            const response = await this.makeRPCCall('topay_sendTransaction', [txData]);
            
            if (response.result) {
                console.log('   Transaction Creation: ✅ SUCCESS');
                
                // Wait a bit for synchronization
                await this.sleep(2000);
                
                // Check if transaction appears in mempool
                const mempoolResponse = await this.makeRPCCall('topay_getMempool', []);
                const txInMempool = mempoolResponse.result && 
                    mempoolResponse.result.some(tx => tx.from === txData.from && tx.to === txData.to);
                
                const syncStatus = txInMempool ? '✅ SYNCED' : '⚠️ NOT SYNCED';
                console.log(`   Transaction Sync: ${syncStatus}`);
                
                this.testResults.push({
                    test: 'Transaction Synchronization',
                    status: txInMempool ? 'PASS' : 'FAIL',
                    details: `Transaction ${txInMempool ? 'found' : 'not found'} in mempool`
                });
            } else {
                throw new Error('Failed to create transaction');
            }
        } catch (error) {
            console.log('   Transaction Sync: ❌ FAILED');
            this.testResults.push({
                test: 'Transaction Synchronization',
                status: 'FAIL',
                details: error.message
            });
        }
    }

    async testBlockMiningSync() {
        console.log('\n⛏️ Testing Block Mining Synchronization...');
        
        try {
            // Get current block number
            const initialResponse = await this.makeRPCCall('topay_getBlockNumber', []);
            const initialBlockNumber = initialResponse.result || 0;
            
            // Mine a new block
            const mineResponse = await this.makeRPCCall('topay_mine', []);
            
            if (mineResponse.result) {
                console.log('   Block Mining: ✅ SUCCESS');
                
                // Wait for synchronization
                await this.sleep(3000);
                
                // Check if block number increased
                const newResponse = await this.makeRPCCall('topay_getBlockNumber', []);
                const newBlockNumber = newResponse.result || 0;
                
                const syncStatus = newBlockNumber > initialBlockNumber ? '✅ SYNCED' : '⚠️ NOT SYNCED';
                console.log(`   Block Number Sync: ${syncStatus} (${initialBlockNumber} → ${newBlockNumber})`);
                
                this.testResults.push({
                    test: 'Block Mining Synchronization',
                    status: newBlockNumber > initialBlockNumber ? 'PASS' : 'FAIL',
                    details: `Block number: ${initialBlockNumber} → ${newBlockNumber}`
                });
            } else {
                throw new Error('Failed to mine block');
            }
        } catch (error) {
            console.log('   Block Mining Sync: ❌ FAILED');
            this.testResults.push({
                test: 'Block Mining Synchronization',
                status: 'FAIL',
                details: error.message
            });
        }
    }

    async testChainStateConsistency() {
        console.log('\n🔗 Testing Chain State Consistency...');
        
        try {
            const chainInfo = await this.makeRPCCall('topay_getChainInfo', []);
            
            if (chainInfo.result) {
                const { blockCount, isValid, totalTransactions } = chainInfo.result;
                console.log(`   Chain Info: ✅ Retrieved`);
                console.log(`     - Blocks: ${blockCount}`);
                console.log(`     - Valid: ${isValid ? '✅' : '❌'}`);
                console.log(`     - Transactions: ${totalTransactions}`);
                
                this.testResults.push({
                    test: 'Chain State Consistency',
                    status: isValid ? 'PASS' : 'FAIL',
                    details: `Blocks: ${blockCount}, Valid: ${isValid}, Transactions: ${totalTransactions}`
                });
            } else {
                throw new Error('Failed to get chain info');
            }
        } catch (error) {
            console.log('   Chain State: ❌ FAILED');
            this.testResults.push({
                test: 'Chain State Consistency',
                status: 'FAIL',
                details: error.message
            });
        }
    }

    async makeRPCCall(method, params) {
        const response = await fetch(`http://localhost:${this.config.blockchain.port}/rpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method,
                params,
                id: Date.now()
            })
        });
        
        return await response.json();
    }

    displayTestResults() {
        console.log('\n📋 Test Results Summary');
        console.log('═══════════════════════════════════════');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(test => {
                    console.log(`   • ${test.test}: ${test.details}`);
                });
        }
        
        console.log('\n' + (failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed. Check network configuration.'));
    }

    cleanup() {
        // Close WebSocket connections
        this.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new NetworkSyncTester();
    tester.runAllTests().catch(console.error);
}

module.exports = NetworkSyncTester;