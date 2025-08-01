'use client';

import { useState } from 'react';
import { Shield, Copy, Download, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import styles from './BackupPhrase.module.css';

interface BackupPhraseProps {
  walletData: {
    address: string;
    privateKey: string;
    publicKey: number[];
    seedPhrase: string[];
  };
  onBackupComplete: () => void;
  onBack: () => void;
}

export default function BackupPhrase({ walletData, onBackupComplete }: BackupPhraseProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
  const [downloadedBackup, setDownloadedBackup] = useState(false);
  const [confirmationChecks, setConfirmationChecks] = useState({
    savedSeedPhrase: false,
    savedPrivateKey: false,
    understoodWarning: false
  });

  const copyToClipboard = async (text: string, type: 'seed' | 'privateKey') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'seed') {
        setCopiedSeed(true);
        setTimeout(() => setCopiedSeed(false), 2000);
      } else {
        setCopiedPrivateKey(true);
        setTimeout(() => setCopiedPrivateKey(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadBackup = () => {
    const backupData = {
      walletAddress: walletData.address,
      seedPhrase: walletData.seedPhrase,
      privateKey: walletData.privateKey,
      publicKey: walletData.publicKey,
      createdAt: new Date().toISOString(),
      walletType: 'TOPAY Quantum-Safe Wallet'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `topay-wallet-backup-${walletData.address.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setDownloadedBackup(true);
  };

  const handleCheckboxChange = (check: keyof typeof confirmationChecks) => {
    setConfirmationChecks(prev => ({
      ...prev,
      [check]: !prev[check]
    }));
  };

  const canProceed = Object.values(confirmationChecks).every(Boolean);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <Shield size={48} className={styles.icon} />
        </div>
        <h2 className={styles.title}>Backup Your Wallet</h2>
        <p className={styles.subtitle}>
          Save your seed phrase and private key. This is the ONLY way to recover your wallet if you lose access.
        </p>
      </div>

      <div className={styles.warningBox}>
        <AlertTriangle size={24} />
        <div>
          <strong>Critical Security Warning</strong>
          <p>Never share your seed phrase or private key with anyone. Anyone with access to these can control your wallet and steal your funds.</p>
        </div>
      </div>

      {/* Seed Phrase Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span>1. Seed Phrase (Recovery Words)</span>
          <span className={styles.badge}>Most Important</span>
        </h3>
        <p className={styles.sectionDescription}>
          Write down these 12 words in order. You can use them to recover your wallet on any device.
        </p>
        
        <div className={styles.seedPhraseContainer}>
          <div className={styles.seedPhrase}>
            {walletData.seedPhrase.map((word, index) => (
              <div key={index} className={styles.seedWord}>
                <span className={styles.wordNumber}>{index + 1}</span>
                <span className={styles.word}>{word}</span>
              </div>
            ))}
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.copyButton}
              onClick={() => copyToClipboard(walletData.seedPhrase.join(' '), 'seed')}
            >
              {copiedSeed ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copiedSeed ? 'Copied!' : 'Copy Seed Phrase'}
            </button>
          </div>
        </div>
      </div>

      {/* Private Key Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span>2. Private Key</span>
          <span className={styles.badgeSecondary}>Advanced</span>
        </h3>
        <p className={styles.sectionDescription}>
          Your private key in hexadecimal format. This is an alternative way to import your wallet.
        </p>
        
        <div className={styles.privateKeyContainer}>
          <div className={styles.privateKeyField}>
            <input
              type={showPrivateKey ? 'text' : 'password'}
              value={walletData.privateKey}
              readOnly
              className={styles.privateKeyInput}
            />
            <button
              className={styles.toggleButton}
              onClick={() => setShowPrivateKey(!showPrivateKey)}
            >
              {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.copyButton}
              onClick={() => copyToClipboard(walletData.privateKey, 'privateKey')}
            >
              {copiedPrivateKey ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copiedPrivateKey ? 'Copied!' : 'Copy Private Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Download Backup */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>3. Download Backup File</h3>
        <p className={styles.sectionDescription}>
          Download a secure backup file containing all your wallet information.
        </p>
        
        <button 
          className={`${styles.downloadButton} ${downloadedBackup ? styles.downloaded : ''}`}
          onClick={downloadBackup}
        >
          {downloadedBackup ? <CheckCircle size={16} /> : <Download size={16} />}
          {downloadedBackup ? 'Backup Downloaded' : 'Download Backup File'}
        </button>
      </div>

      {/* Confirmation Checkboxes */}
      <div className={styles.confirmationSection}>
        <h3>Confirm you have secured your wallet:</h3>
        
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={confirmationChecks.savedSeedPhrase}
            onChange={() => handleCheckboxChange('savedSeedPhrase')}
          />
          <span className={styles.checkmark}></span>
          I have written down my 12-word seed phrase and stored it safely
        </label>
        
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={confirmationChecks.savedPrivateKey}
            onChange={() => handleCheckboxChange('savedPrivateKey')}
          />
          <span className={styles.checkmark}></span>
          I have saved my private key in a secure location
        </label>
        
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={confirmationChecks.understoodWarning}
            onChange={() => handleCheckboxChange('understoodWarning')}
          />
          <span className={styles.checkmark}></span>
          I understand that losing these will result in permanent loss of my wallet
        </label>
      </div>

      <button 
        className={`${styles.continueButton} ${!canProceed ? styles.disabled : ''}`}
        onClick={onBackupComplete}
        disabled={!canProceed}
      >
        I&apos;ve Secured My Wallet
      </button>
    </div>
  );
}