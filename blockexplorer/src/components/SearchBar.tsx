'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidAddress, isValidHash } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const trimmedQuery = query.trim();

    try {
      // Check if it's a valid address
      if (isValidAddress(trimmedQuery)) {
        router.push(`/address/${trimmedQuery}`);
      }
      // Check if it's a valid transaction hash
      else if (isValidHash(trimmedQuery)) {
        router.push(`/tx/${trimmedQuery}`);
      }
      // Check if it's a block number
      else if (/^\d+$/.test(trimmedQuery)) {
        router.push(`/block/${trimmedQuery}`);
      }
      // Check if it's a block hash
      else if (trimmedQuery.startsWith('0x') && trimmedQuery.length === 66) {
        router.push(`/block/${trimmedQuery}`);
      }
      else {
        alert('Invalid search query. Please enter a valid address, transaction hash, or block number/hash.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
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