#!/usr/bin/env node
/**
 * TOPAY Foundation Blockchain - Unified Main Entry Point
 * 
 * This file starts all blockchain services in a single process:
 * - Enhanced RPC Server (port 3001)
 * - Storage Client (port 3002) 
 * - Blockchain Remote (port 3000)
 * 
 * Usage: node main.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import all services
import { BlockchainRPCServer } from './src/blockchain-rpc-server.js';
import StorageClient from './storage-client.js';

class UnifiedBlockchainSystem {
    constructor() {
        this.services = {
            rpcServer: null,
            storageClient: null
        };
        this.isShuttingDown = false;
    }

    async start() {
        console.log('🚀 Starting TOPAY Unified Blockchain System');
        console.log('=' .repeat(60));
        
        try {
            // Start services in order
            await this.startRPCServer();
            await this.startStorageClient();
            
            console.log('\n✅ All blockchain services started successfully!');
            console.log('🌐 System Endpoints:');
            console.log('  📡 RPC Server: http://localhost:3001/rpc');
            console.log('  💾 Storage Client: http://localhost:3002');
            console.log('\n🎉 TOPAY Blockchain System is ready!');
            
            // Setup graceful shutdown
            this.setupGracefulShutdown();
            
        } catch (error) {
            console.error('❌ Failed to start blockchain system:', error);
            await this.shutdown();
            process.exit(1);
        }
    }

    async startStorageClient() {
        console.log('\n💾 Starting Storage Client...');
        try {
            this.services.storageClient = new StorageClient({
                port: 3002,
                dataPath: './storage-data',
                blockchainUrl: 'http://localhost:3001',
                registrationInterval: 5000 // Register every 5 seconds
            });
            
            await this.services.storageClient.start();
            console.log('✅ Storage Client started on port 3002');
            
        } catch (error) {
            console.error('❌ Failed to start Storage Client:', error);
            throw error;
        }
    }

    async startRPCServer() {
        console.log('\n📡 Starting RPC Server...');
        try {
            this.services.rpcServer = new BlockchainRPCServer(3001);
            await this.services.rpcServer.start();
            console.log('✅ RPC Server started on port 3001');
            
            // Wait a moment for RPC to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error('❌ Failed to start RPC Server:', error);
            throw error;
        }
    }



    setupGracefulShutdown() {
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        
        signals.forEach(signal => {
            process.on(signal, async () => {
                if (this.isShuttingDown) return;
                
                console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
                await this.shutdown();
                process.exit(0);
            });
        });

        process.on('uncaughtException', async (error) => {
            console.error('❌ Uncaught Exception:', error);
            await this.shutdown();
            process.exit(1);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            await this.shutdown();
            process.exit(1);
        });
    }

    async shutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;
        
        console.log('\n🔄 Shutting down services...');
        
        // Shutdown services in reverse order
        const shutdownPromises = [];
        
        if (this.services.storageClient && typeof this.services.storageClient.stop === 'function') {
            shutdownPromises.push(
                this.services.storageClient.stop().catch(err => 
                    console.error('Error stopping Storage Client:', err)
                )
            );
        }
        
        if (this.services.rpcServer && typeof this.services.rpcServer.stop === 'function') {
            shutdownPromises.push(
                this.services.rpcServer.stop().catch(err => 
                    console.error('Error stopping RPC Server:', err)
                )
            );
        }
        
        await Promise.all(shutdownPromises);
        console.log('✅ All services shut down successfully');
    }
}

// Start the unified system
console.log('✅ Starting unified system...');
const system = new UnifiedBlockchainSystem();
system.start().catch(error => {
    console.error('❌ System startup failed:', error);
    process.exit(1);
});

export { UnifiedBlockchainSystem };