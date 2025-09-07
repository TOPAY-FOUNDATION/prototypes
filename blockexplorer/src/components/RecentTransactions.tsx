'use client';

import { useMemo } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import TransactionCard from '@/components/TransactionCard';
import { type Transaction, type Block } from '@/lib/blockchain';
import { useBlockchainPolling } from '@/lib/hooks/usePolling';

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
        <div className="loading-spinner py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-secondary">Loading recent transactions...</span>
        </div>
      </div>
    );
  }

  if (error && (!transactions || transactions.length === 0)) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="error-message">
            <h3 className="error-title mb-2">Error Loading Transactions</h3>
            <p className="error-text">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="section-header mb-6">
        <h2 className="section-title">Recent Transactions</h2>
        <div className="flex items-center space-x-4">
          <div className="live-indicator">
            <div className={`live-dot ${loading ? 'updating' : ''}`}></div>
            <span className="live-text">{loading ? 'Updating...' : 'Live'}</span>
            {lastUpdated && (
              <span className="timestamp">({lastUpdated.toLocaleTimeString()})</span>
            )}
          </div>
        </div>
      </div>

      {transactions && transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <TransactionCard key={tx.hash} transaction={tx} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-description">No transactions available</p>
        </div>
      )}
    </div>
  );
}