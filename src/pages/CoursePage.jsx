import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import Button from '../components/Button';
import Words from '../components/Words';
import useEntrance from '../hooks/useEntrance';
import { useLearning } from '../context/LearningContext';
import { getCourse, courseMinutes } from '../data/learningData';
import kit from '../styles/pageKit.module.css';
import styles from './CoursePage.module.css';

const MOTION_OK = '(prefers-reduced-motion: no-preference)';

export default function CoursePage({ courseId, onNavigate }) {
  const course = getCourse(courseId);
  const { completed, toggleMilestone } = useLearning();
  const root = useRef(null);
  const materialRef = useRef(null);
  const firstRender = useRef(true);
  const copyTimer = useRef(0);
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'ok' | 'fail'

  const done = course ? completed[course.id] || [] : [];
  const firstOpen = course ? course.milestones.find((m) => !done.includes(m.id)) || course.milestones[0] : null;
  const [activeId, setActiveId] = useState(firstOpen ? firstOpen.id : null);

  useEntrance(root, [courseId]);

  // the material panel swaps with a little motion
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    if (!materialRef.current || !window.matchMedia(MOTION_OK).matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(materialRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      gsap.from('[data-note]', { opacity: 0, x: -16, duration: 0.5, stagger: 0.07, delay: 0.15, ease: 'power3.out', clearProps: 'opacity,transform' });
    }, materialRef);
    return () => ctx.revert();
  }, [activeId]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  if (!course) {
    return (
      <div className={kit.page}>
        <div className={['container', kit.inner].join(' ')}>
          <h1 className={kit.title}>Course not found</h1>
          <p className={kit.sub}>That course does not exist any more.</p>
          <div><Button onClick={() => onNavigate('courses')}>Back to courses</Button></div>
        </div>
      </div>
    );
  }

  const total = course.milestones.length;
  const index = course.milestones.findIndex((m) => m.id === activeId);
  const active = course.milestones[index] || course.milestones[0];
  const isDone = done.includes(active.id);
  const pct = Math.round((done.length / total) * 100);
  const next = course.milestones[index + 1];

  const copyNotes = async () => {
    const text = [
      course.title,
      course.tagline,
      '',
      ...course.milestones.flatMap((m, i) => [
        `${i + 1}. ${m.title}`,
        ...m.notes.map((n) => `   - ${n}`),
        `   Key idea: ${m.keyIdea}`,
        `   Try it: ${m.tryIt}`,
        '',
      ]),
    ].join('\n');
    let result = 'ok';
    try {
      await window.navigator.clipboard.writeText(text);
    } catch {
      result = 'fail'; // clipboard can be blocked (for example on a non-secure page)
    }
    setCopyState(result);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 2500);
  };

  return (
    <div className={kit.page} ref={root}>
      <div className={['container', kit.inner].join(' ')}>
        <header className={kit.header}>
          <div>
            <button type="button" className={styles.back} onClick={() => onNavigate('courses')} data-anim="fade">
              All courses
            </button>
            <h1 className={kit.title}>
              <Words text={course.title} />
            </h1>
            <p className={kit.sub} data-anim="fade">{course.tagline}</p>
          </div>
          <div className={styles.headStats} data-anim="fade">
            <span className={kit.tag}>{course.level}</span>
            <p className={kit.stat}>
              <strong>{done.length}</strong> of {total} done · {courseMinutes(course)} min
            </p>
          </div>
        </header>

        <div className={kit.bar} role="progressbar" aria-label="Course progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span className={kit.barFill} style={{ width: `${pct}%` }} />
        </div>

        <div className={styles.layout}>
          {/* ── Milestone path ── */}
          <nav className={styles.path} aria-label="Milestones" data-anim="rise">
            <ol className={styles.pathList}>
              {course.milestones.map((m, i) => {
                const on = m.id === active.id;
                const complete = done.includes(m.id);
                return (
                  <li key={m.id} className={styles.pathItem}>
                    {i < total - 1 && (
                      <span className={[styles.conn, complete ? styles.connDone : ''].join(' ')} aria-hidden="true" />
                    )}
                    <button
                      type="button"
                      className={[styles.pathBtn, on ? styles.pathOn : ''].join(' ')}
                      aria-current={on ? 'step' : undefined}
                      onClick={() => setActiveId(m.id)}
                    >
                      <span className={[styles.node, complete ? styles.nodeDone : ''].join(' ')} aria-hidden="true">
                        {complete ? (
                          <svg viewBox="0 0 16 16" className={styles.tick}><path d="M3 8.5l3.2 3.2L13 5" /></svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span>
                        <span className={styles.pathTitle}>{m.title}</span>
                        <span className={styles.pathMeta}>
                          {m.minutes} min{complete ? ' · done' : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <button type="button" className={styles.copy} onClick={copyNotes}>
              {copyState === 'ok' ? 'Notes copied' : copyState === 'fail' ? 'Could not copy' : 'Copy all course notes'}
            </button>
            <span className={kit.srOnly} role="status">
              {copyState === 'ok' ? 'Course notes copied to the clipboard' : copyState === 'fail' ? 'Copying was blocked by the browser' : ''}
            </span>
          </nav>

          {/* ── Material for the active milestone ── */}
          <article className={styles.material} ref={materialRef} aria-labelledby="milestone-heading" data-anim="rise">
            <p className={styles.step}>Milestone {index + 1} of {total} · {active.minutes} min</p>
            <h2 id="milestone-heading" className={styles.milestoneTitle}>{active.title}</h2>
            <p className={styles.summary}>{active.summary}</p>

            <h3 className={styles.subhead}>Notes</h3>
            <ul className={styles.notes}>
              {active.notes.map((note) => (
                <li key={note} className={styles.note} data-note>{note}</li>
              ))}
            </ul>

            <div className={styles.keyIdea}>
              <p className={styles.keyLabel}>Key idea</p>
              <p>{active.keyIdea}</p>
            </div>

            <div className={styles.tryIt}>
              <p className={styles.keyLabel}>Try it</p>
              <p>{active.tryIt}</p>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('workspace')}>
                Practise in the workspace
              </Button>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={[styles.complete, isDone ? styles.completeOn : ''].join(' ')}
                aria-pressed={isDone}
                onClick={() => toggleMilestone(course.id, active.id)}
              >
                {isDone ? 'Completed (tap to undo)' : 'Mark milestone as complete'}
              </button>
              {next && (
                <Button onClick={() => setActiveId(next.id)}>Next milestone</Button>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}