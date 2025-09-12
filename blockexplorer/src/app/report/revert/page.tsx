/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import AIReview, { AIReviewData } from '@/components/AIReview';
import BlockchainClient from '@/lib/blockchain';
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
    email: '',
    evidenceImages: [] as File[]
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const handleReportTypeChange = (type: string) => {
    setReportType(type);
    // Clear the input field when switching types
    setFormData(prev => ({
      ...prev,
      transactionHash: type === 'revert' ? prev.transactionHash : '',
      walletAddress: type === 'wallet' ? prev.walletAddress : ''
    }));
  };

  const [aiReview, setAiReview] = useState<AIReviewData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const blockchainClient = new BlockchainClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages = files.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        evidenceImages: [...prev.evidenceImages, ...validImages].slice(0, 5) // Max 5 images
      }));
      
      // Create preview URLs
      validImages.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreviews(prev => [...prev, event.target?.result as string].slice(0, 5));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidenceImages: prev.evidenceImages.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const triggerAIReview = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const reviewData = {
        reportType,
        walletAddress: reportType === 'wallet' ? formData.walletAddress : '',
        transactionHash: reportType === 'revert' ? formData.transactionHash : '',
        description: formData.description,
        evidenceImages: formData.evidenceImages.length
      };

      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI review');
      }

      const result = await response.json();
      setAiReview(result.review);
    } catch (error) {
      console.error('AI Review Error:', error);
      setAiError('AI analysis temporarily unavailable. Your report will still be processed manually.');
    } finally {
      setAiLoading(false);
    }
  }, [reportType, formData.walletAddress, formData.transactionHash, formData.description, formData.evidenceImages.length]);

  // Trigger AI review when form data changes
  useEffect(() => {
    const shouldTriggerReview = (
      (reportType === 'revert' && formData.transactionHash) ||
      (reportType === 'wallet' && formData.walletAddress)
    ) && formData.reason && formData.description.length > 20;

    if (shouldTriggerReview) {
      const timeoutId = setTimeout(() => {
        triggerAIReview();
      }, 1500); // Debounce for 1.5 seconds

      return () => clearTimeout(timeoutId);
    } else {
      setAiReview(null);
      setAiError(null);
    }
  }, [formData.transactionHash, formData.walletAddress, formData.reason, formData.description, reportType, triggerAIReview]);

  const validateBlockchainData = async (): Promise<boolean> => {
    setIsValidating(true);
    setValidationError(null);
    
    try {
      if (reportType === 'revert' && formData.transactionHash) {
        const isValidTx = await blockchainClient.validateTransactionHash(formData.transactionHash);
        if (!isValidTx) {
          setValidationError('Transaction hash not found on the blockchain. Please verify the transaction hash.');
          return false;
        }
      } else if (reportType === 'wallet' && formData.walletAddress) {
        const isValidAddress = await blockchainClient.validateWalletAddress(formData.walletAddress);
        if (!isValidAddress) {
          setValidationError('Wallet address not found on the blockchain or has no transaction history. Please verify the wallet address.');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Blockchain validation error:', error);
      setValidationError('Unable to validate on blockchain. Please try again later.');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate blockchain data first
    const isValid = await validateBlockchainData();
    if (!isValid) {
      setLoading(false);
      return;
    }
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      // In a real implementation, you would send the report data including images to your backend
      console.log('Report submitted:', {
        ...formData,
        evidenceImagesCount: formData.evidenceImages.length,
        aiReview: aiReview
      });
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
                <p className={styles.successMessage}>Your evidence-based report has been submitted successfully and will be reviewed by our team.</p>
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
            <h1 className={styles.cardTitle}>Report {reportType === 'revert' ? 'Revert' : 'Wallet Address'} with Evidence</h1>
          </div>
          <div className={styles.cardBody}>
            <form onSubmit={handleSubmit}>
              {/* Report Type Picker */}
              <div className={styles.formGroup}>
                <label className={styles.formLabelGroup}>What would you like to report with evidence?</label>
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={() => handleReportTypeChange('revert')}
                    className={`${styles.reportTypeButton} ${reportType === 'revert' ? styles.reportTypeButtonActive : styles.reportTypeButtonInactive}`}
                  >
                    <div className={styles.reportTypeTitle}>Revert</div>
                    <div className={styles.reportTypeDescription}>Report a transaction revert issue with supporting evidence</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportTypeChange('wallet')}
                    className={`${styles.reportTypeButton} ${reportType === 'wallet' ? styles.reportTypeButtonActive : styles.reportTypeButtonInactive}`}
                  >
                    <div className={styles.reportTypeTitle}>Wallet Address</div>
                    <div className={styles.reportTypeDescription}>Report a suspicious wallet with supporting evidence</div>
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
              
              {/* Blockchain Validation Error */}
              {validationError && (
                <div className={styles.formGroup}>
                  <div className={styles.errorMessage}>
                    <span className={styles.errorIcon}>⚠️</span>
                    {validationError}
                  </div>
                </div>
              )}
              
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
              
              {/* AI Review Section */}
              {(aiLoading || aiReview || aiError) && (
                <div className={styles.formGroup}>
                  <AIReview 
                    review={aiReview}
                    isLoading={aiLoading}
                    error={aiError}
                  />
                </div>
              )}
              
              {/* Evidence Images Upload */}
              <div className={styles.formGroup}>
                <label htmlFor="evidenceImages" className={styles.formLabel}>Evidence Images (Optional)</label>
                <p className={styles.formHint}>Upload up to 5 images as evidence to support your report</p>
                <input
                  type="file"
                  id="evidenceImages"
                  name="evidenceImages"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                />
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className={styles.imagePreviewContainer}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className={styles.imagePreview}>
                        <img src={preview} alt={`Evidence ${index + 1}`} className={styles.previewImage} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className={styles.removeImageButton}
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                  disabled={loading || isValidating || (reportType === 'revert' && !formData.transactionHash) || (reportType === 'wallet' && !formData.walletAddress) || !formData.reason || !formData.description || !formData.email}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  {loading || isValidating ? (
                    <>
                      <span className={styles.loadingSpinner}><LoadingSpinner size="sm" /></span>
                      <span className={styles.loadingText}>
                        {isValidating ? 'Validating on blockchain...' : 'Submitting...'}
                      </span>
                    </>
                  ) : (
                    aiReview ? (
                      aiReview.requiresManualReview ? 'Submit for Manual Review' : 'Submit Report (AI Pre-Approved)'
                    ) : 'Submit Report'
                  )}
                </button>
                
                {aiReview && (
                  <div className={styles.submissionNote}>
                    {aiReview.requiresManualReview ? (
                      <p className={styles.manualReviewNote}>
                        📋 This report will be reviewed by our security team due to its complexity or risk level.
                      </p>
                    ) : (
                      <p className={styles.autoProcessNote}>
                        ⚡ This report can be processed automatically based on AI analysis.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}