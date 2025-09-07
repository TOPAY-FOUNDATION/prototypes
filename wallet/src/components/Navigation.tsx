'use client';

import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Wallet, Send, History, Settings, User } from 'lucide-react';
import styles from './navigation.module.css';

interface NavigationProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Navigation({ className = '', activeTab = 'wallet', onTabChange }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { label: 'Wallet', href: '#wallet', id: 'wallet', icon: Wallet },
    { label: 'Send', href: '#send', id: 'send', icon: Send },
    { label: 'History', href: '#history', id: 'history', icon: History },
    { label: 'Account', href: '#account', id: 'account', icon: User },
    { label: 'Settings', href: '#settings', id: 'settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

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
                TOPAY Wallet
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className={styles['nav-menu-desktop']}>
            <div className={styles['nav-links']}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleTabClick(item.id, e)}
                    className={`${styles['nav-link']} ${
                      activeTab === item.id ? styles['nav-link-active'] : ''
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </a>
                );
              })}
            </div>

            {/* Theme Toggle */}
            <div className={styles['nav-actions']}>
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className={styles['nav-menu-mobile']}>
            <ThemeToggle />
            <button
              className={styles['nav-menu-button']}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <svg
                className={styles['nav-menu-icon']}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className={styles['nav-mobile-menu']}>
            <div className={styles['nav-mobile-links']}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      handleTabClick(item.id, e);
                      setIsMenuOpen(false);
                    }}
                    className={`${styles['nav-mobile-link']} ${
                      activeTab === item.id ? styles['nav-mobile-link-active'] : ''
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}