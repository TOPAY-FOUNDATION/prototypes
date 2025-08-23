'use client';

import { useState, useEffect } from 'react';
import { Wallet, Send, User, Settings as SettingsIcon, History as HistoryIcon } from 'lucide-react';
import styles from './page.module.css';
import WalletManager from './components/WalletManager';
import TransactionForm from './components/TransactionForm';
import CustomerSupport from './components/CustomerSupport';
import SupportButton from './components/SupportButton';
import Account from './components/Account';
import Settings from './components/Settings';
import TransactionHistory from './components/TransactionHistory';
import ConnectionStatus from './components/ConnectionStatus';

export default function WalletApp() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const fetchBalance = async (address: string) => {
    try {
      const response = await fetch(`/api/wallet/${address}/balance`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Load wallet address from localStorage on component mount
  useEffect(() => {
    // Check if user has completed welcome flow
    const hasCompletedWelcome = localStorage.getItem('hasCompletedWelcome');
    
    if (!hasCompletedWelcome) {
      // Redirect to welcome page for new users
      window.location.href = '/welcome';
      return;
    }

    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
      fetchBalance(savedAddress);
    }
  }, []);

  const handleWalletChange = (address: string, newBalance: number) => {
    setWalletAddress(address);
    setBalance(newBalance);
    localStorage.setItem('walletAddress', address);
  };

  const handleTransactionSent = () => {
    if (walletAddress) {
      fetchBalance(walletAddress);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>TOPAY Wallet</h1>
        <p className={styles.subtitle}>Quantum-Safe Digital Currency</p>
      </header>

      {/* Connection Status */}
      <ConnectionStatus />

      <nav className={styles.nav}>
        <button
          className={`${styles.navButton} ${activeTab === 'wallet' ? styles.active : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <Wallet size={18} className={styles.navIcon} />
          Wallet
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'send' ? styles.active : ''}`}
          onClick={() => setActiveTab('send')}
        >
          <Send size={18} className={styles.navIcon} />
          Send
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <HistoryIcon size={18} className={styles.navIcon} />
          History
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'account' ? styles.active : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <User size={18} className={styles.navIcon} />
          Account
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={18} className={styles.navIcon} />
          Settings
        </button>
      </nav>

      <main className={styles.main}>
        {activeTab === 'wallet' && (
          <WalletManager 
            onWalletChange={handleWalletChange}
            currentBalance={balance}
            walletAddress={walletAddress}
          />
        )}
        
        {activeTab === 'send' && (
          <TransactionForm 
            walletAddress={walletAddress}
            balance={balance}
            onTransactionSent={handleTransactionSent}
          />
        )}
        
        {activeTab === 'history' && (
          <TransactionHistory walletAddress={walletAddress} />
        )}
        
        {activeTab === 'account' && (
          <Account walletAddress={walletAddress} />
        )}
        
        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 TOPAY Foundation. Quantum-Safe Blockchain Technology.</p>
      </footer>

      {/* Support Button */}
      <SupportButton onClick={() => setIsSupportOpen(true)} />

      {/* Customer Support Modal with AI Assistant */}
      <CustomerSupport 
        isOpen={isSupportOpen} 
        onClose={() => setIsSupportOpen(false)} 
      />
    </div>
  );
}
