'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import styles from './Profile.module.css';

interface ProfileData {
  avatar: string;
  joinDate: string;
  walletAddress: string;
}

interface ProfileProps {
  walletAddress: string;
}

export default function Profile({ walletAddress }: ProfileProps) {
  const [profile, setProfile] = useState<ProfileData>({
    avatar: '',
    joinDate: new Date().toISOString().split('T')[0],
    walletAddress: walletAddress || ''
  });

  // Generate avatar URL based on wallet address
  const getAvatarUrl = (address: string) => {
    if (!address) return '';
    return `https://api.dicebear.com/9.x/identicon/svg?seed=${address}`;
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
  }, [walletAddress]);



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <User size={24} />
          Profile
        </h2>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {profile.avatar ? (
              <Image 
                src={profile.avatar} 
                alt="Profile Avatar" 
                width={96}
                height={96}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <User size={48} />
            )}
          </div>
        </div>

        <div className={styles.profileInfo}>
          <div className={styles.field}>
            <label>Wallet Address</label>
            <span className={styles.walletAddress}>
              {profile.walletAddress || 'No wallet connected'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <h3>Wallet Status</h3>
          <p className={profile.walletAddress ? styles.connected : styles.disconnected}>
            {profile.walletAddress ? 'Connected' : 'Not Connected'}
          </p>
        </div>
        <div className={styles.stat}>
          <h3>Security Level</h3>
          <p className={styles.quantum}>Quantum-Safe</p>
        </div>
        <div className={styles.stat}>
          <h3>Member Since</h3>
          <p>{new Date(profile.joinDate).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}