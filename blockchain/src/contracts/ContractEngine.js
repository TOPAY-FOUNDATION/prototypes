/**
 * Smart Contract Execution Engine for TOPAY Blockchain
 * Manages contract deployment, execution, and state management
 */

import { TOPAYToken } from './TOPAYToken.js';
import crypto from 'crypto';

export class ContractEngine {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.contracts = new Map(); // contractAddress -> contract instance
    this.contractTypes = new Map(); // contractAddress -> contract type
    this.deployedContracts = new Map(); // contractAddress -> deployment info
    
    // Gas configuration
    this.gasConfig = {
      contractDeployment: 100000,
      functionCall: 21000,
      transfer: 21000,
      storageWrite: 5000,
      storageRead: 200
    };
    
    // Register available contract types
    this.registerContractType('TOPAYToken', TOPAYToken);
  }

  /**
   * Register a new contract type
   */
  registerContractType(name, contractClass) {
    this.contractTypes.set(name, contractClass);
    console.log(`📋 Registered contract type: ${name}`);
  }

  /**
   * Deploy a new contract
   */
  async deployContract(contractType, constructorArgs = [], deployerAddress, gasLimit = 100000) {
    try {
      // Validate contract type
      if (!this.contractTypes.has(contractType)) {
        throw new Error(`Unknown contract type: ${contractType}`);
      }
      
      // Generate contract address
      const contractAddress = this.generateContractAddress(deployerAddress, contractType);
      
      // Check if contract already exists
      if (this.contracts.has(contractAddress)) {
        throw new Error(`Contract already exists at address: ${contractAddress}`);
      }
      
      // Create contract instance
      const ContractClass = this.contractTypes.get(contractType);
      const contract = new ContractClass(...constructorArgs);
      
      // Initialize contract
      contract.initialize(deployerAddress, contractAddress);
      
      // Store contract
      this.contracts.set(contractAddress, contract);
      this.deployedContracts.set(contractAddress, {
        type: contractType,
        deployer: deployerAddress,
        deployedAt: Date.now(),
        constructorArgs,
        gasUsed: Math.min(gasLimit, this.gasConfig.contractDeployment)
      });
      
      console.log(`🚀 Contract deployed: ${contractType} at ${contractAddress}`);
      
      return {
        success: true,
        contractAddress,
        transactionHash: this.generateTransactionHash(deployerAddress, contractAddress, 'deploy'),
        gasUsed: Math.min(gasLimit, this.gasConfig.contractDeployment),
        contractInfo: contract.getInfo ? contract.getInfo() : {}
      };
      
    } catch (error) {
      console.error('❌ Contract deployment failed:', error.message);
      return {
        success: false,
        error: error.message,
        gasUsed: Math.min(gasLimit, this.gasConfig.contractDeployment)
      };
    }
  }

  /**
   * Call a contract function
   */
  async callContract(contractAddress, functionName, args = [], callerAddress, gasLimit = 21000) {
    try {
      console.log(`🔧 ContractEngine.callContract: ${functionName} on ${contractAddress}`);
      console.log(`📋 Args: [${args.join(', ')}], Caller: ${callerAddress}`);
      
      // Get contract
      const contract = this.contracts.get(contractAddress);
      if (!contract) {
        throw new Error(`Contract not found at address: ${contractAddress}`);
      }
      
      // Check if function exists
      if (typeof contract[functionName] !== 'function') {
        throw new Error(`Function ${functionName} not found in contract`);
      }
      
      // Calculate gas cost
      let gasUsed = this.gasConfig.functionCall;
      
      // Execute function
      console.log(`🚀 Calling contract.${functionName}(${callerAddress}, ${args.join(', ')})`);
      const result = await contract[functionName](callerAddress, ...args);
      console.log(`✅ Contract call result:`, result);
      
      // Handle different result types
      let response;
      if (typeof result === 'object' && result.success !== undefined) {
        // Function returned a transaction result
        response = {
          success: result.success,
          result: result,
          gasUsed: result.gasUsed || gasUsed,
          transactionHash: result.transactionHash || this.generateTransactionHash(callerAddress, contractAddress, functionName)
        };
      } else {
        // Function returned a value (view function)
        response = {
          success: true,
          result: result,
          gasUsed: this.gasConfig.storageRead,
          transactionHash: null // View functions don't generate transactions
        };
      }
      
      return response;
      
    } catch (error) {
      console.error(`❌ Contract call failed (${functionName}):`, error.message);
      return {
        success: false,
        error: error.message,
        gasUsed: Math.min(gasLimit, this.gasConfig.functionCall)
      };
    }
  }

  /**
   * Get contract information
   */
  getContract(contractAddress) {
    const contract = this.contracts.get(contractAddress);
    const deploymentInfo = this.deployedContracts.get(contractAddress);
    
    if (!contract || !deploymentInfo) {
      return null;
    }
    
    return {
      address: contractAddress,
      type: deploymentInfo.type,
      deployer: deploymentInfo.deployer,
      deployedAt: deploymentInfo.deployedAt,
      info: contract.getInfo ? contract.getInfo() : {},
      functions: this.getContractFunctions(contract)
    };
  }

  /**
   * Get all deployed contracts
   */
  getAllContracts() {
    const contracts = [];
    
    for (const [address, deploymentInfo] of this.deployedContracts.entries()) {
      const contract = this.contracts.get(address);
      contracts.push({
        address,
        type: deploymentInfo.type,
        deployer: deploymentInfo.deployer,
        deployedAt: deploymentInfo.deployedAt,
        info: contract && contract.getInfo ? contract.getInfo() : {}
      });
    }
    
    return contracts.sort((a, b) => b.deployedAt - a.deployedAt);
  }

  /**
   * Get contracts by type
   */
  getContractsByType(contractType) {
    return this.getAllContracts().filter(contract => contract.type === contractType);
  }

  /**
   * Get contracts by deployer
   */
  getContractsByDeployer(deployerAddress) {
    return this.getAllContracts().filter(contract => contract.deployer === deployerAddress);
  }

  /**
   * Generate contract address
   */
  generateContractAddress(deployerAddress, contractType) {
    const data = `${deployerAddress}${contractType}${Date.now()}${Math.random()}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `0x${hash.substring(0, 40)}`;
  }

  /**
   * Generate transaction hash
   */
  generateTransactionHash(from, to, action) {
    const data = `${from}${to}${action}${Date.now()}${Math.random()}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `0x${hash}`;
  }

  /**
   * Get available functions for a contract
   */
  getContractFunctions(contract) {
    const functions = [];
    const prototype = Object.getPrototypeOf(contract);
    const propertyNames = Object.getOwnPropertyNames(prototype);
    
    for (const name of propertyNames) {
      if (typeof contract[name] === 'function' && 
          name !== 'constructor' && 
          !name.startsWith('_') &&
          name !== 'serialize' &&
          name !== 'validate') {
        functions.push(name);
      }
    }
    
    return functions;
  }

  /**
   * Validate all contracts
   */
  validateAllContracts() {
    const results = [];
    
    for (const [address, contract] of this.contracts.entries()) {
      try {
        if (contract.validate) {
          contract.validate();
          results.push({ address, valid: true });
        } else {
          results.push({ address, valid: true, note: 'No validation method' });
        }
      } catch (error) {
        results.push({ address, valid: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Serialize all contracts for storage
   */
  serialize() {
    const serializedContracts = {};
    const serializedDeployments = {};
    
    for (const [address, contract] of this.contracts.entries()) {
      if (contract.serialize) {
        serializedContracts[address] = {
          type: this.deployedContracts.get(address).type,
          data: contract.serialize()
        };
      }
    }
    
    for (const [address, deploymentInfo] of this.deployedContracts.entries()) {
      serializedDeployments[address] = deploymentInfo;
    }
    
    return {
      contracts: serializedContracts,
      deployments: serializedDeployments,
      gasConfig: this.gasConfig,
      timestamp: Date.now()
    };
  }

  /**
   * Deserialize contracts from storage
   */
  deserialize(data) {
    try {
      // Clear existing contracts
      this.contracts.clear();
      this.deployedContracts.clear();
      
      // Restore gas config
      if (data.gasConfig) {
        this.gasConfig = { ...this.gasConfig, ...data.gasConfig };
      }
      
      // Restore deployments
      for (const [address, deploymentInfo] of Object.entries(data.deployments || {})) {
        this.deployedContracts.set(address, deploymentInfo);
      }
      
      // Restore contracts
      for (const [address, contractData] of Object.entries(data.contracts || {})) {
        const ContractClass = this.contractTypes.get(contractData.type);
        if (ContractClass && ContractClass.deserialize) {
          const contract = ContractClass.deserialize(contractData.data);
          this.contracts.set(address, contract);
        }
      }
      
      console.log(`📋 Restored ${this.contracts.size} contracts from storage`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to deserialize contracts:', error.message);
      return false;
    }
  }

  /**
   * Get contract engine statistics
   */
  getStats() {
    const contractsByType = {};
    
    for (const [address, deploymentInfo] of this.deployedContracts.entries()) {
      const type = deploymentInfo.type;
      contractsByType[type] = (contractsByType[type] || 0) + 1;
    }
    
    return {
      totalContracts: this.contracts.size,
      contractsByType,
      availableTypes: Array.from(this.contractTypes.keys()),
      gasConfig: this.gasConfig
    };
  }
}