import React from 'react';
import styles from './Words.module.css';

/** Splits a heading into masked words so GSAP can slide them up one by one (data-anim="word"). */
export default function Words({ text }) {
  return text.split(' ').map((word, i, all) => (
    <React.Fragment key={i}>
      <span className={styles.wordMask}>
        <span className={styles.word} data-anim="word">{word}</span>
      </span>
      {i < all.length - 1 ? ' ' : null}
    </React.Fragment>
  ));
}