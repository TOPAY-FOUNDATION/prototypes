'use client';

import { useRouter } from 'next/navigation';
import { Block } from '@/lib/blockchain';
import { formatHash, formatTimeAgo, formatNumber } from '@/lib/utils';
import styles from './block-card.module.css';

interface BlockCardProps {
  block: Block;
  className?: string;
}

export default function BlockCard({ block, className = '' }: BlockCardProps) {
  const router = useRouter();
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a link or button
    if ((e.target as HTMLElement).closest('a, button')) {
      return;
    }
    router.push(`/block/${block.index}`);
  };
  
  return (
    <div 
      className={`${styles['block-card']} ${styles['clickable-card']} ${className}`}
      onClick={handleCardClick}
    >
      <div className={styles['card-header']}>
        <div className={styles['block-info']}>
          <div className={styles['icon-container']}>
            <svg className={styles['block-icon']} fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </div>
          <div>
            <span className={styles['block-number-link']}>
              Block #{formatNumber(block.index)}
            </span>
            <p className={styles['timestamp']}>
              {formatTimeAgo(block.timestamp)}
            </p>
          </div>
        </div>
        <div className={styles['transaction-count']}>
          <p className={styles['transaction-count-value']}>
            Difficulty: {block.difficulty}
          </p>
          <p className={styles['transaction-time']}>
            {formatTimeAgo(block.timestamp)}
          </p>
        </div>
      </div>
      
      <div className={styles['details-grid']}>
        <div>
          <p className={styles['detail-label']}>Previous Hash</p>
          <span className={styles['hash-value']}>
            {formatHash(block.previousHash)}
          </span>
        </div>
        
        <div>
          <p className={styles['detail-label']}>Nonce</p>
          <div className={styles['nonce-info']}>
            <span className={styles['nonce-value']}>
              {formatNumber(block.nonce)}
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles['card-footer']}>
        <span className={styles['hash-link']}>
          Hash: {formatHash(block.hash)}
        </span>
        <span className={styles['details-link']}>
          View Details →
        </span>
      </div>
    </div>
  );
}