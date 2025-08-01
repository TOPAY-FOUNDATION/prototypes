'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import styles from '../page.module.css';

interface ChainGPTButtonProps {
  onClick: () => void;
}

export default function ChainGPTButton({ onClick }: ChainGPTButtonProps) {
  return (
    <button
      className={styles.chainGptButton}
      onClick={onClick}
      title="ChainGPT AI Assistant"
    >
      <div className={styles.chainGptButtonIcon}>
        <Bot size={20} color="#007bff" />
      </div>
      <div className={styles.chainGptButtonText}>
        ChainGPT
      </div>
      <div className={styles.chainGptButtonPulse}></div>
    </button>
  );
}