import React, { useState, useRef, useMemo, useEffect } from 'react';
import Button from '../components/Button';
import Words from '../components/Words';
import useEntrance from '../hooks/useEntrance';
import { useLearning } from '../context/LearningContext';
import { WORDS, TOPICS, wordOfTheDay } from '../data/learningData';
import kit from '../styles/pageKit.module.css';
import styles from './ExplorePage.module.css';

/** A button that toggles a word in a list (flashcards / practice). */
function Toggle({ on, label, word, onClick }) {
  return (
    <button type="button" className={[styles.toggle, on ? styles.toggleOn : ''].join(' ')} aria-pressed={on} onClick={onClick}>
      <span className={styles.toggleIcon} aria-hidden="true">{on ? '✓' : '+'}</span>
      {label}
      <span className={kit.srOnly}> for {word}</span>
    </button>
  );
}

export default function ExplorePage({ onNavigate }) {
  const root = useRef(null);
  const statusTimer = useRef(0);
  const { flashcardIds, practiceIds, toggleFlashcard, togglePractice } = useLearning();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All');
  const [status, setStatus] = useState('');
  useEntrance(root);

  useEffect(() => () => window.clearTimeout(statusTimer.current), []);

  const wotd = useMemo(() => wordOfTheDay(), []);
  const q = query.trim().toLowerCase();
  const list = WORDS.filter(
    (w) =>
      (topic === 'All' || w.topic === topic) &&
      (!q || w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q))
  );

  const announce = (message) => {
    setStatus(message);
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(''), 3000);
  };

  const onFlashcard = (w) => {
    const had = flashcardIds.includes(w.id);
    toggleFlashcard(w.id);
    announce(had ? `Removed “${w.word}” from flashcards.` : `Added “${w.word}” to flashcards.`);
  };

  const onPractice = (w) => {
    const had = practiceIds.includes(w.id);
    togglePractice(w.id);
    announce(had ? `Removed “${w.word}” from practice.` : `Added “${w.word}” to practice.`);
  };

  const actions = (w) => (
    <div className={styles.actions}>
      <Toggle on={flashcardIds.includes(w.id)} label="Flashcards" word={w.word} onClick={() => onFlashcard(w)} />
      <Toggle on={practiceIds.includes(w.id)} label="Practice" word={w.word} onClick={() => onPractice(w)} />
    </div>
  );

  return (
    <div className={kit.page} ref={root}>
      <div className={['container', kit.inner].join(' ')}>
        <header className={kit.header}>
          <div>
            <h1 className={kit.title}>
              <Words text="Explore words" />
            </h1>
            <p className={kit.sub} data-anim="fade">
              Find new words for your writing. Save the ones you like to your flashcards or to Practice.
            </p>
          </div>
          <div className={styles.headActions} data-anim="fade">
            <Button variant="secondary" onClick={() => onNavigate('flashcards')}>
              Flashcards ({flashcardIds.length})
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('practice')}>
              Practice ({practiceIds.length})
            </Button>
          </div>
        </header>

        {/* ── Word of the day ── */}
        <section className={styles.featured} aria-labelledby="wotd-heading" data-anim="rise">
          <h2 id="wotd-heading" className={styles.featuredLabel}>Word of the day</h2>
          <p className={styles.featuredWord}>{wotd.word}</p>
          <p className={styles.featuredMeta}>
            <span className={kit.tag}>{wotd.pos}</span> <span className={kit.tag}>{wotd.level}</span>{' '}
            <span className={kit.tag}>{wotd.topic}</span>
          </p>
          <p className={styles.featuredDef}>{wotd.definition}</p>
          <p className={styles.example}>“{wotd.example}”</p>
          {actions(wotd)}
        </section>

        {/* ── Search and topics ── */}
        <div className={styles.filters} data-anim="rise">
          <div className={styles.search}>
            <label htmlFor="explore-search" className={styles.searchLabel}>Search words</label>
            <div className={styles.control}>
              <input
                id="explore-search"
                className={styles.input}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “polite” or “vivid”"
                autoComplete="off"
              />
              <span className={styles.line} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.chips} role="group" aria-label="Topic">
            {['All', ...TOPICS].map((t) => (
              <button
                key={t}
                type="button"
                className={[styles.chip, topic === t ? styles.chipOn : ''].join(' ')}
                aria-pressed={topic === t}
                onClick={() => setTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <p className={styles.count} role="status">
          {list.length} {list.length === 1 ? 'word' : 'words'}
        </p>

        {list.length === 0 ? (
          <p className={styles.empty}>No words match that search. Try another word or topic.</p>
        ) : (
          <ul className={styles.grid} aria-label="Words">
            {list.map((w, i) => (
              <li key={w.id} className={styles.card} style={{ '--i': Math.min(i, 12) }}>
                <div className={styles.cardTop}>
                  <h3 className={styles.word}>{w.word}</h3>
                  <span className={kit.tag}>{w.level}</span>
                </div>
                <p className={styles.pos}>{w.pos} · {w.topic}</p>
                <p className={styles.def}>{w.definition}</p>
                <p className={styles.example}>“{w.example}”</p>
                {actions(w)}
              </li>
            ))}
          </ul>
        )}

        {/* announces saves for screen readers and sighted users */}
        <div className={styles.toast} role="status" aria-live="polite">{status}</div>
      </div>
    </div>
  );
}