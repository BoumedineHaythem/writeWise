import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './HowItWorks.module.css';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { title: 'Choose a prompt', body: 'Pick from a range of thoughtful writing prompts or start with a topic that matters to you.' },
  { title: 'Write freely', body: 'Use the distraction-free workspace to get your thoughts down. The word count updates as you go.' },
  { title: 'Review feedback', body: 'See observations on your grammar, vocabulary, and style, with friendly suggestions for next time.' },
  { title: 'Track your progress', body: 'Your practice history and focus-area growth are always there when you want to check in.' },
];
const LAST = STEPS.length - 1;

const PROMPTS = [
  { chip: 'A quiet place', text: 'Describe a place that makes you feel peaceful.' },
  { chip: 'A childhood memory', text: 'Write about a childhood memory you still love.' },
  { chip: 'Your morning', text: 'Describe your perfect morning, hour by hour.' },
];

// A few common mistakes the mini editor can catch
const TYPOS = {
  definately: 'definitely',
  recieve: 'receive',
  seperate: 'separate',
  occassion: 'occasion',
  ocassion: 'occasion',
  neccessary: 'necessary',
  accomodate: 'accommodate',
};

const FEEDBACK = [
  { title: 'Grammar', summary: 'Clear, correct sentences.', detail: 'Your sentences are complete and your verb tenses match. Keep it up.' },
  { title: 'Vocabulary', summary: 'Try “tranquil” instead of “quiet”.', detail: 'A more precise word makes the picture sharper. Other options: calm, still, serene.' },
  { title: 'Style', summary: 'Add one detail the reader can hear.', detail: 'Sounds make a place feel real. What can you hear: water, birds, wind?' },
];

const WEEK = [
  { day: 'Monday', short: 'M', min: 12 },
  { day: 'Tuesday', short: 'T', min: 20 },
  { day: 'Wednesday', short: 'W', min: 15 },
  { day: 'Thursday', short: 'T', min: 28 },
  { day: 'Friday', short: 'F', min: 18 },
  { day: 'Saturday', short: 'S', min: 34 },
  { day: 'Sunday', short: 'S', min: 22 },
];
const MAX_MIN = Math.max(...WEEK.map((d) => d.min));

const DEFAULT_DRAFT =
  'The lake is quiet in the morning. I definately want to go back, because the air feels clean and slow.';

/**
 * "How Writewise works": a stepper + live preview.
 *  - Click any step (or the Back / Next buttons) to jump to it.
 *  - On desktop the section pins while you scroll, and scrolling moves through the steps.
 *  - The preview is interactive: pick prompts, type (it catches typos), open feedback, hover the chart.
 */
export default function HowItWorks({ ignoreReducedMotion = false }) {
  const MOTION_OK = ignoreReducedMotion ? '(min-width: 0px)' : '(prefers-reduced-motion: no-preference)';

  const [active, setActive] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [openFb, setOpenFb] = useState(0);
  const [hoverDay, setHoverDay] = useState(null);

  const root = useRef(null);
  const panelRef = useRef(null);
  const promptRef = useRef(null);
  const slideRefs = useRef([]);
  const pinRef = useRef(null); // the ScrollTrigger that pins the section (desktop only)
  const activeRef = useRef(0);
  const prevActive = useRef(null);
  const lockRef = useRef(false);
  const lockTimer = useRef(0);
  const firstPrompt = useRef(true);

  /* ── derived values for the mini editor ── */
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const typo = (draft.match(/[A-Za-z']+/g) || []).find((w) => TYPOS[w.toLowerCase()]);

  const fixTypo = () => {
    if (!typo) return;
    const fixed = TYPOS[typo.toLowerCase()];
    setDraft((d) => d.replace(new RegExp(`\\b${typo}\\b`, 'g'), fixed));
  };

  /* ── go to a step: click, Back / Next, or the "Review" button ── */
  const goTo = (i) => {
    const next = Math.max(0, Math.min(LAST, i));
    activeRef.current = next;
    setActive(next);

    const st = pinRef.current;
    if (st) {
      // pinned: scroll to the matching spot (and ignore scroll updates until we arrive)
      lockRef.current = true;
      window.clearTimeout(lockTimer.current);
      const y = st.start + ((st.end - st.start) * next) / LAST;
      const smooth = window.matchMedia(MOTION_OK).matches;
      window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
      lockTimer.current = window.setTimeout(() => {
        lockRef.current = false;
      }, 1000);
    } else if (panelRef.current && window.innerWidth <= 860) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  /* ── scroll-driven pinning + entrance animations ── */
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    const el = root.current;

    // entrance, whenever motion is allowed
    mm.add(MOTION_OK, () => {
      const stepEls = el.querySelectorAll('[data-step]');
      gsap.from(el.querySelector('[data-title]'), {
        opacity: 0,
        y: 32,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      });
      gsap.from(stepEls, {
        opacity: 0,
        x: -28,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      });
      gsap.from(panelRef.current, {
        opacity: 0,
        y: 48,
        scale: 0.96,
        duration: 1,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger: el, start: 'top 75%', once: true },
      });
    });

    // desktop: pin the section; scroll position picks the active step
    mm.add(`${MOTION_OK} and (min-width: 861px)`, () => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 72px',
        end: () => `+=${Math.round(window.innerHeight * 2.2)}`,
        pin: true,
        snap: { snapTo: 1 / LAST, duration: { min: 0.2, max: 0.6 }, ease: 'power1.inOut' },
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (lockRef.current) return;
          const i = Math.min(LAST, Math.round(self.progress * LAST));
          if (i !== activeRef.current) {
            activeRef.current = i;
            setActive(i);
          }
        },
      });
      pinRef.current = st;
      return () => {
        pinRef.current = null;
      };
    });

    return () => {
      window.clearTimeout(lockTimer.current);
      mm.revert();
    };
  }, [MOTION_OK]);

  /* ── animate the preview whenever the step changes ── */
  useEffect(() => {
    const slides = slideRefs.current;
    // only the visible slide can be reached by keyboard / screen readers
    slides.forEach((s, i) => {
      if (!s) return;
      s.inert = i !== active;
      s.setAttribute('aria-hidden', i === active ? 'false' : 'true');
    });

    const prev = prevActive.current;
    prevActive.current = active;
    if (prev === null || prev === active) return;
    if (!window.matchMedia(MOTION_OK).matches) return; // CSS shows / hides it instantly

    const next = slides[active];
    const dir = active > prev ? 1 : -1;

    slides.forEach((s, i) => {
      if (s && i !== active) gsap.to(s, { autoAlpha: 0, y: -28 * dir, duration: 0.35, ease: 'power2.in', overwrite: true });
    });
    gsap.fromTo(next, { autoAlpha: 0, y: 36 * dir }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.2, ease: 'power3.out', overwrite: true });
    gsap.from(next.querySelectorAll('[data-stagger]'), {
      opacity: 0,
      y: 18,
      stagger: 0.08,
      duration: 0.5,
      delay: 0.35,
      ease: 'power3.out',
      clearProps: 'opacity,transform',
    });

    if (active === LAST) {
      gsap.fromTo(next.querySelectorAll('[data-bar]'), { scaleY: 0 }, { scaleY: 1, stagger: 0.05, duration: 0.7, delay: 0.4, ease: 'power3.out' });
      gsap.fromTo(next.querySelector('[data-goal]'), { scaleX: 0 }, { scaleX: 2 / 3, duration: 0.9, delay: 0.4, ease: 'power3.out' });
    }
  }, [active, MOTION_OK]);

  /* ── prompt text swaps with a little motion ── */
  useEffect(() => {
    if (firstPrompt.current) {
      firstPrompt.current = false;
      return;
    }
    if (!promptRef.current || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(promptRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
  }, [promptIdx, MOTION_OK]);

  const setSlide = (i) => (el) => {
    slideRefs.current[i] = el;
  };

  return (
    <section className={styles.section} aria-labelledby="how-heading" ref={root}>
      <div className="container">
        <div className={styles.grid}>
          {/* ── Steps ── */}
          <div className={styles.text}>
            <h2 id="how-heading" className={styles.title} data-title>
              How Writewise works
            </h2>
            <p className={styles.hint}>Click a step, or keep scrolling.</p>

            <ol className={styles.steps}>
              {STEPS.map((step, i) => {
                const on = i === active;
                const done = i < active;
                return (
                  <li key={step.title} className={styles.stepItem} data-step>
                    {i < LAST && (
                      <span className={[styles.conn, done ? styles.connDone : ''].join(' ')} aria-hidden="true">
                        <span className={styles.connFill} />
                      </span>
                    )}
                    <button
                      type="button"
                      className={[styles.stepBtn, on ? styles.stepOn : '', done ? styles.stepDone : ''].join(' ')}
                      aria-current={on ? 'step' : undefined}
                      onClick={() => goTo(i)}
                    >
                      <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
                      <span className={styles.stepTitle}>{step.title}</span>
                      <span className={styles.stepBody}>
                        <span className={styles.stepBodyInner}>{step.body}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ── Interactive preview ── */}
          <div className={styles.panel} ref={panelRef} role="region" aria-label="Interactive preview of the four steps">
            <div className={styles.panelBar}>
              <span className={styles.panelCount}>Step {active + 1} of {STEPS.length}</span>
              <span className={styles.panelNav}>
                <button type="button" className={styles.navBtn} onClick={() => goTo(active - 1)} disabled={active === 0}>
                  Back
                </button>
                <button type="button" className={styles.navBtn} onClick={() => goTo(active + 1)} disabled={active === LAST}>
                  Next
                </button>
              </span>
            </div>

            <div className={styles.stage}>
              {/* 1. Prompt */}
              <div className={styles.slide} ref={setSlide(0)} data-active={active === 0}>
                <p className={styles.label} data-stagger>Today’s prompt</p>
                <p className={styles.prompt} ref={promptRef} data-stagger>{PROMPTS[promptIdx].text}</p>
                <div className={styles.chips} role="group" aria-label="Choose a prompt" data-stagger>
                  {PROMPTS.map((p, i) => (
                    <button
                      key={p.chip}
                      type="button"
                      className={[styles.chip, i === promptIdx ? styles.chipOn : ''].join(' ')}
                      aria-pressed={i === promptIdx}
                      onClick={() => setPromptIdx(i)}
                    >
                      {p.chip}
                    </button>
                  ))}
                </div>
                <div className={styles.foot} data-stagger>
                  <button type="button" className={styles.ghost} onClick={() => setPromptIdx((n) => (n + 1) % PROMPTS.length)}>
                    Try a different prompt
                  </button>
                  <button type="button" className={styles.primary} onClick={() => goTo(1)}>
                    Start writing
                  </button>
                </div>
              </div>

              {/* 2. Write */}
              <div className={styles.slide} ref={setSlide(1)} data-active={active === 1}>
                <label htmlFor="how-draft" className={styles.label} data-stagger>Your writing</label>
                <textarea
                  id="how-draft"
                  className={styles.draft}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  spellCheck={false}
                  data-stagger
                />
                <div className={styles.typoRow} aria-live="polite" data-stagger>
                  {typo ? (
                    <>
                      <span className={styles.typoMsg}>
                        “<span className={styles.typoWord}>{typo}</span>” looks misspelled.
                      </span>
                      <button type="button" className={styles.fix} onClick={fixTypo}>
                        Fix it: {TYPOS[typo.toLowerCase()]}
                      </button>
                    </>
                  ) : (
                    <span className={styles.ok}>No spelling mistakes found.</span>
                  )}
                </div>
                <div className={styles.foot} data-stagger>
                  <span className={styles.count}>{words} {words === 1 ? 'word' : 'words'}</span>
                  <button type="button" className={styles.primary} onClick={() => goTo(2)}>
                    Review my writing
                  </button>
                </div>
              </div>

              {/* 3. Feedback */}
              <div className={styles.slide} ref={setSlide(2)} data-active={active === 2}>
                <p className={styles.label} data-stagger>Your feedback</p>
                <ul className={styles.fbList}>
                  {FEEDBACK.map((f, i) => {
                    const open = openFb === i;
                    return (
                      <li key={f.title} className={styles.fbItem} data-stagger>
                        <button
                          type="button"
                          className={styles.fbBtn}
                          aria-expanded={open}
                          aria-controls={`how-fb-${i}`}
                          onClick={() => setOpenFb(open ? -1 : i)}
                        >
                          <span className={styles.fbDot} aria-hidden="true" />
                          <span>
                            <strong className={styles.fbTitle}>{f.title}</strong>
                            <span className={styles.fbSummary}>{f.summary}</span>
                          </span>
                          <span className={[styles.fbChev, open ? styles.fbChevOpen : ''].join(' ')} aria-hidden="true" />
                        </button>
                        <div id={`how-fb-${i}`} className={[styles.fbDetail, open ? styles.fbDetailOpen : ''].join(' ')}>
                          <p className={styles.fbDetailInner}>{f.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 4. Progress */}
              <div className={styles.slide} ref={setSlide(3)} data-active={active === 3}>
                <p className={styles.label} data-stagger>This week</p>
                <p className={styles.prompt} data-stagger>2 of 3 sessions done</p>
                <div className={styles.goal} data-stagger>
                  <span className={styles.goalFill} data-goal />
                </div>
                <p className={styles.readout} aria-live="polite" data-stagger>
                  {hoverDay !== null
                    ? `${WEEK[hoverDay].day}: ${WEEK[hoverDay].min} minutes writing`
                    : 'Hover or focus a bar for details'}
                </p>
                <div className={styles.chart} role="group" aria-label="Minutes written each day">
                  {WEEK.map((d, i) => (
                    <div key={d.day} className={styles.col}>
                      <button
                        type="button"
                        className={[styles.bar, hoverDay === i ? styles.barOn : ''].join(' ')}
                        style={{ height: `${(d.min / MAX_MIN) * 100}%` }}
                        aria-label={`${d.day}, ${d.min} minutes`}
                        data-bar
                        onMouseEnter={() => setHoverDay(i)}
                        onMouseLeave={() => setHoverDay(null)}
                        onFocus={() => setHoverDay(i)}
                        onBlur={() => setHoverDay(null)}
                      />
                    </div>
                  ))}
                </div>
                <div className={styles.days} aria-hidden="true">
                  {WEEK.map((d) => (
                    <span key={d.day}>{d.short}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}