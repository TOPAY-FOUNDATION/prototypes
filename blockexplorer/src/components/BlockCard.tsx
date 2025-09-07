'use client';

import Link from 'next/link';
import { Block } from '@/lib/blockchain';
import { formatHash, formatTimeAgo, formatNumber, formatGas } from '@/lib/utils';
import styles from './block-card.module.css';

interface BlockCardProps {
  block: Block;
  className?: string;
}

export default function BlockCard({ block, className = '' }: BlockCardProps) {
  const gasPercentage = (block.gasUsed / block.gasLimit) * 100;
  
  return (
    <div className={`${styles['block-card']} ${className}`}>
      <div className={styles['card-header']}>
        <div className={styles['block-info']}>
          <div className={styles['icon-container']}>
            <svg className={styles['block-icon']} fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </div>
          <div>
            <Link 
              href={`/block/${block.number}`}
              className={styles['block-number-link']}
            >
              {formatNumber(block.number)}
            </Link>
            <p className={styles['timestamp']}>
              {formatTimeAgo(block.timestamp)}
            </p>
          </div>
        </div>
        <div className={styles['transaction-count']}>
          <p className={styles['transaction-count-value']}>
            {formatNumber(block.transactions.length)} txns
          </p>
          <p className={styles['transaction-time']}>
            in {formatTimeAgo(block.timestamp)}
          </p>
        </div>
      </div>
      
      <div className={styles['details-grid']}>
        <div>
          <p className={styles['detail-label']}>Miner</p>
          <Link 
            href={`/address/${block.miner}`}
            className={styles['miner-link']}
          >
            {formatHash(block.miner)}
          </Link>
        </div>
        
        <div>
          <p className={styles['detail-label']}>Gas Used</p>
          <div className={styles['gas-info']}>
            <span className={styles['gas-value']}>
              {formatGas(block.gasUsed)}
            </span>
            <span className={styles['gas-percentage']}>
              ({gasPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className={styles['gas-bar-container']}>
            <div 
              className={styles['gas-bar']}
              style={{ width: `${gasPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className={styles['card-footer']}>
        <Link 
          href={`/block/${block.hash}`}
          className={styles['hash-link']}
        >
          Hash: {formatHash(block.hash)}
        </Link>
        <Link 
          href={`/block/${block.number}`}
          className={styles['details-link']}
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}