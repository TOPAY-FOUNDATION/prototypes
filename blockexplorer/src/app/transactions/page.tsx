'use client';

import RecentTransactions from '@/components/RecentTransactions';
import ThemeToggle from '@/components/ThemeToggle';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';
import styles from './transactions-page.module.css';

export default function TransactionsPage() {
  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <Link 
                href="/"
                className="text-primary hover:text-primary-700 text-sm font-medium"
              >
                ← Back to Home
              </Link>
            </div>
            <div className="text-center flex-1">
              <h1 className={styles.pageTitle}>
                Live Transactions
              </h1>
              <p className="text-secondary">
                Real-time view of the latest transactions on the TOPAY network
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
      <main className={styles.mainContent}>
        <RecentTransactions maxTransactions={20} />
      </main>
    </div>
  );
}