#!/usr/bin/env node

/**
 * TOPAY Blockchain Workspace Startup Script
 * Starts both the blockchain RPC server and the wallet Next.js app
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from wallet directory
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), 'wallet-nextjs', '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`🚀 ${message}`, colors.bright + colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

async function startBlockchainServer() {
  return new Promise((resolve, reject) => {
    logHeader('Starting TOPAY Blockchain RPC Server');
    
    const serverPath = path.join(__dirname, 'src', 'blockchain-rpc-server.js');
    const server = spawn('node', [serverPath, '3001'], {
      stdio: 'pipe',
      cwd: __dirname
    });

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('TOPAY Blockchain RPC Server running')) {
        log('✅ Blockchain server started successfully!', colors.green);
        resolve(server);
      }
      log(`[BLOCKCHAIN] ${output.trim()}`, colors.blue);
    });

    server.stderr.on('data', (data) => {
      log(`[BLOCKCHAIN ERROR] ${data.toString().trim()}`, colors.red);
    });

    server.on('error', (error) => {
      log(`❌ Failed to start blockchain server: ${error.message}`, colors.red);
      reject(error);
    });

    server.on('close', (code) => {
      if (code !== 0) {
        log(`❌ Blockchain server exited with code ${code}`, colors.red);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!server.killed) {
        log('⏰ Blockchain server startup timeout', colors.yellow);
        resolve(server); // Still resolve to continue
      }
    }, 30000);
  });
}

async function startWalletApp() {
  return new Promise((resolve, reject) => {
    logHeader('Starting TOPAY Wallet Next.js App');
    
    const walletPath = path.join(__dirname, 'wallet-nextjs');
    const wallet = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      cwd: walletPath,
      shell: true
    });

    wallet.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('localhost:3000')) {
        log('✅ Wallet app started successfully!', colors.green);
        const walletUrl = process.env.NEXT_PUBLIC_WALLET_URL || 'http://localhost:3000';
        log(`🌐 Wallet URL: ${walletUrl}`, colors.bright + colors.green);
        resolve(wallet);
      }
      log(`[WALLET] ${output.trim()}`, colors.magenta);
    });

    wallet.stderr.on('data', (data) => {
      const output = data.toString();
      // Next.js outputs some info to stderr, so don't treat all as errors
      if (output.includes('Error') || output.includes('error')) {
        log(`[WALLET ERROR] ${output.trim()}`, colors.red);
      } else {
        log(`[WALLET] ${output.trim()}`, colors.magenta);
      }
    });

    wallet.on('error', (error) => {
      log(`❌ Failed to start wallet app: ${error.message}`, colors.red);
      reject(error);
    });

    wallet.on('close', (code) => {
      if (code !== 0) {
        log(`❌ Wallet app exited with code ${code}`, colors.red);
      }
    });
  });
}

async function main() {
  log(`
${colors.bright + colors.cyan}
████████╗ ██████╗ ██████╗  █████╗ ██╗   ██╗
╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
   ██║   ██║   ██║██████╔╝███████║ ╚████╔╝ 
   ██║   ██║   ██║██╔═══╝ ██╔══██║  ╚██╔╝  
   ██║   ╚██████╔╝██║     ██║  ██║   ██║   
   ╚═╝    ╚═════╝ ╚═╝     ╚═╝  ╚═╝   ╚═╝   
${colors.reset}
${colors.bright}TOPAY Foundation Quantum-Safe Blockchain${colors.reset}
${colors.yellow}Workspace Startup Script${colors.reset}
`);

  try {
    // Start blockchain server first
    const blockchainServer = await startBlockchainServer();
    
    // Wait a bit for the server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start wallet app
    const walletApp = await startWalletApp();
    
    logHeader('🎉 TOPAY Workspace Started Successfully!');
    log('📋 Services Running:', colors.bright);
    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:3001/rpc';
    const walletUrl = process.env.NEXT_PUBLIC_WALLET_URL || 'http://localhost:3000';
    const healthUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_HEALTH_URL || 'http://localhost:3001/health';
    log(`   🔗 Blockchain RPC Server: ${rpcUrl}`, colors.blue);
    log(`   💼 Wallet Application: ${walletUrl}`, colors.magenta);
    log(`   📊 Health Check: ${healthUrl}`, colors.cyan);
    log('\n💡 Press Ctrl+C to stop all services', colors.yellow);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down TOPAY Workspace...', colors.yellow);
      
      if (blockchainServer && !blockchainServer.killed) {
        blockchainServer.kill('SIGTERM');
        log('   ✅ Blockchain server stopped', colors.green);
      }
      
      if (walletApp && !walletApp.killed) {
        walletApp.kill('SIGTERM');
        log('   ✅ Wallet app stopped', colors.green);
      }
      
      log('👋 TOPAY Workspace stopped successfully!', colors.green);
      process.exit(0);
    });

    // Keep the script running
    await new Promise(() => {});
    
  } catch (error) {
    log(`❌ Failed to start TOPAY Workspace: ${error.message}`, colors.red);
    log('\n🔧 Troubleshooting:', colors.yellow);
    log('   1. Make sure you have Node.js installed', colors.reset);
    log('   2. Run "npm install" in both directories', colors.reset);
    log('   3. Check if ports 3000 and 3001 are available', colors.reset);
    process.exit(1);
  }
}

main().catch(console.error);