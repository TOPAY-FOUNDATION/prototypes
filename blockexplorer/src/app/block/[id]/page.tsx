'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Block } from '@/lib/blockchain';
import TransactionCard from '@/components/TransactionCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatHash, formatTimestamp, formatNumber, formatGas, copyToClipboard } from '@/lib/utils';
import styles from './block-page.module.css';
export default function BlockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const blockId = params.id as string;
  useEffect(() => {
    const fetchBlock = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const isBlockNumber = /^\d+$/.test(blockId);
        const queryParam = isBlockNumber ? `number=${blockId}` : `hash=${blockId}`;
        
        const response = await fetch(`/api/blocks?${queryParam}`);
        
        if (!response.ok) {
          throw new Error('Block not found');
        }
        
        const data = await response.json();
        setBlock(data.block);
      } catch (err) {
        console.error('Error fetching block:', err);
        setError('Block not found or failed to load');
      } finally {
        setLoading(false);
      }
    };
    if (blockId) {
      fetchBlock();
    }
  }, [blockId]);
  const handleCopy = async (text: string, type: string) => {
    try {
      await copyToClipboard(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <span className={styles.loadingText}>Loading block details...</span>
      </div>
    );
  }
  if (error || !block) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <h3 className={styles.errorTitle}>Block Not Found</h3>
          <p className={styles.errorText}>{error}</p>
          <button
            onClick={() => router.back()}
            className={styles.backButton}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>Home</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <Link href="/blocks" className={styles.breadcrumbLink}>Blocks</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>Block {formatNumber(block.number)}</span>
          </div>
          
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <div className={styles.blockIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className={styles.pageTitle}>Block</h1>
                <div className={styles.blockNumber}>#{formatNumber(block.number)}</div>
              </div>
            </div>
            
            <div className={styles.statusSection}>
              <div className={styles.statusBadge}>
                <div className={styles.statusDot}></div>
                <span>Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Overview Cards */}
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              </svg>
            </div>
            <div className={styles.overviewContent}>
              <div className={styles.overviewLabel}>Block Height</div>
              <div className={styles.overviewValue}>{formatNumber(block.number)}</div>
            </div>
          </div>
          
          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className={styles.overviewContent}>
              <div className={styles.overviewLabel}>Transactions</div>
              <div className={styles.overviewValue}>{formatNumber(block.transactions.length)}</div>
            </div>
          </div>
          
          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div className={styles.overviewContent}>
              <div className={styles.overviewLabel}>Gas Used</div>
              <div className={styles.overviewValue}>{((block.gasUsed / block.gasLimit) * 100).toFixed(1)}%</div>
            </div>
          </div>
          
          <div className={styles.overviewCard}>
            <div className={styles.overviewIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className={styles.overviewContent}>
              <div className={styles.overviewLabel}>Block Reward</div>
              <div className={styles.overviewValue}>2.5 TOPAY</div>
            </div>
          </div>
        </div>
        
        <div className={styles.contentGrid}>
          {/* Block Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Block Information</h2>
              <div className={styles.cardActions}>
                <button className={styles.actionButton}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Verified
                </button>
              </div>
            </div>
            
            <div className={styles.infoTable}>
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  </svg>
                  Block Hash:
                </div>
                <div className={styles.infoValue}>
                  <span className={styles.hashText}>{block.hash}</span>
                  <button
                    onClick={() => handleCopy(block.hash, 'hash')}
                    className={styles.copyButton}
                    title="Copy to clipboard"
                  >
                    {copied === 'hash' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  Timestamp:
                </div>
                <div className={styles.infoValue}>
                  <span>{formatTimestamp(block.timestamp)}</span>
                  <span className={styles.timeAgo}>({new Date(block.timestamp * 1000).toLocaleString()})</span>
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Transactions:
                </div>
                <div className={styles.infoValue}>
                  <span className={styles.transactionCount}>{formatNumber(block.transactions.length)} transactions</span>
                  {block.transactions.length > 0 && (
                    <Link href={`#transactions`} className={styles.viewLink}>View all</Link>
                  )}
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  Parent Hash:
                </div>
                <div className={styles.infoValue}>
                  <Link 
                    href={`/block/${block.parentHash}`}
                    className={styles.hashLink}
                  >
                    {formatHash(block.parentHash)}
                  </Link>
                  <button
                    onClick={() => handleCopy(block.parentHash, 'parent')}
                    className={styles.copyButton}
                    title="Copy to clipboard"
                  >
                    {copied === 'parent' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Miner:
                </div>
                <div className={styles.infoValue}>
                  <Link 
                    href={`/address/${block.miner}`}
                    className={styles.addressLink}
                  >
                    {formatHash(block.miner)}
                  </Link>
                  <button
                    onClick={() => handleCopy(block.miner, 'miner')}
                    className={styles.copyButton}
                    title="Copy to clipboard"
                  >
                    {copied === 'miner' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Gas Used:
                </div>
                <div className={styles.infoValue}>
                  <span>{formatGas(block.gasUsed)}</span>
                  <span className={styles.gasPercentage}>({((block.gasUsed / block.gasLimit) * 100).toFixed(2)}%)</span>
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Gas Limit:
                </div>
                <div className={styles.infoValue}>
                  <span>{formatGas(block.gasLimit)}</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Gas Usage Visualization */}
            <div className={styles.gasUsageSection}>
              <div className={styles.gasUsageHeader}>
                <span className={styles.gasUsageTitle}>Gas Usage</span>
                <span className={styles.gasUsageStats}>
                  {formatGas(block.gasUsed)} / {formatGas(block.gasLimit)} ({((block.gasUsed / block.gasLimit) * 100).toFixed(2)}%)
                </span>
              </div>
              <div className={styles.gasUsageBar}>
                <div 
                  className={styles.gasUsageFill} 
                  style={{ width: `${(block.gasUsed / block.gasLimit) * 100}%` }}
                />
              </div>
              <div className={styles.gasUsageLabels}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          {/* Transactions */}
          <div className={styles.card} id="transactions">
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Transactions
                <span className={styles.transactionBadge}>{formatNumber(block.transactions.length)}</span>
              </h2>
              {block.transactions.length > 0 && (
                <div className={styles.cardActions}>
                  <button className={styles.filterButton}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                    </svg>
                    Filter
                  </button>
                </div>
              )}
            </div>
            
            <div className={styles.transactionsSection}>
              {block.transactions.length === 0 ? (
                <div className={styles.noTransactions}>
                  <div className={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <h3>No Transactions</h3>
                    <p>This block contains no transactions</p>
                  </div>
                </div>
              ) : (
                <div className={styles.transactionsList}>
                  {block.transactions.map((tx, index) => (
                    <TransactionCard key={tx.hash || index} transaction={tx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}