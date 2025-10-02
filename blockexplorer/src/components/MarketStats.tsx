'use client';

import { useState, useEffect } from 'react';
import { BlockchainClient } from '@/lib/blockchain';
import styles from '../app/market-stats.module.css';

interface MarketStatsProps {
  className?: string;
}

interface MarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  totalTokens?: number;
}

export default function MarketStats({ className = '' }: MarketStatsProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const client = new BlockchainClient();
        const marketData = await client.getMarketData();
        
        setMarketData({
          price: marketData.price,
          marketCap: marketData.marketCap,
          volume24h: marketData.volume24h,
          change24h: marketData.change24h,
          totalTokens: marketData.totalSupply,
        });
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        // Fallback to zero values when API fails
        const fallbackData: MarketData = {
          price: 0,
          marketCap: 0,
          volume24h: 0,
          change24h: 0,
          totalTokens: 0,
        };
        setMarketData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatLargeNumber = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  };

  if (loading) {
    return (
      <div className={`${styles['market-stats-container']} ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={styles['market-stat-card']}>
            <div className={styles['stat-title']}>Loading...</div>
            <div className={styles['stat-value']}>--</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${styles['market-stats-container']} ${className}`}>
      <div className={styles['market-stat-card']}>
        <div className={styles['stat-title']}>TOPAY Price</div>
        <div className={styles['stat-value']}>{formatCurrency(marketData?.price || 0)}</div>
        <div className={marketData?.change24h && marketData.change24h >= 0 
          ? `${styles['stat-change']} ${styles['stat-change-positive']}` 
          : `${styles['stat-change']} ${styles['stat-change-negative']}`}>
          {marketData?.change24h && marketData.change24h >= 0 ? (
            <svg className={styles['stat-icon']} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className={styles['stat-icon']} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
            </svg>
          )}
          {Math.abs(marketData?.change24h || 0).toFixed(2)}%
        </div>
      </div>

      <div className={styles['market-stat-card']}>
        <div className={styles['stat-title']}>Market Cap</div>
        <div className={styles['stat-value']}>{formatLargeNumber(marketData?.marketCap || 0)}</div>
      </div>

      <div className={styles['market-stat-card']}>
        <div className={styles['stat-title']}>24h Volume</div>
        <div className={styles['stat-value']}>{formatLargeNumber(marketData?.volume24h || 0)}</div>
      </div>

      <div className={styles['market-stat-card']}>
        <div className={styles['stat-title']}>Total Tokens</div>
        <div className={styles['stat-value']}>{marketData?.totalTokens || 0}</div>
        <div className={styles['stat-description']}>Active on network</div>
      </div>
    </div>
  );
}