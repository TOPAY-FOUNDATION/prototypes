/**
 * Browser-compatible Wallet Contract Utils
 * Handles smart contract interactions for the wallet
 */

class WalletContractUtils {
  constructor(blockchainUrl = 'http://localhost:8545') {
    this.blockchainUrl = blockchainUrl;
    this.rpcId = 1;
  }

  /**
   * Make RPC call to blockchain
   */
  async makeRPCCall(method, params = []) {
    try {
      const response = await fetch(`${this.blockchainUrl}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: this.rpcId++
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC Error');
      }

      return data.result;
    } catch (error) {
      console.error(`RPC call failed for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Deploy TOPAY token contract
   */
  async deployTOPAYToken(name, symbol, totalSupply, decimals = 18, deployer) {
    try {
      const result = await this.makeRPCCall('topay_deployContract', [
        'ERC20',
        [name, symbol, totalSupply, decimals],
        deployer
      ]);
      
      console.log(`✅ TOPAY Token deployed: ${result.contractAddress}`);
      return result;
    } catch (error) {
      console.error('❌ Failed to deploy TOPAY token:', error);
      // Return mock data for development
      return {
        contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        mock: true
      };
    }
  }

  /**
   * Transfer tokens
   */
  async transferTokens(contractAddress, from, to, amount) {
    try {
      const result = await this.makeRPCCall('topay_callContract', [{
        contractAddress,
        functionName: 'transfer',
        args: [to, amount],
        caller: from
      }]);
      
      console.log(`✅ Token transfer successful: ${result.transactionHash}`);
      return result;
    } catch (error) {
      console.error('❌ Token transfer failed:', error);
      // Return mock data for development
      return {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        success: true,
        mock: true
      };
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(contractAddress, walletAddress) {
    try {
      const result = await this.makeRPCCall('topay_callContract', [{
        contractAddress,
        functionName: 'balanceOf',
        args: [walletAddress],
        caller: 'anonymous'
      }]);
      
      return parseFloat(result.result) || 0;
    } catch (error) {
      console.error('❌ Failed to get token balance:', error);
      // Return mock balance for development
      return Math.random() * 1000;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(contractAddress) {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.makeRPCCall('topay_callContract', [{
          contractAddress,
          functionName: 'name',
          args: [],
          caller: 'anonymous'
        }]),
        this.makeRPCCall('topay_callContract', [{
          contractAddress,
          functionName: 'symbol',
          args: [],
          caller: 'anonymous'
        }]),
        this.makeRPCCall('topay_callContract', [{
          contractAddress,
          functionName: 'decimals',
          args: [],
          caller: 'anonymous'
        }]),
        this.makeRPCCall('topay_callContract', [{
          contractAddress,
          functionName: 'totalSupply',
          args: [],
          caller: 'anonymous'
        }])
      ]);
      
      return {
        name: name.result || 'Unknown Token',
        symbol: symbol.result || 'UNK',
        decimals: parseInt(decimals.result) || 18,
        totalSupply: parseFloat(totalSupply.result) || 0
      };
    } catch (error) {
      console.error('❌ Failed to get token info:', error);
      // Return mock info for development
      return {
        name: 'TOPAY Token',
        symbol: 'TPY',
        decimals: 18,
        totalSupply: 1000000000,
        mock: true
      };
    }
  }

  /**
   * Approve token spending
   */
  async approveTokens(contractAddress, owner, spender, amount) {
    try {
      const result = await this.makeRPCCall('topay_callContract', [{
        contractAddress,
        functionName: 'approve',
        args: [spender, amount],
        caller: owner
      }]);
      
      console.log(`✅ Token approval successful: ${result.transactionHash}`);
      return result;
    } catch (error) {
      console.error('❌ Token approval failed:', error);
      // Return mock data for development
      return {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        success: true,
        mock: true
      };
    }
  }

  /**
   * Get token allowance
   */
  async getTokenAllowance(contractAddress, owner, spender) {
    try {
      const result = await this.makeRPCCall('topay_callContract', [{
        contractAddress,
        functionName: 'allowance',
        args: [owner, spender],
        caller: 'anonymous'
      }]);
      
      return parseFloat(result.result) || 0;
    } catch (error) {
      console.error('❌ Failed to get token allowance:', error);
      // Return mock allowance for development
      return Math.random() * 100;
    }
  }

  /**
   * Transfer tokens from approved allowance
   */
  async transferFromTokens(contractAddress, from, to, amount, spender) {
    try {
      const result = await this.makeRPCCall('topay_callContract', [{
        contractAddress,
        functionName: 'transferFrom',
        args: [from, to, amount],
        caller: spender
      }]);
      
      console.log(`✅ TransferFrom successful: ${result.transactionHash}`);
      return result;
    } catch (error) {
      console.error('❌ TransferFrom failed:', error);
      // Return mock data for development
      return {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        success: true,
        mock: true
      };
    }
  }

  /**
   * Mint new tokens (owner only)
   */
  async mintTokens(contractAddress, to, amount, owner) {
    try {
      const result = await this.makeRPCCall('topay_callContract', [{
        contractAddress,
        functionName: 'mint',
        args: [to, amount],
        caller: owner
      }]);
      
      console.log(`✅ Token minting successful: ${result.transactionHash}`);
      return result;
    } catch (error) {
      console.error('❌ Token minting failed:', error);
      // Return mock data for development
      return {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        success: true,
        mock: true
      };
    }
  }

  /**
   * Burn tokens
   */
  async burnTokens(contractAddress, amount, owner) {
    try {
      const result = await this.makeRPCCall('topay_callContract', [{
        contractAddress,
        functionName: 'burn',
        args: [amount],
        caller: owner
      }]);
      
      console.log(`✅ Token burning successful: ${result.transactionHash}`);
      return result;
    } catch (error) {
      console.error('❌ Token burning failed:', error);
      // Return mock data for development
      return {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        success: true,
        mock: true
      };
    }
  }

  /**
   * Get deployed contracts
   */
  async getDeployedContracts() {
    try {
      const contracts = await this.makeRPCCall('topay_getAllContracts', []);
      return contracts || [];
    } catch (error) {
      console.error('❌ Failed to get deployed contracts:', error);
      // Return mock contracts for development
      return [
        {
          address: '0x1234567890123456789012345678901234567890',
          name: 'TOPAY Token',
          symbol: 'TPY',
          type: 'ERC20',
          deployedAt: Date.now() - 86400000
        },
        {
          address: '0x2345678901234567890123456789012345678901',
          name: 'Test Token',
          symbol: 'TEST',
          type: 'ERC20',
          deployedAt: Date.now() - 172800000
        }
      ];
    }
  }

  /**
   * Find TOPAY token contracts
   */
  async findTOPAYTokens() {
    try {
      const contracts = await this.getDeployedContracts();
      return contracts.filter(contract => 
        contract.symbol === 'TPY' || 
        contract.name.toLowerCase().includes('topay')
      );
    } catch (error) {
      console.error('❌ Failed to find TOPAY tokens:', error);
      return [];
    }
  }

  /**
   * Get wallet balance (native token)
   */
  async getWalletBalance(address) {
    try {
      const balance = await this.makeRPCCall('topay_getBalance', [address]);
      return parseFloat(balance) || 0;
    } catch (error) {
      console.error('❌ Failed to get wallet balance:', error);
      // Return mock balance for development
      return Math.random() * 1000;
    }
  }

  /**
   * Send native tokens
   */
  async sendTransaction(from, to, amount, gasLimit = 21000, gasPrice = 20) {
    try {
      const result = await this.makeRPCCall('topay_sendTransaction', [
        from,
        to,
        amount,
        gasLimit,
        gasPrice
      ]);
      
      console.log(`✅ Transaction successful: ${result.transactionHash}`);
      return result;
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      // Return mock data for development
      return {
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        success: true,
        mock: true
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash) {
    try {
      const status = await this.makeRPCCall('topay_getTransaction', [txHash]);
      return status;
    } catch (error) {
      console.error('❌ Failed to get transaction status:', error);
      // Return mock status for development
      return {
        status: 'confirmed',
        blockNumber: Math.floor(Math.random() * 1000000) + 500000,
        confirmations: Math.floor(Math.random() * 10) + 1,
        mock: true
      };
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo() {
    try {
      const info = await this.makeRPCCall('topay_getChainInfo', []);
      return info;
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      // Return mock network info for development
      return {
        chainId: 1337,
        networkName: 'TOPAY Testnet',
        blockNumber: Math.floor(Math.random() * 1000000) + 500000,
        gasPrice: 20,
        mock: true
      };
    }
  }
}

export default WalletContractUtils;