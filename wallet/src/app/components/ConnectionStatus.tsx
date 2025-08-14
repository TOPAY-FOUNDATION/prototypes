/**
 * Blockchain Connection Status Component
 * Shows the connection status to the main blockchain workspace
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import styles from './ConnectionStatus.module.css';

interface ConnectionStatusProps {
  className?: string;
}

export default function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/blockchain/info');
      const data = await response.json();
      
      if (response.ok && data.isConnectedToWorkspace) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
        setError(data.error || 'Connection failed');
      }
    } catch {
      setIsConnected(false);
      setError('Failed to check connection');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 10 seconds
    const interval = setInterval(checkConnection, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isLoading) {
      return <div className={styles.spinner} />;
    }
    
    if (isConnected) {
      return <CheckCircle size={16} className={styles.connectedIcon} />;
    }
    
    return <AlertCircle size={16} className={styles.disconnectedIcon} />;
  };

  const getStatusText = () => {
    if (isLoading) {
      return 'Checking connection...';
    }
    
    if (isConnected) {
      return 'Connected to Blockchain Workspace';
    }
    
    return 'Disconnected from Blockchain Workspace';
  };

  const getStatusClass = () => {
    if (isLoading) return styles.loading;
    if (isConnected) return styles.connected;
    return styles.disconnected;
  };

  return (
    <div className={`${styles.connectionStatus} ${getStatusClass()} ${className || ''}`}>
      <div className={styles.statusIndicator}>
        {getStatusIcon()}
        <span className={styles.statusText}>{getStatusText()}</span>
      </div>
      
      {!isConnected && !isLoading && (
        <div className={styles.errorDetails}>
          <p className={styles.errorMessage}>{error}</p>
          <p className={styles.suggestion}>
            Please Check your internet connection and try again.
          </p>
          <button 
            className={styles.retryButton}
            onClick={checkConnection}
          >
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
}