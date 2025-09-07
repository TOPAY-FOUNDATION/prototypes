'use client';

import { useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import BlockCard from '@/components/BlockCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MarketStats from '@/components/MarketStats';
import { Block } from '@/lib/blockchain';
import { formatNumber } from '@/lib/utils';
import { useBlockchainPolling } from '@/lib/hooks/usePolling';
import styles from './page.module.css';
import networkStyles from './network-info.module.css';
import explorerStyles from './explorer-sections.module.css';
import latestBlockStyles from './latest-block.module.css';
import liveStatusStyles from './live-status.module.css';
import LiveBlockList from '@/components/LiveBlockList';
import RecentTransactions from '@/components/RecentTransactions';

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
            {/* Live Status Indicator */}
            <div className={liveStatusStyles['status-card']}>
              <div className={liveStatusStyles['live-indicator']}>
                <div className={`${liveStatusStyles['live-dot']} ${loading ? liveStatusStyles['updating'] : ''}`}></div>
                <span className={`${liveStatusStyles['live-text']} ${loading ? liveStatusStyles['updating'] : ''}`}>
                  {loading ? 'Updating...' : 'Live'}
                </span>
                {lastUpdated && (
                  <span className={liveStatusStyles['timestamp']}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                onClick={refetch}
                className={liveStatusStyles['refresh-button']}
              >
                Refresh Now
              </button>
            </div>

            {/* Network Overview Stats */}
            {networkInfo && (
              <div className={styles.networkOverview}>
                {/* Top Stats Row - Etherscan Style */}
                <div className={styles.statsGrid}>
                  <div className={`${styles.statsCard} ${styles.statsCardBlue}`}>
                    <div className={styles.statsIcon}>
                    <svg className={styles.statsIconSvg} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                    <div className={styles.statsValue}>
                      ${formatNumber(24277.08)}
                    </div>
                    <div className={styles.statsLabel}>TOPAY Price</div>
                    <div className={styles.statsChange}>+0.37%</div>
                  </div>
                  <div className={`${styles.statsCard} ${styles.statsCardGreen}`}>
                    <div className={styles.statsIcon}>
                    <svg className={styles.statsIconSvg} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h10a1 1 0 100-2H3z" clipRule="evenodd" />
                      <path d="M7 14a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  </div>
                    <div className={styles.statsValue}>
                      ${formatNumber(516704897885)}
                    </div>
                    <div className={styles.statsLabel}>Market Cap</div>
                  </div>
                  <div className={`${styles.statsCard} ${styles.statsCardPurple}`}>
                    <div className={styles.statsIcon}>
                    <svg className={styles.statsIconSvg} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                    <div className={styles.statsValue}>
                      {formatNumber(2500.36)} M
                    </div>
                    <div className={styles.statsLabel}>Transactions</div>
                    <div className={styles.statsSubtext}>24h</div>
                  </div>
                  <div className={`${styles.statsCard} ${styles.statsCardOrange}`}>
                    <div className={styles.statsIcon}>
                    <svg className={styles.statsIconSvg} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
                      <path d="M10 4a1 1 0 00-1 1v5a1 1 0 002 0V5a1 1 0 00-1-1z" />
                    </svg>
                  </div>
                    <div className={styles.statsValue}>
                      0.172 Gwei
                    </div>
                    <div className={styles.statsLabel}>Med Gas Price</div>
                  </div>
                </div>

                {/* Network Information */}
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
                          <span className={networkStyles['info-value']}>~12 seconds</span>
                        </div>
                      </div>
                      <div className={networkStyles['info-column']}>
                        <div className={networkStyles['info-row']}>
                          <span className={networkStyles['info-label']}>Total Supply</span>
                          <span className={networkStyles['info-value']}>120,431,072 TOPAY</span>
                        </div>
                        <div className={networkStyles['info-row']}>
                          <span className={networkStyles['info-label']}>Validators</span>
                          <span className={networkStyles['info-value']}>2,317,764</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Latest Block */}
            {latestBlock && (
              <div className={latestBlockStyles['latest-block-card']}>
                <div className={latestBlockStyles['card-header']}>
                  <h2 className={latestBlockStyles['card-title']}>
                    Latest Block
                  </h2>
                  <Link 
                    href="/blocks"
                    className={latestBlockStyles['card-link']}
                  >
                    View All Blocks →
                  </Link>
                </div>
                <div className={latestBlockStyles['card-body']}>
                  <BlockCard block={latestBlock} />
                </div>
              </div>
            )}

            {/* Explorer Sections */}
            <div className={explorerStyles['explorer-grid']}>
              <div className={explorerStyles['section-container']}>
                <div className={explorerStyles['section-header']}>
                  <div className={explorerStyles['section-title-container']}>
                    <svg className={`${explorerStyles['section-icon']} ${explorerStyles['section-icon-blue']}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                    </svg>
                    <h2 className={explorerStyles['section-title']}>Latest Blocks</h2>
                  </div>
                  <Link 
                    href="/blocks"
                    className={explorerStyles['view-all-link']}
                  >
                    <span>View all blocks</span>
                    <svg className={explorerStyles['view-all-icon']} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
                <LiveBlockList maxBlocks={8} />
              </div>
              <div className={explorerStyles['section-container']}>
                <div className={explorerStyles['section-header']}>
                  <div className={explorerStyles['section-title-container']}>
                    <svg className={`${explorerStyles['section-icon']} ${explorerStyles['section-icon-green']}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                    </svg>
                    <h2 className={explorerStyles['section-title']}>Latest Transactions</h2>
                  </div>
                  <Link 
                    href="/transactions"
                    className={explorerStyles['view-all-link']}
                  >
                    <span>View all transactions</span>
                    <svg className={explorerStyles['view-all-icon']} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
                <RecentTransactions maxTransactions={10} />
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
