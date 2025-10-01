'use client';

import { useState, useEffect } from 'react';
import { BlockchainClient } from '@/lib/blockchain';
import styles from './tokens-page.module.css';

interface TokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  totalSupply: number;
  owner: string;
  holders: number;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        const client = new BlockchainClient();
        const tokenData = await client.getAllTokens();
        setTokens(tokenData);
      } catch (err) {
        console.error('Failed to fetch tokens:', err);
        setError('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading tokens...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tokens</h1>
        <p>All tokens on the TOPAY Network</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{tokens.length}</div>
          <div className={styles.statLabel}>Total Tokens</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {tokens.reduce((sum, token) => sum + token.holders, 0)}
          </div>
          <div className={styles.statLabel}>Total Holders</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {tokens.reduce((sum, token) => sum + token.totalSupply, 0).toLocaleString()}
          </div>
          <div className={styles.statLabel}>Total Supply</div>
        </div>
      </div>

      <div className={styles.tokensTable}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Token</div>
          <div className={styles.headerCell}>Symbol</div>
          <div className={styles.headerCell}>Total Supply</div>
          <div className={styles.headerCell}>Holders</div>
          <div className={styles.headerCell}>Owner</div>
        </div>

        {tokens.length === 0 ? (
          <div className={styles.noTokens}>
            <p>No tokens found on the network</p>
          </div>
        ) : (
          tokens.map((token) => (
            <div key={token.tokenId} className={styles.tokenRow}>
              <div className={styles.tokenCell}>
                <div className={styles.tokenInfo}>
                  <div className={styles.tokenName}>{token.name}</div>
                  <div className={styles.tokenId}>{token.tokenId}</div>
                </div>
              </div>
              <div className={styles.tokenCell}>
                <span className={styles.symbol}>{token.symbol}</span>
              </div>
              <div className={styles.tokenCell}>
                {token.totalSupply.toLocaleString()}
              </div>
              <div className={styles.tokenCell}>
                {token.holders}
              </div>
              <div className={styles.tokenCell}>
                <span className={styles.address} title={token.owner}>
                  {token.owner.slice(0, 8)}...{token.owner.slice(-6)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}