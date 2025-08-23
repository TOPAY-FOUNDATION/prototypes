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
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading recent blocks...</span>
        </div>
      </div>
    );
  }

  if (error && blocks.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Error Loading Blocks</h3>
            <p className="text-red-600 dark:text-red-300">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Blocks</h2>
        <div className="flex items-center space-x-4">
          {newBlocksCount > 0 && (
            <button
              onClick={handleShowNewBlocks}
              className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg transition-colors animate-pulse"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {newBlocksCount} new block{newBlocksCount > 1 ? 's' : ''}
              </span>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? 'Updating...' : 'Live'}
            </span>
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
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
                index === 0 && newBlocksCount > 0 ? 'ring-2 ring-green-500 ring-opacity-50' : ''
              }`}
            >
              <BlockCard block={block} />
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No blocks available
          </div>
        )}
      </div>

      {loading && blocks.length > 0 && (
        <div className="flex justify-center items-center py-4 mt-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Checking for new blocks...</span>
        </div>
      )}
    </div>
  );
}