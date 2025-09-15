/**
 * Smart Contract Utilities for TOPAY Blockchain
 * Provides helper functions for contract deployment and interaction
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class ContractUtils {
  constructor(rpcUrl = process.env.CONTRACT_RPC_URL || 'http://localhost:8545/rpc') {
    this.rpcUrl = rpcUrl;
    this.requestId = 0;
  }

  /**
   * Make RPC call to blockchain
   */
  async rpcCall(method, params = []) {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: ++this.requestId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC error');
      }

      return data.result;
    } catch (error) {
      console.error(`RPC call failed for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Deploy a TOPAY token contract
   */
  async deployTOPAYToken(deployer, name, symbol, totalSupply, decimals = 18) {
    try {
      console.log(`🚀 Deploying TOPAY Token: ${name} (${symbol})`);
      console.log(`📊 Total Supply: ${totalSupply}, Decimals: ${decimals}`);
      console.log(`👤 Deployer: ${deployer}`);
      
      const result = await this.rpcCall('topay_deployContract', [{
        contractType: 'TOPAYToken',
        constructorArgs: [totalSupply, name, symbol, decimals],
        deployer: deployer,
        gasLimit: 200000
      }]);
      
      console.log(`✅ TOPAY Token deployed successfully!`);
      console.log(`📍 Contract Address: ${result.contractAddress}`);
      console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
      console.log(`⛽ Gas Used: ${result.gasUsed}`);
      
      return result;
    } catch (error) {
      console.error('❌ Token deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Transfer tokens
   */
  async transferTokens(contractAddress, from, to, amount) {
    try {
      console.log(`💸 Transferring ${amount} tokens from ${from} to ${to}`);
      
      const result = await this.rpcCall('topay_callContract', [{
        contractAddress,
        functionName: 'transfer',
        args: [to, amount],
        caller: from,
        gasLimit: 50000
      }]);
      
      if (result.result && result.result.success) {
        console.log(`✅ Transfer successful!`);
        console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
        console.log(`⛽ Gas Used: ${result.gasUsed}`);
      } else {
        console.log(`❌ Transfer failed: ${result.result?.error || 'Unknown error'}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Token transfer failed:', error.message);
      throw error;
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(contractAddress, address) {
    try {
      const result = await this.rpcCall('topay_callContract', [{
        contractAddress,
        functionName: 'balanceOf',
        args: [address],
        caller: 'anonymous'
      }]);
      
      const balance = result.result || 0;
      console.log(`💰 Balance of ${address}: ${balance} tokens`);
      
      return balance;
    } catch (error) {
      console.error('❌ Failed to get token balance:', error.message);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(contractAddress) {
    try {
      console.log(`📋 Getting token information for ${contractAddress}`);
      
      const [name, symbol, totalSupply, decimals] = await Promise.all([
        this.rpcCall('topay_callContract', [{
          contractAddress,
          functionName: 'name',
          args: [],
          caller: 'anonymous'
        }]),
        this.rpcCall('topay_callContract', [{
          contractAddress,
          functionName: 'symbol',
          args: [],
          caller: 'anonymous'
        }]),
        this.rpcCall('topay_callContract', [{
          contractAddress,
          functionName: 'totalSupply',
          args: [],
          caller: 'anonymous'
        }]),
        this.rpcCall('topay_callContract', [{
          contractAddress,
          functionName: 'decimals',
          args: [],
          caller: 'anonymous'
        }])
      ]);
      
      const tokenInfo = {
        address: contractAddress,
        name: name.result,
        symbol: symbol.result,
        totalSupply: totalSupply.result,
        decimals: decimals.result
      };
      
      console.log(`📊 Token Info:`, tokenInfo);
      
      return tokenInfo;
    } catch (error) {
      console.error('❌ Failed to get token info:', error.message);
      throw error;
    }
  }

  /**
   * Approve token spending
   */
  async approveTokens(contractAddress, owner, spender, amount) {
    try {
      console.log(`✅ Approving ${spender} to spend ${amount} tokens from ${owner}`);
      
      const result = await this.rpcCall('topay_callContract', [{
        contractAddress,
        functionName: 'approve',
        args: [spender, amount],
        caller: owner,
        gasLimit: 50000
      }]);
      
      if (result.result && result.result.success) {
        console.log(`✅ Approval successful!`);
        console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
      } else {
        console.log(`❌ Approval failed: ${result.result?.error || 'Unknown error'}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Token approval failed:', error.message);
      throw error;
    }
  }

  /**
   * Get token allowance
   */
  async getTokenAllowance(contractAddress, owner, spender) {
    try {
      const result = await this.rpcCall('topay_callContract', [{
        contractAddress,
        functionName: 'allowance',
        args: [owner, spender],
        caller: 'anonymous'
      }]);
      
      const allowance = result.result || 0;
      console.log(`🔒 Allowance from ${owner} to ${spender}: ${allowance} tokens`);
      
      return allowance;
    } catch (error) {
      console.error('❌ Failed to get token allowance:', error.message);
      throw error;
    }
  }

  /**
   * Transfer tokens from approved allowance
   */
  async transferFromTokens(contractAddress, spender, from, to, amount) {
    try {
      console.log(`💸 Transferring ${amount} tokens from ${from} to ${to} via ${spender}`);
      
      const result = await this.rpcCall('topay_callContract', [{
        contractAddress,
        functionName: 'transferFrom',
        args: [from, to, amount],
        caller: spender,
        gasLimit: 60000
      }]);
      
      if (result.result && result.result.success) {
        console.log(`✅ TransferFrom successful!`);
        console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
      } else {
        console.log(`❌ TransferFrom failed: ${result.result?.error || 'Unknown error'}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Token transferFrom failed:', error.message);
      throw error;
    }
  }

  /**
   * Mint new tokens (if caller is owner)
   */
  async mintTokens(contractAddress, owner, to, amount) {
    try {
      console.log(`🏭 Minting ${amount} tokens to ${to}`);
      
      const result = await this.rpcCall('topay_callContract', [{
        contractAddress,
        functionName: 'mint',
        args: [to, amount],
        caller: owner,
        gasLimit: 60000
      }]);
      
      if (result.result && result.result.success) {
        console.log(`✅ Minting successful!`);
        console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
      } else {
        console.log(`❌ Minting failed: ${result.result?.error || 'Unknown error'}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Token minting failed:', error.message);
      throw error;
    }
  }

  /**
   * Burn tokens
   */
  async burnTokens(contractAddress, from, amount) {
    try {
      console.log(`🔥 Burning ${amount} tokens from ${from}`);
      
      const result = await this.rpcCall('topay_callContract', [{
        contractAddress,
        functionName: 'burn',
        args: [amount],
        caller: from,
        gasLimit: 50000
      }]);
      
      if (result.result && result.result.success) {
        console.log(`✅ Burning successful!`);
        console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
      } else {
        console.log(`❌ Burning failed: ${result.result?.error || 'Unknown error'}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Token burning failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all deployed contracts
   */
  async getAllContracts() {
    try {
      const contracts = await this.rpcCall('topay_getAllContracts');
      
      console.log(`📋 Found ${contracts.length} deployed contracts:`);
      contracts.forEach((contract, index) => {
        console.log(`  ${index + 1}. ${contract.type} at ${contract.address}`);
        console.log(`     Deployer: ${contract.deployer}`);
        console.log(`     Deployed: ${new Date(contract.deployedAt).toLocaleString()}`);
      });
      
      return contracts;
    } catch (error) {
      console.error('❌ Failed to get contracts:', error.message);
      throw error;
    }
  }

  /**
   * Get contracts by type
   */
  async getContractsByType(contractType) {
    try {
      const contracts = await this.rpcCall('topay_getContractsByType', [contractType]);
      
      console.log(`📋 Found ${contracts.length} ${contractType} contracts:`);
      contracts.forEach((contract, index) => {
        console.log(`  ${index + 1}. ${contract.address}`);
        console.log(`     Deployer: ${contract.deployer}`);
        console.log(`     Deployed: ${new Date(contract.deployedAt).toLocaleString()}`);
      });
      
      return contracts;
    } catch (error) {
      console.error(`❌ Failed to get ${contractType} contracts:`, error.message);
      throw error;
    }
  }

  /**
   * Get contract details
   */
  async getContractDetails(contractAddress) {
    try {
      const contract = await this.rpcCall('topay_getContract', [contractAddress]);
      
      console.log(`📋 Contract Details:`);
      console.log(`   Address: ${contract.address}`);
      console.log(`   Type: ${contract.type}`);
      console.log(`   Deployer: ${contract.deployer}`);
      console.log(`   Deployed: ${new Date(contract.deployedAt).toLocaleString()}`);
      console.log(`   Functions: ${contract.functions.join(', ')}`);
      
      if (contract.info && Object.keys(contract.info).length > 0) {
        console.log(`   Info:`, contract.info);
      }
      
      return contract;
    } catch (error) {
      console.error('❌ Failed to get contract details:', error.message);
      throw error;
    }
  }

  /**
   * Create a sample TOPAY token for testing
   */
  async createSampleToken(deployer) {
    try {
      console.log(`🧪 Creating sample TOPAY token for testing...`);
      
      const result = await this.deployTOPAYToken(
        deployer,
        'TOPAY Foundation Token',
        'TOPAY',
        1000000, // 1 million tokens
        18
      );
      
      console.log(`🎉 Sample TOPAY token created successfully!`);
      console.log(`📍 Use this address for testing: ${result.contractAddress}`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to create sample token:', error.message);
      throw error;
    }
  }

  /**
   * Run a complete token test scenario
   */
  async runTokenTestScenario(deployer, user1, user2) {
    try {
      console.log(`\n🧪 Running complete TOPAY token test scenario...`);
      console.log(`👤 Deployer: ${deployer}`);
      console.log(`👤 User 1: ${user1}`);
      console.log(`👤 User 2: ${user2}`);
      
      // 1. Deploy token
      console.log(`\n📋 Step 1: Deploying TOPAY token...`);
      const deployment = await this.deployTOPAYToken(
        deployer,
        'Test TOPAY Token',
        'TTOPAY',
        100000,
        18
      );
      
      const contractAddress = deployment.contractAddress;
      
      // 2. Check initial balances
      console.log(`\n📋 Step 2: Checking initial balances...`);
      await this.getTokenBalance(contractAddress, deployer);
      await this.getTokenBalance(contractAddress, user1);
      await this.getTokenBalance(contractAddress, user2);
      
      // 3. Transfer tokens to user1
      console.log(`\n📋 Step 3: Transferring tokens to user1...`);
      await this.transferTokens(contractAddress, deployer, user1, 1000);
      
      // 4. Check balances after transfer
      console.log(`\n📋 Step 4: Checking balances after transfer...`);
      await this.getTokenBalance(contractAddress, deployer);
      await this.getTokenBalance(contractAddress, user1);
      
      // 5. Approve user2 to spend user1's tokens
      console.log(`\n📋 Step 5: Approving user2 to spend user1's tokens...`);
      await this.approveTokens(contractAddress, user1, user2, 500);
      
      // 6. Check allowance
      console.log(`\n📋 Step 6: Checking allowance...`);
      await this.getTokenAllowance(contractAddress, user1, user2);
      
      // 7. Transfer from user1 to user2 via allowance
      console.log(`\n📋 Step 7: Transferring via allowance...`);
      await this.transferFromTokens(contractAddress, user2, user1, user2, 200);
      
      // 8. Final balance check
      console.log(`\n📋 Step 8: Final balance check...`);
      await this.getTokenBalance(contractAddress, deployer);
      await this.getTokenBalance(contractAddress, user1);
      await this.getTokenBalance(contractAddress, user2);
      
      // 9. Get token info
      console.log(`\n📋 Step 9: Getting token information...`);
      await this.getTokenInfo(contractAddress);
      
      console.log(`\n🎉 Token test scenario completed successfully!`);
      
      return {
        success: true,
        contractAddress,
        message: 'All token operations completed successfully'
      };
      
    } catch (error) {
      console.error('❌ Token test scenario failed:', error.message);
      throw error;
    }
  }
}

// Export for use in other modules
export default ContractUtils;