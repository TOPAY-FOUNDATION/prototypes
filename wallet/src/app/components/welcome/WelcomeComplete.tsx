'use client';

import { CheckCircle, Wallet, Shield, Zap } from 'lucide-react';
import styles from './WelcomeComplete.module.css';

interface WelcomeCompleteProps {
  walletData: {
    address: string;
    privateKey: string;
    publicKey: number[];
    seedPhrase: string[];
  };
  onComplete: () => void;
}

export default function WelcomeComplete({ walletData, onComplete }: WelcomeCompleteProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <CheckCircle size={64} className={styles.successIcon} />
        </div>
        <h2 className={styles.title}>Wallet Setup Complete!</h2>
        <p className={styles.subtitle}>
          Congratulations! Your quantum-safe wallet is ready to use. You can now send and receive TOPAY tokens securely.
        </p>
      </div>

      <div className={styles.walletInfo}>
        <h3>Your Wallet Details</h3>
        <div className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <Wallet size={24} />
            <span>TOPAY Quantum-Safe Wallet</span>
          </div>
          <div className={styles.walletAddress}>
            <label>Wallet Address:</label>
            <span className={styles.address}>{walletData.address}</span>
          </div>
          <div className={styles.walletStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Balance</span>
              <span className={styles.statValue}>0 TOPAY</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Status</span>
              <span className={styles.statValue}>Active</span>
            </div>
          </div>
        </div>
      </div>







      <button className={styles.completeButton} onClick={onComplete}>
        Enter My Wallet
      </button>

      <div className={styles.footer}>
        <p>Welcome to the future of digital currency! 🚀</p>
      </div>
    </div>
  );
}