'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Address, BlockchainClient, TokenBalance } from '@/lib/blockchain';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatHash, formatBalance, formatNumber, copyToClipboard } from '@/lib/utils';
import styles from './address-page.module.css';

export default function AddressDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [addressData, setAddressData] = useState<Address | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const address = params.address as string;

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [addressResponse, tokenBalancesData] = await Promise.all([
          fetch(`/api/address?address=${address}`),
          (async () => {
            try {
              const client = new BlockchainClient();
              return await client.getAddressTokenBalances(address);
            } catch (err) {
              console.warn('Failed to fetch token balances:', err);
              return [];
            }
          })()
        ]);
        
        if (!addressResponse.ok) {
          throw new Error('Address not found');
        }
        
        const data = await addressResponse.json();
        setAddressData(data.address);
        setTokenBalances(tokenBalancesData);
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
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <span className={styles.loadingText}>Loading address details...</span>
      </div>
    );
  }

  if (error || !addressData) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorBox}>
          <h3 className={styles.errorTitle}>Address Not Found</h3>
          <p className={styles.errorText}>{error}</p>
          <button
            onClick={() => router.back()}
            className={styles.backButton}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.headerContent}>
            <div>
              <Link href="/" className={styles.backLink}>
                ← Back to Explorer
              </Link>
              <h1 className={styles.pageTitle}>
                Address Details
              </h1>
            </div>
            <div className={styles.addressContainer}>
              <div className={styles.addressLabel}>Address</div>
              <div className={styles.addressContent}>
                <span className={styles.addressText}>{formatHash(addressData.address, 12)}</span>
                <button
                  onClick={() => handleCopy(addressData.address, 'address')}
                  className={styles.copyButton}
                >
                  {copied === 'address' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentGrid}>
          {/* Address Overview */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Address Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Full Address */}
              <div className="md:col-span-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Address:</span>
                  <div className="flex items-center space-x-2 max-w-lg">
                    <span className="text-sm text-gray-900 dark:text-white font-mono break-all">
                      {addressData.address}
                    </span>
                    <button
                      onClick={() => handleCopy(addressData.address, 'fulladdress')}
                      className={styles.copyButton}
                    >
                      {copied === 'fulladdress' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Balance */}
              <div className={styles.balanceCard}>
                <div className={styles.balanceValue}>
                  {formatBalance(addressData.balance)}
                </div>
                <div className={styles.balanceLabel}>TOPAY Balance</div>
              </div>
              
              {/* Transaction Count */}
              <div className={styles.balanceCard}>
                <div className={styles.balanceValue}>
                  {formatNumber(addressData.transactionCount)}
                </div>
                <div className={styles.balanceLabel}>Total Transactions</div>
              </div>
              
              {/* Address Type */}
              <div className={styles.balanceCard}>
                <div className={styles.balanceValue}>
                  {addressData.transactionCount > 0 ? 'Active' : 'Inactive'}
                </div>
                <div className={styles.balanceLabel}>Address Status</div>
              </div>
            </div>
          </div>

          {/* Balance Details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Balance Information</h2>
            <div className="space-y-4">
              <div className={styles.card}>
                <div>
                  <div className={styles.balanceLabel}>Current Balance</div>
                  <div className={styles.balanceValue}>
                    {formatBalance(addressData.balance)} <span className={styles.balanceCurrency}>TOPAY</span>
                  </div>
                </div>
                <div className={styles.addressContainer}>
                  <div className={styles.addressLabel}>Wei Value</div>
                  <div className={styles.addressText}>
                    {addressData.balance} wei
                  </div>
                </div>
              </div>
              
              {addressData.balance !== '0' && (
                <div className={styles.card}>
                  <div>
                    💡 This address has a positive balance and can send transactions.
                  </div>
                </div>
              )}
              
              {addressData.balance === '0' && addressData.transactionCount > 0 && (
                <div className={styles.card}>
                  <div>
                    ⚠️ This address has transaction history but currently has no balance.
                  </div>
                </div>
              )}
              
              {addressData.balance === '0' && addressData.transactionCount === 0 && (
                <div className={styles.card}>
                  <div>
                    📭 This address has no balance and no transaction history.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Token Balances */}
          {tokenBalances.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Token Balances</h2>
              <div className={styles.tokenBalancesGrid}>
                {tokenBalances.map((tokenBalance) => (
                  <div key={tokenBalance.tokenId} className={styles.tokenBalanceCard}>
                    <div className={styles.tokenInfo}>
                      <div className={styles.tokenName}>{tokenBalance.tokenId}</div>
                      <div className={styles.tokenBalance}>
                        {tokenBalance.balance.toLocaleString()}
                      </div>
                    </div>
                    <Link 
                      href={`/tokens/${tokenBalance.tokenId}`}
                      className={styles.tokenLink}
                    >
                      View Token →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction History Placeholder */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              Transaction History ({formatNumber(addressData.transactionCount)})
            </h2>
            {addressData.transactionCount === 0 ? (
              <div className={styles.noTransactions}>
                <div>📝</div>
                <p>No transactions found</p>
                <p>
                  This address hasn&apos;t sent or received any transactions yet.
                </p>
              </div>
            ) : (
              <div className={styles.noTransactions}>
                <div>🔄</div>
                <p>
                  Transaction history feature coming soon
                </p>
                <p>
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