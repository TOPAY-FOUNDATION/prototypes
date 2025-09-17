'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Smartphone, Wifi, Shield } from 'lucide-react';
import styles from './Settings.module.css';

interface SettingsData {
  notifications: {
    transactions: boolean;
    security: boolean;
    updates: boolean;
    marketing: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
    timezone: string;
  };
  network: {
    autoConnect: boolean;
    nodeUrl: string;
    syncMode: 'full' | 'light' | 'archive';
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
    dataSharing: boolean;
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      transactions: true,
      security: true,
      updates: true,
      marketing: false,
    },
    display: {
      theme: 'light',
      language: 'en',
      currency: 'TOPAY',
      timezone: 'UTC',
    },
    network: {
      autoConnect: true,
      nodeUrl: process.env.NEXT_PUBLIC_TOPAY_MAINNET_URL || 'https://mainnet.topay.org',
      syncMode: 'light',
    },
    privacy: {
      analytics: false,
      crashReports: true,
      dataSharing: false,
    },
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('topaySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSettings = (category: keyof SettingsData, key: string, value: unknown) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    setSettings(newSettings);
    localStorage.setItem('topaySettings', JSON.stringify(newSettings));
  };

  const resetToDefaults = () => {
    const defaultSettings: SettingsData = {
      notifications: {
        transactions: true,
        security: true,
        updates: true,
        marketing: false,
      },
      display: {
        theme: 'light',
        language: 'en',
        currency: 'TOPAY',
        timezone: 'UTC',
      },
      network: {
        autoConnect: true,
        nodeUrl: process.env.NEXT_PUBLIC_TOPAY_MAINNET_URL || 'https://mainnet.topay.org',
        syncMode: 'light',
      },
      privacy: {
        analytics: false,
        crashReports: true,
        dataSharing: false,
      },
    };
    setSettings(defaultSettings);
    localStorage.setItem('topaySettings', JSON.stringify(defaultSettings));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <SettingsIcon size={24} />
          Settings
        </h2>
        <button className={styles.resetButton} onClick={resetToDefaults}>
          Reset to Defaults
        </button>
      </div>

      <div className={styles.settingsGrid}>
        {/* Notifications */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Bell size={20} />
            Notifications
          </h3>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Transaction Alerts</label>
              <span>Get notified about incoming and outgoing transactions</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.notifications.transactions}
                onChange={(e) => updateSettings('notifications', 'transactions', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Security Alerts</label>
              <span>Important security notifications and warnings</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.notifications.security}
                onChange={(e) => updateSettings('notifications', 'security', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>App Updates</label>
              <span>Notifications about new features and updates</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.notifications.updates}
                onChange={(e) => updateSettings('notifications', 'updates', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Marketing</label>
              <span>Promotional content and news</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.notifications.marketing}
                onChange={(e) => updateSettings('notifications', 'marketing', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>

        {/* Display */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Smartphone size={20} />
            Display & Language
          </h3>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Theme</label>
              <span>Choose your preferred color scheme</span>
            </div>
            <select
              value={settings.display.theme}
              onChange={(e) => updateSettings('display', 'theme', e.target.value)}
              className={styles.select}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Language</label>
              <span>Select your preferred language</span>
            </div>
            <select
              value={settings.display.language}
              onChange={(e) => updateSettings('display', 'language', e.target.value)}
              className={styles.select}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Primary Currency</label>
              <span>Default currency for display</span>
            </div>
            <select
              value={settings.display.currency}
              onChange={(e) => updateSettings('display', 'currency', e.target.value)}
              className={styles.select}
            >
              <option value="TOPAY">TOPAY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
        </div>

        {/* Network */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Wifi size={20} />
            Network & Sync
          </h3>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Auto Connect</label>
              <span>Automatically connect to TOPAY network</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.network.autoConnect}
                onChange={(e) => updateSettings('network', 'autoConnect', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Node URL</label>
              <span>Custom node endpoint for network connection</span>
            </div>
            <input
              type="url"
              value={settings.network.nodeUrl}
              onChange={(e) => updateSettings('network', 'nodeUrl', e.target.value)}
              className={styles.input}
              placeholder={process.env.NEXT_PUBLIC_TOPAY_MAINNET_URL || "https://mainnet.topay.org"}
            />
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Sync Mode</label>
              <span>Choose blockchain synchronization method</span>
            </div>
            <select
              value={settings.network.syncMode}
              onChange={(e) => updateSettings('network', 'syncMode', e.target.value)}
              className={styles.select}
            >
              <option value="light">Light (Recommended)</option>
              <option value="full">Full Node</option>
              <option value="archive">Archive Node</option>
            </select>
          </div>
        </div>

        {/* Privacy */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Shield size={20} />
            Privacy & Data
          </h3>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Analytics</label>
              <span>Help improve the app by sharing usage data</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.privacy.analytics}
                onChange={(e) => updateSettings('privacy', 'analytics', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Crash Reports</label>
              <span>Automatically send crash reports to help fix bugs</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.privacy.crashReports}
                onChange={(e) => updateSettings('privacy', 'crashReports', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label>Data Sharing</label>
              <span>Share anonymized data with third parties</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.privacy.dataSharing}
                onChange={(e) => updateSettings('privacy', 'dataSharing', e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p>Settings are automatically saved to your device.</p>
        <p>Some changes may require restarting the application.</p>
      </div>
    </div>
  );
}