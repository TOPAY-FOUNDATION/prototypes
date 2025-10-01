'use client';

import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Wallet, Send, History, Settings, User, LogOut } from 'lucide-react';
import styles from './navigation.module.css';

interface NavigationProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Navigation({ className = '', activeTab = 'wallet', onTabChange }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleLogout = () => {
    // Clear all wallet data
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletPrivateKey');
    localStorage.removeItem('hasCompletedWelcome');
    localStorage.removeItem('topayProfile');
    localStorage.removeItem('topaySecuritySettings');
    
    // Clear all wallet-specific data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('topayWallet_') || key.startsWith('topay_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    setShowLogoutModal(false);
    
    // Redirect to welcome page
    window.location.href = '/welcome';
  };

  return (
    <>
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
                
                {/* Logout Button */}
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className={`${styles['nav-link']} ${styles['nav-logout-button']}`}
                  title="Remove Wallet / Logout"
                >
                  <LogOut size={16} />
                  Logout
                </button>
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
                
                {/* Mobile Logout Button */}
                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setIsMenuOpen(false);
                  }}
                  className={`${styles['nav-mobile-link']} ${styles['nav-logout-button']}`}
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              color: 'var(--error-color)',
              marginBottom: '1rem'
            }}>
              <LogOut size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                Remove Wallet
              </h3>
            </div>
            
            <p style={{ 
              marginBottom: '1.5rem', 
              color: 'var(--text-primary)',
              lineHeight: '1.5'
            }}>
              This will remove your wallet from this device and log you out. 
              Make sure you have backed up your seed phrase and private key before proceeding.
            </p>
            
            <div style={{ 
              background: 'var(--error-light)',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--error-color)',
              marginBottom: '1.5rem'
            }}>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--error-color)', 
                fontWeight: '600',
                margin: 0
              }}>
                ⚠️ This action cannot be undone
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  background: 'var(--text-secondary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  background: 'var(--error-color)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Remove Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}