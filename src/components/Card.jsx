import React from 'react';
import styles from './Card.module.css';

/**
 * Reusable Card component.
 * variant: 'default' | 'accent' | 'flat'
 */
export default function Card({ children, variant = 'default', className = '', ...rest }) {
  return (
    <div
      className={[styles.card, styles[variant], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
