'use client';

import { useState } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ReportTransactionPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportType, setReportType] = useState('transaction');
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
      transactionHash: '',
      walletAddress: ''
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
      <div className="min-h-screen bg-page">
        <div className="container py-12 max-w-2xl mx-auto">
          <div className="card">
            <div className="card-header">
              <h1 className="card-title text-xl">Report Submitted</h1>
            </div>
            <div className="card-body">
              <div className="text-center py-8">
                <div className="mb-4 text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                <p className="text-secondary mb-6">Your report has been submitted successfully.</p>
                <div className="flex justify-center space-x-4">
                  <Link 
                    href="/"
                    className="btn btn-primary"
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
    <div className="min-h-screen bg-page">
      <div className="container py-12 max-w-2xl mx-auto">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title text-xl">Report {reportType === 'transaction' ? 'Transaction' : 'Wallet Address'}</h1>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Report Type Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">What would you like to report?</label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => handleReportTypeChange('transaction')}
                    className={`flex-1 p-3 border rounded-md text-center transition-colors ${
                      reportType === 'transaction'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">Transaction</div>
                    <div className="text-sm text-secondary mt-1">Report a suspicious transaction</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportTypeChange('wallet')}
                    className={`flex-1 p-3 border rounded-md text-center transition-colors ${
                      reportType === 'wallet'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">Wallet Address</div>
                    <div className="text-sm text-secondary mt-1">Report a suspicious wallet</div>
                  </button>
                </div>
              </div>

              {/* Dynamic Input Field */}
              <div className="mb-4">
                {reportType === 'transaction' ? (
                  <>
                    <label htmlFor="transactionHash" className="block text-sm font-medium mb-1">Transaction Hash</label>
                    <input
                      type="text"
                      id="transactionHash"
                      name="transactionHash"
                      value={formData.transactionHash}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 font-mono"
                      placeholder="Enter the transaction hash"
                    />
                  </>
                ) : (
                  <>
                    <label htmlFor="walletAddress" className="block text-sm font-medium mb-1">Wallet Address</label>
                    <input
                      type="text"
                      id="walletAddress"
                      name="walletAddress"
                      value={formData.walletAddress}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 font-mono"
                      placeholder="Enter the wallet address"
                    />
                  </>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium mb-1">Reason for Report</label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
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
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                  placeholder={`Please provide details about why you are reporting this ${reportType === 'transaction' ? 'transaction' : 'wallet address'}`}
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium mb-1">Your Email (optional)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                  placeholder="For follow-up information"
                />
              </div>
              
              <div className="flex justify-between">
                <Link 
                  href="/"
                  className="btn btn-secondary"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || (!formData.transactionHash && !formData.walletAddress) || !formData.reason || !formData.description}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Submitting...</span>
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