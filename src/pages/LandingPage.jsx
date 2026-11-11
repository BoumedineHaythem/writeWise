import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Button from '../components/Button';
import Card from '../components/Card';
import HeroScene from '../components/HeroScene';
import Tilt from '../components/Tilt';
import HowItWorks from '../components/HowItWorks';
import { mockBenefits } from '../data/mockData';
import styles from './LandingPage.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * Animations respect the visitor's "reduce motion" system setting.
 * Set this to true ONLY while testing, if your computer has animations turned off.
 */
const IGNORE_REDUCED_MOTION = false;
const MOTION_OK = IGNORE_REDUCED_MOTION ? '(min-width: 0px)' : '(prefers-reduced-motion: no-preference)';

const TICKER_WORDS = ['Write', 'Review', 'Practise', 'Repeat'];

/**
 * Script for the "writer" typo effect in the headline.
 * Each step: show `text` after waiting `wait` seconds; `wrong` draws the red squiggle.
 */
const TYPO_STEPS = (() => {
  const steps = [];
  const push = (text, wait, wrong) => steps.push({ text, wait, wrong });
  const type = (word, from, wait, wrong) => {
    for (let i = from; i <= word.length; i += 1) push(word.slice(0, i), wait, wrong);
  };
  const erase = (word, to, wait, wrong) => {
    for (let i = word.length - 1; i >= to; i -= 1) push(word.slice(0, i), wait, wrong);
  };
  type('ritaer', 1, 0.16, true);
  push('ritaer', 0.9, true);
  erase('ritaer', 1, 0.08, true);
  type('riter', 2, 0.15, true);
  push('riter', 0.8, true);
  erase('riter', 0, 0.07, true);
  push('', 0.25, false);
  type('writer', 1, 0.16, false);
  return steps;
})();

/** Splits a heading into masked words so GSAP can slide them up one by one. */
function Words({ text, anim }) {
  return text.split(' ').map((word, i, all) => (
    <React.Fragment key={i}>
      <span className={styles.wordMask}>
        <span className={styles.word} data-anim={anim}>{word}</span>
      </span>
      {i < all.length - 1 ? ' ' : null}
    </React.Fragment>
  ));
}

export default function LandingPage({ onNavigate }) {
  const root = useRef(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    const list = (sel) => gsap.utils.toArray(sel, root.current);
    const one = (sel) => root.current.querySelector(sel);

    /* ═════════ Everything that runs whenever motion is allowed ═════════ */
    mm.add(MOTION_OK, () => {
      const cleanups = [];

      /* 1. Hero intro */
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="rule"]', { scaleX: 0, duration: 1.1, ease: 'power3.inOut' })
        .from('[data-anim="meta"]', { opacity: 0, y: 8, duration: 0.6, stagger: 0.1 }, 0.25)
        .from('[data-anim="word"]', { yPercent: 115, duration: 1, stagger: 0.09 }, 0.3)
        .from('[data-anim="hero-fade"]', { opacity: 0, y: 24, duration: 0.8, stagger: 0.12 }, 0.95)
        .from('[data-anim="scene"]', { opacity: 0, y: 70, scale: 0.88, duration: 1.3, ease: 'power4.out' }, 0.45);

      /* 1b. "writer" is typed wrong, then fixed */
      const typo = one('[data-anim="typo"]');
      if (typo) {
        typo.textContent = '';
        typo.classList.add(styles.typoTyping);
        const typoTl = gsap.timeline({ delay: 2 });
        TYPO_STEPS.forEach((step) => {
          typoTl.call(
            () => {
              typo.textContent = step.text;
              typo.classList.toggle(styles.typoWrong, step.wrong);
            },
            null,
            `+=${step.wait}`
          );
        });
        typoTl
          .call(() => typo.classList.add(styles.typoDone), null, '+=0.3')
          .call(() => typo.classList.remove(styles.typoTyping), null, '+=1.4');
        cleanups.push(() => {
          typo.textContent = 'writer';
          typo.classList.remove(styles.typoTyping, styles.typoWrong, styles.typoDone);
        });
      }

      /* 2. Hero text drifts up slower than the page */
      gsap.to('[data-anim="hero-text"]', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: '[data-anim="hero"]', start: 'top top', end: 'bottom top', scrub: true },
      });

      /* 3. Glowing light follows the cursor in the hero */
      const hero = one('[data-anim="hero"]');
      const glow = one('[data-anim="glow"]');
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      if (hero && glow) {
        const r0 = hero.getBoundingClientRect();
        gsap.set(glow, { x: r0.width * 0.72, y: r0.height * 0.35, opacity: 0.16 });
        if (finePointer) {
          const gx = gsap.quickTo(glow, 'x', { duration: 1.1, ease: 'power3' });
          const gy = gsap.quickTo(glow, 'y', { duration: 1.1, ease: 'power3' });
          const follow = (e) => {
            const r = hero.getBoundingClientRect();
            gx(e.clientX - r.left);
            gy(e.clientY - r.top);
          };
          hero.addEventListener('pointermove', follow);
          cleanups.push(() => hero.removeEventListener('pointermove', follow));
        }
      }

      /* 4. Magnetic buttons: they lean toward the cursor */
      if (finePointer) {
        list('[data-magnet]').forEach((el) => {
          const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
          const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
          const move = (e) => {
            const r = el.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            if (Math.hypot(dx, dy) < 150) {
              xTo(dx * 0.3);
              yTo(dy * 0.3);
            } else {
              xTo(0);
              yTo(0);
            }
          };
          window.addEventListener('pointermove', move, { passive: true });
          cleanups.push(() => window.removeEventListener('pointermove', move));
        });
      }

      /* 5. Scroll progress bar at the top of the page */
      gsap.to('[data-anim="progress"]', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.2 },
      });

      /* 6. Ticker slides sideways and leans with scroll speed */
      const track = one('[data-anim="ticker"]');
      gsap.to(track, {
        xPercent: -35,
        ease: 'none',
        scrollTrigger: { trigger: '[data-anim="ticker-section"]', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
      if (track) {
        const setSkew = gsap.quickSetter(track, 'skewX', 'deg');
        const proxy = { skew: 0 };
        ScrollTrigger.create({
          onUpdate: (self) => {
            const skew = gsap.utils.clamp(-10, 10, self.getVelocity() / -150);
            if (Math.abs(skew) > Math.abs(proxy.skew)) {
              proxy.skew = skew;
              gsap.to(proxy, {
                skew: 0,
                duration: 0.8,
                ease: 'power3',
                overwrite: true,
                onUpdate: () => setSkew(proxy.skew),
              });
            }
          },
        });
      }

      /* 7. Section titles */
      list('[data-anim="title"]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 32,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });

      /* 8. Benefit cards rise in, staggered */
      const benefits = list('[data-anim="benefit"]');
      gsap.set(benefits, { opacity: 0, y: 48 });
      ScrollTrigger.batch(benefits, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power3.out',
            clearProps: 'transform',
          }),
      });

      /* 9. Closing call to action */
      const ctaTrigger = { trigger: '[data-anim="cta"]', start: 'top 70%', once: true };
      gsap.from('[data-anim="cta-word"]', {
        yPercent: 115,
        duration: 1,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: ctaTrigger,
      });
      gsap.from('[data-anim="cta-fade"]', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.12,
        delay: 0.35,
        ease: 'power3.out',
        scrollTrigger: ctaTrigger,
      });

      return () => cleanups.forEach((fn) => fn());
    }, root);

    // Fonts change text size, so re-measure scroll positions once they load.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => mm.revert();
  }, []);

  return (
    <div className={styles.page} ref={root}>
      <div className={styles.progress} data-anim="progress" aria-hidden="true" />

      {/* ── Hero ── */}
      <section className={styles.hero} aria-labelledby="hero-heading" data-anim="hero">
        <div className={styles.aurora} aria-hidden="true">
          <span className={[styles.blob, styles.blobA].join(' ')} />
          <span className={[styles.blob, styles.blobB].join(' ')} />
          <span className={styles.glow} data-anim="glow" />
        </div>

        <div className={['container', styles.heroContainer].join(' ')}>
          <div className={styles.metaWrap}>
            <p className={styles.meta}>
              <span data-anim="meta">Free prototype</span>
              <span data-anim="meta">Sign-up is simulated</span>
            </p>
            <span className={styles.metaRule} data-anim="rule" aria-hidden="true" />
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroText} data-anim="hero-text">
              <h1 id="hero-heading" className={styles.title}>
                <Words text="Become a more confident English" anim="word" />{' '}
                <span className={styles.wordMask}>
                  <span className={styles.word} data-anim="word">
                    <span className={styles.typoWrap}>
                      {/* Screen readers get the real word; the animated copy is hidden */}
                      <span className={styles.srOnly}>writer</span>
                      <span className={styles.typoSizer} aria-hidden="true">writer</span>
                      <span className={styles.typo} data-anim="typo" aria-hidden="true">writer</span>
                    </span>
                  </span>
                </span>
              </h1>
              <p className={styles.subtitle} data-anim="hero-fade">
                Writewise gives you a quiet space to practise, structured prompts to spark ideas,
                and sample feedback to illustrate ways to improve, one session at a time.
              </p>
              <div className={styles.heroCta} data-anim="hero-fade">
                <span className={styles.magnet} data-magnet>
                  <Button size="lg" onClick={() => onNavigate('signup')}>
                    Get started, it’s free
                  </Button>
                </span>
                <span className={styles.magnet} data-magnet>
                  <Button size="lg" variant="secondary" onClick={() => onNavigate('login')}>
                    Log in
                  </Button>
                </span>
              </div>
              <p className={styles.heroNote} data-anim="hero-fade">
                Practise writing and explore sample progress. No account is created.
              </p>
            </div>

            {/* 3D scene (decorative) */}
            <div className={styles.heroPreview} data-anim="scene">
              <HeroScene />
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker (decorative) ── */}
      <div className={styles.tickerSection} data-anim="ticker-section" aria-hidden="true">
        <div className={styles.tickerTrack} data-anim="ticker">
          {[0, 1].map((round) =>
            TICKER_WORDS.map((w, i) => (
              <span
                key={`${round}-${w}`}
                className={[styles.tickerWord, i % 2 === 1 ? styles.tickerOutline : ''].join(' ')}
              >
                {w}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── Benefits ── */}
      <section className={styles.benefits} aria-labelledby="benefits-heading">
        <div className="container">
          <div className={styles.sectionGrid}>
            <h2 id="benefits-heading" className={styles.sectionTitle} data-anim="title">
              Everything you need to build a writing habit
            </h2>
            <div className={styles.benefitsGrid}>
              {mockBenefits.map((b, i) => (
                <Tilt key={i}>
                  <Card variant="flat" className={styles.benefitCard} data-anim="benefit">
                    <h3 className={styles.benefitTitle}>{b.title}</h3>
                    <p className={styles.benefitBody}>{b.body}</p>
                  </Card>
                </Tilt>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works (interactive) ── */}
      <HowItWorks ignoreReducedMotion={IGNORE_REDUCED_MOTION} />

      {/* ── CTA ── */}
      <section className={styles.cta} aria-labelledby="cta-heading" data-anim="cta">
        <div className="container">
          <div className={styles.ctaGrid}>
            <div className={styles.ctaText}>
              <h2 id="cta-heading" className={styles.ctaTitle}>
                <Words text="Ready to start writing?" anim="cta-word" />
              </h2>
              <p className={styles.ctaBody} data-anim="cta-fade">
                Try the sign-up demo to open your sample learner dashboard.
              </p>
            </div>
            <div className={styles.ctaAction} data-anim="cta-fade">
              <span className={styles.magnet} data-magnet>
                <Button size="lg" onClick={() => onNavigate('signup')}>
                  Try the sign-up demo
                </Button>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}