import React from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import {
  mockProgressSessions,
  mockTotalStats,
  mockFocusAreas,
  mockCompletedSessions,
} from '../data/mockData';
import styles from './ProgressPage.module.css';

export default function ProgressPage({ onNavigate }) {
  const { totalSessions, totalWords, currentStreak, longestStreak } = mockTotalStats;
  // Pre-compute max words once — used to scale the activity bars
  const maxWeeklyWords = Math.max(...mockProgressSessions.map((r) => r.words));

  return (
    <div className={styles.page}>
      <div className={['container', styles.inner].join(' ')}>

        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Your progress</h1>
            <p className={styles.pageSub}>
              A snapshot of your writing journey — keep it up!
            </p>
          </div>
          <Button onClick={() => onNavigate('workspace')}>
            Start a new session
          </Button>
        </div>

        {/* Sample data notice */}
        <div className={styles.sampleNotice} role="note">
          <span aria-hidden="true">📊 </span>
          <strong>Sample data: </strong>
          This progress view shows example data to illustrate how your real progress will appear. Weekly bars compare words written; focus percentages and streak counts are illustrative only.
        </div>

        {/* ── Stat tiles ── */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Overall statistics</h2>
          <div className={styles.statsGrid}>
            {[
              { value: totalSessions, label: 'Total sessions', icon: '📝' },
              { value: totalWords.toLocaleString(), label: 'Words written', icon: '✍️' },
              { value: `${currentStreak} days`, label: 'Current streak', icon: '🔥' },
              { value: `${longestStreak} days`, label: 'Longest streak', icon: '🏆' },
            ].map((stat) => (
              <Card key={stat.label} variant="flat" className={styles.statTile}>
                <span className={styles.statIcon} aria-hidden="true">{stat.icon}</span>
                <span className={styles.statValue} aria-label={`${stat.label}: ${stat.value}`}>
                  {stat.value}
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Weekly breakdown ── */}
        <section aria-labelledby="weekly-heading">
          <h2 id="weekly-heading" className={styles.sectionTitle}>
            Session history by week
          </h2>
          <Card
            className={styles.weeklyCard}
            role="region"
            aria-label="Scrollable weekly activity table"
            tabIndex={0}
          >
            <table className={styles.table} aria-label="Weekly session and word count history">
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Sessions</th>
                  <th scope="col">Words written</th>
                  <th scope="col" aria-label="Activity bar">Activity</th>
                </tr>
              </thead>
              <tbody>
                {mockProgressSessions.map((row) => {
                  const barWidth = Math.round((row.words / maxWeeklyWords) * 100);
                  return (
                    <tr key={row.week}>
                      <td className={styles.weekCell}>{row.week}</td>
                      <td className={styles.numCell}>{row.sessions}</td>
                      <td className={styles.numCell}>{row.words}</td>
                      <td className={styles.barCell}>
                        <div
                          className={styles.activityBar}
                          role="presentation"
                          aria-hidden="true"
                        >
                          <div
                            className={styles.activityFill}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </section>

        {/* ── Focus areas ── */}
        <section aria-labelledby="focus-heading">
          <h2 id="focus-heading" className={styles.sectionTitle}>
            Focus area progress
          </h2>
          <div className={styles.focusGrid}>
            {mockFocusAreas.map((area) => (
              <Card key={area.id} className={styles.focusCard}>
                <div className={styles.focusHeader}>
                  <span className={styles.focusIcon} aria-hidden="true">{area.icon}</span>
                  <div>
                    <h3 className={styles.focusTitle}>{area.label}</h3>
                    <p className={styles.focusDesc}>{area.description}</p>
                  </div>
                </div>
                <ProgressBar
                  value={area.progress}
                  label={`${area.label} progress`}
                  size="md"
                />
                <p className={styles.focusComment}>
                  {area.progress < 50
                    ? 'Still growing — keep practising!'
                    : area.progress < 75
                    ? 'Good progress. Push a little further!'
                    : 'Strong area — well done!'}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Completed sessions list ── */}
        <section aria-labelledby="sessions-heading">
          <h2 id="sessions-heading" className={styles.sectionTitle}>
            Completed practice sessions
          </h2>
          <Card className={styles.sessionsCard}>
            <ul className={styles.sessionList} aria-label="Completed practice sessions">
              {mockCompletedSessions.map((s, i) => (
                <li key={i} className={styles.sessionItem}>
                  <div className={styles.sessionMeta}>
                    <span className={styles.sessionDate}>{s.date}</span>
                    <span className={styles.sessionWords}>{s.words} words</span>
                    <span className={styles.sessionFocus}>{s.focus}</span>
                  </div>
                  <p className={styles.sessionPrompt}>&ldquo;{s.prompt}&rdquo;</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* CTA */}
        <Card variant="accent" className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Keep the momentum going</h2>
          <p className={styles.ctaSub}>
            Consistent short sessions build real improvement. What will you write today?
          </p>
          <Button size="lg" onClick={() => onNavigate('workspace')}>
            Start writing now
          </Button>
        </Card>

      </div>
    </div>
  );
}
