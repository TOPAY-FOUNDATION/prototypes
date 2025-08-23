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
    <form onSubmit={handleSearch} className={`w-full max-w-2xl ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Address / Txn Hash / Block Number / Block Hash"
          className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}