import React from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { mockUser, mockFocusAreas, mockRecentActivity } from '../data/mockData';
import styles from './DashboardPage.module.css';

export default function DashboardPage({ onNavigate, userName }) {
  const name = userName || mockUser.name;
  const { weeklyGoal, sessionsThisWeek } = mockUser;
  const goalPercent = Math.round((sessionsThisWeek / weeklyGoal) * 100);

  return (
    <div className={styles.page}>
      <div className={['container', styles.inner].join(' ')}>

        {/* ── Welcome banner ── */}
        <section className={styles.welcome} aria-labelledby="welcome-heading">
          <div className={styles.welcomeText}>
            <h1 id="welcome-heading">
              Welcome back, {name}! 👋
            </h1>
            <p className={styles.welcomeSub}>
              You&apos;re doing great. Keep building your writing habit.
            </p>
          </div>
          <Button size="lg" onClick={() => onNavigate('workspace')}>
            Continue writing →
          </Button>
        </section>

        {/* ── Weekly goal ── */}
        <Card className={styles.goalCard}>
          <div className={styles.goalHeader}>
            <div>
              <h2 className={styles.cardTitle}>Weekly goal</h2>
              <p className={styles.goalCaption}>
                {sessionsThisWeek} of {weeklyGoal} sessions completed this week
              </p>
            </div>
            <span
              className={styles.goalBadge}
              aria-label={`${goalPercent}% of weekly goal reached`}
            >
              {goalPercent}%
            </span>
          </div>
          <ProgressBar
            value={goalPercent}
            label={`Weekly goal (${sessionsThisWeek}/${weeklyGoal} sessions)`}
            showLabel={false}
            size="lg"
          />
          {sessionsThisWeek >= weeklyGoal && (
            <p className={styles.goalComplete} role="status">
              🎉 You&apos;ve hit your weekly goal — nice work!
            </p>
          )}
        </Card>

        <div className={styles.twoCol}>
          {/* ── Focus areas ── */}
          <section aria-labelledby="focus-heading">
            <h2 id="focus-heading" className={styles.sectionTitle}>Your focus areas</h2>
            <div className={styles.focusList}>
              {mockFocusAreas.map((area) => (
                <Card key={area.id} variant="flat" className={styles.focusCard}>
                  <div className={styles.focusHeader}>
                    <span className={styles.focusIcon} aria-hidden="true">{area.icon}</span>
                    <span className={styles.focusLabel}>{area.label}</span>
                  </div>
                  <p className={styles.focusDesc}>{area.description}</p>
                  <ProgressBar value={area.progress} label={`${area.label} progress`} size="sm" />
                </Card>
              ))}
            </div>
          </section>

          {/* ── Recent activity ── */}
          <section aria-labelledby="activity-heading">
            <h2 id="activity-heading" className={styles.sectionTitle}>Recent activity</h2>
            <div className={styles.activityList}>
              {mockRecentActivity.map((item) => (
                <Card key={item.id} className={styles.activityCard}>
                  <div className={styles.activityTop}>
                    <span className={styles.activityDate}>{item.date}</span>
                    <span className={styles.activityStatus}>{item.status}</span>
                  </div>
                  <p className={styles.activityPrompt}>&ldquo;{item.prompt}&rdquo;</p>
                  <div className={styles.activityMeta}>
                    <span>{item.wordCount} words</span>
                    <span>·</span>
                    <span>{item.focusArea}</span>
                  </div>
                </Card>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('progress')}
                className={styles.viewAll}
              >
                View full progress →
              </Button>
            </div>
          </section>
        </div>

        {/* ── Start writing prompt ── */}
        <Card variant="accent" className={styles.startCard}>
          <div className={styles.startInner}>
            <div>
              <h2 className={styles.startTitle}>Ready for today&apos;s session?</h2>
              <p className={styles.startSub}>
                A new prompt is waiting. Even ten minutes of writing makes a difference.
              </p>
            </div>
            <Button size="lg" onClick={() => onNavigate('workspace')}>
              Start writing
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
