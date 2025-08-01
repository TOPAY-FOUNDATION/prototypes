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

      <div className={styles.features}>
        <h3>What you can do now:</h3>
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Wallet size={24} />
            </div>
            <div className={styles.featureContent}>
              <h4>Send & Receive</h4>
              <p>Transfer TOPAY tokens to anyone, anywhere in the world</p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Shield size={24} />
            </div>
            <div className={styles.featureContent}>
              <h4>Quantum-Safe Security</h4>
              <p>Your wallet is protected against future quantum computers</p>
            </div>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Zap size={24} />
            </div>
            <div className={styles.featureContent}>
              <h4>Fast Transactions</h4>
              <p>Lightning-fast transfers with minimal fees</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.securityReminder}>
        <h3>🔐 Security Reminders</h3>
        <ul className={styles.reminderList}>
          <li>✅ Your seed phrase and private key are safely backed up</li>
          <li>✅ Device password is set for additional protection</li>
          <li>🔒 Never share your seed phrase or private key with anyone</li>
          <li>💾 Keep multiple backups in secure locations</li>
          <li>🛡️ Always verify recipient addresses before sending</li>
        </ul>
      </div>

      <div className={styles.nextSteps}>
        <h3>Next Steps</h3>
        <div className={styles.stepsList}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <div className={styles.stepContent}>
              <h4>Explore Your Wallet</h4>
              <p>Familiarize yourself with the wallet interface and features</p>
            </div>
          </div>
          
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepContent}>
              <h4>Get Some TOPAY Tokens</h4>
              <p>Receive tokens from friends or purchase them to start using your wallet</p>
            </div>
          </div>
          
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <div className={styles.stepContent}>
              <h4>Make Your First Transaction</h4>
              <p>Send tokens to another wallet to experience the speed and security</p>
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