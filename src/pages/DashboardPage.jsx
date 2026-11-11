import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import Tilt from '../components/Tilt';
import { mockUser, mockFocusAreas, mockRecentActivity } from '../data/mockData';
import styles from './DashboardPage.module.css';

gsap.registerPlugin(ScrollTrigger);

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

export default function DashboardPage({ onNavigate, userName }) {
  const root = useRef(null);
  const name = userName || mockUser.name;
  const { weeklyGoal, sessionsThisWeek } = mockUser;
  const goalPercent = Math.round((sessionsThisWeek / weeklyGoal) * 100);
  const ringPercent = Math.min(100, goalPercent);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    // Everything below is skipped when the visitor has asked for reduced motion.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cleanups = [];
      const all = (sel) => gsap.utils.toArray(sel, root.current);

      /* 1. Welcome header */
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="word"]', { yPercent: 115, duration: 0.9, stagger: 0.07 })
        .from('[data-anim="fade"]', { opacity: 0, y: 20, duration: 0.7, stagger: 0.1 }, 0.35);

      /* 2. Weekly goal: card rises, ring draws, numbers count up */
      const goalTrigger = { trigger: '[data-anim="goal"]', start: 'top 88%', once: true };
      gsap.from('[data-anim="goal"]', { opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', scrollTrigger: goalTrigger });
      gsap.fromTo(
        '[data-anim="ring"]',
        { strokeDashoffset: 100 },
        { strokeDashoffset: 100 - ringPercent, duration: 1.5, delay: 0.25, ease: 'power3.out', scrollTrigger: goalTrigger }
      );
      all('[data-count]').forEach((el) => {
        const to = Number(el.dataset.count);
        const counter = { v: 0 };
        el.textContent = '0';
        gsap.to(counter, {
          v: to,
          duration: 1.4,
          delay: 0.25,
          ease: 'power2.out',
          scrollTrigger: goalTrigger,
          onUpdate: () => {
            el.textContent = String(Math.round(counter.v));
          },
        });
        cleanups.push(() => {
          el.textContent = String(to);
        });
      });

      /* 3. Focus cards and activity rows rise in as you scroll */
      const rise = (items, vars) => {
        if (!items.length) return;
        gsap.set(items, { opacity: 0, ...vars });
        ScrollTrigger.batch(items, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              x: 0,
              y: 0,
              duration: 0.85,
              stagger: 0.1,
              ease: 'power3.out',
              clearProps: 'transform',
            }),
        });
      };
      rise(all('[data-anim="focus"]'), { y: 48 });
      rise(all('[data-anim="activity"]'), { x: 36 });

      /* 4. Closing card */
      gsap.from('[data-anim="start"]', {
        opacity: 0,
        y: 40,
        scale: 0.97,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-anim="start"]', start: 'top 90%', once: true },
      });

      /* 5. Magnetic buttons */
      if (window.matchMedia('(pointer: fine)').matches) {
        all('[data-magnet]').forEach((el) => {
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

      return () => cleanups.forEach((fn) => fn());
    }, root);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, [goalPercent, ringPercent]);

  return (
    <div className={styles.page} ref={root}>
      <div className={['container', styles.inner].join(' ')}>

        {/* ── Welcome ── */}
        <section className={styles.welcome} aria-labelledby="welcome-heading">
          <div className={styles.welcomeText}>
            <h1 id="welcome-heading" className={styles.title}>
              <Words text={`Welcome back, ${name}`} />
            </h1>
            <p className={styles.welcomeSub} data-anim="fade">
              You&apos;re doing great. Keep building your writing habit.
            </p>
          </div>
          <div className={styles.welcomeAction} data-anim="fade">
            <span className={styles.magnet} data-magnet>
              <Button size="lg" onClick={() => onNavigate('workspace')}>
                Continue writing
              </Button>
            </span>
          </div>
        </section>

        {/* ── Weekly goal ── */}
        <Card className={styles.goalCard} data-anim="goal">
          <div className={styles.goalText}>
            <h2 className={styles.cardTitle}>Weekly goal</h2>
            <p className={styles.goalBig}>
              <span data-count={sessionsThisWeek}>{sessionsThisWeek}</span>
              <span className={styles.goalOf}> / {weeklyGoal}</span>
            </p>
            <p className={styles.goalCaption}>
              {sessionsThisWeek} of {weeklyGoal} sessions completed this week
            </p>
            {sessionsThisWeek >= weeklyGoal && (
              <p className={styles.goalComplete} role="status">
                You&apos;ve hit your weekly goal. Nice work!
              </p>
            )}
          </div>

          <div className={styles.ringWrap} role="img" aria-label={`${goalPercent}% of weekly goal reached`}>
            <svg viewBox="0 0 120 120" className={styles.ring} aria-hidden="true">
              <circle cx="60" cy="60" r="52" pathLength="100" className={styles.ringTrack} />
              <circle
                cx="60"
                cy="60"
                r="52"
                pathLength="100"
                className={styles.ringFill}
                style={{ strokeDashoffset: 100 - ringPercent }}
                data-anim="ring"
              />
            </svg>
            <span className={styles.ringLabel} aria-hidden="true">
              <span data-count={goalPercent}>{goalPercent}</span>%
            </span>
          </div>
        </Card>

        <div className={styles.twoCol}>
          {/* ── Focus areas ── */}
          <section className={styles.focusCol} aria-labelledby="focus-heading">
            <h2 id="focus-heading" className={styles.sectionTitle}>Your focus areas</h2>
            <div className={styles.focusList}>
              {mockFocusAreas.map((area) => (
                <Tilt key={area.id} max={6}>
                  <Card variant="flat" className={styles.focusCard} data-anim="focus">
                    <div className={styles.focusHeader}>
                      <span className={styles.focusLabel}>{area.label}</span>
                      <span className={styles.focusPct}>{area.progress}%</span>
                    </div>
                    <p className={styles.focusDesc}>{area.description}</p>
                    <ProgressBar value={area.progress} label={`${area.label} progress`} size="sm" />
                  </Card>
                </Tilt>
              ))}
            </div>
          </section>

          {/* ── Recent activity ── */}
          <section className={styles.activityCol} aria-labelledby="activity-heading">
            <h2 id="activity-heading" className={styles.sectionTitle}>Recent activity</h2>
            <div className={styles.activityList}>
              {mockRecentActivity.map((item) => (
                <Card key={item.id} className={styles.activityCard} data-anim="activity">
                  <div className={styles.activityTop}>
                    <span className={styles.activityDate}>{item.date}</span>
                    <span className={styles.activityStatus}>{item.status}</span>
                  </div>
                  <p className={styles.activityPrompt}>&ldquo;{item.prompt}&rdquo;</p>
                  <div className={styles.activityMeta}>
                    <span>{item.wordCount} words</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.focusArea}</span>
                  </div>
                </Card>
              ))}
              <Button variant="ghost" size="sm" onClick={() => onNavigate('progress')}>
                View full progress
              </Button>
            </div>
          </section>
        </div>

        {/* ── Start writing ── */}
        <Card variant="accent" className={styles.startCard} data-anim="start">
          <div className={styles.startInner}>
            <div>
              <h2 className={styles.startTitle}>Ready for today&apos;s session?</h2>
              <p className={styles.startSub}>
                A new prompt is waiting. Even ten minutes of writing makes a difference.
              </p>
            </div>
            <span className={styles.magnet} data-magnet>
              <Button size="lg" onClick={() => onNavigate('workspace')}>
                Start writing
              </Button>
            </span>
          </div>
        </Card>

      </div>
    </div>
  );
}