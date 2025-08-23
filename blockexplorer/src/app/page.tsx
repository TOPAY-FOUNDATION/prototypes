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
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="header">
        <div className="container py-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1" />
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold mb-2">
                TOPAY Block Explorer
              </h1>
              <p className="text-secondary">
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
      <main className="container py-8">
        {loading ? (
          <div className="loading-spinner py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-secondary">Loading blockchain data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="error-message max-w-md mx-auto">
              <h3 className="error-title mb-2">Connection Error</h3>
              <p className="error-text">{error.message || 'Failed to load blockchain data. Please check if the TOPAY network is running.'}</p>
              <button
                onClick={refetch}
                className="btn btn-error mt-4"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Status Indicator */}
            <div className="card p-4">
              <div className="live-indicator">
                <div className={`live-dot ${loading ? 'updating' : ''}`}></div>
                <span className="live-text">
                  {loading ? 'Updating...' : 'Live'}
                </span>
                {lastUpdated && (
                  <span className="timestamp">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                onClick={refetch}
                className="btn btn-small btn-primary"
              >
                Refresh Now
              </button>
            </div>

            {/* Network Stats */}
            {networkInfo && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Network Information</h2>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stats-card stats-card-blue">
                      <div className="stats-value">
                        {networkInfo.networkName}
                      </div>
                      <div className="stats-label">Network</div>
                    </div>
                    <div className="stats-card stats-card-green">
                      <div className="stats-value">
                        {formatNumber(networkInfo.latestBlock)}
                      </div>
                      <div className="stats-label">Latest Block</div>
                    </div>
                    <div className="stats-card stats-card-purple">
                      <div className="stats-value">
                        {networkInfo.chainId}
                      </div>
                      <div className="stats-label">Chain ID</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Latest Block */}
            {latestBlock && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">
                    Latest Block
                  </h2>
                  <Link 
                    href="/blocks"
                    className="link"
                  >
                    View All Blocks →
                  </Link>
                </div>
                <div className="card-body">
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
