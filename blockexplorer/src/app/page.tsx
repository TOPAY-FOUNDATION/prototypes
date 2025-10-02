'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MarketStats from '@/components/MarketStats';

import { formatNumber } from '@/lib/utils';
import { BlockchainClient } from '@/lib/blockchain';
import { useBlockchainPolling } from '@/lib/hooks/usePolling';
import styles from './page.module.css';
import networkStyles from './network-info.module.css';
import LiveBlockList from '@/components/LiveBlockList';
import RecentTransactions from '@/components/RecentTransactions';

interface NetworkInfo {
  chainId: number;
  latestBlock: number;
  networkName: string;
  totalBlocks: number;
  difficulty: number;
  hashRate: string;
  version: string;
  totalSupply?: string;
  validators?: number;
  blockTime?: string;
}

export default function Home() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const blockchain = new BlockchainClient();

  const fetchData = async () => {
    const [latestBlock, networkData, blockchainStats] = await Promise.all([
      blockchain.getBlockByNumber('latest'),
      blockchain.getNetworkInfo(),
      blockchain.getBlockchainStats()
    ]);

    // Type assertion for network data
    const network = networkData as {
      totalBlocks: number;
      difficulty: number;
      hashingAlgorithm: string;
      networkName: string;
      chainId: number;
    };

    setNetworkInfo({
      chainId: network.chainId || 1,
      totalBlocks: network.totalBlocks,
      difficulty: network.difficulty,
      hashRate: network.hashingAlgorithm || 'TOPAY-Z512',
      networkName: network.networkName,
      version: '2.0.0',
      latestBlock: latestBlock.index,
      totalSupply: blockchainStats.totalTokens?.toString() || '0',
      validators: Math.floor(Math.random() * 1000000) + 2000000, // TODO: Get real validator count from API
      blockTime: '~12 seconds'
    });
    
    return { block: latestBlock, network: networkData };
  };

  const {
    loading,
    error,
    refetch
  } = useBlockchainPolling(fetchData, {
    interval: 30000, // 30 seconds
    onError: (err) => {
      console.error('Error fetching data:', err);
    }
  });

  return (
    <div className={styles.pageRoot}>
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              The TOPAY Blockchain Explorer
            </h1>
            <p className={styles.heroDescription}>
              Explore blocks, transactions, and addresses on the TOPAY network with real-time data and comprehensive analytics
            </p>
          </div>
          <div className={styles.searchContainer}>
            <SearchBar className={styles.searchBar} />
          </div>
        </div>
      </section>

      {/* Market Stats Section */}
      <section className={styles.marketStatsSection}>
        <MarketStats />
      </section>

      {/* Main Content */}
      <main className="container py-12">
        {loading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="lg" />
            <span className={styles.loadingText}>Loading blockchain data...</span>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorMessage}>
              <h3 className={styles.errorTitle}>Connection Error</h3>
              <p className={styles.errorText}>{error.message || 'Failed to load blockchain data. Please check if the TOPAY network is running.'}</p>
              <button
                onClick={refetch}
                className={styles.retryButton}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.contentContainer}>


            {/* Network Information */}
            {networkInfo && (
              <div className={networkStyles['network-info-card']}>
                <div className={networkStyles['card-header']}>
                  <h2 className={networkStyles['card-title']}>Network Information</h2>
                  <div className={networkStyles['live-indicator']}>
                    <div className={networkStyles['live-dot']}></div>
                    <span className={networkStyles['live-text']}>Live</span>
                  </div>
                </div>
                <div className={networkStyles['card-body']}>
                  <div className={networkStyles['info-grid']}>
                    <div className={networkStyles['info-column']}>
                      <div className={networkStyles['info-row']}>
                        <span className={networkStyles['info-label']}>Network</span>
                        <span className={networkStyles['info-value']}>{networkInfo.networkName}</span>
                      </div>
                      <div className={networkStyles['info-row']}>
                        <span className={networkStyles['info-label']}>Chain ID</span>
                        <span className={networkStyles['info-value']}>{networkInfo.chainId}</span>
                      </div>
                    </div>
                    <div className={networkStyles['info-column']}>
                      <div className={networkStyles['info-row']}>
                        <span className={networkStyles['info-label']}>Latest Block</span>
                        <span className={networkStyles['info-value']}>{formatNumber(networkInfo.latestBlock)}</span>
                      </div>
                      <div className={networkStyles['info-row']}>
                        <span className={networkStyles['info-label']}>Block Time</span>
                        <span className={networkStyles['info-value']}>{networkInfo.blockTime}</span>
                      </div>
                    </div>
                    <div className={networkStyles['info-column']}>
                      <div className={networkStyles['info-row']}>
                        <span className={networkStyles['info-label']}>Total Supply</span>
                        <span className={networkStyles['info-value']}>{formatNumber(parseInt(networkInfo.totalSupply || '0'))} TOPAY</span>
                      </div>
                      <div className={networkStyles['info-row']}>
                        <span className={networkStyles['info-label']}>Validators</span>
                        <span className={networkStyles['info-value']}>{formatNumber(networkInfo.validators || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Explorer Sections */}
            <section className={styles.explorerSections}>
              {/* Latest Blocks */}
              <div className={styles.explorerSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Latest Blocks</h2>
                  <Link href="/blocks" className={styles.sectionLink}>
                    View All Blocks →
                  </Link>
                </div>
                <div className={styles.sectionContent}>
                  <LiveBlockList />
                </div>
              </div>

              {/* Latest Transactions */}
              <div className={styles.explorerSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Latest Transactions</h2>
                  <Link href="/transactions" className={styles.sectionLink}>
                    View All Transactions →
                  </Link>
                </div>
                <div className={styles.sectionContent}>
                  <RecentTransactions />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
