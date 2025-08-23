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
      <div className="min-h-screen bg-page flex justify-center items-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-secondary">Loading block details...</span>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="min-h-screen bg-page flex justify-center items-center">
        <div className="error-message text-center">
          <h3 className="error-title">Block Not Found</h3>
          <p className="error-text mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="header">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-primary hover:text-primary-dark text-sm font-medium">
                ← Back to Explorer
              </Link>
              <h1 className="text-2xl font-bold mt-2">
                Block #{formatNumber(block.number)}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-secondary">Block Hash</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">{formatHash(block.hash, 12)}</span>
                <button
                  onClick={() => handleCopy(block.hash, 'hash')}
                  className="btn btn-small"
                >
                  {copied === 'hash' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-6">
          {/* Block Details */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Block Details</h2>
            </div>
            <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="data-row">
                  <span className="label">Block Number:</span>
                  <span className="value">{formatNumber(block.number)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Timestamp:</span>
                  <span className="value timestamp">{formatTimestamp(block.timestamp)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Transactions:</span>
                  <span className="value">{formatNumber(block.transactions.length)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Parent Hash:</span>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/block/${block.parentHash}`}
                      className="text-primary hover:text-primary-dark font-mono"
                    >
                      {formatHash(block.parentHash)}
                    </Link>
                    <button
                      onClick={() => handleCopy(block.parentHash, 'parent')}
                      className="btn btn-small"
                    >
                      {copied === 'parent' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="data-row">
                  <span className="label">Miner:</span>
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/address/${block.miner}`}
                      className="text-primary hover:text-primary-dark font-mono"
                    >
                      {formatHash(block.miner)}
                    </Link>
                    <button
                      onClick={() => handleCopy(block.miner, 'miner')}
                      className="btn btn-small"
                    >
                      {copied === 'miner' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="data-row">
                  <span className="label">Gas Used:</span>
                  <span className="value">{formatGas(block.gasUsed)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Gas Limit:</span>
                  <span className="value">{formatGas(block.gasLimit)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Gas Usage:</span>
                  <span className="value">
                    {((block.gasUsed / block.gasLimit) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Gas Usage Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-secondary mb-1">
                <span>Gas Usage</span>
                <span>{formatGas(block.gasUsed)} / {formatGas(block.gasLimit)}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${(block.gasUsed / block.gasLimit) * 100}%` }}
                ></div>
              </div>
            </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Transactions ({formatNumber(block.transactions.length)})
              </h2>
            </div>
            <div className="card-body">
              {block.transactions.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-description">No transactions in this block</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {block.transactions.map((tx, index) => (
                    <TransactionCard key={tx.hash || index} transaction={tx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}