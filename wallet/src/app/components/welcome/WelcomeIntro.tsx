'use client';

import { Shield, Zap, Lock, Globe, Plus, Download } from 'lucide-react';
import styles from './WelcomeIntro.module.css';

interface WelcomeIntroProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export default function WelcomeIntro({ onCreateWallet, onImportWallet }: WelcomeIntroProps) {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.iconContainer}>
          <Shield size={64} className={styles.heroIcon} />
        </div>
        <h2 className={styles.title}>Welcome to TOPAY Wallet</h2>
        <p className={styles.subtitle}>
          Your gateway to quantum-safe digital currency. Let&apos;s set up your secure wallet in just a few steps.
        </p>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Shield size={24} />
          </div>
          <div className={styles.featureContent}>
            <h3>Quantum-Safe Security</h3>
            <p>Advanced cryptography that protects against future quantum computers</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Zap size={24} />
          </div>
          <div className={styles.featureContent}>
            <h3>Fast Transactions</h3>
            <p>Lightning-fast transfers with minimal fees</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Lock size={24} />
          </div>
          <div className={styles.featureContent}>
            <h3>Your Keys, Your Control</h3>
            <p>You own and control your private keys - no third parties</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Globe size={24} />
          </div>
          <div className={styles.featureContent}>
            <h3>Global Access</h3>
            <p>Send and receive payments anywhere in the world</p>
          </div>
        </div>
      </div>

      <div className={styles.setupInfo}>
        <h3>Choose how to get started:</h3>
        <div className={styles.walletOptions}>
          <div className={styles.walletOption}>
            <div className={styles.optionIcon}>
              <Plus size={32} />
            </div>
            <h4>Create New Wallet</h4>
            <p>Generate a brand new quantum-safe wallet with fresh keys</p>
            <ul className={styles.optionFeatures}>
              <li>✨ Generate new quantum-safe keys</li>
              <li>🔐 Create secure seed phrase</li>
              <li>🛡️ Set up device protection</li>
            </ul>
            <button className={styles.optionButton} onClick={onCreateWallet}>
              Create New Wallet
            </button>
          </div>

          <div className={styles.walletOption}>
            <div className={styles.optionIcon}>
              <Download size={32} />
            </div>
            <h4>Import Existing Wallet</h4>
            <p>Restore your wallet using your existing seed phrase</p>
            <ul className={styles.optionFeatures}>
              <li>🔄 Restore from seed phrase</li>
              <li>🔐 Import your existing keys</li>
              <li>🛡️ Set up device protection</li>
            </ul>
            <button className={styles.optionButton} onClick={onImportWallet}>
              Import Wallet
            </button>
          </div>
        </div>
      </div>

      <div className={styles.disclaimer}>
        <p>
          <strong>Important:</strong> Make sure you&apos;re in a private, secure location. 
          We&apos;ll be showing you sensitive information that should be kept confidential.
        </p>
      </div>
    </div>
  );
}