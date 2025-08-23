'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About TOPAY</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              TOPAY is a next-generation blockchain platform designed for speed, security, and scalability.
            </p>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blocks" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  Blocks
                </Link>
              </li>
              <li>
                <Link href="/report/transaction" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  Report
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  Whitepaper
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Community */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  Twitter
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  Discord
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary hover:dark:text-primary-dark">
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} TOPAY Foundation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}