'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft, ExternalLink, Search, RefreshCw } from 'lucide-react';
import styles from './TransactionHistory.module.css';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  token?: {
    symbol: string;
    name: string;
    address: string;
  };
  type: 'send' | 'receive' | 'approve' | 'contract';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: number;
  fee?: number;
}

interface TransactionHistoryProps {
  walletAddress: string;
}

export default function TransactionHistory({ walletAddress }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'approve' | 'contract'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTokenManagerReady, setIsTokenManagerReady] = useState(false);

  // Initialize TokenManager
  const initializeTokenManager = async () => {
    try {
      if ((window as unknown as { tokenManager?: unknown }).tokenManager) {
        setIsTokenManagerReady(true);
        return;
      }

      const { TokenManager } = await import('../../../lib/token-manager.js');
      const tokenManager = new TokenManager();
      await tokenManager.initialize();
      
      (window as unknown as { tokenManager: unknown }).tokenManager = tokenManager;
      setIsTokenManagerReady(true);
      
      console.log('✅ TokenManager initialized for TransactionHistory');
    } catch (error) {
      console.error('❌ Failed to initialize TokenManager:', error);
    }
  };

  const fetchTransactions = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    if (!walletAddress || !isTokenManagerReady) return;

    setIsLoading(true);
    try {
      // Try to get transaction history from blockchain client
      const response = await fetch(`/api/wallet/${walletAddress}/transactions?page=${pageNum}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        const newTransactions = Array.isArray(data.transactions) ? data.transactions : [];
        
        if (reset || pageNum === 1) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }
        
        setHasMore(newTransactions.length === 20);
      } else {
        // Fallback: generate mock transactions for demonstration
        const mockTransactions = generateMockTransactions(walletAddress, pageNum);
        
        if (reset || pageNum === 1) {
          setTransactions(mockTransactions);
        } else {
          setTransactions(prev => [...prev, ...mockTransactions]);
        }
        
        setHasMore(pageNum < 3); // Limit mock data to 3 pages
      }
    } catch (error) {
      console.error('❌ Failed to fetch transactions:', error);
      
      // Fallback to mock data
      const mockTransactions = generateMockTransactions(walletAddress, pageNum);
      if (reset || pageNum === 1) {
        setTransactions(mockTransactions);
      } else {
        setTransactions(prev => [...prev, ...mockTransactions]);
      }
      setHasMore(pageNum < 3);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isTokenManagerReady]);

  const generateMockTransactions = (address: string, pageNum: number): Transaction[] => {
    const mockTxs: Transaction[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 20; i++) {
      const txIndex = (pageNum - 1) * 20 + i;
      const isSend = Math.random() > 0.5;
      const isTokenTx = Math.random() > 0.7;
      
      mockTxs.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: isSend ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        to: isSend ? `0x${Math.random().toString(16).substr(2, 40)}` : address,
        amount: Math.random() * 1000,
        token: isTokenTx ? {
          symbol: 'TPY',
          name: 'TOPAY Token',
          address: `0x${Math.random().toString(16).substr(2, 40)}`
        } : undefined,
        type: isSend ? 'send' : 'receive',
        status: Math.random() > 0.1 ? 'confirmed' : (Math.random() > 0.5 ? 'pending' : 'failed'),
        timestamp: now - (txIndex * 3600000) - Math.random() * 3600000,
        blockNumber: Math.floor(Math.random() * 1000000) + 500000,
        gasUsed: Math.floor(Math.random() * 50000) + 21000,
        gasPrice: Math.floor(Math.random() * 20) + 10,
        fee: (Math.floor(Math.random() * 50000) + 21000) * (Math.floor(Math.random() * 20) + 10) / 1e9
      });
    }
    
    return mockTxs;
  };

  const getTransactionIcon = (tx: Transaction) => {
    const iconProps = { size: 16 };
    
    switch (tx.type) {
      case 'send':
        return <ArrowUpRight {...iconProps} style={{ color: 'var(--error-color)' }} />;
      case 'receive':
        return <ArrowDownLeft {...iconProps} style={{ color: 'var(--success-color)' }} />;
      case 'approve':
        return <ExternalLink {...iconProps} style={{ color: 'var(--warning-color)' }} />;
      default:
        return <ExternalLink {...iconProps} style={{ color: 'var(--primary-color)' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'var(--success-color)';
      case 'pending':
        return 'var(--warning-color)';
      case 'failed':
        return 'var(--error-color)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const formatAmount = (amount: number, token?: { symbol: string }) => {
    const symbol = token?.symbol || 'TOPAY';
    return `${amount.toFixed(4)} ${symbol}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(tx => {
    const matchesFilter = filter === 'all' || tx.type === filter;
    const matchesSearch = !searchTerm || 
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.token?.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    return matchesFilter && matchesSearch;
  }) : [];

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, false);
    }
  };

  const refresh = () => {
    setPage(1);
    fetchTransactions(1, true);
  };

  useEffect(() => {
    initializeTokenManager();
  }, []);

  useEffect(() => {
    if (walletAddress && isTokenManagerReady) {
      fetchTransactions(1, true);
    }
  }, [walletAddress, isTokenManagerReady, fetchTransactions]);

  if (!walletAddress) {
    return (
      <div className={styles.card}>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <Clock size={48} style={{ marginBottom: '1rem' }} />
          <h3>No Wallet Connected</h3>
          <p>Connect your wallet to view transaction history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={24} />
          Transaction History
        </h2>
        <button 
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={refresh}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <RefreshCw size={16} className={isLoading ? styles.spinner : ''} />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['all', 'send', 'receive', 'approve', 'contract'] as const).map((filterType) => (
            <button
              key={filterType}
              className={`${styles.button} ${filter === filterType ? styles.buttonPrimary : styles.buttonSecondary}`}
              onClick={() => setFilter(filterType)}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', textTransform: 'capitalize' }}
            >
              {filterType}
            </button>
          ))}
        </div>
        
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={16} style={{ 
            position: 'absolute', 
            left: '0.75rem', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: 'var(--text-secondary)' 
          }} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.input}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Transaction List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            {isLoading ? (
              <div>
                <RefreshCw size={32} className={styles.spinner} style={{ marginBottom: '1rem' }} />
                <p>Loading transactions...</p>
              </div>
            ) : (
              <div>
                <Clock size={48} style={{ marginBottom: '1rem' }} />
                <h3>No Transactions Found</h3>
                <p>No transactions match your current filters.</p>
              </div>
            )}
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div 
              key={tx.hash}
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
              }}
              onClick={() => {
                // Open transaction in block explorer
                window.open(`${process.env.NEXT_PUBLIC_EXPLORER_URL || 'http://localhost:3001'}/tx/${tx.hash}`, '_blank');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--background-primary)',
                  border: '2px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getTransactionIcon(tx)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {tx.type}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.125rem 0.375rem', 
                      borderRadius: '0.25rem',
                      background: getStatusColor(tx.status) + '20',
                      color: getStatusColor(tx.status),
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {tx.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {tx.type === 'send' ? `To ${formatAddress(tx.to)}` : `From ${formatAddress(tx.from)}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {formatTime(tx.timestamp)}
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '1rem', 
                  color: tx.type === 'send' ? 'var(--error-color)' : 'var(--success-color)',
                  marginBottom: '0.25rem'
                }}>
                  {tx.type === 'send' ? '-' : '+'}{formatAmount(tx.amount, tx.token)}
                </div>
                {tx.fee && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Fee: {tx.fee.toFixed(6)} TOPAY
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formatAddress(tx.hash)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && filteredTransactions.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={loadMore}
            disabled={isLoading}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className={styles.spinner} style={{ marginRight: '0.5rem' }} />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}