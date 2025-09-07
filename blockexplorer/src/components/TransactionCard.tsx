'use client';

import Link from 'next/link';
import { Transaction } from '@/lib/blockchain';
import { formatHash, formatBalance, formatGwei, formatGas, copyToClipboard } from '@/lib/utils';
import { useState } from 'react';
import styles from './transaction-card.module.css';

interface TransactionCardProps {
  transaction: Transaction;
  className?: string;
}

export default function TransactionCard({ transaction, className = '' }: TransactionCardProps) {
  const [copied, setCopied] = useState('');

  const handleCopy = async (text: string, type: string) => {
    try {
      await copyToClipboard(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className={`${styles['transaction-card']} ${className}`}>
      <div className={styles['card-header']}>
        <div className={styles['tx-info']}>
          <div className={styles['tx-icon-container']}>
            <svg className={styles['tx-icon']} fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
          </div>
          <div>
            <Link 
              href={`/tx/${transaction.hash}`}
              className={styles['tx-hash-link']}
            >
              {formatHash(transaction.hash, 12)}
            </Link>
            <p className={styles['block-number']}>
              Block #{transaction.blockNumber}
            </p>
          </div>
        </div>
        <div className={styles['tx-value-container']}>
          <p className={styles['tx-value']}>
            {formatBalance(transaction.value)} TPY
          </p>
          <p className={styles['tx-gas-price']}>
            {formatGwei(transaction.gasPrice)}
          </p>
        </div>
      </div>
      
      <div className={styles['details-grid']}>
        <div>
          <p className={styles['detail-label']}>From</p>
          <div className={styles['address-container']}>
            <Link 
              href={`/address/${transaction.from}`}
              className={styles['address-link']}
            >
              {formatHash(transaction.from)}
            </Link>
            <button
              onClick={() => handleCopy(transaction.from, 'from')}
              className={styles['copy-button']}
              title="Copy address"
            >
              <svg className={styles['copy-icon']} fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div>
          <p className={styles['detail-label']}>To</p>
          <div className={styles['address-container']}>
            <Link 
              href={`/address/${transaction.to}`}
              className={styles['address-link']}
            >
              {formatHash(transaction.to)}
            </Link>
            <button
              onClick={() => handleCopy(transaction.to, 'to')}
              className={styles['copy-button']}
              title="Copy address"
            >
              <svg className={styles['copy-icon']} fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles['card-footer']}>
        <div className={styles['footer-content']}>
          <div className={styles['gas-info']}>
            <span className={styles['gas-text']}>
              Gas: {formatGas(transaction.gas)}
            </span>
            {copied && (
              <span className={styles['copied-text']}>
                Copied!
              </span>
            )}
          </div>
          <Link 
            href={`/tx/${transaction.hash}`}
            className={styles['details-link']}
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}