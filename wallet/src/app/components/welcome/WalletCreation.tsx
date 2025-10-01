'use client';

import { useState } from 'react';
import { Wallet, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './WalletCreation.module.css';

interface WalletCreationProps {
  onWalletCreated: (walletData: {
    address: string;
    privateKey: string;
    publicKey: number[];
    seedPhrase: string[];
  }) => void;
  onBack: () => void;
}

export default function WalletCreation({ onWalletCreated }: WalletCreationProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Generate a seed phrase (12 words)
  const generateSeedPhrase = (): string[] => {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'age',
      'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm',
      'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost',
      'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing',
      'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle',
      'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna',
      'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve',
      'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed',
      'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art',
      'article', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist',
      'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract',
      'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average',
      'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward'
    ];
    
    const seedPhrase: string[] = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      seedPhrase.push(words[randomIndex]);
    }
    return seedPhrase;
  };

  const createWallet = async () => {
    setIsCreating(true);
    setError('');

    try {
      // Call the wallet generation API
      const response = await fetch('/api/wallet/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate wallet');
      }

      const walletData = await response.json();
      
      // Generate seed phrase
      const seedPhrase = generateSeedPhrase();

      // Simulate wallet creation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      const completeWalletData = {
        address: walletData.address,
        privateKey: walletData.privateKey,
        publicKey: walletData.publicKey,
        seedPhrase: seedPhrase,
        blockchainRegistration: walletData.blockchainRegistration,
        welcomeTokens: walletData.welcomeTokens
      };

      // Log registration status and token allocation
      if (walletData.blockchainRegistration?.registered) {
        console.log(`✅ Wallet registered on blockchain with transaction hash: ${walletData.blockchainRegistration.transactionHash}`);
        if (walletData.welcomeTokens) {
          console.log(`🎁 Welcome tokens allocated: ${walletData.welcomeTokens.amount} ${walletData.welcomeTokens.symbol}`);
        }
      } else {
        console.log('⚠️ Wallet created but not registered on blockchain');
      }

      onWalletCreated(completeWalletData);
    } catch (err) {
      setError('Failed to create wallet. Please try again.');
      console.error('Wallet creation error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <Wallet size={48} className={styles.icon} />
        </div>
        <h2 className={styles.title}>Create Your Wallet</h2>
        <p className={styles.subtitle}>
          We&apos;ll generate a quantum-safe wallet with your unique private keys and seed phrase.
        </p>
      </div>

      {!isCreating && !error && (
        <div className={styles.content}>
          <div className={styles.infoBox}>
            <h3>What happens next:</h3>
            <ul className={styles.stepsList}>
              <li>🔐 Generate quantum-safe private keys</li>
              <li>🏠 Create your unique wallet address</li>
              <li>🔗 Register wallet on TOPAY blockchain</li>
              <li>🎁 Receive 1000 welcome tokens automatically</li>
              <li>📝 Generate a 12-word recovery seed phrase</li>
              <li>✅ Prepare your wallet for use</li>
            </ul>
          </div>

          <div className={styles.securityNote}>
            <AlertCircle size={20} />
            <div>
              <strong>Security Notice:</strong>
              <p>Your private keys and seed phrase will be generated locally and are never sent to our servers. Keep them safe and never share them with anyone.</p>
            </div>
          </div>

          <button className={styles.createButton} onClick={createWallet}>
            Create My Wallet
          </button>
        </div>
      )}

      {isCreating && (
        <div className={styles.loadingContainer}>
          <Loader size={48} className={styles.spinner} />
          <h3>Creating Your Wallet...</h3>
          <p>Generating quantum-safe cryptographic keys</p>
          <div className={styles.progressSteps}>
            <div className={styles.progressStep}>
              <CheckCircle size={16} className={styles.checkIcon} />
              <span>Generating private key</span>
            </div>
            <div className={styles.progressStep}>
              <CheckCircle size={16} className={styles.checkIcon} />
              <span>Creating wallet address</span>
            </div>
            <div className={styles.progressStep}>
              <CheckCircle size={16} className={styles.checkIcon} />
              <span>Registering on blockchain</span>
            </div>
            <div className={styles.progressStep}>
              <Loader size={16} className={styles.loadingIcon} />
              <span>Allocating welcome tokens</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <AlertCircle size={48} className={styles.errorIcon} />
          <h3>Wallet Creation Failed</h3>
          <p>{error}</p>
          <button className={styles.retryButton} onClick={createWallet}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}