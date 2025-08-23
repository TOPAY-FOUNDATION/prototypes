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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Block #{transaction.blockNumber}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Hash:</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900 dark:text-white font-mono break-all">
              {formatHash(transaction.hash, 12)}
            </span>
            <button
              onClick={() => handleCopy(transaction.hash, 'hash')}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              {copied === 'hash' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">From:</span>
          <div className="flex items-center space-x-2">
            <Link 
              href={`/address/${transaction.from}`}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
            >
              {formatHash(transaction.from)}
            </Link>
            <button
              onClick={() => handleCopy(transaction.from, 'from')}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              {copied === 'from' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">To:</span>
          <div className="flex items-center space-x-2">
            <Link 
              href={`/address/${transaction.to}`}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
            >
              {formatHash(transaction.to)}
            </Link>
            <button
              onClick={() => handleCopy(transaction.to, 'to')}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              {copied === 'to' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Value:</span>
          <span className="text-sm text-gray-900 dark:text-white font-semibold">
            {formatBalance(transaction.value)} ETH
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Gas Price:</span>
          <span className="text-sm text-gray-900 dark:text-white">
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