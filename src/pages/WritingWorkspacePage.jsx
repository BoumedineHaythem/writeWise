import React, { useState, useRef, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import SlashEditor, {
  createInitialBlocks,
  blocksToPlainText,
} from '../components/SlashEditor';
import { mockWritingPrompts, mockSampleFeedback } from '../data/mockData';
import styles from './WritingWorkspacePage.module.css';

function countWords(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export default function WritingWorkspacePage({ onNavigate }) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [blocks, setBlocks] = useState(createInitialBlocks);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const feedbackRef = useRef(null);

  const prompt = mockWritingPrompts[promptIndex];
  const text = blocksToPlainText(blocks);
  const wordCount = countWords(text);
  const MIN_WORDS = 20;

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
    setSubmitted(true);
  };

  const handleNewSession = () => {
    setBlocks(createInitialBlocks());
    setSubmitted(false);
    setError('');
    setPromptIndex((i) => (i + 1) % mockWritingPrompts.length);
  };

  const handleEditorChange = (next) => {
    setBlocks(next);
    setError('');
  };

  return (
    <div className={styles.page}>
      <div className={['container', styles.inner].join(' ')}>

        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Writing workspace</h1>
            <p className={styles.pageSub}>
              Take your time. Write freely — there&apos;s no perfect first draft.
            </p>
            <p className={styles.prototypeNote}>
              Write at least {MIN_WORDS} words to continue. Review shows preset sample feedback and does not analyze your writing.
            </p>
          </div>
          {submitted && (
            <Button variant="secondary" onClick={handleNewSession}>
              New session
            </Button>
          )}
        </div>

        <div className={styles.layout}>
          {/* ── Writing area ── */}
          <div className={styles.editorCol}>
            {/* Prompt */}
            <Card variant="accent" className={styles.promptCard}>
              <p className={styles.promptLabel} aria-label="Writing prompt">
                <span aria-hidden="true">✍️ </span>Today&apos;s prompt
              </p>
              <p className={styles.promptText}>{prompt}</p>
              {!submitted && (
                <button
                  className={styles.changePrompt}
                  onClick={() => setPromptIndex((i) => (i + 1) % mockWritingPrompts.length)}
                  aria-label="Try a different writing prompt"
                >
                  Try a different prompt →
                </button>
              )}
            </Card>

            {/* Editor */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className={styles.editorForm}>
                <SlashEditor
                  id="writing-area"
                  label="Your writing"
                  value={blocks}
                  onChange={handleEditorChange}
                  placeholder="Start writing here… There's no wrong answer."
                  error={error}
                />
                <div className={styles.editorFooter}>
                  <div
                    id="word-count-status"
                    className={[
                      styles.wordCount,
                      wordCount >= MIN_WORDS ? styles.wordCountOk : '',
                    ].join(' ')}
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={`Word count: ${wordCount} ${wordCount === 1 ? 'word' : 'words'}`}
                  >
                    <span aria-hidden="true">
                      {wordCount} {wordCount === 1 ? 'word' : 'words'}
                      {wordCount > 0 && wordCount < MIN_WORDS && (
                        <span className={styles.wordCountHint}>
                          {' '}({MIN_WORDS - wordCount} more to unlock review)
                        </span>
                      )}
                    </span>
                    {/* Screen-reader-only text that updates on change */}
                    <span className="sr-only">
                      {wordCount} {wordCount === 1 ? 'word' : 'words'} written.
                      {wordCount < MIN_WORDS
                        ? ` Write ${MIN_WORDS - wordCount} more to unlock review.`
                        : ' You can submit for review.'}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    disabled={wordCount < MIN_WORDS}
                    size="lg"
                    aria-describedby={wordCount < MIN_WORDS ? 'word-count-status' : undefined}
                  >
                    Review my writing
                  </Button>
                </div>
              </form>
            ) : (
              /* Submitted — show what they wrote (read-only, keeps formatting) */
              <div className={styles.submittedText}>
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
                <p className={styles.feedbackOverall}>{mockSampleFeedback.overallComment}</p>

                <ul className={styles.observationList} aria-label="Feedback observations">
                  {mockSampleFeedback.observations.map((obs) => (
                    <li key={obs.id} className={styles.observation}>
                      <div className={styles.obsHeader}>
                        <span aria-hidden="true">{obs.icon}</span>
                        <strong>{obs.category}</strong>
                      </div>
                      <p className={styles.obsText}>{obs.text}</p>
                    </li>
                  ))}
                </ul>

                <div className={styles.nextStep}>
                  <p className={styles.nextStepLabel}>
                    <span aria-hidden="true">🌱 </span>Suggested next step
                  </p>
                  <p>{mockSampleFeedback.nextStep}</p>
                </div>

                <div className={styles.feedbackActions}>
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