'use client';

import { useState } from 'react';
import styles from './SupportButton.module.css';

interface SupportButtonProps {
  onClick: () => void;
}

export default function SupportButton({ onClick }: SupportButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={styles.supportButton}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Customer Support"
    >
      <div className={styles.statusIndicator + ' ' + styles.statusOnline}></div>
      <span className={styles.supportIcon}>?</span>
      {isHovered && (
        <span className={styles.tooltip}>Need Help?</span>
      )}
    </button>
  );
}