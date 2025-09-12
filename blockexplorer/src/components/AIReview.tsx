'use client';

import React from 'react';
import styles from './AIReview.module.css';

export interface AIReviewData {
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  analysis: string;
  recommendations: string[];
  flaggedElements: string[];
  confidence: number;
  requiresManualReview: boolean;
  autoProcessingDecision: {
    canAutoProcess: boolean;
    reason: string;
    reviewerNotes?: string;
  };
}

interface AIReviewProps {
  review: AIReviewData | null;
  isLoading: boolean;
  error: string | null;
}

const AIReview: React.FC<AIReviewProps> = ({ review, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>🤖 AI Security Analysis</h3>
          <div className={styles.loadingBadge}>Analyzing...</div>
        </div>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p>ChainGPT is analyzing your report for potential security risks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>🤖 AI Security Analysis</h3>
          <div className={styles.errorBadge}>Error</div>
        </div>
        <div className={styles.errorContent}>
          <p className={styles.errorMessage}>{error}</p>
          <p className={styles.errorSubtext}>Manual review will be conducted by our security team.</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10b981'; // green
      case 'medium': return '#f59e0b'; // yellow
      case 'high': return '#ef4444'; // red
      case 'critical': return '#dc2626'; // dark red
      default: return '#6b7280'; // gray
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      case 'critical': return '🔴';
      default: return '❓';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>🤖 AI Security Analysis</h3>
        <div 
          className={styles.severityBadge}
          style={{ backgroundColor: getSeverityColor(review.severity) }}
        >
          {getSeverityIcon(review.severity)} {review.severity.toUpperCase()}
        </div>
      </div>

      <div className={styles.content}>
        {/* Risk Score */}
        <div className={styles.riskScore}>
          <div className={styles.scoreLabel}>Risk Score</div>
          <div className={styles.scoreValue}>
            <span className={styles.scoreNumber}>{review.riskScore}</span>
            <span className={styles.scoreMax}>/100</span>
          </div>
          <div className={styles.scoreBar}>
            <div 
              className={styles.scoreProgress}
              style={{ 
                width: `${review.riskScore}%`,
                backgroundColor: getSeverityColor(review.severity)
              }}
            ></div>
          </div>
        </div>

        {/* Analysis */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>📊 Analysis</h4>
          <p className={styles.analysisText}>{review.analysis}</p>
        </div>

        {/* Flagged Elements */}
        {review.flaggedElements.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>🚩 Flagged Elements</h4>
            <ul className={styles.flaggedList}>
              {review.flaggedElements.map((element, index) => (
                <li key={index} className={styles.flaggedItem}>
                  {element}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {review.recommendations.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>💡 Recommendations</h4>
            <ul className={styles.recommendationsList}>
              {review.recommendations.map((recommendation, index) => (
                <li key={index} className={styles.recommendationItem}>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence */}
        <div className={styles.confidence}>
          <span className={styles.confidenceLabel}>AI Confidence:</span>
          <span className={styles.confidenceValue}>{review.confidence}%</span>
        </div>

        {/* Processing Decision */}
        <div className={styles.processingDecision}>
          <h4 className={styles.sectionTitle}>Processing Decision</h4>
          <div className={`${styles.decisionBadge} ${review.requiresManualReview ? styles.manualReview : styles.autoProcess}`}>
            {review.requiresManualReview ? '👤 Manual Review Required' : '🤖 Can Auto-Process'}
          </div>
          <p className={styles.decisionReason}>
            <strong>Reason:</strong> {review.autoProcessingDecision.reason}
          </p>
          {review.autoProcessingDecision.reviewerNotes && (
            <p className={styles.reviewerNotes}>
              <strong>Reviewer Notes:</strong> {review.autoProcessingDecision.reviewerNotes}
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          <p>
            {review.requiresManualReview 
              ? 'This report has been flagged for manual review by a human expert due to complexity or high risk factors.'
              : 'This report can be automatically processed based on AI analysis, but human oversight remains available if needed.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIReview;