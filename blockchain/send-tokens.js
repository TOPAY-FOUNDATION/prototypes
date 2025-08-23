/**
 * Token Transfer Script
 * Sends TOPAY tokens from deployer to specified address
 */

import { ContractUtils } from './src/contracts/ContractUtils.js';

// Configuration
const DEPLOYER_ADDRESS = 'TOPAYdeployer1234567890abcdef1234567890abcdef123';
const RECIPIENT_ADDRESS = 'TO75A76EF148D21839EADAE5734873D26E93B97463PAY';
const AMOUNT_TO_SEND = 10000; // Amount of tokens to send

class TokenSender {
  constructor() {
    this.contractUtils = new ContractUtils('http://localhost:8545/rpc');
  }

  /**
   * Send tokens from deployer to recipient
   */
  async sendTokens() {
    try {
      console.log('🚀 Starting token transfer...');
      console.log('=' .repeat(50));
      console.log(`👤 From: ${DEPLOYER_ADDRESS}`);
      console.log(`🎯 To: ${RECIPIENT_ADDRESS}`);
      console.log(`💰 Amount: ${AMOUNT_TO_SEND} tokens`);
      console.log('');

      // First, get all deployed contracts to find the TOPAY token
      console.log('🔍 Finding TOPAY token contract...');
      const contracts = await this.contractUtils.getAllContracts();
      
      let tokenContract = null;
      for (const contract of contracts) {
        if (contract.type === 'TOPAYToken') {
          tokenContract = contract;
          break;
        }
      }

      if (!tokenContract) {
        console.log('❌ No TOPAY token contract found. Deploying new one...');
        
        // Deploy a new TOPAY token
        const deployment = await this.contractUtils.deployTOPAYToken(
          DEPLOYER_ADDRESS,
          'TOPAY Token',
          'TOPAY',
          1000000, // 1M total supply
          18 // 18 decimals
        );
        
        tokenContract = {
          address: deployment.contractAddress,
          type: 'TOPAYToken'
        };
        
        console.log(`✅ New TOPAY token deployed at: ${tokenContract.address}`);
      } else {
        console.log(`✅ Found TOPAY token at: ${tokenContract.address}`);
      }

      // Check deployer balance before transfer
      console.log('\n💰 Checking deployer balance...');
      const deployerBalance = await this.contractUtils.getTokenBalance(
        tokenContract.address,
        DEPLOYER_ADDRESS
      );
      console.log(`📊 Deployer balance: ${deployerBalance} tokens`);

      if (deployerBalance < AMOUNT_TO_SEND) {
        throw new Error(`Insufficient balance. Deployer has ${deployerBalance} tokens, but trying to send ${AMOUNT_TO_SEND}`);
      }

      // Check recipient balance before transfer
      console.log('\n🔍 Checking recipient balance before transfer...');
      const recipientBalanceBefore = await this.contractUtils.getTokenBalance(
        tokenContract.address,
        RECIPIENT_ADDRESS
      );
      console.log(`📊 Recipient balance before: ${recipientBalanceBefore} tokens`);

      // Perform the transfer
      console.log('\n💸 Executing token transfer...');
      const transferResult = await this.contractUtils.transferTokens(
        tokenContract.address,
        DEPLOYER_ADDRESS,
        RECIPIENT_ADDRESS,
        AMOUNT_TO_SEND
      );

      if (transferResult.result && transferResult.result.success) {
        console.log('✅ Transfer completed successfully!');
        console.log(`🔗 Transaction Hash: ${transferResult.transactionHash}`);
        console.log(`⛽ Gas Used: ${transferResult.gasUsed}`);
      } else {
        throw new Error(`Transfer failed: ${transferResult.result?.error || 'Unknown error'}`);
      }

      // Check balances after transfer
      console.log('\n📊 Checking balances after transfer...');
      const deployerBalanceAfter = await this.contractUtils.getTokenBalance(
        tokenContract.address,
        DEPLOYER_ADDRESS
      );
      const recipientBalanceAfter = await this.contractUtils.getTokenBalance(
        tokenContract.address,
        RECIPIENT_ADDRESS
      );

      console.log(`👤 Deployer balance after: ${deployerBalanceAfter} tokens`);
      console.log(`🎯 Recipient balance after: ${recipientBalanceAfter} tokens`);
      console.log(`📈 Tokens transferred: ${recipientBalanceAfter - recipientBalanceBefore} tokens`);

      console.log('\n🎉 Token transfer completed successfully!');
      console.log('=' .repeat(50));
      
      return {
        success: true,
        contractAddress: tokenContract.address,
        transactionHash: transferResult.transactionHash,
        gasUsed: transferResult.gasUsed,
        amountTransferred: AMOUNT_TO_SEND,
        deployerBalanceAfter,
        recipientBalanceAfter
      };

    } catch (error) {
      console.error('❌ Token transfer failed:', error.message);
      console.error('⏰ Failed at:', new Date().toLocaleString());
      throw error;
    }
  }
}

// Execute the token transfer
async function main() {
  const sender = new TokenSender();
  
  try {
    await sender.sendTokens();
    process.exit(0);
  } catch (error) {
    console.error('💥 Script execution failed!');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();