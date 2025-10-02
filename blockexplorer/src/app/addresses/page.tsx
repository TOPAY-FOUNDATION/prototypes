'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatHash, formatNumber, copyToClipboard } from '@/lib/utils';
import styles from './addresses-page.module.css';

interface Address {
  address: string;
  balance: number;
  transactionCount: number;
  lastActivity: number;
  type: 'contract' | 'wallet';
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [sortBy, setSortBy] = useState<'balance' | 'transactions' | 'activity'>('balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'contract' | 'wallet'>('all');

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get recent transactions to extract addresses
        const transactionsResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/transactions/recent?limit=50`);
        const transactionsData = await transactionsResponse.json();
        
        // Get recent blocks to extract more addresses
        const blocksResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/blocks/recent?limit=20`);
        const blocksData = await blocksResponse.json();
        
        // Get network info to get genesis wallet
        const networkResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/network`);
        const networkData = await networkResponse.json();
        
        const addressMap = new Map<string, Address>();
        
        // Add genesis wallet if available
        if (networkData.success && networkData.network) {
          const genesisAddress = 'TOPAY_GENESIS_WALLET_000000000000';
          
          // Get balance for genesis wallet
          const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${genesisAddress}/balance`);
          const balanceData = await balanceResponse.json();
          
          // Get transaction count for genesis wallet
          const nonceResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${genesisAddress}/nonce`);
          const nonceData = await nonceResponse.json();
          
          if (balanceData.success && nonceData.success) {
            const balance = parseInt(balanceData.balance, 16) / 1e18; // Convert from wei to TOPAY
            const transactionCount = parseInt(nonceData.nonce, 16);
            
            addressMap.set(genesisAddress, {
              address: genesisAddress,
              balance: balance,
              transactionCount: transactionCount,
              lastActivity: Date.now() - Math.random() * 86400000, // Random within last day
              type: 'wallet'
            });
          }
        }
        
        // Process transactions to extract addresses
        if (transactionsData.success && transactionsData.transactions) {
          for (const tx of transactionsData.transactions) {
            // Process 'from' address
            if (tx.from && tx.from !== '0x0000000000000000000000000000000000000000') {
              if (!addressMap.has(tx.from)) {
                try {
                  const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${tx.from}/balance`);
                  const balanceData = await balanceResponse.json();
                  
                  const nonceResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${tx.from}/nonce`);
                  const nonceData = await nonceResponse.json();
                  
                  if (balanceData.success && nonceData.success) {
                    const balance = parseInt(balanceData.balance, 16) / 1e18;
                    const transactionCount = parseInt(nonceData.nonce, 16);
                    
                    addressMap.set(tx.from, {
                      address: tx.from,
                      balance: balance,
                      transactionCount: transactionCount,
                      lastActivity: parseInt(tx.blockNumber, 16) * 10000 + Date.now() - 86400000, // Approximate
                      type: 'wallet'
                    });
                  }
                } catch (error) {
                  console.warn(`Failed to fetch data for address ${tx.from}:`, error);
                }
              }
            }
            
            // Process 'to' address
            if (tx.to && tx.to !== '0x0000000000000000000000000000000000000000') {
              if (!addressMap.has(tx.to)) {
                try {
                  const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${tx.to}/balance`);
                  const balanceData = await balanceResponse.json();
                  
                  const nonceResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${tx.to}/nonce`);
                  const nonceData = await nonceResponse.json();
                  
                  const codeResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${tx.to}/code`);
                  const codeData = await codeResponse.json();
                  
                  if (balanceData.success && nonceData.success && codeData.success) {
                    const balance = parseInt(balanceData.balance, 16) / 1e18;
                    const transactionCount = parseInt(nonceData.nonce, 16);
                    const isContract = codeData.code && codeData.code !== '0x';
                    
                    addressMap.set(tx.to, {
                      address: tx.to,
                      balance: balance,
                      transactionCount: transactionCount,
                      lastActivity: parseInt(tx.blockNumber, 16) * 10000 + Date.now() - 86400000, // Approximate
                      type: isContract ? 'contract' : 'wallet'
                    });
                  }
                } catch (error) {
                  console.warn(`Failed to fetch data for address ${tx.to}:`, error);
                }
              }
            }
          }
        }
        
        // Process blocks to extract miner addresses
        if (blocksData.success && blocksData.blocks) {
          for (const block of blocksData.blocks) {
            if (block.miner && block.miner !== '0x0000000000000000000000000000000000000000') {
              if (!addressMap.has(block.miner)) {
                try {
                  const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${block.miner}/balance`);
                  const balanceData = await balanceResponse.json();
                  
                  const nonceResponse = await fetch(`${process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL}/explorer/account/${block.miner}/nonce`);
                  const nonceData = await nonceResponse.json();
                  
                  if (balanceData.success && nonceData.success) {
                    const balance = parseInt(balanceData.balance, 16) / 1e18;
                    const transactionCount = parseInt(nonceData.nonce, 16);
                    
                    addressMap.set(block.miner, {
                      address: block.miner,
                      balance: balance,
                      transactionCount: transactionCount,
                      lastActivity: parseInt(block.timestamp, 16) * 1000, // Convert to milliseconds
                      type: 'wallet'
                    });
                  }
                } catch (error) {
                  console.warn(`Failed to fetch data for miner address ${block.miner}:`, error);
                }
              }
            }
          }
        }
        
        // Convert map to array and filter out addresses with no activity
        const addressesArray = Array.from(addressMap.values()).filter(addr => 
          addr.balance > 0 || addr.transactionCount > 0
        );
        
        setAddresses(addressesArray);
      } catch (err) {
        console.error('Error fetching addresses:', err);
        setError('Failed to load addresses from blockchain');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const handleCopy = async (text: string, id: string) => {
    try {
      await copyToClipboard(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSort = (field: 'balance' | 'transactions' | 'activity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedAddresses = addresses
    .filter(addr => filterType === 'all' || addr.type === filterType)
    .sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'transactions':
          aValue = a.transactionCount;
          bValue = b.transactionCount;
          break;
        case 'activity':
          aValue = a.lastActivity;
          bValue = b.lastActivity;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <span className={styles.loadingText}>Loading addresses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <h3 className={styles.errorTitle}>Error Loading Addresses</h3>
          <p className={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>Addresses</span>
          </div>
          
          <div className={styles.headerContent}>
            <div className={styles.addressIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h1 className={styles.pageTitle}>Addresses</h1>
              <div className={styles.pageSubtitle}>
                {formatNumber(filteredAndSortedAddresses.length)} addresses found
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Filters and Controls */}
        <div className={styles.controlsSection}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Type:</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as 'all' | 'contract' | 'wallet')}
                className={styles.filterSelect}
              >
                <option value="all">All Types</option>
                <option value="wallet">Wallets</option>
                <option value="contract">Contracts</option>
              </select>
            </div>
          </div>
          
          <div className={styles.sortControls}>
            <span className={styles.sortLabel}>Sort by:</span>
            <button 
              onClick={() => handleSort('balance')}
              className={`${styles.sortButton} ${sortBy === 'balance' ? styles.active : ''}`}
            >
              Balance {sortBy === 'balance' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
              onClick={() => handleSort('transactions')}
              className={`${styles.sortButton} ${sortBy === 'transactions' ? styles.active : ''}`}
            >
              Transactions {sortBy === 'transactions' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
              onClick={() => handleSort('activity')}
              className={`${styles.sortButton} ${sortBy === 'activity' ? styles.active : ''}`}
            >
              Last Activity {sortBy === 'activity' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* Addresses Table */}
        <div className={styles.tableContainer}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>Address</div>
              <div className={styles.headerCell}>Type</div>
              <div className={styles.headerCell}>Balance</div>
              <div className={styles.headerCell}>Transactions</div>
              <div className={styles.headerCell}>Last Activity</div>
              <div className={styles.headerCell}>Actions</div>
            </div>
            
            <div className={styles.tableBody}>
              {filteredAndSortedAddresses.map((address) => (
                <div key={address.address} className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    <div className={styles.addressCell}>
                      <div className={styles.addressIcon}>
                        {address.type === 'contract' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7.07,18.28C7.5,17.38 10.12,16.5 12,16.5C13.88,16.5 16.5,17.38 16.93,18.28C15.57,19.36 13.86,20 12,20C10.14,20 8.43,19.36 7.07,18.28M18.36,16.83C16.93,15.09 13.46,14.5 12,14.5C10.54,14.5 7.07,15.09 5.64,16.83C4.62,15.5 4,13.82 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,13.82 19.38,15.5 18.36,16.83M12,6C10.06,6 8.5,7.56 8.5,9.5C8.5,11.44 10.06,13 12,13C13.94,13 15.5,11.44 15.5,9.5C15.5,7.56 13.94,6 12,6M12,11A1.5,1.5 0 0,1 10.5,9.5A1.5,1.5 0 0,1 12,8A1.5,1.5 0 0,1 13.5,9.5A1.5,1.5 0 0,1 12,11Z"/>
                          </svg>
                        )}
                      </div>
                      <Link href={`/address/${address.address}`} className={styles.addressLink}>
                        {formatHash(address.address)}
                      </Link>
                    </div>
                  </div>
                  
                  <div className={styles.tableCell}>
                    <span className={`${styles.typeTag} ${styles[address.type]}`}>
                      {address.type === 'contract' ? 'Contract' : 'Wallet'}
                    </span>
                  </div>
                  
                  <div className={styles.tableCell}>
                    <span className={styles.balanceValue}>
                      {formatNumber(address.balance)} TOPAY
                    </span>
                  </div>
                  
                  <div className={styles.tableCell}>
                    <span className={styles.transactionCount}>
                      {formatNumber(address.transactionCount)}
                    </span>
                  </div>
                  
                  <div className={styles.tableCell}>
                    <span className={styles.timeAgo}>
                      {new Date(address.lastActivity).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className={styles.tableCell}>
                    <button
                      onClick={() => handleCopy(address.address, address.address)}
                      className={styles.copyButton}
                      title="Copy address"
                    >
                      {copied === address.address ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {filteredAndSortedAddresses.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3>No Addresses Found</h3>
            <p>No addresses match your current filter criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}