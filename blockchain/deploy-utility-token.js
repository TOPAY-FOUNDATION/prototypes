/**
 * TOPAY Utility Token Deployment Script
 * Deploys the TOPAY (TPY) utility token for blockchain operations
 */

import { ContractUtils } from './src/contracts/ContractUtils.js';

// Configuration for TOPAY utility token
const TOKEN_CONFIG = {
  name: 'TOPAY Token',
  symbol: 'TPY',
  totalSupply: 2000000000, // 2 billion tokens as per whitepaper
  decimals: 18,
  deployer: 'TOPAYdeployer1234567890abcdef1234567890abcdef123'
};

class UtilityTokenDeployer {
  constructor() {
    this.contractUtils = new ContractUtils('http://localhost:8545/rpc');
  }

  /**
   * Deploy TOPAY utility token
   */
  async deployUtilityToken() {
    try {
      console.log('🚀 Deploying TOPAY Utility Token...');
      console.log('=' .repeat(60));
      console.log(`📛 Token Name: ${TOKEN_CONFIG.name}`);
      console.log(`🏷️  Token Symbol: ${TOKEN_CONFIG.symbol}`);
      console.log(`💰 Total Supply: ${TOKEN_CONFIG.totalSupply.toLocaleString()} tokens`);
      console.log(`🔢 Decimals: ${TOKEN_CONFIG.decimals}`);
      console.log(`👤 Deployer: ${TOKEN_CONFIG.deployer}`);
      console.log('');

      // Deploy the utility token
      const deployment = await this.contractUtils.deployTOPAYToken(
        TOKEN_CONFIG.deployer,
        TOKEN_CONFIG.name,
        TOKEN_CONFIG.symbol,
        TOKEN_CONFIG.totalSupply,
        TOKEN_CONFIG.decimals
      );

      console.log('✅ TOPAY Utility Token deployed successfully!');
      console.log('=' .repeat(60));
      console.log(`📍 Contract Address: ${deployment.contractAddress}`);
      console.log(`🔗 Transaction Hash: ${deployment.transactionHash}`);
      console.log(`⛽ Gas Used: ${deployment.gasUsed}`);
      console.log('');

      // Verify deployment by checking token details
      console.log('🔍 Verifying token deployment...');
      
      // Check deployer balance
      const deployerBalance = await this.contractUtils.getTokenBalance(
        deployment.contractAddress,
        TOKEN_CONFIG.deployer
      );
      
      console.log(`💰 Deployer Balance: ${deployerBalance.toLocaleString()} TPY`);
      
      // Get all contracts to verify it's registered
      const contracts = await this.contractUtils.getAllContracts();
      const utilityToken = contracts.find(c => c.address === deployment.contractAddress);
      
      if (utilityToken) {
        console.log('✅ Token successfully registered in contract registry');
        console.log(`📋 Contract Type: ${utilityToken.type}`);
      }

      console.log('');
      console.log('🎉 TOPAY Utility Token is ready for blockchain operations!');
      console.log('=' .repeat(60));
      console.log('🔧 Utility Token Use Cases:');
      console.log('   • Transaction fees payment');
      console.log('   • Validator staking and rewards');
      console.log('   • Smart contract gas fees');
      console.log('   • Network governance voting');
      console.log('   • Ecosystem incentives and rewards');
      console.log('=' .repeat(60));
      
      return {
        success: true,
        contractAddress: deployment.contractAddress,
        transactionHash: deployment.transactionHash,
        gasUsed: deployment.gasUsed,
        tokenConfig: TOKEN_CONFIG,
        deployerBalance
      };

    } catch (error) {
      console.error('❌ Utility token deployment failed:', error.message);
      console.error('⏰ Failed at:', new Date().toLocaleString());
      throw error;
    }
  }

  /**
   * Check if utility token already exists
   */
  async checkExistingToken() {
    try {
      console.log('🔍 Checking for existing TOPAY utility tokens...');
      
      const contracts = await this.contractUtils.getAllContracts();
      const topayTokens = contracts.filter(c => c.type === 'TOPAYToken');
      
      if (topayTokens.length > 0) {
        console.log(`📋 Found ${topayTokens.length} existing TOPAY token(s):`);
        for (const token of topayTokens) {
          console.log(`   📍 Address: ${token.address}`);
          console.log(`   📅 Deployed: ${new Date(token.deployedAt).toLocaleString()}`);
        }
        return topayTokens;
      } else {
        console.log('📭 No existing TOPAY tokens found.');
        return [];
      }
    } catch (error) {
      console.log('⚠️  Could not check existing tokens:', error.message);
      return [];
    }
  }
}

// Execute the deployment
async function main() {
  const deployer = new UtilityTokenDeployer();
  
  try {
    // Check for existing tokens first
    const existingTokens = await deployer.checkExistingToken();
    
    if (existingTokens.length > 0) {
      console.log('\n⚠️  Existing TOPAY tokens found. Deploying new utility token anyway...');
      console.log('💡 Note: Multiple token contracts can coexist for testing purposes.\n');
    }
    
    // Deploy the utility token
    const result = await deployer.deployUtilityToken();
    
    console.log('\n🎯 Deployment Summary:');
    console.log(`   Contract: ${result.contractAddress}`);
    console.log(`   Symbol: ${result.tokenConfig.symbol}`);
    console.log(`   Supply: ${result.tokenConfig.totalSupply.toLocaleString()}`);
    console.log(`   Balance: ${result.deployerBalance.toLocaleString()} TPY`);
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Script execution failed!');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();