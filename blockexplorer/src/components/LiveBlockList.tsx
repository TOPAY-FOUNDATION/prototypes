'use client';

import { useState, useEffect } from 'react';
import BlockCard from './BlockCard';
import LoadingSpinner from './LoadingSpinner';
import { Block, BlockchainClient } from '@/lib/blockchain';
import { useBlockchainPolling } from '@/lib/hooks/usePolling';
import styles from './live-block-list.module.css';
import { CubeIcon } from '@heroicons/react/24/outline';

interface LiveBlockListProps {
  maxBlocks?: number;
  className?: string;
}

export default function LiveBlockList({ maxBlocks = 5, className = '' }: LiveBlockListProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [newBlocksCount, setNewBlocksCount] = useState(0);
  const blockchain = new BlockchainClient();

  const fetchRecentBlocks = async () => {
    return await blockchain.getRecentBlocks(maxBlocks);
  };

  const {
    data: fetchedBlocks,
    loading,
    error,
    lastUpdated
  } = useBlockchainPolling(fetchRecentBlocks, {
    interval: 30000, // 30 seconds for block list
    onError: (err) => {
      console.error('Error fetching blocks:', err);
    }
  });

  useEffect(() => {
    if (fetchedBlocks && Array.isArray(fetchedBlocks)) {
      const currentBlockNumbers = blocks.map(b => b.index);
      const newBlocks = fetchedBlocks.filter(block => !currentBlockNumbers.includes(block.index));
      
      if (newBlocks.length > 0 && blocks.length > 0) {
        setNewBlocksCount(prev => prev + newBlocks.length);
        
        // Auto-clear the new blocks indicator after 5 seconds
        setTimeout(() => {
          setNewBlocksCount(0);
        }, 5000);
      }
      
      setBlocks(fetchedBlocks);
    }
  }, [fetchedBlocks, blocks]);

  const handleShowNewBlocks = () => {
    setNewBlocksCount(0);
    // Scroll to top to show new blocks
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && blocks.length === 0) {
    return (
      <div className={`${className}`}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="md" />
            <span className={styles.loadingText}>Loading recent blocks...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return (
      <div className={`${className}`}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h3 className={styles.errorTitle}>Error Loading Blocks</h3>
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
            <CubeIcon className={styles.titleIcon} />
            Recent Blocks
          </h2>
          <div className="flex items-center space-x-4">
            {newBlocksCount > 0 && (
              <button
                onClick={handleShowNewBlocks}
                className={styles.newBlocksButton}
              >
                <div className={styles.liveDot}></div>
                <span>
                  {newBlocksCount} new block{newBlocksCount > 1 ? 's' : ''}
                </span>
              </button>
            )}
            <div className={styles.liveStatus}>
              <div className={`${styles.liveDot} ${loading ? 'animate-pulse' : ''}`}></div>
              <span className={styles.liveStatusText}>
                {loading ? 'Updating...' : 'Live'}
              </span>
              {lastUpdated && (
                <span className="text-xs opacity-70">
                  ({lastUpdated.toLocaleTimeString()})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.blocksList}>
            {blocks.length > 0 ? (
              blocks.map((block, index) => (
                <div
                  key={block.hash}
                  className={`transition-all duration-500 ${
                    index === 0 && newBlocksCount > 0 ? 'animate-pulse' : ''
                  }`}
                >
                  <BlockCard block={block} />
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <CubeIcon className={styles.emptyStateIcon} />
                <h3 className={styles.emptyStateTitle}>No Blocks Available</h3>
                <p className={styles.emptyStateText}>There are currently no blocks in the blockchain.</p>
              </div>
            )}
          </div>
        </div>

        {loading && blocks.length > 0 && (
          <div className="flex items-center justify-center py-4 mt-2 text-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm opacity-70">Checking for new blocks...</span>
          </div>
        )}
      </div>
    </div>
  );
}