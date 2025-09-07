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
          <div className={styles.headerContent}>
            <div>
              <Link href="/" className={styles.backLink}>
                ← Back to Explorer
              </Link>
              <h1 className={styles.pageTitle}>
                Block #{formatNumber(block.number)}
              </h1>
            </div>
            <div className={styles.hashContainer}>
              <div className={styles.hashLabel}>Block Hash</div>
              <div className={styles.hashContent}>
                <span className={styles.hashText}>{formatHash(block.hash, 12)}</span>
                <button
                  onClick={() => handleCopy(block.hash, 'hash')}
                  className={styles.copyButton}
                >
                  {copied === 'hash' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentGrid}>
          {/* Block Details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Block Details</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoGroup}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Block Number:</span>
                  <span className={styles.infoText}>{formatNumber(block.number)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Timestamp:</span>
                  <span className={styles.infoText}>{formatTimestamp(block.timestamp)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Transactions:</span>
                  <span className={styles.infoText}>{formatNumber(block.transactions.length)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Parent Hash:</span>
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
                    >
                      {copied === 'parent' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <div className={styles.infoGroup}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Miner:</span>
                  <div className={styles.infoValue}>
                    <Link 
                      href={`/address/${block.miner}`}
                      className={styles.hashLink}
                    >
                      {formatHash(block.miner)}
                    </Link>
                    <button
                      onClick={() => handleCopy(block.miner, 'miner')}
                      className={styles.copyButton}
                    >
                      {copied === 'miner' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gas Used:</span>
                  <span className={styles.infoText}>{formatGas(block.gasUsed)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gas Limit:</span>
                  <span className={styles.infoText}>{formatGas(block.gasLimit)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gas Usage:</span>
                  <span className={styles.infoText}>
                    {((block.gasUsed / block.gasLimit) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Gas Usage Bar */}
            <div className={styles.gasUsageSection}>
              <div className={styles.gasUsageHeader}>
                <span>Gas Usage</span>
                <span>{formatGas(block.gasUsed)} / {formatGas(block.gasLimit)}</span>
              </div>
              <div className={styles.gasUsageBar}>
                <div 
                  className={styles.gasUsageFill} 
                  style={{ width: `${(block.gasUsed / block.gasLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Transactions */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Transactions</h2>
            <div className={styles.transactionsSection}>
              {block.transactions.length === 0 ? (
                <div className={styles.noTransactions}>
                  <p>No transactions in this block</p>
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