'use client';

import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import styles from './page.module.css';
import WalletCreation from '../components/WalletCreation';
import QRCode from '../components/QRCode';
import FloatingAIButton from '../components/FloatingAIButton';
import { WalletStorage } from '../lib/walletStorage';

interface Token {
  symbol: string;
  balance: string;
  address?: string;
}

interface SendFormData {
  recipient: string;
  amount: string;
  token: string;
}

interface WalletData {
  address: string;
  privateKey: string;
  publicKey: string;
  createdAt: string;
}

export default function SimpleWallet() {
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [activeView, setActiveView] = useState<'tokens' | 'receive' | 'send'>('tokens');
  const [sendForm, setSendForm] = useState<SendFormData>({
    recipient: '',
    amount: '',
    token: 'TOPAY'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Check for existing wallet on component mount
  useEffect(() => {
    const checkWallet = () => {
      const existingWallet = WalletStorage.getWallet();
      if (existingWallet) {
        setHasWallet(true);
        setWalletAddress(existingWallet.address);
        loadWalletData(existingWallet.address);
      } else {
        setHasWallet(false);
      }
    };

    checkWallet();
  }, []);

  const handleWalletCreated = (walletData: WalletData) => {
    // Save wallet to localStorage
    WalletStorage.saveWallet(walletData);
    
    // Update state
    setHasWallet(true);
    setWalletAddress(walletData.address);
    
    // Load wallet data
    loadWalletData(walletData.address);
  };

  const loadWalletData = async (address: string) => {
    setIsLoading(true);
    try {
      // Load balance
      const balanceResponse = await fetch(`/api/wallet/${address}/balance`);
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData.balance || '0');
      }

      // Load tokens
      const tokensResponse = await fetch(`/api/wallet/${address}/tokens`);
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        setTokens(tokensData.tokens || []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!sendForm.recipient || !sendForm.amount || !sendForm.token) {
      setError('Please fill all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: walletAddress,
          to: sendForm.recipient,
          amount: parseFloat(sendForm.amount),
          tokenId: sendForm.token === 'TOPAY' ? undefined : sendForm.token
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setError('');
        setSendForm({ recipient: '', amount: '', token: 'TOPAY' });
        await loadWalletData(walletAddress);
        alert(`Transaction sent successfully! Hash: ${result.transactionHash}`);
      } else {
        setError(`Error: ${result.error}`);
      }
    } catch {
      setError('Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  };

  const handleLogout = () => {
    // Clear all wallet data
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletPrivateKey');
    localStorage.removeItem('hasCompletedWelcome');
    localStorage.removeItem('topayProfile');
    localStorage.removeItem('topaySecuritySettings');
    
    // Clear all wallet-specific data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('topayWallet_') || key.startsWith('topay_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setShowLogoutModal(false);
    
    // Reset wallet state
    setHasWallet(false);
    setWalletAddress('');
    setBalance('0');
    setTokens([]);
    setActiveView('tokens');
  };

  // Show loading while checking for wallet
  if (hasWallet === null) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Show wallet creation if no wallet exists
  if (!hasWallet) {
    return <WalletCreation onWalletCreated={handleWalletCreated} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.wallet}>
        {/* Header */}
        <div className={styles.header}>
          <h1>TOPAY Wallet</h1>
          <div className={styles.headerRight}>
            <div className={styles.address}>
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className={styles.logoutButton}
              title="Remove Wallet / Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className={styles.nav}>
          <button 
            className={activeView === 'tokens' ? styles.active : ''}
            onClick={() => setActiveView('tokens')}
          >
            Tokens
          </button>
          <button 
            className={activeView === 'receive' ? styles.active : ''}
            onClick={() => setActiveView('receive')}
          >
            Receive
          </button>
          <button 
            className={activeView === 'send' ? styles.active : ''}
            onClick={() => setActiveView('send')}
          >
            Send
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeView === 'tokens' && (
            <div className={styles.tokensView}>
              <div className={styles.balanceCard}>
                <h3>Native Balance</h3>
                <div className={styles.balance}>{balance} TOPAY</div>
              </div>
              
              <div className={styles.tokensList}>
                <h3>Tokens</h3>
                {tokens.length === 0 ? (
                  <div className={styles.noTokens}>No tokens found</div>
                ) : (
                  tokens.map((token, index) => (
                    <div key={token.address || index} className={styles.tokenItem}>
                      <div className={styles.tokenInfo}>
                        <div className={styles.tokenName}>{token.symbol}</div>
                      </div>
                      <div className={styles.tokenBalance}>
                        {token.balance || '0.000000'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeView === 'receive' && (
            <div className={styles.receiveView}>
              <h3>Receive Tokens</h3>
              <div className={styles.receiveCard}>
                <div className={styles.qrPlaceholder}>
                  <QRCode value={walletAddress} size={200} className={styles.qrCode} />
                </div>
                <div className={styles.addressDisplay}>
                  <label>Your Wallet Address:</label>
                  <div className={styles.addressBox}>
                    <span>{walletAddress}</span>
                    <button onClick={() => copyToClipboard(walletAddress)}>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'send' && (
            <div className={styles.sendView}>
              <h3>Send Tokens</h3>
              <div className={styles.sendForm}>
                <div className={styles.formGroup}>
                  <label>Token:</label>
                  <select 
                    value={sendForm.token} 
                    onChange={(e) => setSendForm({...sendForm, token: e.target.value})}
                  >
                    <option value="TOPAY">TOPAY (Native)</option>
                    {tokens.map((token, index) => (
                      <option key={token.address || index} value={token.address || token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Recipient Address:</label>
                  <input
                    type="text"
                    value={sendForm.recipient}
                    onChange={(e) => setSendForm({...sendForm, recipient: e.target.value})}
                    placeholder="Enter recipient address"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Amount:</label>
                  <input
                    type="number"
                    value={sendForm.amount}
                    onChange={(e) => setSendForm({...sendForm, amount: e.target.value})}
                    placeholder="Enter amount"
                    step="0.000001"
                  />
                </div>

                <button 
                  className={styles.sendButton}
                  onClick={handleSend}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>

                {error && (
                  <div className={styles.error}>{error}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <LogOut size={24} />
              <h3>Remove Wallet</h3>
            </div>
            
            <p className={styles.modalText}>
              This will remove your wallet from this device and log you out. 
              Make sure you have backed up your seed phrase and private key before proceeding.
            </p>
            
            <div className={styles.warningBox}>
              <p>⚠️ This action cannot be undone</p>
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              
              <button
                onClick={handleLogout}
                className={styles.confirmButton}
              >
                Remove Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Button */}
      <FloatingAIButton />
    </div>
  );
}
