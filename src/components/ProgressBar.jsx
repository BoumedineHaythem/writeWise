import React from 'react';
import styles from './ProgressBar.module.css';

/**
 * Accessible progress bar.
 * value: 0–100
 */
export default function ProgressBar({ value, label, showLabel = true, size = 'md' }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={styles.wrapper}>
      {showLabel && (
        <div className={styles.labelRow}>
          {label && <span className={styles.label}>{label}</span>}
          <span className={styles.percent}>{clamped}%</span>
        </div>
      )}
      <div
        className={[styles.track, styles[size]].filter(Boolean).join(' ')}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${clamped}%` : `${clamped}%`}
      >
        <div
          className={styles.fill}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
