'use client';
import { useState, useEffect, useCallback } from 'react';
import { Wallet, RefreshCw, Copy, TrendingUp, Clock, Plus, Send, ArrowUpDown, Eye, EyeOff, Trash2 } from 'lucide-react';
// import styles from '../page.module.css';
import walletStyles from './WalletManager.module.css';
import { TokenManager } from '../../lib/token-manager.js';
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
      const manager = new TokenManager('http://localhost:8545/rpc', walletAddress ? walletAddress : null) as unknown as TokenManagerInstance;
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
    fetchPriceData();
  }, [initializeTokenManager]);

  useEffect(() => {
    if (walletAddress && isTokenManagerReady) {
      refreshBalance();
      refreshTokenBalances();
    }
  }, [walletAddress, isTokenManagerReady, refreshBalance, refreshTokenBalances]);

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
        <button 
          onClick={refreshBalance} 
          disabled={isLoading}
          className={walletStyles.refreshButton}
        >
          <RefreshCw className={`${walletStyles.refreshIcon} ${isLoading ? walletStyles.spinning : ''}`} />
        </button>
      </div>

      {message && (
        <div className={`${walletStyles.message} ${walletStyles[messageType]}`}>
          {message}
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
    </div>
  );
}
