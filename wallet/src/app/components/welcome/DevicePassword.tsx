'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './DevicePassword.module.css';

interface DevicePasswordProps {
  onPasswordSet: (password: string) => void;
  onBack: () => void;
}

export default function DevicePassword({ onPasswordSet }: DevicePasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score < 3) return { strength: 'weak', color: '#ef4444', text: 'Weak' };
    if (score < 4) return { strength: 'medium', color: '#f59e0b', text: 'Medium' };
    return { strength: 'strong', color: '#10b981', text: 'Strong' };
  };

  const passwordStrength = getPasswordStrength(password);

  const validatePasswords = () => {
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (passwordStrength.strength === 'weak') {
      setError('Please choose a stronger password');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validatePasswords()) {
      onPasswordSet(password);
    }
  };

  const requirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains number', met: /\d/.test(password) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <Lock size={48} className={styles.icon} />
        </div>
        <h2 className={styles.title}>Set Device Password</h2>
        <p className={styles.subtitle}>
          Create a strong password to protect your wallet on this device. This adds an extra layer of security.
        </p>
      </div>

      <div className={styles.infoBox}>
        <Shield size={20} />
        <div>
          <strong>Why set a device password?</strong>
          <ul>
            <li>Protects your wallet if someone gains access to your device</li>
            <li>Required to access your wallet and make transactions</li>
            <li>Can be changed later in security settings</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Password Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Device Password</label>
          <div className={styles.passwordField}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your device password"
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {password && (
            <div className={styles.strengthContainer}>
              <div className={styles.strengthBar}>
                <div 
                  className={styles.strengthFill}
                  style={{ 
                    width: `${(Object.values(getPasswordStrength(password)).length / 5) * 100}%`,
                    backgroundColor: passwordStrength.color 
                  }}
                />
              </div>
              <span 
                className={styles.strengthText}
                style={{ color: passwordStrength.color }}
              >
                {passwordStrength.text}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Confirm Password</label>
          <div className={styles.passwordField}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your device password"
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className={styles.requirements}>
          <h4>Password Requirements:</h4>
          <div className={styles.requirementsList}>
            {requirements.map((req, index) => (
              <div key={index} className={`${styles.requirement} ${req.met ? styles.met : ''}`}>
                {req.met ? <CheckCircle size={16} /> : <div className={styles.circle} />}
                <span>{req.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className={`${styles.submitButton} ${passwordStrength.strength === 'weak' || password !== confirmPassword ? styles.disabled : ''}`}
          disabled={passwordStrength.strength === 'weak' || password !== confirmPassword}
        >
          Set Device Password
        </button>
      </form>

      <div className={styles.note}>
        <p>
          <strong>Note:</strong> This password is stored locally on your device and cannot be recovered. 
          Make sure to remember it or write it down securely.
        </p>
      </div>
    </div>
  );
}