'use client';

import { useState, useEffect } from 'react';
import { Wallet, RefreshCw, Copy, TrendingUp, Clock } from 'lucide-react';
import styles from '../page.module.css';
import walletStyles from './WalletManager.module.css';

interface WalletManagerProps {
  onWalletChange: (address: string, balance: number) => void;
  currentBalance: number;
}

export default function WalletManager({ onWalletChange, currentBalance }: WalletManagerProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  const [priceData, setPriceData] = useState({ usdPrice: 0, change24h: 0 });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const showMessage = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const refreshBalance = async () => {
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
  };

  const fetchPriceData = async () => {
    try {
      const response = await fetch('/api/price/topay');
      if (response.ok) {
        const data = await response.json();
        setPriceData({
          usdPrice: data.usdPrice || 0,
          change24h: data.change24h || 0
        });
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showMessage(`${label} copied to clipboard!`, 'success');
    }).catch(() => {
      showMessage(`Failed to copy ${label}`, 'error');
    });
  };

  // Load wallet data from localStorage on component mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    
    if (savedAddress) {
      setWalletAddress(savedAddress);
    }

    // Fetch initial price data
    fetchPriceData();

    // Set up price data refresh interval (every 5 minutes)
    const priceInterval = setInterval(fetchPriceData, 5 * 60 * 1000);

    return () => clearInterval(priceInterval);
  }, []);

  if (!walletAddress) {
    return (
      <div className={styles.card}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Wallet size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h2>No Wallet Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please complete the welcome setup to create your wallet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className={`${styles.alert} ${styles[`alert${messageType.charAt(0).toUpperCase() + messageType.slice(1)}`]}`}>
          {message}
        </div>
      )}

      {/* Main Wallet Card */}
      <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={24} />
            My Wallet
          </h2>
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={refreshBalance}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <RefreshCw size={16} className={isLoading ? styles.spinner : ''} />
            Refresh
          </button>
        </div>

        {/* Wallet Address Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Wallet Address</span>
            <button 
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => copyToClipboard(walletAddress, 'Address')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
            >
              <Copy size={14} />
              Copy
            </button>
          </div>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.875rem', 
            wordBreak: 'break-all',
            background: 'var(--background-secondary)',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}>
            {walletAddress}
          </div>
        </div>
        
        {/* Balance Section */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>
            Total Balance
          </div>
          <div className={styles.balance} style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--success-color)' }}>
            {(currentBalance || 0).toFixed(8)} TOPAY
          </div>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            ≈ ${((currentBalance || 0) * (priceData.usdPrice || 0)).toFixed(2)} USD
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--background-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={16} style={{ color: (priceData.change24h || 0) >= 0 ? 'var(--success-color)' : 'var(--error-color)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>24h Change</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: (priceData.change24h || 0) >= 0 ? 'var(--success-color)' : 'var(--error-color)' }}>
              {(priceData.change24h || 0) >= 0 ? '+' : ''}{(priceData.change24h || 0).toFixed(2)}%
            </div>
          </div>
          
          <div style={{ background: 'var(--background-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--primary-color)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Last Updated</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>Tokens</h3>
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
          >
            + Import Token
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* TOPAY Token */}
          <div 
            className={walletStyles.tokenRow}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '1rem',
              background: 'var(--background-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                TP
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>TOPAY</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantum-Safe Currency</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>{(currentBalance || 0).toFixed(4)}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                ${((currentBalance || 0) * (priceData.usdPrice || 0)).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Ethereum Token */}
          <div 
            className={walletStyles.tokenRow}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '1rem',
              background: 'var(--background-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #627eea, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                ETH
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>Ethereum</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ETH</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>0.0000</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>$0.00</div>
            </div>
          </div>

          {/* Bitcoin Token */}
          <div 
            className={walletStyles.tokenRow}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '1rem',
              background: 'var(--background-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #f7931a, #e67e22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                BTC
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>Bitcoin</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>BTC</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>0.0000</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>$0.00</div>
            </div>
          </div>

          {/* USDC Token */}
          <div 
            className={walletStyles.tokenRow}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '1rem',
              background: 'var(--background-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #2775ca, #1e40af)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}>
                USDC
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>USD Coin</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>USDC</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)' }}>0.00</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>$0.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}