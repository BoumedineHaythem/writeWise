import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import Button from '../components/Button';
import Card from '../components/Card';
import SlashEditor, {
  createInitialBlocks,
  blocksToPlainText,
} from '../components/SlashEditor';
import { mockWritingPrompts, mockSampleFeedback } from '../data/mockData';
import styles from './WritingWorkspacePage.module.css';

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const MIN_WORDS = 20;

function countWords(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

/** Splits a heading into masked words so GSAP can slide them up one by one. */
function Words({ text }) {
  return text.split(' ').map((word, i, all) => (
    <React.Fragment key={i}>
      <span className={styles.wordMask}>
        <span className={styles.word} data-anim="word">{word}</span>
      </span>
      {i < all.length - 1 ? ' ' : null}
    </React.Fragment>
  ));
}

export default function WritingWorkspacePage({ onNavigate }) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [blocks, setBlocks] = useState(createInitialBlocks);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [focusMode, setFocusMode] = useState(false);

  const root = useRef(null);
  const feedbackRef = useRef(null);
  const promptRef = useRef(null);
  const reviewRef = useRef(null);
  const firstPrompt = useRef(true);
  const wasUnlocked = useRef(false);

  const prompt = mockWritingPrompts[promptIndex];
  const text = blocksToPlainText(blocks);
  const wordCount = countWords(text);
  const unlocked = wordCount >= MIN_WORDS;
  const progress = Math.min(100, Math.round((wordCount / MIN_WORDS) * 100));
  const focusing = focusMode && !submitted;

  /* ── page intro ── */
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="word"]', { yPercent: 115, duration: 0.9, stagger: 0.08 })
        .from('[data-anim="fade"]', { opacity: 0, y: 20, duration: 0.7, stagger: 0.1 }, 0.35)
        .from('[data-anim="rise"]', { opacity: 0, y: 40, duration: 0.9, stagger: 0.15, clearProps: 'opacity,transform' }, 0.5);
    }, root);
    return () => mm.revert();
  }, []);

  /* ── feedback arrives with motion ── */
  useLayoutEffect(() => {
    if (!submitted) return undefined;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from('[data-anim="submitted"]', { opacity: 0, y: 24, duration: 0.7, ease: 'power3.out' });
      gsap.from('[data-anim="feedback"]', { opacity: 0, x: 60, duration: 0.9, ease: 'power3.out' });
      gsap.from('[data-anim="fb-item"]', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.09,
        delay: 0.3,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      });
    }, root);
    return () => mm.revert();
  }, [submitted]);

  /* ── prompt text swaps with a little motion ── */
  useEffect(() => {
    if (firstPrompt.current) {
      firstPrompt.current = false;
      return;
    }
    if (!promptRef.current || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(promptRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
  }, [promptIndex]);

  /* ── the review button pops when it unlocks ── */
  useEffect(() => {
    if (unlocked && !wasUnlocked.current && reviewRef.current && window.matchMedia(MOTION_OK).matches) {
      gsap.fromTo(reviewRef.current, { scale: 1 }, { scale: 1.08, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
    wasUnlocked.current = unlocked;
  }, [unlocked]);

  /* ── Esc leaves focus mode (unless the slash menu already used it) ── */
  useEffect(() => {
    if (!focusMode) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented) setFocusMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode]);

  // Scroll feedback into view on mobile after submission
  useEffect(() => {
    if (submitted && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      feedbackRef.current.focus({ preventScroll: true });
    }
  }, [submitted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (wordCount < MIN_WORDS) {
      setError(`Please write at least ${MIN_WORDS} words before reviewing. You have ${wordCount} so far.`);
      return;
    }
    setError('');
    setFocusMode(false);
    setSubmitted(true);
  };

  const handleNewSession = () => {
    setBlocks(createInitialBlocks());
    setSubmitted(false);
    setError('');
    setFocusMode(false);
    setPromptIndex((i) => (i + 1) % mockWritingPrompts.length);
  };

  const handleEditorChange = (next) => {
    setBlocks(next);
    setError('');
  };

  return (
    <div className={[styles.page, focusing ? styles.pageFocus : ''].filter(Boolean).join(' ')} ref={root}>
      <div className={['container', styles.inner].join(' ')}>

        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>
              <Words text="Writing workspace" />
            </h1>
            <p className={styles.pageSub} data-anim="fade">
              Take your time. Write freely, there&apos;s no perfect first draft.
            </p>
            <p className={styles.prototypeNote} data-anim="fade">
              Write at least {MIN_WORDS} words to continue. Review shows preset sample feedback and does not analyze your writing.
            </p>
          </div>
          {submitted && (
            <Button variant="secondary" onClick={handleNewSession}>
              New session
            </Button>
          )}
        </div>

        <div className={[styles.layout, submitted ? styles.layoutSplit : ''].join(' ')}>
          {/* ── Writing area ── */}
          <div className={styles.editorCol}>
            {/* Prompt */}
            <Card variant="accent" className={styles.promptCard} data-anim="rise">
              <p className={styles.promptLabel}>Today&apos;s prompt</p>
              <p className={styles.promptText} ref={promptRef}>{prompt}</p>
              {!submitted && (
                <button
                  type="button"
                  className={styles.changePrompt}
                  onClick={() => setPromptIndex((i) => (i + 1) % mockWritingPrompts.length)}
                  aria-label="Try a different writing prompt"
                >
                  Try a different prompt
                </button>
              )}
            </Card>

            {/* Editor */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className={styles.editorForm} data-anim="rise" noValidate>
                <div className={styles.editorTools}>
                  <button
                    type="button"
                    className={styles.focusBtn}
                    aria-pressed={focusMode}
                    onClick={() => setFocusMode((v) => !v)}
                  >
                    {focusMode ? 'Exit focus mode' : 'Focus mode'}
                  </button>
                </div>

                <SlashEditor
                  id="writing-area"
                  label="Your writing"
                  value={blocks}
                  onChange={handleEditorChange}
                  placeholder="Start writing here… There's no wrong answer."
                  error={error}
                  minHeight={focusing ? 'calc(100vh - 17rem)' : 'clamp(26rem, 58vh, 44rem)'}
                  fontSize={focusing ? '1.3rem' : '1.1rem'}
                />

                <div className={styles.editorFooter}>
                  <div className={styles.countBlock}>
                    <div
                      id="word-count-status"
                      className={[
                        styles.wordCount,
                        unlocked ? styles.wordCountOk : '',
                      ].join(' ')}
                      aria-live="polite"
                      aria-atomic="true"
                      aria-label={`Word count: ${wordCount} ${wordCount === 1 ? 'word' : 'words'}`}
                    >
                      <span aria-hidden="true">
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                        {wordCount > 0 && !unlocked && (
                          <span className={styles.wordCountHint}>
                            {' '}({MIN_WORDS - wordCount} more to unlock review)
                          </span>
                        )}
                      </span>
                      {/* Screen-reader-only text that updates on change */}
                      <span className="sr-only">
                        {wordCount} {wordCount === 1 ? 'word' : 'words'} written.
                        {!unlocked
                          ? ` Write ${MIN_WORDS - wordCount} more to unlock review.`
                          : ' You can submit for review.'}
                      </span>
                    </div>
                    <div className={styles.meter} aria-hidden="true">
                      <span
                        className={[styles.meterFill, unlocked ? styles.meterDone : ''].join(' ')}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <span className={styles.reviewWrap} ref={reviewRef}>
                    <Button
                      type="submit"
                      disabled={!unlocked}
                      size="lg"
                      aria-describedby={!unlocked ? 'word-count-status' : undefined}
                    >
                      Review my writing
                    </Button>
                  </span>
                </div>
              </form>
            ) : (
              /* Submitted: show what they wrote (read-only, keeps formatting) */
              <div className={styles.submittedText} data-anim="submitted">
                <p className={styles.submittedLabel}>
                  <strong>Your writing</strong> · {wordCount} words
                </p>
                <div className={styles.textDisplay}>
                  <SlashEditor readOnly value={blocks} />
                </div>
              </div>
            )}
          </div>

          {/* ── Feedback panel ── */}
          {submitted && (
            <aside
              className={styles.feedbackCol}
              aria-labelledby="feedback-heading"
              ref={feedbackRef}
              tabIndex={-1}
              data-anim="feedback"
            >
              {/* Prototype disclaimer */}
              <div className={styles.disclaimerBanner} role="note">
                <strong>Sample feedback only.</strong>
                <span> {mockSampleFeedback.disclaimer.replace('⚠️ ', '')}</span>
              </div>

              <Card className={styles.feedbackCard}>
                <h2 id="feedback-heading" className={styles.feedbackTitle}>
                  Your feedback
                </h2>
                <p className={styles.feedbackOverall} data-anim="fb-item">{mockSampleFeedback.overallComment}</p>

                <ul className={styles.observationList} aria-label="Feedback observations">
                  {mockSampleFeedback.observations.map((obs) => (
                    <li key={obs.id} className={styles.observation} data-anim="fb-item">
                      <div className={styles.obsHeader}>
                        <span className={styles.obsDot} aria-hidden="true" />
                        <strong>{obs.category}</strong>
                      </div>
                      <p className={styles.obsText}>{obs.text}</p>
                    </li>
                  ))}
                </ul>

                <div className={styles.nextStep} data-anim="fb-item">
                  <p className={styles.nextStepLabel}>Suggested next step</p>
                  <p>{mockSampleFeedback.nextStep}</p>
                </div>

                <div className={styles.feedbackActions} data-anim="fb-item">
                  <Button onClick={handleNewSession} fullWidth>
                    Start a new session
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => onNavigate('progress')}
                    fullWidth
                  >
                    View my progress
                  </Button>
                </div>
              </Card>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}