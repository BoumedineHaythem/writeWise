import React, { useState, useRef, useMemo, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import Button from '../components/Button';
import Words from '../components/Words';
import useEntrance from '../hooks/useEntrance';
import { useLearning } from '../context/LearningContext';
import kit from '../styles/pageKit.module.css';
import styles from './FlashcardsPage.module.css';

const MOTION_OK = '(prefers-reduced-motion: no-preference)';

// small stable hash so "shuffle" gives a different but repeatable order
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

export default function FlashcardsPage({ onNavigate }) {
  const root = useRef(null);
  const cardRef = useRef(null);
  const dirRef = useRef(1);
  const firstCard = useRef(true);
  const statusTimer = useRef(0);
  const { flashcards, knownIds, setKnown, removeFlashcard, addAllToPractice } = useLearning();

  const [mode, setMode] = useState('all'); // 'all' | 'learning'
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seed, setSeed] = useState(0);
  const [status, setStatus] = useState('');
  useEntrance(root);

  useEffect(() => () => window.clearTimeout(statusTimer.current), []);

  const deck = useMemo(() => {
    const base = mode === 'learning' ? flashcards.filter((w) => !knownIds.includes(w.id)) : flashcards;
    if (!seed) return base;
    return [...base].sort((a, b) => hash(a.id + seed) - hash(b.id + seed));
  }, [flashcards, knownIds, mode, seed]);

  const safeIndex = Math.min(index, Math.max(0, deck.length - 1));
  const card = deck[safeIndex];
  const known = card ? knownIds.includes(card.id) : false;
  const knownCount = flashcards.filter((w) => knownIds.includes(w.id)).length;

  // each new card slides in
  useLayoutEffect(() => {
    if (firstCard.current) {
      firstCard.current = false;
      return;
    }
    if (!cardRef.current || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(cardRef.current, { opacity: 0, x: 48 * dirRef.current }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out', clearProps: 'transform' });
  }, [card?.id]);

  const announce = (message) => {
    setStatus(message);
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(''), 3000);
  };

  const go = (delta) => {
    if (deck.length === 0) return;
    dirRef.current = delta;
    setFlipped(false);
    setIndex((safeIndex + delta + deck.length) % deck.length);
  };

  const mark = (value) => {
    if (!card) return;
    setKnown(card.id, value);
    if (mode === 'learning' && value) {
      // the card leaves this deck, so the next one is already at this position
      setFlipped(false);
      dirRef.current = 1;
    } else {
      go(1);
    }
  };

  const changeMode = (next) => {
    setMode(next);
    setIndex(0);
    setFlipped(false);
  };

  const shuffle = () => {
    setSeed(Date.now());
    setIndex(0);
    setFlipped(false);
    announce('Deck shuffled.');
  };

  const jumpTo = (id) => {
    setMode('all');
    setSeed(0);
    setIndex(flashcards.findIndex((w) => w.id === id));
    setFlipped(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  return (
    <div className={kit.page} ref={root}>
      <div className={['container', kit.inner].join(' ')}>
        <header className={kit.header}>
          <div>
            <h1 className={kit.title}>
              <Words text="Flashcards" />
            </h1>
            <p className={kit.sub} data-anim="fade">
              Flip each card, say the meaning in your head, then tell us how it went.
            </p>
          </div>
          <p className={kit.stat} data-anim="fade">
            <strong>{knownCount}</strong> of {flashcards.length} known
          </p>
        </header>

        {flashcards.length === 0 ? (
          /* ── Empty: nothing saved yet ── */
          <section className={styles.empty} data-anim="rise" aria-labelledby="empty-heading">
            <h2 id="empty-heading" className={styles.emptyTitle}>No flashcards yet</h2>
            <p className={styles.emptyText}>
              Save words from Explore and they will show up here as cards you can flip.
            </p>
            <Button onClick={() => onNavigate('explore')}>Explore words</Button>
          </section>
        ) : (
          <>
            {/* ── Deck controls ── */}
            <div className={styles.controls} data-anim="rise">
              <div className={styles.modes} role="group" aria-label="Which cards to study">
                <button type="button" className={[styles.mode, mode === 'all' ? styles.modeOn : ''].join(' ')} aria-pressed={mode === 'all'} onClick={() => changeMode('all')}>
                  All cards ({flashcards.length})
                </button>
                <button type="button" className={[styles.mode, mode === 'learning' ? styles.modeOn : ''].join(' ')} aria-pressed={mode === 'learning'} onClick={() => changeMode('learning')}>
                  Still learning ({flashcards.length - knownCount})
                </button>
              </div>
              <button type="button" className={styles.mode} onClick={shuffle}>Shuffle</button>
            </div>

            {card ? (
              <section className={styles.study} aria-label="Study area" onKeyDown={onKeyDown} data-anim="rise">
                <p className={styles.position}>
                  Card {safeIndex + 1} of {deck.length}
                  {known && <span className={kit.tag}>Known</span>}
                </p>
                <div className={kit.bar} aria-hidden="true">
                  <span className={kit.barFill} style={{ width: `${((safeIndex + 1) / deck.length) * 100}%` }} />
                </div>

                <div className={styles.stage} ref={cardRef}>
                  <button
                    type="button"
                    className={[styles.flip, flipped ? styles.flipped : ''].join(' ')}
                    onClick={() => setFlipped((f) => !f)}
                    aria-label={
                      flipped
                        ? `${card.word}: ${card.definition} Example: ${card.example} Press to flip back.`
                        : `${card.word}, ${card.pos}. Press to show the meaning.`
                    }
                  >
                    <span className={[styles.face, styles.front].join(' ')} aria-hidden="true">
                      <span className={styles.faceWord}>{card.word}</span>
                      <span className={styles.facePos}>{card.pos}</span>
                      <span className={styles.faceHint}>Click to flip</span>
                    </span>
                    <span className={[styles.face, styles.back].join(' ')} aria-hidden="true">
                      <span className={styles.faceDef}>{card.definition}</span>
                      <span className={styles.faceExample}>“{card.example}”</span>
                    </span>
                  </button>
                </div>

                <div className={styles.nav}>
                  <Button variant="secondary" onClick={() => go(-1)} disabled={deck.length < 2}>Previous</Button>
                  <Button variant="secondary" onClick={() => go(1)} disabled={deck.length < 2}>Next</Button>
                </div>

                <div className={styles.rate}>
                  <button type="button" className={styles.again} onClick={() => mark(false)}>Still learning</button>
                  <button type="button" className={styles.got} onClick={() => mark(true)}>I know it</button>
                </div>
                <p className={styles.keys}>Tip: use the ← and → keys to move between cards.</p>
              </section>
            ) : (
              <section className={styles.empty} data-anim="rise" aria-labelledby="done-heading">
                <h2 id="done-heading" className={styles.emptyTitle}>You know every card</h2>
                <p className={styles.emptyText}>Nothing left in “Still learning”. Review them all, or add more words.</p>
                <div className={styles.emptyActions}>
                  <Button onClick={() => changeMode('all')}>Review all cards</Button>
                  <Button variant="secondary" onClick={() => onNavigate('explore')}>Explore words</Button>
                </div>
              </section>
            )}

            {/* ── Your deck ── */}
            <section aria-labelledby="deck-heading" className={styles.deck} data-anim="rise">
              <div className={styles.deckHead}>
                <h2 id="deck-heading" className={styles.deckTitle}>Your deck</h2>
                <button
                  type="button"
                  className={styles.mode}
                  onClick={() => {
                    addAllToPractice(flashcards.map((w) => w.id));
                    announce('All your flashcard words were added to Practice.');
                  }}
                >
                  Add all to practice
                </button>
              </div>
              <ul className={styles.chips}>
                {flashcards.map((w) => (
                  <li key={w.id} className={[styles.chip, knownIds.includes(w.id) ? styles.chipKnown : ''].join(' ')}>
                    <button type="button" className={styles.chipWord} onClick={() => jumpTo(w.id)}>
                      {w.word}
                      {knownIds.includes(w.id) && <span className={kit.srOnly}> (known)</span>}
                    </button>
                    <button type="button" className={styles.chipRemove} onClick={() => removeFlashcard(w.id)} aria-label={`Remove ${w.word} from flashcards`}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <div className={styles.toast} role="status" aria-live="polite">{status}</div>
      </div>
    </div>
  );
}