'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Navigation from '../components/Navigation';
import WalletManager from './components/WalletManager';
import TransactionForm from './components/transactions/TransactionForm';
import CustomerSupport from './components/support/CustomerSupport';
import SupportButton from './components/support/SupportButton';
import Account from './components/account/Account';
import Settings from './components/settings/Settings';
import TransactionHistory from './components/transactions/TransactionHistory';
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

  const handleTransactionSent = () => {
    if (walletAddress) {
      fetchBalance(walletAddress);
    }
  };

  return (
    <div className="bg-page min-h-screen">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="container">
        <div className={styles.main}>
          {/* Connection Status */}
          <div className={styles.statusBar}>
            <ConnectionStatus />
          </div>

          {/* Main Content */}
          <div className={styles.content}>
            {activeTab === 'wallet' && (
              <div className="animate-fade-in">
                <WalletManager 
                  onWalletChange={(address: string, balance: number) => {
                    setWalletAddress(address);
                    setBalance(balance);
                    localStorage.setItem('walletAddress', address);
                  }}
                  currentBalance={balance}
                  walletAddress={walletAddress}
                />
              </div>
            )}
            {activeTab === 'send' && (
              <div className="animate-fade-in">
                <TransactionForm 
                  walletAddress={walletAddress}
                  balance={balance}
                  onTransactionSent={handleTransactionSent}
                />
              </div>
            )}
            {activeTab === 'history' && (
              <div className="animate-fade-in">
                <TransactionHistory walletAddress={walletAddress} />
              </div>
            )}
            {activeTab === 'account' && (
              <div className="animate-fade-in">
                <Account 
                  walletAddress={walletAddress}
                />
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="animate-fade-in">
                <Settings />
              </div>
            )}
          </div>
        </div>
      </div>

      <SupportButton onClick={() => setIsSupportOpen(true)} />
      
      <CustomerSupport 
        isOpen={isSupportOpen} 
        onClose={() => setIsSupportOpen(false)} 
      />
    </div>
  );
}
