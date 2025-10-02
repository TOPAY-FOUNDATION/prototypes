'use client';

import { useMemo } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import TransactionCard from '@/components/TransactionCard';
import { type Transaction, BlockchainClient } from '@/lib/blockchain';
import { useBlockchainPolling } from '@/lib/hooks/usePolling';
import styles from './recent-transactions.module.css';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface RecentTransactionsProps {
  maxTransactions?: number;
  className?: string;
}

export default function RecentTransactions({
  maxTransactions = 10,
  className = ''
}: RecentTransactionsProps) {
  // Use useMemo to prevent blockchain client recreation on every render
  const blockchain = useMemo(() => new BlockchainClient(), []);

  const fetchRecentTransactions = async (): Promise<{ transactions: Transaction[] }> => {
    // Use the new blockchain client to get recent transactions directly
    const transactions = await blockchain.getRecentTransactions(maxTransactions);
    return { transactions };
  };

  const { data, loading, error, lastUpdated } = useBlockchainPolling(fetchRecentTransactions, {
    interval: 30000,
    onError: (err) => {
      console.error('Error fetching recent transactions:', err);
    }
  });

  const transactions = useMemo(() => {
    const txs = data?.transactions || [];
    // Sort by blockNumber desc, then transactionIndex desc to show newest first
    const sorted = [...txs].sort((a, b) => {
      const aBlockNumber = a.blockNumber || a.blockIndex || 0;
      const bBlockNumber = b.blockNumber || b.blockIndex || 0;
      if (aBlockNumber !== bBlockNumber) return bBlockNumber - aBlockNumber;
      return (b.transactionIndex ?? 0) - (a.transactionIndex ?? 0);
    });
    return sorted.slice(0, maxTransactions);
  }, [data, maxTransactions]);

  if (loading && (!transactions || transactions.length === 0)) {
    return (
      <div className={`${className}`}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="md" />
            <span className={styles.loadingText}>Loading recent transactions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && (!transactions || transactions.length === 0)) {
    return (
      <div className={`${className}`}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h3 className={styles.errorTitle}>Error Loading Transactions</h3>
            <p className={styles.errorText}>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <ArrowPathIcon className={styles.titleIcon} />
            Recent Transactions
          </h2>
          <div className={styles.liveStatus}>
            <div className={`${styles.liveDot} ${loading ? 'animate-pulse' : ''}`}></div>
            <span className={styles.liveStatusText}>
              {loading ? 'Updating...' : 'Live'}
            </span>
            {lastUpdated && (
              <span className="text-xs opacity-70">({lastUpdated.toLocaleTimeString()})</span>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.transactionsList}>
            {transactions && transactions.length > 0 ? (
              transactions.map((tx) => (
                <TransactionCard key={tx.hash} transaction={tx} />
              ))
            ) : (
              <div className={styles.emptyState}>
                <ArrowPathIcon className={styles.emptyStateIcon} />
                <h3 className={styles.emptyStateTitle}>No Transactions Available</h3>
                <p className={styles.emptyStateText}>There are currently no transactions in the blockchain.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}