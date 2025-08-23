'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Address } from '@/lib/blockchain';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatHash, formatBalance, formatNumber, copyToClipboard } from '@/lib/utils';

export default function AddressDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [addressData, setAddressData] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const address = params.address as string;

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/address?address=${address}`);
        
        if (!response.ok) {
          throw new Error('Address not found');
        }
        
        const data = await response.json();
        setAddressData(data.address);
      } catch (err) {
        console.error('Error fetching address:', err);
        setError('Address not found or failed to load');
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchAddress();
    }
  }, [address]);

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
        <span className="ml-3 text-gray-600">Loading address details...</span>
      </div>
    );
  }

  if (error || !addressData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Address Not Found</h3>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to Explorer
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Address Details
              </h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Address</div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono text-gray-900">{formatHash(addressData.address, 12)}</span>
                <button
                  onClick={() => handleCopy(addressData.address, 'address')}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                >
                  {copied === 'address' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Address Overview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Address Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Full Address */}
              <div className="md:col-span-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600 mt-1">Address:</span>
                  <div className="flex items-center space-x-2 max-w-lg">
                    <span className="text-sm text-gray-900 font-mono break-all">
                      {addressData.address}
                    </span>
                    <button
                      onClick={() => handleCopy(addressData.address, 'fulladdress')}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 flex-shrink-0"
                    >
                      {copied === 'fulladdress' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Balance */}
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatBalance(addressData.balance)}
                </div>
                <div className="text-sm text-gray-600">ETH Balance</div>
              </div>
              
              {/* Transaction Count */}
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatNumber(addressData.transactionCount)}
                </div>
                <div className="text-sm text-gray-600">Total Transactions</div>
              </div>
              
              {/* Address Type */}
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {addressData.transactionCount > 0 ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-gray-600">Address Status</div>
              </div>
            </div>
          </div>

          {/* Balance Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-600">Current Balance</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatBalance(addressData.balance)} ETH
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Wei Value</div>
                  <div className="text-sm font-mono text-gray-700">
                    {addressData.balance} wei
                  </div>
                </div>
              </div>
              
              {addressData.balance !== '0' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    💡 This address has a positive balance and can send transactions.
                  </div>
                </div>
              )}
              
              {addressData.balance === '0' && addressData.transactionCount > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    ⚠️ This address has transaction history but currently has no balance.
                  </div>
                </div>
              )}
              
              {addressData.balance === '0' && addressData.transactionCount === 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    📭 This address has no balance and no transaction history.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction History Placeholder */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Transaction History ({formatNumber(addressData.transactionCount)})
            </h2>
            {addressData.transactionCount === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg mb-2">No transactions found</p>
                <p className="text-gray-400 text-sm">
                  This address hasn&apos;t sent or received any transactions yet.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-blue-400 text-6xl mb-4">🔄</div>
                <p className="text-gray-500 text-lg mb-2">
                  Transaction history feature coming soon
                </p>
                <p className="text-gray-400 text-sm">
                  This address has {formatNumber(addressData.transactionCount)} transaction{addressData.transactionCount !== 1 ? 's' : ''}.
                  Detailed transaction history will be available in a future update.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}