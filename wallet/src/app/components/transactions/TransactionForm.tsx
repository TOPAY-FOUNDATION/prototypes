'use client';

import { useState } from 'react';
import styles from './TransactionForm.module.css';

interface TransactionFormProps {
  walletAddress: string;
  balance: number;
  onTransactionSent: () => void;
}

interface TransactionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (privateKey: string) => void;
  transactionDetails: {
    recipient: string;
    amount: string;
    fee: string;
    total: string;
  };
  isLoading: boolean;
}

function TransactionConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transactionDetails, 
  isLoading 
}: TransactionConfirmationModalProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (privateKey.trim()) {
      onConfirm(privateKey.trim());
    }
  };

  const handleClose = () => {
    setPrivateKey('');
    setShowPrivateKey(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--overlay-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--background-primary)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Confirm Transaction</h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Transaction Details */}
        <div style={{
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Transaction Details
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>To:</span>
              <span style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.875rem', 
                wordBreak: 'break-all',
                maxWidth: '60%',
                textAlign: 'right'
              }}>
                {transactionDetails.recipient}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Amount:</span>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                {transactionDetails.amount} TOPAY
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Network Fee:</span>
              <span style={{ fontSize: '0.875rem' }}>
                {transactionDetails.fee} TOPAY
              </span>
            </div>
            
            <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Total:</span>
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                {transactionDetails.total} TOPAY
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{
          backgroundColor: 'var(--warning-light)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--warning-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔒</span>
            <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--warning-color)' }}>
              Secure Transaction Signing
            </span>
          </div>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem', 
            color: 'var(--warning-color)',
            lineHeight: '1.4'
          }}>
            Your private key is used locally to sign this transaction and will never be transmitted or stored.
          </p>
        </div>

        {/* Private Key Input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Enter your private key to sign this transaction
          </label>
          <div style={{ position: 'relative' }}>
             <textarea
               value={privateKey}
               onChange={(e) => setPrivateKey(e.target.value)}
               placeholder="Enter your private key..."
               disabled={isLoading}
               style={{
                 width: '100%',
                 minHeight: '80px',
                 padding: '0.75rem',
                 border: '1px solid var(--border-color)',
                 borderRadius: '6px',
                 fontSize: '0.875rem',
                 fontFamily: 'monospace',
                 resize: 'vertical',
                 boxSizing: 'border-box',
                 ...(showPrivateKey ? {} : { WebkitTextSecurity: 'disc' } as React.CSSProperties)
               }}
             />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              disabled={isLoading}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '0.75rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}
            >
              {showPrivateKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: 'var(--background-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !privateKey.trim()}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: privateKey ? 'var(--success-color)' : 'var(--border-color)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: privateKey.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading && <span className={styles.spinner}></span>}
            {isLoading ? 'Signing...' : 'Sign & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionForm({ walletAddress, balance, onTransactionSent }: TransactionFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const showMessage = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const validateForm = () => {
    if (!walletAddress) {
      showMessage('Please create or import a wallet first', 'warning');
      return false;
    }

    if (!recipient.trim()) {
      showMessage('Please enter recipient address', 'warning');
      return false;
    }

    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showMessage('Please enter a valid amount', 'warning');
      return false;
    }

    if (parseFloat(amount) > balance) {
      showMessage('Insufficient balance', 'error');
      return false;
    }

    return true;
  };

  const calculateFee = (amount: number) => {
    // Simple fee calculation - 0.1% of transaction amount, minimum 0.00001 TOPAY
    return Math.max(amount * 0.001, 0.00001);
  };

  const handleSendClick = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmTransaction = async (privateKey: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: walletAddress,
          to: recipient.trim(),
          amount: parseFloat(amount),
          privateKey: privateKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send transaction');
      }

      const data = await response.json();
      showMessage(`Transaction sent successfully! Hash: ${data.hash}`, 'success');
      
      // Clear form and close modal
      setRecipient('');
      setAmount('');
      setShowConfirmModal(false);
      
      // Notify parent to refresh balance
      onTransactionSent();
      
    } catch (error) {
      showMessage('Failed to send transaction: ' + (error as Error).message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxAmount = () => {
    // Leave a small amount for potential fees
    const maxSendable = Math.max(0, balance - 0.00001);
    setAmount(maxSendable.toString());
  };

  const fee = amount ? calculateFee(parseFloat(amount)) : 0;
  const total = amount ? parseFloat(amount) + fee : 0;

  if (!walletAddress) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Send Transaction</h2>
        <div className={`${styles.alert} ${styles.alertWarning}`}>
          Please create or import a wallet first to send transactions.
        </div>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className={`${styles.alert} ${styles[`alert${messageType.charAt(0).toUpperCase() + messageType.slice(1)}`]}`}>
          {message}
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Send Transaction</h2>
        
        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Available Balance:</span>
            <span className={styles.balance} style={{ fontSize: '1.2rem', margin: '0' }}>
              {(balance || 0).toFixed(8)} TOPAY
            </span>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Recipient Address</label>
            <input
              type="text"
              className={styles.input}
              value={recipient || ''}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient wallet address..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Amount (TOPAY)
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={setMaxAmount}
                style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              >
                Max
              </button>
            </label>
            <input
              type="number"
              step="0.00000001"
              min="0"
              max={balance}
              className={styles.input}
              value={amount || ''}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00000000"
            />
          </div>

          {/* Transaction Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div style={{
              backgroundColor: 'var(--background-secondary)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Transaction Summary
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount:</span>
                  <span>{parseFloat(amount || '0').toFixed(8)} TOPAY</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Network Fee:</span>
                  <span>{(fee || 0).toFixed(8)} TOPAY</span>
                </div>
                <hr style={{ margin: '0.25rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                  <span>Total:</span>
                  <span>{(total || 0).toFixed(8)} TOPAY</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={handleSendClick}
              disabled={isLoading || !recipient || !amount}
              style={{ flex: 1 }}
            >
              Review Transaction
            </button>
            
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => {
                setRecipient('');
                setAmount('');
                setMessage('');
              }}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(var(--success-color-rgb), 0.1)', borderRadius: '8px', border: '1px solid rgba(var(--success-color-rgb), 0.2)' }}>
          <h4 style={{ color: 'var(--success-color)', marginBottom: '0.5rem' }}>🔒 Secure Transaction Process</h4>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.5rem', margin: 0 }}>
            <li>Review transaction details before signing</li>
            <li>Private key authentication happens in a secure popup</li>
            <li>Your private key never leaves your browser</li>
            <li>Transactions are irreversible once confirmed</li>
          </ul>
        </div>
      </div>

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmTransaction}
        transactionDetails={{
          recipient,
          amount: amount || '0',
          fee: (fee || 0).toFixed(8),
          total: (total || 0).toFixed(8)
        }}
        isLoading={isLoading}
      />
    </div>
  );
}