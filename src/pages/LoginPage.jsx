import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import Button from '../components/Button';
import HeroScene from '../components/HeroScene';
import styles from './LoginPage.module.css';

const MOTION_OK = '(prefers-reduced-motion: no-preference)';

const TIPS = [
  'Write a little every day. Ten minutes is enough.',
  'Read your sentence out loud. Your ear catches what your eyes miss.',
  'Every mistake shows you what to practise next.',
];

function validate(fields) {
  const errors = {};
  if (!fields.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!fields.password) errors.password = 'Password is required.';
  return errors;
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

/** Underline-style field with an animated focus line and a sliding error message. */
function Field({ id, label, type = 'text', value, onChange, error, placeholder, autoComplete, inputRef, trailing }) {
  const errorId = `${id}-error`;
  return (
    <div className={[styles.field, error ? styles.fieldError : ''].join(' ')} data-anim="field">
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.control}>
        <input
          id={id}
          ref={inputRef}
          className={styles.input}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-required="true"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {trailing}
        <span className={styles.line} aria-hidden="true" />
      </div>
      <div className={[styles.errorWrap, error ? styles.errorOpen : ''].join(' ')}>
        <div className={styles.errorInner}>
          {error && (
            <p id={errorId} className={styles.errorText} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ onNavigate, onAuthSuccess }) {
  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [tipsPaused, setTipsPaused] = useState(false);

  const root = useRef(null);
  const stageRef = useRef(null);
  const formRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const tipRef = useRef(null);
  const timer = useRef(0);
  const firstTip = useRef(true);

  const set = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((current) => (current[key] ? { ...current, [key]: '' } : current));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(fields);
    setErrors(errs);
    const keys = Object.keys(errs);
    if (keys.length > 0) {
      setShake((t) => t + 1);
      (keys[0] === 'email' ? emailRef : passwordRef).current?.focus();
      return;
    }
    setSubmitted(true);
    timer.current = window.setTimeout(() => onAuthSuccess('Alex'), 1800);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* ── page intro: the dark stage wipes in, then everything rises ── */
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const cleanups = [];

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="stage"]', { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power4.inOut' })
        .from('[data-anim="word"]', { yPercent: 115, duration: 0.9, stagger: 0.08 }, 0.5)
        .from('[data-anim="scene"]', { opacity: 0, y: 60, scale: 0.9, duration: 1.2 }, 0.6)
        .from('[data-anim="tip"]', { opacity: 0, y: 16, duration: 0.7 }, 1.1)
        .from('[data-anim="fade"]', { opacity: 0, y: 24, duration: 0.7, stagger: 0.09 }, 0.55)
        .from('[data-anim="field"]', { opacity: 0, y: 28, duration: 0.7, stagger: 0.1 }, 0.8)
        .from('[data-anim="button"]', { opacity: 0, y: 28, scale: 0.96, duration: 0.7 }, 1.0);

      /* a soft light follows the cursor across the dark stage */
      const stage = stageRef.current;
      const glow = stage?.querySelector('[data-anim="glow"]');
      const fine = window.matchMedia('(pointer: fine)').matches;
      if (stage && glow) {
        const r0 = stage.getBoundingClientRect();
        gsap.set(glow, { x: r0.width * 0.6, y: r0.height * 0.4, opacity: 0.3 });
        if (fine) {
          const gx = gsap.quickTo(glow, 'x', { duration: 1.1, ease: 'power3' });
          const gy = gsap.quickTo(glow, 'y', { duration: 1.1, ease: 'power3' });
          const follow = (e) => {
            const r = stage.getBoundingClientRect();
            gx(e.clientX - r.left);
            gy(e.clientY - r.top);
          };
          stage.addEventListener('pointermove', follow);
          cleanups.push(() => stage.removeEventListener('pointermove', follow));
        }
      }

      /* the main button leans toward the cursor */
      if (fine) {
        root.current.querySelectorAll('[data-magnet]').forEach((el) => {
          const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
          const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
          const move = (e) => {
            const r = el.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            if (Math.hypot(dx, dy) < 140) {
              xTo(dx * 0.25);
              yTo(dy * 0.25);
            } else {
              xTo(0);
              yTo(0);
            }
          };
          window.addEventListener('pointermove', move, { passive: true });
          cleanups.push(() => window.removeEventListener('pointermove', move));
        });
      }

      return () => cleanups.forEach((fn) => fn());
    }, root);
    return () => mm.revert();
  }, []);

  /* ── tips on the stage change every few seconds (paused on hover, off with reduced motion) ── */
  useEffect(() => {
    if (tipsPaused || !window.matchMedia(MOTION_OK).matches) return undefined;
    const id = window.setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 4500);
    return () => window.clearInterval(id);
  }, [tipsPaused]);

  useEffect(() => {
    if (firstTip.current) {
      firstTip.current = false;
      return;
    }
    if (!tipRef.current || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(tipRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
  }, [tipIdx]);

  /* ── the form shakes when something is wrong ── */
  useEffect(() => {
    if (!shake || !formRef.current || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(formRef.current, { x: -12 }, { x: 0, duration: 0.8, ease: 'elastic.out(1, 0.25)', clearProps: 'transform' });
  }, [shake]);

  /* ── success: check draws itself, confetti bursts, loading bar fills ── */
  useLayoutEffect(() => {
    if (!submitted) return undefined;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="check"]', { scale: 0.5, opacity: 0, duration: 0.6, ease: 'back.out(2)' })
        .fromTo('[data-anim="check-circle"]', { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 0.05)
        .fromTo('[data-anim="check-path"]', { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, 0.6)
        .from('[data-anim="success-text"]', { opacity: 0, y: 18, duration: 0.6, stagger: 0.1 }, 0.7)
        .fromTo('[data-anim="load"]', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'none' }, 0.6);

      gsap.utils.toArray('[data-anim="particle"]', root.current).forEach((p) => {
        const angle = gsap.utils.random(0, Math.PI * 2);
        const dist = gsap.utils.random(70, 150);
        gsap.fromTo(
          p,
          { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0 },
          {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            rotation: gsap.utils.random(-180, 180),
            opacity: 0,
            scale: 0.2,
            duration: gsap.utils.random(0.9, 1.4),
            delay: 0.6,
            ease: 'power3.out',
          }
        );
      });
    }, root);
    return () => mm.revert();
  }, [submitted]);

  return (
    <div className={styles.page} ref={root}>
      {/* ── Dark stage with the 3D pages (decorative) ── */}
      <aside className={styles.stage} ref={stageRef} data-anim="stage" aria-hidden="true">
        <div className={styles.aurora}>
          <span className={[styles.blob, styles.blobA].join(' ')} />
          <span className={[styles.blob, styles.blobB].join(' ')} />
          <span className={styles.glow} data-anim="glow" />
        </div>

        <p className={styles.stageTitle}>
          <Words text="Good to see you again." />
        </p>

        <div className={styles.sceneWrap} data-anim="scene">
          <HeroScene />
        </div>

        <div
          className={styles.tips}
          data-anim="tip"
          onMouseEnter={() => setTipsPaused(true)}
          onMouseLeave={() => setTipsPaused(false)}
        >
          <p className={styles.tipText} ref={tipRef} key={tipIdx}>{TIPS[tipIdx]}</p>
          <span className={styles.tipDots}>
            {TIPS.map((_, i) => (
              <span key={i} className={[styles.tipDot, i === tipIdx ? styles.tipDotOn : ''].join(' ')} />
            ))}
          </span>
        </div>
      </aside>

      {/* ── Form side ── */}
      <main className={styles.panel}>
        <div className={styles.panelInner}>
          {submitted ? (
            <div className={styles.success} role="status" aria-live="polite">
              <div className={styles.burst} aria-hidden="true">
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i} className={styles.particle} data-anim="particle" />
                ))}
              </div>
              <svg className={styles.check} viewBox="0 0 52 52" aria-hidden="true" data-anim="check">
                <circle cx="26" cy="26" r="23" pathLength="100" className={styles.checkCircle} data-anim="check-circle" />
                <path d="M15 27 l8 8 l15 -17" pathLength="100" className={styles.checkPath} data-anim="check-path" />
              </svg>
              <p className={styles.prototypeNoteCenter} data-anim="success-text">
                Prototype only: no credentials were checked and no session was saved.
              </p>
              <h2 className={styles.successTitle} data-anim="success-text">Demo sign-in complete</h2>
              <p className={styles.successSub} data-anim="success-text">Taking you to your dashboard…</p>
              <div className={styles.loadBar} aria-hidden="true">
                <span className={styles.loadFill} data-anim="load" />
              </div>
            </div>
          ) : (
            <>
              <h1 className={styles.title} data-anim="fade">Log in to Writewise</h1>
              <p className={styles.sub} data-anim="fade">Good to see you again.</p>
              <p className={styles.note} data-anim="fade">
                This demo accepts any valid-format email and a password. Nothing is verified or saved.
              </p>

              <form onSubmit={handleSubmit} noValidate className={styles.form} ref={formRef}>
                <Field
                  id="login-email"
                  label="Email address"
                  type="email"
                  value={fields.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  error={errors.email}
                  autoComplete="email"
                  inputRef={emailRef}
                />
                <Field
                  id="login-password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={fields.password}
                  onChange={set('password')}
                  placeholder="Your password"
                  error={errors.password}
                  autoComplete="current-password"
                  inputRef={passwordRef}
                  trailing={
                    <button
                      type="button"
                      className={styles.toggle}
                      aria-label="Show password"
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <span key={String(showPassword)} className={styles.toggleText}>
                        {showPassword ? 'Hide' : 'Show'}
                      </span>
                    </button>
                  }
                />
                <span className={styles.submitWrap} data-magnet data-anim="button">
                  <Button type="submit" fullWidth size="lg">
                    Log in
                  </Button>
                </span>
              </form>

              <p className={styles.switchLink} data-anim="fade">
                Don&apos;t have an account?{' '}
                <button type="button" className={styles.linkBtn} onClick={() => onNavigate('signup')}>
                  Sign up for free
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}