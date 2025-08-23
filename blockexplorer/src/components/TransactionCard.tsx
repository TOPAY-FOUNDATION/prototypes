'use client';

import Link from 'next/link';
import { Transaction } from '@/lib/blockchain';
import { formatHash, formatBalance, formatGwei, formatGas, copyToClipboard } from '@/lib/utils';
import { useState } from 'react';

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
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title">Transaction</h3>
        <div className="flex items-center space-x-2">
          <span className="text-secondary">Block #{transaction.blockNumber}</span>
        </div>
      </div>
      
      <div className="card-body">
        <div className="data-row">
          <span className="label">Hash:</span>
          <div className="flex items-center space-x-2">
            <span className="hash">
              {formatHash(transaction.hash, 12)}
            </span>
            <button
              onClick={() => handleCopy(transaction.hash, 'hash')}
              className="copy-button"
            >
              {copied === 'hash' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="data-row">
          <span className="label">From:</span>
          <div className="flex items-center space-x-2">
            <Link 
              href={`/address/${transaction.from}`}
              className="address link"
            >
              {formatHash(transaction.from)}
            </Link>
            <button
              onClick={() => handleCopy(transaction.from, 'from')}
              className="copy-button"
            >
              {copied === 'from' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="data-row">
          <span className="label">To:</span>
          <div className="flex items-center space-x-2">
            <Link 
              href={`/address/${transaction.to}`}
              className="address link"
            >
              {formatHash(transaction.to)}
            </Link>
            <button
              onClick={() => handleCopy(transaction.to, 'to')}
              className="copy-button"
            >
              {copied === 'to' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="data-row">
          <span className="label">Value:</span>
          <span className="value text-success font-semibold">
            {formatBalance(transaction.value)} TPY
          </span>
        </div>
        
        <div className="data-row">
          <span className="label">Gas Price:</span>
          <span className="value">
            {formatGwei(transaction.gasPrice)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Gas Limit:</span>
          <span className="text-sm text-gray-900 dark:text-white">
            {formatGas(transaction.gas)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Block Hash:</span>
          <Link 
            href={`/block/${transaction.blockHash}`}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
          >
            {formatHash(transaction.blockHash)}
          </Link>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link 
          href={`/tx/${transaction.hash}`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}