import React, { useRef } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import Tilt from '../components/Tilt';
import Words from '../components/Words';
import useEntrance from '../hooks/useEntrance';
import { useLearning } from '../context/LearningContext';
import { COURSES, courseMinutes } from '../data/learningData';
import kit from '../styles/pageKit.module.css';
import styles from './CoursesPage.module.css';

export default function CoursesPage({ onNavigate }) {
  const root = useRef(null);
  const { completed } = useLearning();
  useEntrance(root);

  const totalAll = COURSES.reduce((n, c) => n + c.milestones.length, 0);
  const totalDone = COURSES.reduce((n, c) => n + (completed[c.id] || []).length, 0);

  return (
    <div className={kit.page} ref={root}>
      <div className={['container', kit.inner].join(' ')}>
        <header className={kit.header}>
          <div>
            <h1 className={kit.title}>
              <Words text="Courses" />
            </h1>
            <p className={kit.sub} data-anim="fade">
              Short lessons with clear milestones. Finish each one and keep the notes.
            </p>
          </div>
          <p className={kit.stat} data-anim="fade">
            <strong>{totalDone}</strong> of {totalAll} milestones done
          </p>
        </header>

        <div className={styles.grid}>
          {COURSES.map((course) => {
            const done = (completed[course.id] || []).length;
            const total = course.milestones.length;
            const pct = Math.round((done / total) * 100);
            const action = done === 0 ? 'Start course' : done === total ? 'Review course' : 'Continue';
            return (
              <Tilt key={course.id} max={5}>
                <Card className={styles.card} data-anim="rise">
                  <div className={styles.top}>
                    <span className={kit.tag}>{course.level}</span>
                    <span className={styles.meta}>
                      {total} milestones · {courseMinutes(course)} min
                    </span>
                  </div>
                  <h2 className={styles.courseTitle}>{course.title}</h2>
                  <p className={styles.tagline}>{course.tagline}</p>

                  <ul className={styles.steps} aria-label={`${course.title} milestones`}>
                    {course.milestones.map((m) => (
                      <li
                        key={m.id}
                        className={[styles.step, (completed[course.id] || []).includes(m.id) ? styles.stepDone : ''].join(' ')}
                      >
                        <span className={styles.stepDot} aria-hidden="true" />
                        {m.title}
                        {(completed[course.id] || []).includes(m.id) && <span className={kit.srOnly}> (done)</span>}
                      </li>
                    ))}
                  </ul>

                  <div className={styles.progress}>
                    <div className={styles.progressText}>
                      <span>{done} of {total} done</span>
                      <span>{pct}%</span>
                    </div>
                    <div className={kit.bar} role="progressbar" aria-label={`${course.title} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <span className={kit.barFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <Button fullWidth onClick={() => onNavigate('course', course.id)}>
                    {action}
                  </Button>
                </Card>
              </Tilt>
            );
          })}
        </div>
      </div>
    </div>
  );
}