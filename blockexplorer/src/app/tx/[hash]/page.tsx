'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Transaction } from '@/lib/blockchain';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatHash, formatBalance, formatGwei, formatGas, formatNumber, copyToClipboard } from '@/lib/utils';

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading transaction details...</span>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto text-center">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Transaction Not Found</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                ← Back to Explorer
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                Transaction Details
              </h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Transaction Hash</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono text-gray-900 dark:text-white">{formatHash(transaction.hash, 12)}</span>
                <button
                  onClick={() => handleCopy(transaction.hash, 'hash')}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  {copied === 'hash' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Transaction Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Transaction Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Transaction Hash:</span>
                  <div className="flex items-center space-x-2 max-w-xs">
                    <span className="text-sm text-gray-900 dark:text-white font-mono break-all">
                      {transaction.hash}
                    </span>
                    <button
                      onClick={() => handleCopy(transaction.hash, 'fullhash')}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex-shrink-0"
                    >
                      {copied === 'fullhash' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Block Number:</span>
                  <Link 
                    href={`/block/${transaction.blockNumber}`}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                  >
                    #{formatNumber(transaction.blockNumber)}
                  </Link>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Block Hash:</span>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/block/${transaction.blockHash}`}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
                    >
                      {formatHash(transaction.blockHash)}
                    </Link>
                    <button
                      onClick={() => handleCopy(transaction.blockHash, 'blockhash')}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      {copied === 'blockhash' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Transaction Index:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{transaction.transactionIndex}</span>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Value:</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatBalance(transaction.value)} TPY
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
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Address Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">From:</div>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/address/${transaction.from}`}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
                    >
                      {transaction.from}
                    </Link>
                    <button
                      onClick={() => handleCopy(transaction.from, 'from')}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      {copied === 'from' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="text-red-600 dark:text-red-400 font-semibold">SENDER</div>
              </div>
              
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">To:</div>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/address/${transaction.to}`}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
                    >
                      {transaction.to}
                    </Link>
                    <button
                      onClick={() => handleCopy(transaction.to, 'to')}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      {copied === 'to' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="text-green-600 dark:text-green-400 font-semibold">RECIPIENT</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}