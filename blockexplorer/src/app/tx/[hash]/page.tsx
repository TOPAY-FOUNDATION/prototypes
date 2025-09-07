'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Transaction } from '@/lib/blockchain';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatHash, formatBalance, formatGwei, formatGas, formatNumber, copyToClipboard } from '@/lib/utils';
import styles from './transaction-page.module.css';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const txHash = params.hash as string;

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/transactions?hash=${txHash}`);
        
        if (!response.ok) {
          throw new Error('Transaction not found');
        }
        
        const data = await response.json();
        setTransaction(data.transaction);
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError('Transaction not found or failed to load');
      } finally {
        setLoading(false);
      }
    };

    if (txHash) {
      fetchTransaction();
    }
  }, [txHash]);

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
        <span className={styles.loadingText}>Loading transaction details...</span>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorBox}>
          <h3 className={styles.errorTitle}>Transaction Not Found</h3>
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
                Transaction Details
              </h1>
            </div>
            <div className={styles.hashContainer}>
              <div className={styles.hashLabel}>Transaction Hash</div>
              <div className={styles.hashContent}>
                <span className={styles.hashText}>{formatHash(transaction.hash, 12)}</span>
                <button
                  onClick={() => handleCopy(transaction.hash, 'hash')}
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
          {/* Transaction Overview */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Transaction Overview</h2>
            <div className={styles.overviewGrid}>
              {/* Left Column */}
              <div className={styles.infoGroup}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Transaction Hash:</span>
                  <div className={styles.infoValue}>
                    <span className={styles.hashFullText}>
                      {transaction.hash}
                    </span>
                    <button
                      onClick={() => handleCopy(transaction.hash, 'fullhash')}
                      className={styles.copyButton}
                    >
                      {copied === 'fullhash' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Block Number:</span>
                  <Link 
                    href={`/block/${transaction.blockNumber}`}
                    className={styles.blockLink}
                  >
                    #{formatNumber(transaction.blockNumber)}
                  </Link>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Block Hash:</span>
                  <div className={styles.infoValue}>
                    <Link 
                      href={`/block/${transaction.blockHash}`}
                      className={styles.hashLink}
                    >
                      {formatHash(transaction.blockHash)}
                    </Link>
                    <button
                      onClick={() => handleCopy(transaction.blockHash, 'blockhash')}
                      className={styles.copyButton}
                    >
                      {copied === 'blockhash' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Transaction Index:</span>
                  <span className={styles.infoText}>{transaction.transactionIndex}</span>
                </div>
              </div>
              
              {/* Right Column */}
              <div className={styles.infoGroup}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Value:</span>
                  <span className={styles.valueText}>
                    {formatBalance(transaction.value)} TPY
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gas Price:</span>
                  <span className={styles.gasText}>
                    {formatGwei(transaction.gasPrice)}
                  </span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gas Limit:</span>
                  <span className={styles.gasText}>
                    {formatGas(transaction.gas)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Address Information</h2>
            <div className={styles.addressSection}>
              <div className={`${styles.addressCard} ${styles.senderCard}`}>
                <div>
                  <div className={styles.addressLabel}>From:</div>
                  <div className={styles.addressValue}>
                    <Link 
                      href={`/address/${transaction.from}`}
                      className={styles.addressLink}
                    >
                      {transaction.from}
                    </Link>
                    <button
                      onClick={() => handleCopy(transaction.from, 'from')}
                      className={styles.copyButton}
                    >
                      {copied === 'from' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className={styles.senderRole}>SENDER</div>
              </div>
              
              <div className={styles.arrowContainer}>
                <div className={styles.arrowCircle}>
                  <svg className={styles.arrowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
              
              <div className={`${styles.addressCard} ${styles.recipientCard}`}>
                <div>
                  <div className={styles.addressLabel}>To:</div>
                  <div className={styles.addressValue}>
                    <Link 
                      href={`/address/${transaction.to}`}
                      className={styles.addressLink}
                    >
                      {transaction.to}
                    </Link>
                    <button
                      onClick={() => handleCopy(transaction.to, 'to')}
                      className={styles.copyButton}
                    >
                      {copied === 'to' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className={styles.recipientRole}>RECIPIENT</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}