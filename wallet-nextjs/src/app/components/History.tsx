'use client';

import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, ArrowUpRight, ArrowDownLeft, Clock, Search, Download } from 'lucide-react';
import styles from './History.module.css';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'mining' | 'staking';
  amount: number;
  currency: string;
  address: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  fee: number;
  confirmations: number;
  hash: string;
  blockHeight?: number;
}

interface ApiTransaction {
  hash: string;
  type?: 'sent' | 'received' | 'mining' | 'staking';
  amount: number;
  to?: string;
  from?: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'failed';
  fee?: number;
  confirmations?: number;
  blockHeight?: number;
}

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const walletAddress = localStorage.getItem('walletAddress');
        if (!walletAddress) {
          setTransactions([]);
          setFilteredTransactions([]);
          return;
        }

        const response = await fetch(`/api/wallet/${walletAddress}/transactions`);
        if (response.ok) {
          const data = await response.json();
          // Handle both direct array and object with transactions property
          const transactionArray = Array.isArray(data.transactions) ? data.transactions : [];
          const formattedTransactions: Transaction[] = transactionArray.map((tx: ApiTransaction) => ({
            id: tx.hash,
            type: tx.type || 'sent',
            amount: tx.amount,
            currency: 'TOPAY',
            address: tx.to || tx.from || 'Unknown',
            timestamp: new Date(tx.timestamp),
            status: tx.status || 'completed',
            fee: tx.fee || 0,
            confirmations: tx.confirmations || 0,
            hash: tx.hash,
            blockHeight: tx.blockHeight || 0
          }));
          setTransactions(formattedTransactions);
          setFilteredTransactions(formattedTransactions);
        } else {
          // If no transactions found, set empty arrays
          setTransactions([]);
          setFilteredTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
        setFilteredTransactions([]);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    const filtered = transactions.filter(tx => {
      const matchesSearch = 
        tx.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm);
      
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'timestamp':
        default:
          aValue = a.timestamp.getTime();
          bValue = b.timestamp.getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight size={20} className={styles.sentIcon} />;
      case 'received':
        return <ArrowDownLeft size={20} className={styles.receivedIcon} />;
      case 'mining':
      case 'staking':
        return <Clock size={20} className={styles.rewardIcon} />;
      default:
        return <Clock size={20} className={styles.defaultIcon} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClass = `${styles.statusBadge} ${styles[status]}`;
    return <span className={statusClass}>{status.toUpperCase()}</span>;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatAddress = (address: string) => {
    if (address === 'Mining Reward' || address === 'Staking Reward') {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Currency', 'Address', 'Status', 'Fee', 'Hash'].join(','),
      ...filteredTransactions.map(tx => [
        tx.timestamp.toISOString(),
        tx.type,
        tx.amount,
        tx.currency,
        tx.address,
        tx.status,
        tx.fee,
        tx.hash
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'topay_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalStats = () => {
    const completed = filteredTransactions.filter(tx => tx.status === 'completed');
    const totalSent = completed.filter(tx => tx.type === 'sent').reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalReceived = completed.filter(tx => tx.type === 'received' || tx.type === 'mining' || tx.type === 'staking').reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalFees = completed.reduce((sum, tx) => sum + (tx.fee || 0), 0);

    return { totalSent, totalReceived, totalFees };
  };

  const stats = getTotalStats();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <HistoryIcon size={24} />
          Transaction History
        </h2>
        <button className={styles.exportButton} onClick={exportTransactions}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>+{(stats.totalReceived || 0).toFixed(2)}</div>
          <div className={styles.statLabel}>Total Received</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>-{(stats.totalSent || 0).toFixed(2)}</div>
          <div className={styles.statLabel}>Total Sent</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{(stats.totalFees || 0).toFixed(4)}</div>
          <div className={styles.statLabel}>Total Fees</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{filteredTransactions.length}</div>
          <div className={styles.statLabel}>Total Transactions</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by address, hash, or amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Types</option>
            <option value="sent">Sent</option>
            <option value="received">Received</option>
            <option value="mining">Mining</option>
            <option value="staking">Staking</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className={styles.filterSelect}
          >
            <option value="timestamp-desc">Newest First</option>
            <option value="timestamp-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className={styles.transactionList}>
        {filteredTransactions.length === 0 ? (
          <div className={styles.emptyState}>
            <HistoryIcon size={48} className={styles.emptyIcon} />
            <h3>No transactions found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className={styles.transactionItem}>
              <div className={styles.transactionIcon}>
                {getTransactionIcon(transaction.type)}
              </div>
              
              <div className={styles.transactionDetails}>
                <div className={styles.transactionHeader}>
                  <span className={styles.transactionType}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </span>
                  {getStatusBadge(transaction.status)}
                </div>
                
                <div className={styles.transactionAddress}>
                  {transaction.type === 'sent' ? 'To: ' : 'From: '}
                  {formatAddress(transaction.address)}
                </div>
                
                <div className={styles.transactionMeta}>
                  <span>{formatTimestamp(transaction.timestamp)}</span>
                  <span>•</span>
                  <span>{transaction.confirmations} confirmations</span>
                  {transaction.fee > 0 && (
                    <>
                      <span>•</span>
                      <span>Fee: {transaction.fee} TOPAY</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className={styles.transactionAmount}>
                <div className={`${styles.amount} ${styles[transaction.type]}`}>
                  {transaction.type === 'sent' ? '-' : '+'}
                  {(transaction.amount || 0).toFixed(2)} {transaction.currency}
                </div>
                <div className={styles.hash}>
                  {transaction.hash.slice(0, 10)}...
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}