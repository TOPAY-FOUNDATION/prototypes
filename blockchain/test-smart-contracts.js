/**
 * TOPAY Smart Contract Test Script
 * Tests the deployment and functionality of TOPAY token smart contracts
 */

import { ContractUtils } from './src/contracts/ContractUtils.js';

// Test addresses
const DEPLOYER_ADDRESS = 'TOPAYdeployer1234567890abcdef1234567890abcdef123';
const USER1_ADDRESS = 'TOPAYuser1234567890abcdef1234567890abcdef12345678';
const USER2_ADDRESS = 'TOPAYuser2234567890abcdef1234567890abcdef12345678';
const USER3_ADDRESS = 'TOPAYuser3234567890abcdef1234567890abcdef12345678';

class SmartContractTester {
  constructor() {
    this.contractUtils = new ContractUtils('http://localhost:8545/rpc');
    this.deployedContracts = [];
  }

  /**
   * Run all smart contract tests
   */
  async runAllTests() {
    try {
      console.log('🚀 Starting TOPAY Smart Contract Tests');
      console.log('=' .repeat(60));
      
      // Test 1: Basic contract deployment
      await this.testBasicDeployment();
      
      // Test 2: Token operations
      await this.testTokenOperations();
      
      // Test 3: Advanced token features
      await this.testAdvancedFeatures();
      
      // Test 4: Contract management
      await this.testContractManagement();
      
      // Test 5: Complete scenario
      await this.testCompleteScenario();
      
      console.log('\n🎉 All smart contract tests completed successfully!');
      console.log('=' .repeat(60));
      
    } catch (error) {
      console.error('❌ Smart contract tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Test basic contract deployment
   */
  async testBasicDeployment() {
    console.log('\n📋 Test 1: Basic Contract Deployment');
    console.log('-' .repeat(40));
    
    try {
      // Deploy a simple TOPAY token
      const deployment = await this.contractUtils.deployTOPAYToken(
        DEPLOYER_ADDRESS,
        'Basic TOPAY Token',
        'BTOPAY',
        50000,
        18
      );
      
      this.deployedContracts.push({
        name: 'Basic TOPAY Token',
        address: deployment.contractAddress,
        type: 'TOPAYToken'
      });
      
      // Verify deployment
      const contractInfo = await this.contractUtils.getTokenInfo(deployment.contractAddress);
      
      console.log('✅ Basic deployment test passed');
      console.log(`   Token Name: ${contractInfo.name}`);
      console.log(`   Token Symbol: ${contractInfo.symbol}`);
      console.log(`   Total Supply: ${contractInfo.totalSupply}`);
      
    } catch (error) {
      console.error('❌ Basic deployment test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test token operations
   */
  async testTokenOperations() {
    console.log('\n📋 Test 2: Token Operations');
    console.log('-' .repeat(40));
    
    try {
      // Deploy token for operations testing
      const deployment = await this.contractUtils.deployTOPAYToken(
        DEPLOYER_ADDRESS,
        'Operations TOPAY Token',
        'OTOPAY',
        100000,
        18
      );
      
      const contractAddress = deployment.contractAddress;
      this.deployedContracts.push({
        name: 'Operations TOPAY Token',
        address: contractAddress,
        type: 'TOPAYToken'
      });
      
      // Check deployer balance before transfer
      console.log('\n🔍 Checking deployer balance before transfer...');
      const initialDeployerBalance = await this.contractUtils.getTokenBalance(contractAddress, DEPLOYER_ADDRESS);
      console.log(`💰 Deployer balance: ${initialDeployerBalance}`);
      
      // Test transfer
      console.log('\n🔄 Testing token transfer...');
      await this.contractUtils.transferTokens(contractAddress, DEPLOYER_ADDRESS, USER1_ADDRESS, 5000);
      
      // Check balances
      const deployerBalance = await this.contractUtils.getTokenBalance(contractAddress, DEPLOYER_ADDRESS);
      const user1Balance = await this.contractUtils.getTokenBalance(contractAddress, USER1_ADDRESS);
      
      // Expected balances with 18 decimals: 100000 * 10^18 = 1e+23 initial supply
      const expectedDeployerBalance = 1e+23 - 5000; // 99999999999999999995000
      const expectedUser1Balance = 5000;
      
      if (deployerBalance === expectedDeployerBalance && user1Balance === expectedUser1Balance) {
        console.log('✅ Token transfer test passed');
      } else {
        throw new Error(`Balance mismatch: deployer=${deployerBalance}, user1=${user1Balance}`);
      }
      
      // Test approval and transferFrom
      console.log('\n🔄 Testing token approval and transferFrom...');
      await this.contractUtils.approveTokens(contractAddress, USER1_ADDRESS, USER2_ADDRESS, 2000);
      
      const allowance = await this.contractUtils.getTokenAllowance(contractAddress, USER1_ADDRESS, USER2_ADDRESS);
      if (allowance !== 2000) {
        throw new Error(`Allowance mismatch: expected 2000, got ${allowance}`);
      }
      
      await this.contractUtils.transferFromTokens(contractAddress, USER2_ADDRESS, USER1_ADDRESS, USER3_ADDRESS, 1500);
      
      const user3Balance = await this.contractUtils.getTokenBalance(contractAddress, USER3_ADDRESS);
      if (user3Balance !== 1500) {
        throw new Error(`TransferFrom failed: expected 1500, got ${user3Balance}`);
      }
      
      console.log('✅ Token operations test passed');
      
    } catch (error) {
      console.error('❌ Token operations test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test advanced token features
   */
  async testAdvancedFeatures() {
    console.log('\n📋 Test 3: Advanced Token Features');
    console.log('-' .repeat(40));
    
    try {
      // Deploy token for advanced testing
      const deployment = await this.contractUtils.deployTOPAYToken(
        DEPLOYER_ADDRESS,
        'Advanced TOPAY Token',
        'ATOPAY',
        75000,
        18
      );
      
      const contractAddress = deployment.contractAddress;
      this.deployedContracts.push({
        name: 'Advanced TOPAY Token',
        address: contractAddress,
        type: 'TOPAYToken'
      });
      
      // Test minting
      console.log('\n🏭 Testing token minting...');
      await this.contractUtils.mintTokens(contractAddress, DEPLOYER_ADDRESS, USER1_ADDRESS, 10000);
      
      const user1Balance = await this.contractUtils.getTokenBalance(contractAddress, USER1_ADDRESS);
      if (user1Balance !== 10000) {
        throw new Error(`Minting failed: expected 10000, got ${user1Balance}`);
      }
      
      // Test burning
      console.log('\n🔥 Testing token burning...');
      await this.contractUtils.burnTokens(contractAddress, USER1_ADDRESS, 3000);
      
      const user1BalanceAfterBurn = await this.contractUtils.getTokenBalance(contractAddress, USER1_ADDRESS);
      if (user1BalanceAfterBurn !== 7000) {
        throw new Error(`Burning failed: expected 7000, got ${user1BalanceAfterBurn}`);
      }
      
      console.log('✅ Advanced features test passed');
      
    } catch (error) {
      console.error('❌ Advanced features test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test contract management
   */
  async testContractManagement() {
    console.log('\n📋 Test 4: Contract Management');
    console.log('-' .repeat(40));
    
    try {
      // Get all contracts
      console.log('\n📋 Testing contract listing...');
      const allContracts = await this.contractUtils.getAllContracts();
      
      if (allContracts.length < this.deployedContracts.length) {
        throw new Error(`Contract count mismatch: expected at least ${this.deployedContracts.length}, got ${allContracts.length}`);
      }
      
      // Get contracts by type
      const topayTokens = await this.contractUtils.getContractsByType('TOPAYToken');
      
      if (topayTokens.length < this.deployedContracts.length) {
        throw new Error(`TOPAY token count mismatch: expected at least ${this.deployedContracts.length}, got ${topayTokens.length}`);
      }
      
      // Get contract details
      for (const contract of this.deployedContracts) {
        console.log(`\n🔍 Getting details for ${contract.name}...`);
        const details = await this.contractUtils.getContractDetails(contract.address);
        
        if (details.type !== contract.type) {
          throw new Error(`Contract type mismatch for ${contract.address}`);
        }
      }
      
      console.log('✅ Contract management test passed');
      
    } catch (error) {
      console.error('❌ Contract management test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test complete scenario
   */
  async testCompleteScenario() {
    console.log('\n📋 Test 5: Complete Token Scenario');
    console.log('-' .repeat(40));
    
    try {
      // Run the complete test scenario
      const result = await this.contractUtils.runTokenTestScenario(
        DEPLOYER_ADDRESS,
        USER1_ADDRESS,
        USER2_ADDRESS
      );
      
      if (!result.success) {
        throw new Error('Complete scenario test failed');
      }
      
      this.deployedContracts.push({
        name: 'Complete Scenario Token',
        address: result.contractAddress,
        type: 'TOPAYToken'
      });
      
      console.log('✅ Complete scenario test passed');
      
    } catch (error) {
      console.error('❌ Complete scenario test failed:', error.message);
      throw error;
    }
  }

  /**
   * Display test summary
   */
  displaySummary() {
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(60));
    console.log(`✅ Total contracts deployed: ${this.deployedContracts.length}`);
    console.log('\n📋 Deployed Contracts:');
    
    this.deployedContracts.forEach((contract, index) => {
      console.log(`   ${index + 1}. ${contract.name}`);
      console.log(`      Address: ${contract.address}`);
      console.log(`      Type: ${contract.type}`);
    });
    
    console.log('\n🎯 All tests completed successfully!');
    console.log('\n📝 You can now use these contract addresses for further testing:');
    this.deployedContracts.forEach(contract => {
      console.log(`   ${contract.name}: ${contract.address}`);
    });
  }
}

// Main execution
async function main() {
  try {
    console.log('🌟 TOPAY Foundation Smart Contract Testing Suite');
    console.log('🔗 Connecting to blockchain at http://localhost:8545');
    console.log('⏰ Started at:', new Date().toLocaleString());
    
    const tester = new SmartContractTester();
    
    // Wait a moment for blockchain to be ready
    console.log('\n⏳ Waiting for blockchain to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run all tests
    await tester.runAllTests();
    
    // Display summary
    tester.displaySummary();
    
    console.log('\n🎉 Smart contract testing completed successfully!');
    console.log('⏰ Completed at:', new Date().toLocaleString());
    
  } catch (error) {
    console.error('\n💥 Smart contract testing failed!');
    console.error('❌ Error:', error.message);
    console.error('⏰ Failed at:', new Date().toLocaleString());
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1].endsWith('test-smart-contracts.js')) {
  main().catch(console.error);
}

export { SmartContractTester };