'use client';

import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import ReportButton from './ReportButton';
import styles from './navigation.module.css';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { label: 'Home', href: '/', active: true },
    { label: 'Blockchain', href: '/blocks' },
    { label: 'Transactions', href: '/transactions' },
    { label: 'Addresses', href: '/addresses' },
    { label: 'Tokens', href: '/tokens' },
    { label: 'Resources', href: '/resources' },
  ];

  return (
    <nav className={`${styles['nav-header']} ${className}`}>
      <div className="container">
        <div className={styles['nav-container']}>
          {/* Logo */}
          <div className={styles['nav-logo-container']}>
            <Link href="/" className={styles['nav-logo-link']}>
              <div className={styles['nav-logo']}>
                <span className={styles['nav-logo-text']}>T</span>
              </div>
              <span className={styles['nav-title']}>
                TOPAY Explorer
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className={styles['nav-menu-desktop']}>
            <div className={styles['nav-links']}>
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles['nav-link']} ${
                    item.active ? styles['nav-link-active'] : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side actions */}
          <div className={styles['nav-actions']}>
            <ReportButton />
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <div className={styles['nav-mobile-menu-button-container']}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={styles['nav-mobile-menu-button']}
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className={styles['nav-icon']} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className={styles['nav-icon']} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className={styles['nav-mobile-menu']}>
            <div className={styles['nav-mobile-links']}>
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles['nav-mobile-link']} ${
                    item.active ? styles['nav-mobile-link-active'] : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}