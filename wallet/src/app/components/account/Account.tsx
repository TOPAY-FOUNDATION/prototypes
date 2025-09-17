'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, Copy, Trash2, Plus, Users, X } from 'lucide-react';
import styles from './Account.module.css';

interface ProfileData {
  name?: string;
  avatar: string;
  joinDate: string;
  walletAddress: string;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  biometricAuth: boolean;
  autoLock: boolean;
  autoLockTime: number;
  showBalances: boolean;
  transactionConfirmation: boolean;
  securityNotifications: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'transaction' | 'settings_change' | 'failed_attempt';
  description: string;
  timestamp: Date;
  location: string;
  status: 'success' | 'warning' | 'error';
}

interface WalletData {
  address: string;
  privateKey: string;
  name: string;
  balance: number;
  createdAt: string;
  isCurrent?: boolean;
}

interface AccountProps {
  walletAddress: string;
}

export default function Account({ walletAddress }: AccountProps) {
  const [profile, setProfile] = useState<ProfileData>({
    avatar: '',
    joinDate: new Date().toISOString().split('T')[0],
    walletAddress: walletAddress || ''
  });

  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    biometricAuth: false,
    autoLock: true,
    autoLockTime: 5,
    showBalances: true,
    transactionConfirmation: true,
    securityNotifications: true,
  });

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [message, setMessage] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  
  // Account management state
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showImportWallet, setShowImportWallet] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletData[]>([]);
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [isLoadingSeedPhrase, setIsLoadingSeedPhrase] = useState(false);
  
  // Import wallet state
  const [importSeedPhrase, setImportSeedPhrase] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Generate avatar URL based on wallet address
  const getAvatarUrl = (address: string) => {
    if (!address) return '';
    return `${process.env.NEXT_PUBLIC_DICEBEAR_API_URL || 'https://api.dicebear.com/9.x/identicon/svg'}?seed=${address}`;
  };

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showMessage(`${label} copied to clipboard!`);
    }).catch(() => {
      showMessage(`Failed to copy ${label}`);
    });
  };

  // Fetch seed phrase from API
  const fetchSeedPhrase = async () => {
    if (seedPhrase || isLoadingSeedPhrase) return; // Already loaded or loading
    
    setIsLoadingSeedPhrase(true);
    try {
      // Convert privateKey string to array if needed
      let privateKeyArray;
      if (typeof privateKey === 'string') {
        // If it's a comma-separated string, convert to array
        privateKeyArray = privateKey.split(',').map(num => parseInt(num.trim()));
      } else {
        privateKeyArray = privateKey;
      }

      const response = await fetch(`/api/wallet/${walletAddress}/seed-phrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privateKey: privateKeyArray
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch seed phrase');
      }

      const data = await response.json();
      // The API returns seedPhrase as an array, so join it to create a string
      setSeedPhrase(Array.isArray(data.seedPhrase) ? data.seedPhrase.join(' ') : data.seedPhrase);
    } catch (error) {
      console.error('Error fetching seed phrase:', error);
      showMessage('Failed to load seed phrase');
    } finally {
      setIsLoadingSeedPhrase(false);
    }
  };

  // Handle seed phrase reveal
  const handleSeedPhraseReveal = async () => {
    if (!showSeedPhrase) {
      await fetchSeedPhrase();
    }
    setShowSeedPhrase(!showSeedPhrase);
  };

  // Account management functions
  const loadAvailableWallets = () => {
    const wallets: WalletData[] = [];
    const currentAddress = localStorage.getItem('walletAddress');
    const currentPrivateKey = localStorage.getItem('walletPrivateKey');
    
    // Add current wallet to the list first
    if (currentAddress && currentPrivateKey) {
      const currentProfile = localStorage.getItem('topayProfile');
      const parsedProfile = currentProfile ? JSON.parse(currentProfile) : null;
      
      wallets.push({
        address: currentAddress,
        privateKey: currentPrivateKey,
        name: parsedProfile?.name || 'Current Wallet',
        balance: 0,
        createdAt: new Date().toISOString(),
        isCurrent: true
      });
    }
    
    // Load all other stored wallets
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('topayWallet_')) {
        try {
          const walletData = JSON.parse(localStorage.getItem(key) || '{}');
          // Only include wallets that are different from current wallet
          if (walletData.address && walletData.address !== currentAddress) {
            wallets.push({
              address: walletData.address || '',
              privateKey: walletData.privateKey || '',
              name: walletData.name || `Wallet ${wallets.length + 1}`,
              balance: walletData.balance || 0,
              createdAt: walletData.createdAt || new Date().toISOString(),
              isCurrent: false
            });
          }
        } catch (error) {
          console.error('Error loading wallet:', error);
        }
      }
    }
    
    setAvailableWallets(wallets);
  };

  const switchToWallet = (wallet: WalletData) => {
    // Save current wallet data before switching (preserve ALL data)
    const currentAddress = localStorage.getItem('walletAddress');
    if (currentAddress && currentAddress !== wallet.address) {
      const currentPrivateKey = localStorage.getItem('walletPrivateKey');
      const currentProfile = localStorage.getItem('topayProfile');
      const currentSecuritySettings = localStorage.getItem('topaySecuritySettings');
      
      // Create comprehensive wallet backup
      const currentWalletData = {
        address: currentAddress,
        privateKey: currentPrivateKey || '',
        name: 'Previous Wallet',
        balance: 0,
        createdAt: new Date().toISOString(),
        profile: currentProfile ? JSON.parse(currentProfile) : null,
        securitySettings: currentSecuritySettings ? JSON.parse(currentSecuritySettings) : null
      };
      localStorage.setItem(`topayWallet_${currentAddress}`, JSON.stringify(currentWalletData));
    }
    
    // Switch to new wallet
    localStorage.setItem('walletAddress', wallet.address);
    localStorage.setItem('walletPrivateKey', wallet.privateKey);
    
    // Restore wallet-specific profile and security settings if they exist
    const walletBackup = localStorage.getItem(`topayWallet_${wallet.address}`);
    if (walletBackup) {
      try {
        const backupData = JSON.parse(walletBackup);
        if (backupData.profile) {
          localStorage.setItem('topayProfile', JSON.stringify(backupData.profile));
        }
        if (backupData.securitySettings) {
          localStorage.setItem('topaySecuritySettings', JSON.stringify(backupData.securitySettings));
        }
      } catch (error) {
        console.error('Error restoring wallet backup:', error);
      }
    }
    
    // Update component state
    setProfile(prev => ({
      ...prev,
      walletAddress: wallet.address,
      avatar: getAvatarUrl(wallet.address)
    }));
    setPrivateKey(wallet.privateKey);
    
    setShowAccountSwitcher(false);
    showMessage(`Switched to ${wallet.name}`);
    
    // Reload the page to update all components
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const removeCurrentAccount = () => {
    const currentAddress = localStorage.getItem('walletAddress');
    if (!currentAddress) return;
    
    // Remove wallet data
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletPrivateKey');
    localStorage.removeItem(`topayWallet_${currentAddress}`);
    localStorage.removeItem('hasCompletedWelcome');
    localStorage.removeItem('topayProfile');
    localStorage.removeItem('topaySecuritySettings');
    
    setShowRemoveConfirm(false);
    showMessage('Account removed successfully');
    
    // Redirect to welcome page
    setTimeout(() => {
      window.location.href = '/welcome';
    }, 1500);
  };

  const importWallet = async () => {
    if (!importSeedPhrase.trim()) {
      setImportError('Please enter a seed phrase');
      return;
    }

    setIsImporting(true);
    setImportError('');

    try {
      // Save current wallet data before importing new one
      const currentAddress = localStorage.getItem('walletAddress');
      if (currentAddress) {
        const currentPrivateKey = localStorage.getItem('walletPrivateKey');
        const currentProfile = localStorage.getItem('topayProfile');
        const currentSecuritySettings = localStorage.getItem('topaySecuritySettings');
        
        const currentWalletData = {
          address: currentAddress,
          privateKey: currentPrivateKey || '',
          name: profile.name || 'Previous Wallet',
          balance: 0,
          createdAt: new Date().toISOString(),
          profile: currentProfile ? JSON.parse(currentProfile) : null,
          securitySettings: currentSecuritySettings ? JSON.parse(currentSecuritySettings) : null
        };
        localStorage.setItem(`topayWallet_${currentAddress}`, JSON.stringify(currentWalletData));
      }

      // Import wallet from seed phrase
      const response = await fetch('/api/wallet/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seedPhrase: importSeedPhrase.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import wallet');
      }

      const walletData = await response.json();
      
      // Set imported wallet as active
      localStorage.setItem('walletAddress', walletData.address);
      localStorage.setItem('walletPrivateKey', walletData.privateKey);
      localStorage.setItem('hasCompletedWelcome', 'true');
      
      // Create default profile for imported wallet
      const newProfile = {
        name: `Imported Wallet ${Date.now().toString().slice(-4)}`,
        email: '',
        phone: '',
        walletAddress: walletData.address,
        avatar: getAvatarUrl(walletData.address)
      };
      localStorage.setItem('topayProfile', JSON.stringify(newProfile));
      
      // Create default security settings
      const defaultSecuritySettings = {
        twoFactorAuth: false,
        biometricAuth: false,
        transactionNotifications: true,
        loginNotifications: true,
        autoLock: true,
        autoLockTime: 5
      };
      localStorage.setItem('topaySecuritySettings', JSON.stringify(defaultSecuritySettings));
      
      setShowImportWallet(false);
      setShowAccountSwitcher(false);
      setImportSeedPhrase('');
      showMessage('Wallet imported successfully!');
      
      // Refresh the page to load new wallet data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error importing wallet:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import wallet. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const createNewWallet = async () => {
    try {
      // Save current wallet data before creating new one
      const currentAddress = localStorage.getItem('walletAddress');
      if (currentAddress) {
        const currentPrivateKey = localStorage.getItem('walletPrivateKey');
        const currentProfile = localStorage.getItem('topayProfile');
        const currentSecuritySettings = localStorage.getItem('topaySecuritySettings');
        
        const currentWalletData = {
          address: currentAddress,
          privateKey: currentPrivateKey || '',
          name: profile.name || 'Previous Wallet',
          balance: 0,
          createdAt: new Date().toISOString(),
          profile: currentProfile ? JSON.parse(currentProfile) : null,
          securitySettings: currentSecuritySettings ? JSON.parse(currentSecuritySettings) : null
        };
        localStorage.setItem(`topayWallet_${currentAddress}`, JSON.stringify(currentWalletData));
      }

      // Generate new wallet directly
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
      
      // Log blockchain registration status
      if (walletData.blockchainRegistration?.registered) {
        console.log(`✅ New wallet registered on blockchain with transaction hash: ${walletData.blockchainRegistration.transactionHash}`);
      } else {
        console.log('⚠️ New wallet created but not registered on blockchain');
      }
      
      // Set new wallet as active
      localStorage.setItem('walletAddress', walletData.address);
      localStorage.setItem('walletPrivateKey', walletData.privateKey);
      localStorage.setItem('hasCompletedWelcome', 'true');
      
      // Create default profile for new wallet
      const newProfile = {
        name: `Wallet ${Date.now().toString().slice(-4)}`,
        email: '',
        phone: '',
        walletAddress: walletData.address,
        avatar: getAvatarUrl(walletData.address)
      };
      localStorage.setItem('topayProfile', JSON.stringify(newProfile));
      
      // Create default security settings
      const defaultSecuritySettings = {
        twoFactorAuth: false,
        biometricAuth: false,
        transactionNotifications: true,
        loginNotifications: true,
        autoLock: true,
        autoLockTime: 5
      };
      localStorage.setItem('topaySecuritySettings', JSON.stringify(defaultSecuritySettings));
      
      setShowAccountSwitcher(false);
      showMessage('New wallet created successfully!');
      
      // Refresh the page to load new wallet data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating wallet:', error);
      showMessage('Failed to create new wallet. Please try again.');
    }
  };

  useEffect(() => {
    // Load profile from localStorage
    const savedProfile = localStorage.getItem('topayProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile({ 
        ...parsedProfile, 
        walletAddress: walletAddress || parsedProfile.walletAddress,
        avatar: getAvatarUrl(walletAddress || parsedProfile.walletAddress)
      });
    } else {
      setProfile(prev => ({ 
        ...prev, 
        walletAddress: walletAddress || '',
        avatar: getAvatarUrl(walletAddress || '')
      }));
    }

    // Load private key from localStorage
    const savedPrivateKey = localStorage.getItem('walletPrivateKey');
    if (savedPrivateKey) {
      setPrivateKey(savedPrivateKey);
    } else {
      // Load private key from secure storage if available
      const savedPrivateKey = localStorage.getItem('walletPrivateKey');
      if (savedPrivateKey) {
        setPrivateKey(savedPrivateKey);
      }
    }

    // Load security settings
    const savedSettings = localStorage.getItem('topaySecuritySettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Merge with default settings to ensure all properties are defined
      setSettings({
        twoFactorAuth: parsedSettings.twoFactorAuth ?? false,
        biometricAuth: parsedSettings.biometricAuth ?? false,
        autoLock: parsedSettings.autoLock ?? true,
        autoLockTime: parsedSettings.autoLockTime ?? 5,
        showBalances: parsedSettings.showBalances ?? true,
        transactionConfirmation: parsedSettings.transactionConfirmation ?? true,
        securityNotifications: parsedSettings.securityNotifications ?? true,
      });
    }

    // Load available wallets
    loadAvailableWallets();

    // Load security events from API or storage
    const fetchSecurityEvents = async () => {
      try {
        const response = await fetch(`/api/wallet/${walletAddress}/security-events`);
        if (response.ok) {
          const data = await response.json();
          setSecurityEvents(data.events || []);
        } else {
          // If no events found, set empty array
          setSecurityEvents([]);
        }
      } catch (error) {
        console.error('Error fetching security events:', error);
        setSecurityEvents([]);
      }
    };

    if (walletAddress) {
      fetchSecurityEvents();
    }
  }, [walletAddress]);

  const updateSetting = (key: keyof SecuritySettings, value: unknown) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('topaySecuritySettings', JSON.stringify(newSettings));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: 'var(--warning-color)' }} />;
      case 'error':
        return <AlertTriangle size={16} style={{ color: 'var(--error-color)' }} />;
      default:
        return <Clock size={16} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <div className={styles.container}>
      {message && (
        <div className={styles.message}>
          {message}
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>
          <User size={32} />
          Account Details
        </h1>
        <p className={styles.subtitle}>
          Manage your profile information and security settings
        </p>
      </div>

      <div className={styles.grid}>
        
        {/* Profile Section */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <User size={24} />
            Profile Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div className={styles.avatar}>
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={profile.avatar} 
                  alt="Profile Avatar" 
                  width={96}
                  height={96}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <User size={48} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Wallet Address
            </label>
            <div className={styles.fieldValue}>
              <span className={styles.monospace}>
                {profile.walletAddress || 'No wallet connected'}
              </span>
              {profile.walletAddress && (
                <button
                  onClick={() => copyToClipboard(profile.walletAddress, 'Wallet address')}
                  className={styles.copyButton}
                >
                  <Copy size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              )}
            </div>
          </div>

          <div className={styles.stats}>
            <div className={`${styles.stat} ${styles.statBlue}`}>
              <h3 className={styles.statTitle}>
                Wallet Status
              </h3>
              <p className={styles.statValue} style={{ 
                color: profile.walletAddress ? 'var(--success-color)' : 'var(--error-color)'
              }}>
                {profile.walletAddress ? 'Connected' : 'Not Connected'}
              </p>
            </div>
            
            <div className={`${styles.stat} ${styles.statGreen}`}>
              <h3 className={styles.statTitle}>
                Security Level
              </h3>
              <p className={styles.statValue} style={{ color: 'var(--success-color)' }}>
                Quantum-Safe
              </p>
            </div>
            
            <div className={`${styles.stat} ${styles.statRed}`}>
              <h3 className={styles.statTitle}>
                Member Since
              </h3>
              <p className={styles.statValue} style={{ color: 'var(--text-primary)' }}>
                {new Date(profile.joinDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings Section */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 className={styles.sectionTitle}>
              <Shield size={24} />
              Security Settings
            </h2>
            <div className={styles.securityScore}>
              Score: 85/100
            </div>
          </div>

          <div className={styles.settingsList}>
            {[
              { key: 'twoFactorAuth', label: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
              { key: 'biometricAuth', label: 'Biometric Authentication', desc: 'Use fingerprint or face recognition' },
              { key: 'autoLock', label: 'Auto-Lock Wallet', desc: 'Lock wallet after inactivity' },
              { key: 'transactionConfirmation', label: 'Transaction Confirmation', desc: 'Require confirmation for transactions' },
              { key: 'securityNotifications', label: 'Security Notifications', desc: 'Get alerts for security events' }
            ].map(({ key, label, desc }) => (
              <div key={key} className={styles.settingItem}>
                <div>
                  <div className={styles.settingLabel}>{label}</div>
                  <div className={styles.settingDesc}>{desc}</div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={settings[key as keyof SecuritySettings] as boolean}
                    onChange={(e) => updateSetting(key as keyof SecuritySettings, e.target.checked)}
                    className={styles.switchInput}
                  />
                  <span className={`${styles.switchSlider} ${settings[key as keyof SecuritySettings] ? styles.switchSliderChecked : ''}`}>
                    <span className={`${styles.switchHandle} ${settings[key as keyof SecuritySettings] ? styles.switchHandleChecked : ''}`}></span>
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Backup & Recovery Section */}
      <div className={styles.card} style={{ marginTop: '2rem' }}>
        <h2 className={styles.sectionTitle}>
          <Key size={24} />
          Backup & Recovery
        </h2>

        <div className={styles.backupCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 className={styles.backupTitle}>Recovery Seed Phrase</h3>
            <button
              onClick={handleSeedPhraseReveal}
              className={styles.revealButton}
            >
              {isLoadingSeedPhrase ? (
                <>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid var(--border-color)', 
                    borderTop: '2px solid var(--primary-color)', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }} />
                  Loading...
                </>
              ) : (
                <>
                  {showSeedPhrase ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showSeedPhrase ? 'Hide' : 'Reveal'}
                </>
              )}
            </button>
          </div>
          
          {showSeedPhrase ? (
            <div>
              {seedPhrase ? (
                <>
                  <div className={styles.seedPhraseGrid}>
                    {seedPhrase.split(' ').map((word, index) => (
                      <span key={index} className={styles.seedWord}>
                        {index + 1}. {word}
                      </span>
                    ))}
                  </div>
                  <div className={styles.warningMessage}>
                    <AlertTriangle size={16} />
                    Never share your seed phrase with anyone. Store it securely offline.
                  </div>
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: 'var(--text-secondary)'
                }}>
                  <p>Unable to load seed phrase. Please try again.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.hiddenContent}>
              <p style={{ marginBottom: '0.5rem' }}>Click &quot;Reveal&quot; to show your recovery seed phrase</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Make sure you&apos;re in a private location</p>
            </div>
          )}
        </div>

        {/* Wallet Address Section */}
        <div className={styles.backupCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 className={styles.backupTitle}>Receive Address</h3>
            <button
              onClick={() => {
                copyToClipboard(walletAddress, 'Wallet address');
              }}
              className={styles.copyButton}
            >
              <Copy size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
          
          <div className={styles.publicKeyDisplay}>
            {walletAddress}
          </div>
          <div className={styles.infoMessage}>
            <AlertTriangle size={16} />
            This is your receive address. Share this to receive TOPAY tokens.
          </div>
        </div>

        {/* Private Key Section */}
        <div className={styles.backupCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 className={styles.backupTitle}>Private Key</h3>
            <button
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className={styles.revealButton}
            >
              {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPrivateKey ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showPrivateKey ? (
            <div>
              <div className={styles.privateKeyDisplay}>
                {privateKey}
              </div>
              <div className={styles.warningMessage}>
                <AlertTriangle size={16} />
                Never share your private key. Anyone with access can control your wallet.
              </div>
            </div>
          ) : (
            <div className={styles.hiddenContent}>
              <p style={{ marginBottom: '0.5rem' }}>Click &quot;Show&quot; to reveal your private key</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Make sure you&apos;re in a secure environment</p>
            </div>
          )}
        </div>

        <div className={styles.buttonGroup}>
          <button 
            onClick={() => {
              if (showPrivateKey) {
                copyToClipboard(privateKey, 'Private key');
              } else {
                showMessage('Please reveal private key first');
              }
            }}
            className={styles.primaryButton}
          >
            <Copy size={16} />
            Copy Private Key
          </button>
          <button className={styles.secondaryButton}>
            Backup Wallet
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className={styles.card} style={{ marginTop: '2rem' }}>
        <h2 className={styles.sectionTitle}>
          <Clock size={24} />
          Recent Security Activity
        </h2>

        <div className={styles.activityList}>
          {securityEvents.map((event) => (
            <div key={event.id} className={styles.activityItem}>
              <div>{getStatusIcon(event.status)}</div>
              <div style={{ flex: 1 }}>
                <div className={styles.activityTitle}>
                  {event.description}
                </div>
                <div className={styles.activityMeta}>
                  {formatTimestamp(event.timestamp)} • {event.location}
                </div>
              </div>
              <div className={styles.activityType}>
                {event.type.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Management Section */}
      <div className={styles.card} style={{ marginTop: '2rem' }}>
        <h2 className={styles.sectionTitle}>
          <Users size={24} />
          Account Management
        </h2>

        <div className={styles.buttonGroup}>
          <button 
            onClick={() => setShowAccountSwitcher(true)}
            className={styles.primaryButton}
          >
            <Users size={16} />
            Switch Account
          </button>
          
          <button 
            onClick={() => setShowRemoveConfirm(true)}
            className={styles.dangerButton}
          >
            <Trash2 size={16} />
            Remove Account
          </button>
        </div>
      </div>

      {/* Account Switcher Popup */}
      {showAccountSwitcher && (
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
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '1.5rem' 
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Switch Account</h3>
              <button
                onClick={() => setShowAccountSwitcher(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Available Wallets ({availableWallets.length})
              </h4>
              
              {availableWallets.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem',
                  color: 'var(--text-secondary)'
                }}>
                  <p>No wallets found on this device</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {availableWallets.map((wallet) => (
                    <div 
                      key={wallet.address}
                      onClick={() => !wallet.isCurrent && switchToWallet(wallet)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        background: wallet.isCurrent ? 'var(--success-light)' : 'var(--background-secondary)',
                        borderRadius: '0.5rem',
                        border: wallet.isCurrent ? '2px solid var(--success-color)' : '1px solid var(--border-color)',
                        cursor: wallet.isCurrent ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!wallet.isCurrent) {
                          e.currentTarget.style.background = 'var(--background-hover)';
                          e.currentTarget.style.borderColor = 'var(--border-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!wallet.isCurrent) {
                          e.currentTarget.style.background = 'var(--background-secondary)';
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                        }
                      }}
                    >
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {wallet.name}
                          {wallet.isCurrent && (
                            <span style={{
                              background: 'var(--success-color)',
                              color: 'white',
                              fontSize: '0.75rem',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontWeight: '500'
                            }}>
                              Current
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace'
                        }}>
                          {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Balance: {wallet.balance} TOPAY
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Created: {new Date(wallet.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ 
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <button
                onClick={createNewWallet}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  background: 'var(--success-color)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                <Plus size={16} />
                Create New Wallet
              </button>
              
              <button
                onClick={() => setShowImportWallet(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                <Key size={16} />
                Import Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Account Confirmation Popup */}
      {showRemoveConfirm && (
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
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '1.5rem' 
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--error-color)' }}>
                Remove Account
              </h3>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: 'var(--error-color)',
                marginBottom: '1rem'
              }}>
                <AlertTriangle size={20} />
                <span style={{ fontWeight: '600' }}>Warning: This action cannot be undone</span>
              </div>
              
              <p style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                This will permanently remove the current wallet from this device. 
                Make sure you have backed up your seed phrase and private key.
              </p>
              
              <div style={{ 
                background: 'var(--error-light)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--error-color)'
              }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--error-color)', fontWeight: '600' }}>
                  Wallet to be removed:
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  fontFamily: 'monospace',
                  color: 'var(--text-primary)',
                  marginTop: '0.25rem'
                }}>
                  {profile.walletAddress?.slice(0, 20)}...{profile.walletAddress?.slice(-10)}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowRemoveConfirm(false)}
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
                onClick={removeCurrentAccount}
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
                Remove Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Wallet Modal */}
      {showImportWallet && (
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
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '1.5rem' 
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Import Wallet</h3>
              <button
                onClick={() => {
                  setShowImportWallet(false);
                  setImportSeedPhrase('');
                  setImportError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                marginBottom: '0.5rem',
                color: 'var(--text-primary)'
              }}>
                Seed Phrase (12 words)
              </label>
              <textarea
                value={importSeedPhrase}
                onChange={(e) => setImportSeedPhrase(e.target.value)}
                placeholder="Enter your 12-word seed phrase separated by spaces"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  WebkitTextSecurity: 'disc'
                } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
              {importError && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: 'var(--error-light)',
                  border: '1px solid var(--error-color)',
                  borderRadius: '0.5rem',
                  color: 'var(--error-color)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={16} />
                  {importError}
                </div>
              )}
            </div>

            <div style={{
              background: 'var(--warning-light)',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--warning-color)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: 'var(--warning-color)'
              }}>
                <AlertTriangle size={16} />
                <span style={{ fontWeight: '600' }}>Security Notice</span>
              </div>
              <ul style={{ 
                fontSize: '0.875rem', 
                color: 'var(--warning-color)',
                margin: 0,
                paddingLeft: '1.25rem'
              }}>
                <li>Never share your seed phrase with anyone</li>
                <li>Make sure you&apos;re in a secure environment</li>
                <li>This will replace your current active wallet</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowImportWallet(false);
                  setImportSeedPhrase('');
                  setImportError('');
                }}
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
                onClick={importWallet}
                disabled={isImporting || !importSeedPhrase.trim()}
                style={{
                  flex: 1,
                  background: isImporting || !importSeedPhrase.trim() ? 'var(--text-muted)' : 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: isImporting || !importSeedPhrase.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isImporting ? (
                  <>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid var(--text-muted)',
                  borderTop: '2px solid var(--text-white)', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    Import Wallet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}