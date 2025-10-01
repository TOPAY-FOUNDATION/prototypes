'use client';

import { useState } from 'react';
import { Wallet, Shield, Download, Upload } from 'lucide-react';
import styles from './WalletCreation.module.css';

interface WalletData {
  address: string;
  privateKey: string;
  publicKey: string;
  createdAt: string;
}

interface WalletCreationProps {
  onWalletCreated: (walletData: WalletData) => void;
}

export default function WalletCreation({ onWalletCreated }: WalletCreationProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');
  const [error, setError] = useState('');

  const handleCreateWallet = async () => {
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/wallet/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }

      const walletData = await response.json();
      
      // Format wallet data for storage
      const formattedWalletData = {
        address: walletData.address,
        privateKey: Array.isArray(walletData.privateKey) 
          ? walletData.privateKey.map((b: number) => b.toString(16).padStart(2, '0')).join('')
          : walletData.privateKey,
        publicKey: Array.isArray(walletData.publicKey)
          ? walletData.publicKey.map((b: number) => b.toString(16).padStart(2, '0')).join('')
          : walletData.publicKey,
        createdAt: new Date().toISOString()
      };
      
      onWalletCreated(formattedWalletData);
    } catch (error) {
      console.error('Error creating wallet:', error);
      setError('Failed to create wallet. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleImportWallet = () => {
    setError('');
    
    try {
      const walletData = JSON.parse(importData);
      
      // Basic validation
      if (!walletData.address || !walletData.privateKey || !walletData.publicKey) {
        throw new Error('Invalid wallet format');
      }
      
      onWalletCreated(walletData);
    } catch {
      setError('Invalid wallet data. Please check the format and try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Wallet className={styles.icon} size={48} />
          <h1 className={styles.title}>Welcome to TOPAY Wallet</h1>
          <p className={styles.subtitle}>
            Create a new wallet or import an existing one to get started
          </p>
        </div>

        {!showImport ? (
          <div className={styles.actions}>
            <button
              onClick={handleCreateWallet}
              disabled={isCreating}
              className={`${styles.button} ${styles.primary}`}
            >
              <Shield size={20} />
              {isCreating ? 'Creating Wallet...' : 'Create New Wallet'}
            </button>

            <button
              onClick={() => setShowImport(true)}
              className={`${styles.button} ${styles.secondary}`}
            >
              <Upload size={20} />
              Import Existing Wallet
            </button>

            <div className={styles.security}>
              <Shield size={16} />
              <span>Your wallet is stored securely in your browser</span>
            </div>
          </div>
        ) : (
          <div className={styles.importSection}>
            <h3 className={styles.importTitle}>Import Wallet</h3>
            <p className={styles.importSubtitle}>
              Paste your wallet backup data below:
            </p>
            
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your wallet JSON data here..."
              className={styles.textarea}
              rows={6}
            />

            <div className={styles.importActions}>
              <button
                onClick={handleImportWallet}
                disabled={!importData.trim()}
                className={`${styles.button} ${styles.primary}`}
              >
                <Download size={20} />
                Import Wallet
              </button>

              <button
                onClick={() => {
                  setShowImport(false);
                  setImportData('');
                  setError('');
                }}
                className={`${styles.button} ${styles.secondary}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}