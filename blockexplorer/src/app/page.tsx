'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import BlockCard from '@/components/BlockCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ThemeToggle from '@/components/ThemeToggle';
import { Block } from '@/lib/blockchain';
import { formatNumber } from '@/lib/utils';
import { useBlockchainPolling } from '@/lib/hooks/usePolling';

interface NetworkInfo {
  chainId: number;
  latestBlock: number;
  networkName: string;
}

export default function Home() {
  const [latestBlock, setLatestBlock] = useState<Block | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  const fetchData = async () => {
    const [blockResponse, networkResponse] = await Promise.all([
      fetch('/api/blocks?latest=true'),
      fetch('/api/network')
    ]);

    if (!blockResponse.ok || !networkResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const blockData = await blockResponse.json();
    const networkData = await networkResponse.json();

    setLatestBlock(blockData.block);
    setNetworkInfo(networkData.network);
    
    return { block: blockData.block, network: networkData.network };
  };

  const {
    loading,
    error,
    lastUpdated,
    refetch
  } = useBlockchainPolling(fetchData, {
    interval: 30000, // 30 seconds
    onError: (err) => {
      console.error('Error fetching data:', err);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1" />
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                TOPAY Block Explorer
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Explore blocks, transactions, and addresses on the TOPAY network
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <ThemeToggle />
            </div>
          </div>
          <div className="text-center">
            <SearchBar className="mx-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading blockchain data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Connection Error</h3>
              <p className="text-red-600 dark:text-red-300">{error.message || 'Failed to load blockchain data. Please check if the TOPAY network is running.'}</p>
              <button
                onClick={refetch}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Status Indicator */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {loading ? 'Updating...' : 'Live'}
                </span>
                {lastUpdated && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                onClick={refetch}
                className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
              >
                Refresh Now
              </button>
            </div>

            {/* Network Stats */}
            {networkInfo && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Network Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {networkInfo.networkName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Network</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatNumber(networkInfo.latestBlock)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Latest Block</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {networkInfo.chainId}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Chain ID</div>
                  </div>
                </div>
              </div>
            )}

            {/* Latest Block */}
            {latestBlock && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Latest Block
                  </h2>
                  <Link 
                    href="/blocks"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View All Blocks →
                  </Link>
                </div>
                <div className="p-6">
                  <BlockCard block={latestBlock} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
