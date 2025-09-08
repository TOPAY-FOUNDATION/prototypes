'use client';

import { useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './report-page.module.css';

export default function ReportRevertPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportType, setReportType] = useState('revert');
  const [formData, setFormData] = useState({
    transactionHash: '',
    walletAddress: '',
    reason: '',
    description: '',
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReportTypeChange = (type: string) => {
    setReportType(type);
    // Clear the input field when switching types
    setFormData(prev => ({
      ...prev,
      transactionHash: type === 'revert' ? prev.transactionHash : '',
      walletAddress: type === 'wallet' ? prev.walletAddress : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // In a real implementation, you would send the report data to your backend
      console.log('Report submitted:', formData);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.cardTitle}>Report Submitted</h1>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.successContainer}>
                <div className={styles.successIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className={styles.successTitle}>Thank You!</h2>
                <p className={styles.successMessage}>Your report has been submitted successfully.</p>
                <div className={styles.successButtonContainer}>
                  <Link 
                    href="/"
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Return to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Report {reportType === 'revert' ? 'Revert' : 'Wallet Address'}</h1>
          </div>
          <div className={styles.cardBody}>
            <form onSubmit={handleSubmit}>
              {/* Report Type Picker */}
              <div className={styles.formGroup}>
                <label className={styles.formLabelGroup}>What would you like to report?</label>
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={() => handleReportTypeChange('revert')}
                    className={`${styles.reportTypeButton} ${reportType === 'revert' ? styles.reportTypeButtonActive : styles.reportTypeButtonInactive}`}
                  >
                    <div className={styles.reportTypeTitle}>Revert</div>
                    <div className={styles.reportTypeDescription}>Report a transaction revert issue</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportTypeChange('wallet')}
                    className={`${styles.reportTypeButton} ${reportType === 'wallet' ? styles.reportTypeButtonActive : styles.reportTypeButtonInactive}`}
                  >
                    <div className={styles.reportTypeTitle}>Wallet Address</div>
                    <div className={styles.reportTypeDescription}>Report a suspicious wallet</div>
                  </button>
                </div>
              </div>

              {/* Dynamic Input Field */}
              <div className={styles.formGroup}>
                {reportType === 'revert' ? (
                  <>
                    <label htmlFor="transactionHash" className={styles.formLabel}>Transaction Hash</label>
                    <input
                      type="text"
                      id="transactionHash"
                      name="transactionHash"
                      value={formData.transactionHash}
                      onChange={handleChange}
                      required
                      className={styles.input}
                      placeholder="Enter the transaction hash that reverted"
                    />
                  </>
                ) : (
                  <>
                    <label htmlFor="walletAddress" className={styles.formLabel}>Wallet Address</label>
                    <input
                      type="text"
                      id="walletAddress"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleChange}
                      required
                      className={styles.input}
                      placeholder="Enter the wallet address"
                    />
                  </>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="reason" className={styles.formLabel}>Reason for Report</label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className={styles.select}
                >
                  <option value="">Select a reason</option>
                  <option value="suspicious">Suspicious Activity</option>
                  <option value="scam">Scam or Fraud</option>
                  <option value="illegal">Illegal Activity</option>
                  <option value="phishing">Phishing</option>
                  <option value="money_laundering">Money Laundering</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.formLabel}>Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className={styles.textarea}
                  placeholder={`Please provide details about why you are reporting this ${reportType === 'revert' ? 'revert issue' : 'wallet address'}`}
                ></textarea>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>Your Email (optional)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="For follow-up information"
                />
              </div>
              
              <div className={styles.buttonContainer}>
                <Link 
                  href="/"
                  className={`${styles.button} ${styles.buttonSecondary}`}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || (reportType === 'revert' && !formData.transactionHash) || (reportType === 'wallet' && !formData.walletAddress) || !formData.reason || !formData.description}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  {loading ? (
                    <>
                      <span className={styles.loadingSpinner}><LoadingSpinner size="sm" /></span>
                      <span className={styles.loadingText}>Submitting...</span>
                    </>
                  ) : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}