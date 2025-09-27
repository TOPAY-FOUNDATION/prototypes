'use client';
import { useState, useEffect, useCallback } from 'react';
import { Wallet, RefreshCw, Copy, TrendingUp, Clock, Plus, Send, ArrowUpDown, Eye, EyeOff, Trash2, Shield, Key, Database } from 'lucide-react';
import walletStyles from './WalletManager.module.css';
import { TokenManager } from '../../lib/token-manager.js';
import { WalletManager as WalletManagerLib } from '../../lib/wallet-manager.js';

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance?: number;
  formattedBalance?: string;
  totalSupply?: number;
  type: 'TOPAY' | 'CUSTOM';
  isNative?: boolean;
  error?: string;
}

interface WalletManagerProps {
  onWalletChange: (address: string, balance: number) => void;
  currentBalance: number;
  walletAddress: string | null;
}

interface TokenManagerInstance extends TokenManager {
  parseTokenAmount: (amount: string, decimals: number) => number;
  getAllTokenBalances: (address: string) => Promise<Record<string, Token>>;
  addToken: (contractAddress: string, userAddress?: string | null) => Promise<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: number;
    type: string;
    isNative: boolean;
    addedAt: string;
  }>;
  transferTokens: (tokenAddress: string, from: string, to: string, amount: string) => Promise<{
    result?: { success: boolean; error?: string };
  }>;
  approveTokens: (tokenAddress: string, from: string, spender: string, amount: string) => Promise<{
    result?: { success: boolean; error?: string };
  }>;
  removeToken: (tokenAddress: string) => boolean;
}
interface TransferResult {
  result?: {
    success: boolean;
    error?: string;
  };
}
interface ErrorWithMessage {
  message: string;
}
interface WalletStats {
  wallet: {
    address: string;
    balance: number;
    hasPrivateKey: boolean;
    hasSeed: boolean;
    isHDWallet: boolean;
    createdAt: string;
    lastBalanceUpdate: string | null;
  } | null;
  security: {
    isAuthenticated: boolean;
    sessionValid: boolean;
    rateLimitStatus: Record<string, unknown>;
  };
  connection: {
    isConnected: boolean;
    blockchainUrl: string | null;
  };
}

interface BlockchainInfo {
  chainId: number;
  networkName: string;
  blockHeight: number;
  difficulty: string;
  hashRate: string;
  totalSupply: number;
  circulatingSupply: number;
  peers: number;
  version: string;
}

interface BlockchainClientInfo {
  chainId: number;
  networkName: string;
  blockHeight: number;
  difficulty: number | string;
  latestBlockHash?: string | null;
  latestBlockTimestamp?: number | null;
  chainValid?: boolean;
  peers: number;
  mock?: boolean;
}

export default function WalletManager({ onWalletChange, currentBalance, walletAddress }: WalletManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  const [priceData, setPriceData] = useState({ usdPrice: 0, change24h: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [importAddress, setImportAddress] = useState('');
  const [transferData, setTransferData] = useState({ to: '', amount: '' });
  const [approveData, setApproveData] = useState({ spender: '', amount: '' });
  const [hideZeroBalances, setHideZeroBalances] = useState(false);
  const [isTokenManagerReady, setIsTokenManagerReady] = useState(false);
  const [tokenManager, setTokenManager] = useState<TokenManagerInstance | null>(null);
  
  // New blockchain-related state
  const [walletManager, setWalletManager] = useState<WalletManagerLib | null>(null);
  const [isWalletManagerReady, setIsWalletManagerReady] = useState(false);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(null);
  const [showWalletStats, setShowWalletStats] = useState(false);
  const [showBlockchainInfo, setShowBlockchainInfo] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);
  const [showImportWalletModal, setShowImportWalletModal] = useState(false);
  const [walletPassword, setWalletPassword] = useState('');
  const [walletMnemonic, setWalletMnemonic] = useState('');

  const showMessage = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Set client-side flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setLastUpdated(new Date());
  }, []);

  // Initialize TokenManager
  const initializeTokenManager = useCallback(async () => {
    try {
      const manager = new TokenManager(undefined, walletAddress as null | undefined) as unknown as TokenManagerInstance;
      await manager.initialize();
      setTokenManager(manager);
      setIsTokenManagerReady(true);
      console.log('✅ TokenManager initialized');
    } catch (error) {
      const err = error as Error;
      console.error('❌ Failed to initialize TokenManager:', err);
      showMessage('Failed to initialize token manager', 'error');
    }
  }, [walletAddress]);

  // Initialize WalletManager
  const initializeWalletManager = useCallback(async () => {
    try {
      const manager = new WalletManagerLib();
      await manager.initialize();
      setWalletManager(manager);
      setIsWalletManagerReady(true);
      console.log('✅ WalletManager initialized');
    } catch (error) {
      const err = error as Error;
      console.error('❌ Failed to initialize WalletManager:', err);
      showMessage('Failed to initialize wallet manager', 'error');
    }
  }, []);

  // Blockchain integration functions
  const createNewWallet = async () => {
    if (!walletManager || !walletPassword) return;
    
    try {
      setIsLoading(true);
      const wallet = await walletManager.createWallet();
      onWalletChange(wallet.address, wallet.balance);
      setShowCreateWalletModal(false);
      setWalletPassword('');
      showMessage('Wallet created successfully!', 'success');
      await refreshWalletStats();
    } catch (error) {
      const err = error as Error;
      showMessage('Failed to create wallet: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const importWallet = async () => {
    if (!walletManager || !walletMnemonic || !walletPassword) return;
    
    try {
      setIsLoading(true);
      const wallet = await walletManager.importWallet(walletMnemonic);
      onWalletChange(wallet.address, wallet.balance);
      setShowImportWalletModal(false);
      setWalletMnemonic('');
      setWalletPassword('');
      showMessage('Wallet imported successfully!', 'success');
      await refreshWalletStats();
    } catch (error) {
      const err = error as Error;
      showMessage('Failed to import wallet: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWalletStats = useCallback(async () => {
    if (!walletManager || !isWalletManagerReady) return;
    
    try {
      const stats = await walletManager.getWalletStats();
      const formattedStats: WalletStats = {
        wallet: stats.wallet ? {
          address: String(stats.wallet.address),
          balance: stats.wallet.balance,
          hasPrivateKey: stats.wallet.hasPrivateKey,
          hasSeed: stats.wallet.hasSeed,
          isHDWallet: stats.wallet.isHDWallet,
          createdAt: String(stats.wallet.createdAt),
          lastBalanceUpdate: stats.wallet.lastBalanceUpdate ? String(stats.wallet.lastBalanceUpdate) : null,
        } : null,
        security: {
          isAuthenticated: stats.security.isAuthenticated,
          sessionValid: stats.security.isValidSession,
          rateLimitStatus: (stats.security as { rateLimits?: Record<string, unknown> }).rateLimits || {},
        },
        connection: stats.connection,
      };
      setWalletStats(formattedStats);
    } catch (error) {
      const err = error as Error;
      console.error('Failed to refresh wallet stats:', err);
    }
  }, [walletManager, isWalletManagerReady]);

  const refreshBlockchainInfo = useCallback(async () => {
    if (!walletManager || !isWalletManagerReady) return;
    
    try {
      const info = await walletManager.getBlockchainInfo() as BlockchainClientInfo;
      const formattedInfo: BlockchainInfo = {
        chainId: Number(info.chainId),
        networkName: info.networkName,
        blockHeight: Number(info.blockHeight),
        difficulty: String(info.difficulty),
        hashRate: '0 H/s', // Not available in blockchain client
        totalSupply: 0, // Not available in blockchain client
        circulatingSupply: 0, // Not available in blockchain client
        peers: info.peers,
        version: '1.0.0', // Not available in blockchain client
      };
      setBlockchainInfo(formattedInfo);
    } catch (error) {
      const err = error as Error;
      console.error('Failed to refresh blockchain info:', err);
    }
  }, [walletManager, isWalletManagerReady]);

  const refreshTransactionHistory = useCallback(async () => {
    if (!walletManager || !isWalletManagerReady || !walletAddress) return;
    
    try {
      const history = await walletManager.getTransactionHistory();
      // Transaction history is now handled by the wallet manager
      console.log('Transaction history refreshed:', history);
    } catch (error) {
      const err = error as Error;
      console.error('Failed to refresh transaction history:', err);
    }
  }, [walletManager, isWalletManagerReady, walletAddress]);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/wallet/${walletAddress}/balance`);
      const data = await response.json();
      onWalletChange(walletAddress, data.balance);
      setLastUpdated(new Date());
      showMessage('Balance refreshed!', 'success');
    } catch {
      showMessage('Failed to refresh balance', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, onWalletChange]);

  const refreshTokenBalances = useCallback(async () => {
    if (!walletAddress || !isTokenManagerReady || !tokenManager) return;
    
    try {
      const balances = await tokenManager.getAllTokenBalances(walletAddress);
      const tokenList = Object.values(balances) as Token[];
      setTokens(tokenList);
      console.log(`🔄 Refreshed ${tokenList.length} token balances`);
    } catch (error) {
      const err = error as Error;
      console.error('❌ Failed to refresh token balances:', err);
      showMessage('Failed to refresh token balances', 'error');
    }
  }, [walletAddress, isTokenManagerReady, tokenManager]);

  const importToken = async () => {
    if (!importAddress || !walletAddress || !isTokenManagerReady || !tokenManager) return;
    
    try {
      const token = await tokenManager.addToken(importAddress, walletAddress);
      showMessage(`Token ${token.name} (${token.symbol}) imported successfully!`, 'success');
      setImportAddress('');
      setShowImportModal(false);
      await refreshTokenBalances();
    } catch (error) {
      const err = error as Error;
      console.error('❌ Failed to import token:', err);
      showMessage('Failed to import token. Please check the contract address.', 'error');
    }
  };

  const transferTokens = async () => {
    if (!selectedToken || !transferData.to || !transferData.amount || !walletAddress || !isTokenManagerReady || !tokenManager) return;
    
    try {
      const amount = tokenManager.parseTokenAmount(transferData.amount, selectedToken.decimals);
      const result = await tokenManager.transferTokens(
        selectedToken.address,
        walletAddress,
        transferData.to,
        amount.toString()
      ) as TransferResult;
      
      if (result.result?.success) {
        showMessage(`Successfully transferred ${transferData.amount} ${selectedToken.symbol}!`, 'success');
        setTransferData({ to: '', amount: '' });
        setShowTransferModal(false);
        setSelectedToken(null);
        await refreshTokenBalances();
        await refreshBalance();
      } else {
        showMessage('Transfer failed: ' + (result.result?.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      const err = error as ErrorWithMessage;
      console.error('❌ Transfer failed:', err);
      showMessage('Transfer failed: ' + err.message, 'error');
    }
  };

  const approveTokens = async () => {
    if (!selectedToken || !approveData.spender || !approveData.amount || !walletAddress || !isTokenManagerReady || !tokenManager) return;
    
    try {
      const amount = tokenManager.parseTokenAmount(approveData.amount, selectedToken.decimals);
      const result = await tokenManager.approveTokens(
        selectedToken.address,
        walletAddress,
        approveData.spender,
        amount.toString()
      ) as TransferResult;
      
      if (result.result?.success) {
        showMessage(`Successfully approved ${approveData.amount} ${selectedToken.symbol} for ${approveData.spender}!`, 'success');
        setApproveData({ spender: '', amount: '' });
        setShowApproveModal(false);
        setSelectedToken(null);
      } else {
        showMessage('Approval failed: ' + (result.result?.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      const err = error as ErrorWithMessage;
      console.error('❌ Approval failed:', err);
      showMessage('Approval failed: ' + err.message, 'error');
    }
  };

  const removeToken = async (tokenAddress: string) => {
    if (!tokenManager) return;
    
    try {
      await tokenManager.removeToken(tokenAddress);
      setTokens(prev => prev.filter(token => token.address !== tokenAddress));
      showMessage('Token removed successfully', 'success');
    } catch (error) {
      const err = error as ErrorWithMessage;
      showMessage('Failed to remove token: ' + err.message, 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('Copied to clipboard', 'success');
  };

  const fetchPriceData = async () => {
    // Mock price data for demonstration
    setPriceData({
      usdPrice: 0.85 + Math.random() * 0.1,
      change24h: (Math.random() - 0.5) * 10
    });
    setLastUpdated(new Date());
  };

  useEffect(() => {
    initializeTokenManager();
    initializeWalletManager();
    fetchPriceData();
  }, [initializeTokenManager, initializeWalletManager]);

  useEffect(() => {
    if (walletAddress && isTokenManagerReady) {
      refreshBalance();
      refreshTokenBalances();
    }
    if (walletAddress && isWalletManagerReady) {
      refreshWalletStats();
      refreshBlockchainInfo();
      refreshTransactionHistory();
    }
  }, [walletAddress, isTokenManagerReady, isWalletManagerReady, refreshBalance, refreshTokenBalances, refreshWalletStats, refreshBlockchainInfo, refreshTransactionHistory]);

  const filteredTokens = hideZeroBalances 
    ? tokens.filter(token => (token.balance || 0) > 0)
    : tokens;

  return (
    <div className={walletStyles.walletContainer}>
      <div className={walletStyles.header}>
        <div className={walletStyles.titleSection}>
          <Wallet className={walletStyles.walletIcon} />
          <h2>TOPAY Wallet</h2>
        </div>
        <div className={walletStyles.headerActions}>
          <button 
            onClick={() => setShowWalletStats(!showWalletStats)}
            className={walletStyles.actionButton}
            title="Wallet Stats"
          >
            <Shield size={16} />
          </button>
          <button 
            onClick={() => setShowBlockchainInfo(!showBlockchainInfo)}
            className={walletStyles.actionButton}
            title="Blockchain Info"
          >
            <Database size={16} />
          </button>
          <button 
            onClick={() => setShowCreateWalletModal(true)}
            className={walletStyles.actionButton}
            title="Create Wallet"
          >
            <Key size={16} />
          </button>
          <button 
            onClick={refreshBalance} 
            disabled={isLoading}
            className={walletStyles.refreshButton}
          >
            <RefreshCw className={`${walletStyles.refreshIcon} ${isLoading ? walletStyles.spinning : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className={`${walletStyles.message} ${walletStyles[messageType]}`}>
          {message}
        </div>
      )}

      {/* Create Wallet Modal */}
      {showCreateWalletModal && (
        <div className={walletStyles.modal}>
          <div className={walletStyles.modalContent}>
            <h3>Create New Wallet</h3>
            <input
              type="password"
              placeholder="Enter Password"
              value={walletPassword}
              onChange={(e) => setWalletPassword(e.target.value)}
              className={walletStyles.input}
            />
            <div className={walletStyles.modalActions}>
              <button
                onClick={() => {
                  setShowCreateWalletModal(false);
                  setWalletPassword('');
                }}
                className={walletStyles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={createNewWallet}
                disabled={!walletPassword || isLoading}
                className={walletStyles.confirmButton}
              >
                Create Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Wallet Modal */}
      {showImportWalletModal && (
        <div className={walletStyles.modal}>
          <div className={walletStyles.modalContent}>
            <h3>Import Wallet</h3>
            <input
              type="text"
              placeholder="Enter Mnemonic Phrase"
              value={walletMnemonic}
              onChange={(e) => setWalletMnemonic(e.target.value)}
              className={walletStyles.input}
            />
            <input
              type="password"
              placeholder="Enter Password"
              value={walletPassword}
              onChange={(e) => setWalletPassword(e.target.value)}
              className={walletStyles.input}
            />
            <div className={walletStyles.modalActions}>
              <button
                onClick={() => {
                  setShowImportWalletModal(false);
                  setWalletMnemonic('');
                  setWalletPassword('');
                }}
                className={walletStyles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={importWallet}
                disabled={!walletMnemonic || !walletPassword || isLoading}
                className={walletStyles.confirmButton}
              >
                Import Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Token Modal */}
      {showImportModal && (
        <div className={walletStyles.modal}>
          <div className={walletStyles.modalContent}>
            <h3>Import Custom Token</h3>
            <input
              type="text"
              placeholder="Token Contract Address"
              value={importAddress}
              onChange={(e) => setImportAddress(e.target.value)}
              className={walletStyles.input}
            />
            <div className={walletStyles.modalActions}>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportAddress('');
                }}
                className={walletStyles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={importToken}
                disabled={!importAddress || isLoading}
                className={walletStyles.confirmButton}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedToken && (
        <div className={walletStyles.modal}>
          <div className={walletStyles.modalContent}>
            <h3>Transfer {selectedToken.symbol}</h3>
            <input
              type="text"
              placeholder="Recipient Address"
              value={transferData.to}
              onChange={(e) => setTransferData(prev => ({ ...prev, to: e.target.value }))}
              className={walletStyles.input}
            />
            <input
              type="number"
              placeholder="Amount"
              value={transferData.amount}
              onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
              className={walletStyles.input}
            />
            <div className={walletStyles.modalActions}>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferData({ to: '', amount: '' });
                  setSelectedToken(null);
                }}
                className={walletStyles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={transferTokens}
                disabled={!transferData.to || !transferData.amount || isLoading}
                className={walletStyles.confirmButton}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedToken && (
        <div className={walletStyles.modal}>
          <div className={walletStyles.modalContent}>
            <h3>Approve {selectedToken.symbol}</h3>
            <input
              type="text"
              placeholder="Spender Address"
              value={approveData.spender}
              onChange={(e) => setApproveData(prev => ({ ...prev, spender: e.target.value }))}
              className={walletStyles.input}
            />
            <input
              type="number"
              placeholder="Amount"
              value={approveData.amount}
              onChange={(e) => setApproveData(prev => ({ ...prev, amount: e.target.value }))}
              className={walletStyles.input}
            />
            <div className={walletStyles.modalActions}>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApproveData({ spender: '', amount: '' });
                  setSelectedToken(null);
                }}
                className={walletStyles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={approveTokens}
                disabled={!approveData.spender || !approveData.amount || isLoading}
                className={walletStyles.confirmButton}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Wallet Stats Panel */}
       {showWalletStats && walletStats && (
         <div className={walletStyles.infoPanel}>
           <h3>Wallet Statistics</h3>
           <div className={walletStyles.statsGrid}>
             <div className={walletStyles.statItem}>
               <span>Address:</span>
               <span>{walletStats.wallet?.address?.slice(0, 10)}...</span>
             </div>
             <div className={walletStyles.statItem}>
               <span>Balance:</span>
               <span>{walletStats.wallet?.balance?.toFixed(6)} TPY</span>
             </div>
             <div className={walletStyles.statItem}>
               <span>Authenticated:</span>
               <span>{walletStats.security.isAuthenticated ? '✅' : '❌'}</span>
             </div>
             <div className={walletStyles.statItem}>
               <span>Connected:</span>
               <span>{walletStats.connection.isConnected ? '✅' : '❌'}</span>
             </div>
           </div>
         </div>
       )}

       {/* Blockchain Info Panel */}
       {showBlockchainInfo && blockchainInfo && (
         <div className={walletStyles.infoPanel}>
           <h3>Blockchain Information</h3>
           <div className={walletStyles.statsGrid}>
             <div className={walletStyles.statItem}>
               <span>Network:</span>
               <span>{blockchainInfo.networkName}</span>
             </div>
             <div className={walletStyles.statItem}>
               <span>Block Height:</span>
               <span>{blockchainInfo.blockHeight}</span>
             </div>
             <div className={walletStyles.statItem}>
               <span>Peers:</span>
               <span>{blockchainInfo.peers}</span>
             </div>
             <div className={walletStyles.statItem}>
               <span>Total Supply:</span>
               <span>{blockchainInfo.totalSupply.toLocaleString()} TPY</span>
             </div>
           </div>
         </div>
       )}

       <div className={walletStyles.balanceSection}>
         <div className={walletStyles.mainBalance}>
           <span className={walletStyles.balanceAmount}>{(currentBalance || 0).toFixed(6)} TPY</span>
           <div className={walletStyles.priceInfo}>
             <span className={walletStyles.usdValue}>
               ${((currentBalance || 0) * (priceData?.usdPrice || 0)).toFixed(2)} USD
             </span>
             <span className={`${walletStyles.change} ${(priceData?.change24h || 0) >= 0 ? walletStyles.positive : walletStyles.negative}`}>
               <TrendingUp size={12} />
               {(priceData?.change24h || 0) >= 0 ? '+' : ''}{(priceData?.change24h || 0).toFixed(2)}%
             </span>
           </div>
         </div>
         
         <div className={walletStyles.lastUpdated}>
           <Clock size={12} />
           Updated: {isClient && lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
         </div>
       </div>

       {walletAddress && (
         <div className={walletStyles.addressSection}>
           <span className={walletStyles.addressLabel}>Wallet Address:</span>
           <div className={walletStyles.addressContainer}>
             <span className={walletStyles.address}>
               {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
             </span>
             <button 
               onClick={() => copyToClipboard(walletAddress)}
               className={walletStyles.copyButton}
             >
               <Copy size={14} />
             </button>
           </div>
         </div>
       )}

       <div className={walletStyles.tokensSection}>
         <div className={walletStyles.tokensHeader}>
           <h3>Tokens</h3>
           <div className={walletStyles.tokensControls}>
             <button
               onClick={() => setHideZeroBalances(!hideZeroBalances)}
               className={walletStyles.toggleButton}
             >
               {hideZeroBalances ? <Eye size={16} /> : <EyeOff size={16} />}
               {hideZeroBalances ? 'Show All' : 'Hide Zero'}
             </button>
             <button
               onClick={() => setShowImportModal(true)}
               className={walletStyles.importButton}
             >
               <Plus size={16} />
               Import Token
             </button>
           </div>
         </div>

         <div className={walletStyles.tokensList}>
           {filteredTokens.map((token) => (
             <div key={token.address} className={walletStyles.tokenItem}>
               <div className={walletStyles.tokenInfo}>
                 <div className={walletStyles.tokenHeader}>
                   <span className={walletStyles.tokenSymbol}>{token.symbol}</span>
                   <span className={walletStyles.tokenName}>{token.name}</span>
                   {token.type === 'CUSTOM' && (
                     <button
                       onClick={() => removeToken(token.address)}
                       className={walletStyles.removeButton}
                     >
                       <Trash2 size={14} />
                     </button>
                   )}
                 </div>
                 <div className={walletStyles.tokenBalance}>
                   {token.formattedBalance || '0.000000'} {token.symbol}
                 </div>
                 {token.error && (
                   <div className={walletStyles.tokenError}>{token.error}</div>
                 )}
               </div>
               <div className={walletStyles.tokenActions}>
                 <button
                   onClick={() => {
                     setSelectedToken(token);
                     setShowTransferModal(true);
                   }}
                   className={walletStyles.actionButton}
                 >
                   <Send size={14} />
                   Send
                 </button>
                 <button
                   onClick={() => {
                     setSelectedToken(token);
                     setShowApproveModal(true);
                   }}
                   className={walletStyles.actionButton}
                 >
                   <ArrowUpDown size={14} />
                   Approve
                 </button>
               </div>
             </div>
           ))}
         </div>
       </div>

    </div>
  );
}
