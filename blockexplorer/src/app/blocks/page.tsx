'use client';

import LiveBlockList from '@/components/LiveBlockList';
import ThemeToggle from '@/components/ThemeToggle';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

export default function BlocksPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                ← Back to Home
              </Link>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Live Blocks
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time view of the latest blocks on the TOPAY network
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <ThemeToggle />
            </div>
          </div>
          <div className="text-center">
            <SearchBar className="mx-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LiveBlockList maxBlocks={10} />
      </main>
    </div>
  );
}