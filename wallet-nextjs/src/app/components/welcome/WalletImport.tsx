'use client';

import { useState } from 'react';
import { Download, AlertCircle, Eye, EyeOff } from 'lucide-react';
import styles from './WalletImport.module.css';

interface WalletData {
  address: string;
  privateKey: string;
  publicKey: number[];
  seedPhrase: string[];
}

interface WalletImportProps {
  onWalletImported: (wallet: WalletData) => void;
  onBack: () => void;
}

export default function WalletImport({ onWalletImported, onBack }: WalletImportProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);

  const handleImport = async () => {
    if (!seedPhrase.trim()) {
      setError('Please enter your seed phrase');
      return;
    }

    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12) {
      setError('Seed phrase must contain exactly 12 words');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call the API to import wallet from seed phrase
      const response = await fetch('/api/wallet/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedPhrase: words,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import wallet');
      }

      const walletData = await response.json();
      
      // Create complete wallet data including the seed phrase
      const completeWalletData: WalletData = {
        address: walletData.address,
        publicKey: walletData.publicKey,
        privateKey: '', // Don't store private key for security
        seedPhrase: words
      };
      
      onWalletImported(completeWalletData);
    } catch (err) {
      setError('Failed to import wallet. Please check your seed phrase and try again.');
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedPhraseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSeedPhrase(e.target.value);
    if (error) setError('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <Download size={48} className={styles.icon} />
        </div>
        <h2 className={styles.title}>Import Your Wallet</h2>
        <p className={styles.subtitle}>
          Enter your 12-word seed phrase to restore your existing wallet
        </p>
      </div>

      <div className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Seed Phrase (12 words)
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowSeedPhrase(!showSeedPhrase)}
            >
              {showSeedPhrase ? <EyeOff size={16} /> : <Eye size={16} />}
              {showSeedPhrase ? 'Hide' : 'Show'}
            </button>
          </label>
          <textarea
            className={`${styles.textarea} ${error ? styles.error : ''}`}
            value={seedPhrase}
            onChange={handleSeedPhraseChange}
            placeholder="Enter your 12-word seed phrase separated by spaces..."
            rows={4}
            style={{
              WebkitTextSecurity: showSeedPhrase ? 'none' : 'disc',
            } as React.CSSProperties}
          />
          {error && (
            <div className={styles.errorMessage}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className={styles.warning}>
          <AlertCircle size={20} />
          <div>
            <h4>Important Security Notice</h4>
            <p>
              Make sure you&apos;re entering your seed phrase in a secure environment. 
              Never share your seed phrase with anyone or enter it on untrusted websites.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.backButton} onClick={onBack}>
            Back
          </button>
          <button
            className={styles.importButton}
            onClick={handleImport}
            disabled={isLoading || !seedPhrase.trim()}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                Importing...
              </>
            ) : (
              'Import Wallet'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}