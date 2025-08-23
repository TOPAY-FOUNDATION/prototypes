'use client';

import { useState, useEffect } from 'react';
import BlockCard from './BlockCard';
import LoadingSpinner from './LoadingSpinner';
import { Block } from '@/lib/blockchain';
import { useBlockchainPolling } from '@/lib/hooks/usePolling';

interface LiveBlockListProps {
  maxBlocks?: number;
  className?: string;
}

export default function LiveBlockList({ maxBlocks = 5, className = '' }: LiveBlockListProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [newBlocksCount, setNewBlocksCount] = useState(0);

  const fetchRecentBlocks = async () => {
    const response = await fetch(`/api/blocks?limit=${maxBlocks}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch blocks');
    }

    const data = await response.json();
    return data.blocks || [];
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
      const currentBlockNumbers = blocks.map(b => b.number);
      const newBlocks = fetchedBlocks.filter(block => !currentBlockNumbers.includes(block.number));
      
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
        <div className="loading-spinner py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-secondary">Loading recent blocks...</span>
        </div>
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="error-message">
            <h3 className="error-title mb-2">Error Loading Blocks</h3>
            <p className="error-text">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="section-header mb-6">
        <h2 className="section-title">Recent Blocks</h2>
        <div className="flex items-center space-x-4">
          {newBlocksCount > 0 && (
            <button
              onClick={handleShowNewBlocks}
              className="btn btn-success btn-small animate-pulse"
            >
              <div className="live-dot"></div>
              <span>
                {newBlocksCount} new block{newBlocksCount > 1 ? 's' : ''}
              </span>
            </button>
          )}
          <div className="live-indicator">
            <div className={`live-dot ${loading ? 'updating' : ''}`}></div>
            <span className="live-text">
              {loading ? 'Updating...' : 'Live'}
            </span>
            {lastUpdated && (
              <span className="timestamp">
                ({lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {blocks.length > 0 ? (
          blocks.map((block, index) => (
            <div
              key={block.hash}
              className={`transition-all duration-500 ${
                index === 0 && newBlocksCount > 0 ? 'highlight-new' : ''
              }`}
            >
              <BlockCard block={block} />
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p className="empty-state-description">No blocks available</p>
          </div>
        )}
      </div>

      {loading && blocks.length > 0 && (
        <div className="loading-spinner py-4 mt-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-secondary text-sm">Checking for new blocks...</span>
        </div>
      )}
    </div>
  );
}