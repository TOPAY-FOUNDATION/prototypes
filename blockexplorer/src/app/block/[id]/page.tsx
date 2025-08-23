'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Block } from '@/lib/blockchain';
import TransactionCard from '@/components/TransactionCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatHash, formatTimestamp, formatNumber, formatGas, copyToClipboard } from '@/lib/utils';

export default function BlockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const blockId = params.id as string;

  useEffect(() => {
    const fetchBlock = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const isBlockNumber = /^\d+$/.test(blockId);
        const queryParam = isBlockNumber ? `number=${blockId}` : `hash=${blockId}`;
        
        const response = await fetch(`/api/blocks?${queryParam}`);
        
        if (!response.ok) {
          throw new Error('Block not found');
        }
        
        const data = await response.json();
        setBlock(data.block);
      } catch (err) {
        console.error('Error fetching block:', err);
        setError('Block not found or failed to load');
      } finally {
        setLoading(false);
      }
    };

    if (blockId) {
      fetchBlock();
    }
  }, [blockId]);

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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading block details...</span>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Block Not Found</h3>
          <p className="text-red-600 mb-4">{error}</p>
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
                Block #{formatNumber(block.number)}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Block Hash</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">{formatHash(block.hash, 12)}</span>
                <button
                  onClick={() => handleCopy(block.hash, 'hash')}
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
          {/* Block Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Block Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Block Number:</span>
                  <span className="text-sm text-gray-900 dark:text-gray-200">{formatNumber(block.number)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp:</span>
                  <span className="text-sm text-gray-900 dark:text-gray-200">{formatTimestamp(block.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions:</span>
                  <span className="text-sm text-gray-900 dark:text-gray-200">{formatNumber(block.transactions.length)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Parent Hash:</span>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/block/${block.parentHash}`}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
                    >
                      {formatHash(block.parentHash)}
                    </Link>
                    <button
                      onClick={() => handleCopy(block.parentHash, 'parent')}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      {copied === 'parent' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Miner:</span>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/address/${block.miner}`}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono"
                    >
                      {formatHash(block.miner)}
                    </Link>
                    <button
                      onClick={() => handleCopy(block.miner, 'miner')}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      {copied === 'miner' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Gas Used:</span>
                  <span className="text-sm text-gray-900">{formatGas(block.gasUsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Gas Limit:</span>
                  <span className="text-sm text-gray-900">{formatGas(block.gasLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Gas Usage:</span>
                  <span className="text-sm text-gray-900">
                    {((block.gasUsed / block.gasLimit) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Gas Usage Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Gas Usage</span>
                <span>{formatGas(block.gasUsed)} / {formatGas(block.gasLimit)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(block.gasUsed / block.gasLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Transactions ({formatNumber(block.transactions.length)})
            </h2>
            {block.transactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions in this block</p>
            ) : (
              <div className="space-y-4">
                {block.transactions.map((tx, index) => (
                  <TransactionCard key={tx.hash || index} transaction={tx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}