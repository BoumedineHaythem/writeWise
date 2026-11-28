import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { mockFocusAreas } from '../data/mockData';

const EMPTY = {
  totals: { totalSessions: 0, totalWords: 0, currentStreak: 0, longestStreak: 0 },
  weeklyGoal: 3,
  sessionsThisWeek: 0,
  weekly: [],
  focusAreas: mockFocusAreas.map((a) => ({ ...a, progress: 0 })),
  sessions: [],
};

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Loads the signed-in user's progress and recent sessions from the backend. */
export default function useProgress(sessionLimit = 20) {
  const [state, setState] = useState({ data: EMPTY, loading: true, error: '' });

  useEffect(() => {
    let alive = true;
    Promise.all([api.progress(), api.sessions(sessionLimit)])
      .then(([progress, { sessions }]) => {
        if (!alive) return;
        // keep the icons and descriptions from the static focus-area list
        const focusAreas = progress.focusAreas.map((a) => ({
          ...mockFocusAreas.find((m) => m.id === a.id),
          ...a,
        }));
        setState({ data: { ...progress, focusAreas, sessions }, loading: false, error: '' });
      })
      .catch((err) => alive && setState({ data: EMPTY, loading: false, error: err.message }));
    return () => {
      alive = false;
    };
  }, [sessionLimit]);

  return state;
}
