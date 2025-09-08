'use client';

import { useMemo } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import TransactionCard from '@/components/TransactionCard';
import { type Transaction, type Block } from '@/lib/blockchain';
import { useBlockchainPolling } from '@/lib/hooks/usePolling';
import styles from './recent-transactions.module.css';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface RecentTransactionsProps {
  maxTransactions?: number;
  className?: string;
  // How many recent blocks to scan for transactions. Defaults to 10.
  blocksToScan?: number;
}

export default function RecentTransactions({
  maxTransactions = 10,
  className = '',
  blocksToScan = 10
}: RecentTransactionsProps) {
  const fetchRecentTransactions = async (): Promise<{ transactions: Transaction[] }> => {
    // Fetch recent blocks and aggregate their transactions
    const response = await fetch(`/api/blocks?limit=${blocksToScan}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent blocks for transactions');
    }

    const data = await response.json();
    const blocks: Block[] = data.blocks || [];

    // Flatten transactions and enrich ordering metadata
    const allTxs: Transaction[] = [];
    for (const block of blocks) {
      const txs = (block.transactions || []).map((tx) => ({
        ...tx,
        // Ensure blockNumber and blockHash are present (formatters set these already)
        blockNumber: tx.blockNumber ?? block.number,
        blockHash: tx.blockHash ?? block.hash,
      }));
      allTxs.push(...txs);
    }

    return { transactions: allTxs };
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
      if (a.blockNumber !== b.blockNumber) return b.blockNumber - a.blockNumber;
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