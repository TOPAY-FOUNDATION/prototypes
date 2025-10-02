'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidAddress, isValidHash } from '@/lib/utils';
import { BlockchainClient } from '@/lib/blockchain';

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const blockchain = new BlockchainClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const trimmedQuery = query.trim();

    try {
      // Use the new search API to find the query
      const searchResults = await blockchain.search(trimmedQuery);
      
      // If we found results, navigate to the most relevant one
      if (searchResults.totalResults > 0) {
        if (searchResults.blocks && searchResults.blocks.length > 0) {
          // Navigate to the first block found
          const firstBlock = searchResults.blocks[0] as { index: number };
          router.push(`/block/${firstBlock.index}`);
        } else if (searchResults.transactions && searchResults.transactions.length > 0) {
          // Navigate to the first transaction found
          const firstTx = searchResults.transactions[0] as { hash: string };
          router.push(`/tx/${firstTx.hash}`);
        } else if (searchResults.addresses && searchResults.addresses.length > 0) {
          // Navigate to the first address found
          const firstAddress = searchResults.addresses[0] as { address: string };
          router.push(`/address/${firstAddress.address}`);
        }
      } else {
        // Fallback to the original logic if no results found
        if (isValidAddress(trimmedQuery)) {
          router.push(`/address/${trimmedQuery}`);
        } else if (isValidHash(trimmedQuery)) {
          router.push(`/tx/${trimmedQuery}`);
        } else if (/^\d+$/.test(trimmedQuery)) {
          router.push(`/block/${trimmedQuery}`);
        } else if (trimmedQuery.startsWith('0x') && trimmedQuery.length === 66) {
          router.push(`/block/${trimmedQuery}`);
        } else {
          alert('No results found. Please enter a valid address, transaction hash, or block number/hash.');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to original logic on error
      try {
        if (isValidAddress(trimmedQuery)) {
          router.push(`/address/${trimmedQuery}`);
        } else if (isValidHash(trimmedQuery)) {
          router.push(`/tx/${trimmedQuery}`);
        } else if (/^\d+$/.test(trimmedQuery)) {
          router.push(`/block/${trimmedQuery}`);
        } else if (trimmedQuery.startsWith('0x') && trimmedQuery.length === 66) {
          router.push(`/block/${trimmedQuery}`);
        } else {
          alert('Search failed. Please enter a valid address, transaction hash, or block number/hash.');
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        alert('Search failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className={`search-bar ${className}`}>
      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Address / Txn Hash / Block Number / Block Hash"
          className="search-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="search-button"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}