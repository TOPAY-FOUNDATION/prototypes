'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Key, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, Smartphone } from 'lucide-react';
import styles from './Security.module.css';

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

export default function Security() {
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
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [passwordStrength] = useState('strong'); // Default to strong for demo
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [isLoadingSeedPhrase, setIsLoadingSeedPhrase] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');

  useEffect(() => {
    // Load wallet data from localStorage
    const address = localStorage.getItem('walletAddress');
    const key = localStorage.getItem('walletPrivateKey');
    
    if (address) setWalletAddress(address);
    if (key) setPrivateKey(key);

    const savedSettings = localStorage.getItem('topaySecuritySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Mock security events
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'login',
        description: 'Successful login from Windows device',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        location: 'New York, US',
        status: 'success'
      },
      {
        id: '2',
        type: 'transaction',
        description: 'Transaction sent: 50 TOPAY',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        location: 'New York, US',
        status: 'success'
      },
      {
        id: '3',
        type: 'settings_change',
        description: 'Security settings updated',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        location: 'New York, US',
        status: 'success'
      },
      {
        id: '4',
        type: 'failed_attempt',
        description: 'Failed login attempt detected',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        location: 'Unknown',
        status: 'warning'
      }
    ];
    setSecurityEvents(mockEvents);
  }, []);

  const updateSetting = (key: keyof SecuritySettings, value: unknown) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('topaySecuritySettings', JSON.stringify(newSettings));
  };

  const fetchSeedPhrase = async () => {
    if (!walletAddress || !privateKey) return;
    
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

      if (response.ok) {
        const data = await response.json();
        // The API returns seedPhrase as an array, so join it to create a string
        setSeedPhrase(Array.isArray(data.seedPhrase) ? data.seedPhrase.join(' ') : data.seedPhrase);
      } else {
        console.error('Failed to fetch seed phrase');
      }
    } catch (error) {
      console.error('Error fetching seed phrase:', error);
    } finally {
      setIsLoadingSeedPhrase(false);
    }
  };

  const handleSeedPhraseReveal = () => {
    if (!showSeedPhrase && !seedPhrase) {
      fetchSeedPhrase();
    }
    setShowSeedPhrase(!showSeedPhrase);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className={styles.successIcon} />;
      case 'warning':
        return <AlertTriangle size={16} className={styles.warningIcon} />;
      case 'error':
        return <AlertTriangle size={16} className={styles.errorIcon} />;
      default:
        return <Clock size={16} className={styles.defaultIcon} />;
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
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Shield size={24} />
          Security Center
        </h2>
        <div className={styles.securityScore}>
          <span className={styles.scoreLabel}>Security Score</span>
          <span className={styles.scoreValue}>85/100</span>
        </div>
      </div>

      <div className={styles.content}>
        {/* Security Settings */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Lock size={20} />
            Security Settings
          </h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Two-Factor Authentication</label>
              <span>Add an extra layer of security to your account</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => updateSetting('twoFactorAuth', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Biometric Authentication</label>
              <span>Use fingerprint or face recognition</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.biometricAuth}
                onChange={(e) => updateSetting('biometricAuth', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Auto-Lock Wallet</label>
              <span>Automatically lock wallet after inactivity</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.autoLock}
                onChange={(e) => updateSetting('autoLock', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {settings.autoLock && (
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label>Auto-Lock Time</label>
                <span>Minutes of inactivity before locking</span>
              </div>
              <select
                value={settings.autoLockTime}
                onChange={(e) => updateSetting('autoLockTime', parseInt(e.target.value))}
                className={styles.select}
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>
          )}

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Show Balances</label>
              <span>Display wallet balances on main screen</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.showBalances}
                onChange={(e) => updateSetting('showBalances', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Transaction Confirmation</label>
              <span>Require confirmation for all transactions</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.transactionConfirmation}
                onChange={(e) => updateSetting('transactionConfirmation', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>

        {/* Backup & Recovery */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Key size={20} />
            Backup & Recovery
          </h3>
          
          <div className={styles.backupCard}>
            <div className={styles.backupHeader}>
              <h4>Recovery Seed Phrase</h4>
              <button
              className={styles.revealButton}
              onClick={handleSeedPhraseReveal}
              disabled={isLoadingSeedPhrase}
            >
              {isLoadingSeedPhrase ? (
                <>
                  <div className={styles.spinner}></div>
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
              seedPhrase ? (
                <div className={styles.seedPhrase}>
                  <div className={styles.seedWords}>
                    {seedPhrase.split(' ').map((word, index) => (
                      <span key={index} className={styles.seedWord}>
                        {index + 1}. {word}
                      </span>
                    ))}
                  </div>
                  <div className={styles.seedWarning}>
                    <AlertTriangle size={16} />
                    Never share your seed phrase with anyone. Store it securely offline.
                  </div>
                </div>
              ) : (
                <div className={styles.seedHidden}>
                  <p>Unable to load seed phrase</p>
                </div>
              )
            ) : (
              <div className={styles.seedHidden}>
                <p>Click &quot;Reveal&quot; to show your recovery seed phrase</p>
                <p className={styles.warning}>Make sure you&#39;re in a private location</p>
              </div>
            )}
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.primaryButton}>
              Export Private Key
            </button>
            <button className={styles.secondaryButton}>
              Backup Wallet
            </button>
          </div>
        </div>

        {/* Security Activity */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Clock size={20} />
            Recent Security Activity
          </h3>
          
          <div className={styles.activityList}>
            {securityEvents.map((event) => (
              <div key={event.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {getStatusIcon(event.status)}
                </div>
                <div className={styles.activityDetails}>
                  <div className={styles.activityDescription}>
                    {event.description}
                  </div>
                  <div className={styles.activityMeta}>
                    {formatTimestamp(event.timestamp)} • {event.location}
                  </div>
                </div>
                <div className={styles.activityType}>
                  {event.type.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Password Strength */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Smartphone size={20} />
            Password Security
          </h3>
          
          <div className={styles.passwordCard}>
            <div className={styles.passwordStrength}>
              <label>Current Password Strength</label>
              <div className={styles.strengthMeter}>
                <div className={`${styles.strengthBar} ${styles[passwordStrength]}`}></div>
              </div>
              <span className={styles.strengthLabel}>
                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
              </span>
            </div>
            
            <button className={styles.primaryButton}>
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}