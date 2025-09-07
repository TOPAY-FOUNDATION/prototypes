'use client';

import { useState } from 'react';
import styles from '../../page.module.css';

interface BlockchainInfo {
  blockCount: number;
  height: number;
  difficulty: number;
  latestBlock: {
    hash: string;
    timestamp: number;
    transactions: unknown[];
    nonce: number;
  };
}

interface MempoolData {
  count: number;
  transactions: Array<{
    amount: number;
    from: string;
    to: string;
    hash: string;
  }>;
}

interface Block {
  index: number;
  timestamp: number;
  transactions: unknown[];
  hash: string;
}

interface BlockchainInfoProps {
  info: BlockchainInfo;
  onRefresh?: () => void | Promise<void>;
}

export default function BlockchainInfo({ info, onRefresh }: BlockchainInfoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mempoolData, setMempoolData] = useState<MempoolData | null>(null);
  const [latestBlocks, setLatestBlocks] = useState<Block[]>([]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Ensure onRefresh is a function before calling it
      if (typeof onRefresh === 'function') {
        await onRefresh();
      }
      
      // Fetch mempool data
      const mempoolResponse = await fetch('/api/blockchain/mempool');
      if (mempoolResponse.ok) {
        const mempool = await mempoolResponse.json();
        setMempoolData(mempool);
      }

      // Fetch latest blocks
      const blocksResponse = await fetch('/api/blockchain/blocks?limit=5');
      if (blocksResponse.ok) {
        const blocks = await blocksResponse.json();
        setLatestBlocks(blocks.blocks || []);
      }
    } catch (error) {
      console.error('Failed to refresh blockchain data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 className={styles.cardTitle}>Blockchain Information</h2>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={refreshData}
            disabled={isLoading}
          >
            {isLoading ? <span className={styles.spinner}></span> : null}
            Refresh
          </button>
        </div>

        {info ? (
          <div className={styles.grid + ' ' + styles.gridCols2}>
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Network Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Blocks:</span>
                  <strong>{info.blockCount || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Chain Height:</span>
                  <strong>{info.height || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Difficulty:</span>
                  <strong>{info.difficulty || 1}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pending Transactions:</span>
                  <strong>{mempoolData?.count || 0}</strong>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Latest Block</h3>
              {info.latestBlock ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Block Hash:</span>
                    <code style={{ fontSize: '0.8rem' }}>{formatHash(info.latestBlock.hash)}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Timestamp:</span>
                    <span style={{ fontSize: '0.9rem' }}>{formatTimestamp(info.latestBlock.timestamp)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Transactions:</span>
                    <strong>{info.latestBlock.transactions?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Nonce:</span>
                    <strong>{info.latestBlock.nonce || 0}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No blocks available</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <p>Loading blockchain information...</p>
          </div>
        )}
      </div>

      {/* Mempool Information */}
      {mempoolData && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Memory Pool</h2>
          {mempoolData.transactions && mempoolData.transactions.length > 0 ? (
            <div>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                {mempoolData.count} pending transaction(s) waiting to be mined
              </p>
              <div className={styles.transactionList}>
                {mempoolData.transactions.slice(0, 10).map((tx, index) => (
                  <div key={index} className={styles.transactionItem}>
                    <div>
                      <div style={{ fontWeight: '500' }}>
                        {tx.amount} TOPAY
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        From: {formatHash(tx.from)} → To: {formatHash(tx.to)}
                      </div>
                    </div>
                    <div className={styles.transactionHash}>
                      {formatHash(tx.hash)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No pending transactions</p>
          )}
        </div>
      )}

      {/* Recent Blocks */}
      {latestBlocks.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent Blocks</h2>
          <div className={styles.transactionList}>
            {latestBlocks.map((block, index) => (
              <div key={index} className={styles.transactionItem}>
                <div>
                  <div style={{ fontWeight: '500' }}>
                    Block #{block.index}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {formatTimestamp(block.timestamp)} • {block.transactions?.length || 0} transactions
                  </div>
                </div>
                <div className={styles.transactionHash}>
                  {formatHash(block.hash)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Information */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Network Details</h2>
        <div className={styles.grid + ' ' + styles.gridCols2}>
          <div>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Consensus</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Algorithm:</span>
                <strong>Proof of Work</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Block Time:</span>
                <strong>~10 minutes</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Max Block Size:</span>
                <strong>1 MB</strong>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Security</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Signature:</span>
                <strong>CRYSTALS-Dilithium</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Hash Function:</span>
                <strong>SHA-256</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quantum Safe:</span>
                <strong style={{ color: 'var(--success-color)' }}>Yes</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}