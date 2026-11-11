import React, { useState, useRef, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import styles from './PracticePage.module.css';

// Prototype data. In the real app these come from the mistakes found in the
// person's own writing. You can move this list into ../data/mockData.
const PRACTICE_WORDS = [
  { id: 'w1', word: 'definitely', mistake: 'definately', meaning: 'without any doubt', sentence: 'I will ____ finish my draft today.' },
  { id: 'w2', word: 'receive', mistake: 'recieve', meaning: 'to get something that is sent or given', sentence: 'I hope to ____ your feedback soon.' },
  { id: 'w3', word: 'separate', mistake: 'seperate', meaning: 'apart, not joined together', sentence: 'Keep each idea in a ____ paragraph.' },
  { id: 'w4', word: 'necessary', mistake: 'neccessary', meaning: 'needed; you cannot do without it', sentence: 'It is ____ to read your work aloud.' },
  { id: 'w5', word: 'occasion', mistake: 'ocassion', meaning: 'a particular time or event', sentence: 'Write a thank-you note for every ____.' },
  { id: 'w6', word: 'accommodate', mistake: 'accomodate', meaning: 'to make room for; to fit in', sentence: 'The new schedule can ____ more writing time.' },
];

export default function PracticePage({ onNavigate }) {
  const [mode, setMode] = useState('overview'); // 'overview' | 'practicing' | 'done'
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'
  const [score, setScore] = useState(0);
  const inputRef = useRef(null);
  const doneRef = useRef(null);

  const total = PRACTICE_WORDS.length;
  const current = PRACTICE_WORDS[index];

  // Focus the answer box for each new word
  useEffect(() => {
    if (mode === 'practicing' && result === null) inputRef.current?.focus();
  }, [mode, index, result]);

  // Move focus to the summary when the round ends
  useEffect(() => {
    if (mode === 'done') doneRef.current?.focus();
  }, [mode]);

  const startPractice = () => {
    setIndex(0);
    setAnswer('');
    setResult(null);
    setScore(0);
    setMode('practicing');
  };

  const handleCheck = (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    const correct = answer.trim().toLowerCase() === current.word;
    setResult(correct ? 'correct' : 'wrong');
    if (correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setMode('done');
      return;
    }
    setIndex((i) => i + 1);
    setAnswer('');
    setResult(null);
  };

  const [before, after] = current.sentence.split('____');

  return (
    <div className={styles.page}>
      <div className={['container', styles.inner].join(' ')}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Practice</h1>
          <p className={styles.pageSub}>
            A few minutes on the words you usually get wrong makes your writing easier to trust.
          </p>
        </div>

        <Card className={styles.card}>
          {/* ── Overview: the words + start button ── */}
          {mode === 'overview' && (
            <>
              <h2 className={styles.cardTitle}>Words you often write incorrectly</h2>
              <p className={styles.cardText}>
                Practice these {total} words to improve your writing.
              </p>

              <ul className={styles.wordList} aria-label="Words to practice">
                {PRACTICE_WORDS.map((w) => (
                  <li key={w.id} className={styles.wordItem}>
                    <span className={styles.wordCorrect}>{w.word}</span>
                    <span className={styles.wordMistake}>
                      You often write: <s>{w.mistake}</s>
                    </span>
                  </li>
                ))}
              </ul>

              <Button size="lg" fullWidth onClick={startPractice}>
                Start practice
              </Button>
            </>
          )}

          {/* ── Practicing: one word at a time ── */}
          {mode === 'practicing' && (
            <form onSubmit={handleCheck} noValidate>
              <p className={styles.progress}>
                Word {index + 1} of {total}
              </p>

              <p className={styles.sentence}>
                {before}
                <span className={styles.blank}>
                  {result ? current.word : <span className="sr-only">blank</span>}
                </span>
                {after}
              </p>
              <p className={styles.meaning}>Meaning: {current.meaning}</p>

              <label htmlFor="practice-answer" className={styles.inputLabel}>
                Type the missing word
              </label>
              <input
                id="practice-answer"
                ref={inputRef}
                className={styles.input}
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={result !== null}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />

              <div role="status" className={styles.feedback}>
                {result === 'correct' && (
                  <p className={styles.correct}>Correct! Nice spelling.</p>
                )}
                {result === 'wrong' && (
                  <p className={styles.wrong}>
                    Not quite. The correct spelling is <strong>{current.word}</strong>.
                  </p>
                )}
              </div>

              <div className={styles.actions}>
                {result === null ? (
                  <Button type="submit" size="lg" disabled={!answer.trim()}>
                    Check
                  </Button>
                ) : (
                  <Button type="button" size="lg" onClick={handleNext} autoFocus>
                    {index + 1 >= total ? 'See my result' : 'Next word'}
                  </Button>
                )}
                <Button type="button" variant="ghost" onClick={() => setMode('overview')}>
                  Stop practice
                </Button>
              </div>
            </form>
          )}

          {/* ── Done ── */}
          {mode === 'done' && (
            <div>
              <h2 className={styles.cardTitle} ref={doneRef} tabIndex={-1}>
                Practice complete
              </h2>
              <p className={styles.score}>
                {score} of {total} correct
              </p>
              <p className={styles.cardText}>
                {score === total
                  ? 'Every word right. Try using them in your next piece of writing.'
                  : 'Good effort. Repeating the tricky ones is how they stick.'}
              </p>
              <div className={styles.actions}>
                <Button size="lg" onClick={startPractice}>
                  Practice again
                </Button>
                <Button variant="secondary" size="lg" onClick={() => onNavigate('workspace')}>
                  Write something
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
