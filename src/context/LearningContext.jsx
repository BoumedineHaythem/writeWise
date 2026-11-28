import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { getWord } from '../data/learningData';
import { api } from '../api/client';

/**
 * Shared learning state: saved flashcards, words to practise, known cards and
 * finished course milestones.
 *
 * Logged out: saved in the browser (localStorage).
 * Logged in: saved on the server. Anything saved in the browser first is merged into the account.
 * Changes apply on screen immediately, then the server's answer replaces local state.
 */
const LearningContext = createContext(null);

const KEYS = { flashcardIds: 'ww-flashcards', practiceIds: 'ww-practice', knownIds: 'ww-known', completed: 'ww-milestones' };
const EMPTY = { flashcardIds: [], practiceIds: [], knownIds: [], completed: {} };

function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be unavailable (private mode, quota): the app still works in memory */
  }
}

const loadLocal = () => Object.fromEntries(Object.entries(KEYS).map(([k, key]) => [k, load(key, EMPTY[k])]));
const clearLocal = () => Object.entries(KEYS).forEach(([k, key]) => save(key, EMPTY[k]));
const hasAny = (s) => s.flashcardIds.length || s.practiceIds.length || Object.keys(s.completed).length;

const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function LearningProvider({ isLoggedIn = false, children }) {
  const [state, setState] = useState(loadLocal);
  const [syncError, setSyncError] = useState('');
  const remote = useRef(isLoggedIn);
  const stateRef = useRef(state);
  useEffect(() => {
    remote.current = isLoggedIn;
    stateRef.current = state;
  });

  // Switch the source of truth when the login state changes.
  useEffect(() => {
    if (!isLoggedIn) {
      setState(loadLocal());
      return undefined;
    }
    let alive = true;
    const local = loadLocal();
    (hasAny(local) ? api.importLearning(local).then((s) => (clearLocal(), s)) : api.learning())
      .then((s) => alive && setState(s))
      .catch((err) => alive && setSyncError(err.message));
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  // Logged out: keep the browser copy up to date.
  useEffect(() => {
    if (isLoggedIn) return;
    for (const [k, key] of Object.entries(KEYS)) save(key, state[k]);
  }, [state, isLoggedIn]);

  /** Apply a change locally now; when logged in, also send it and adopt the server's result. */
  const apply = useCallback((localUpdate, remoteCall) => {
    setState(localUpdate);
    if (!remote.current) return;
    remoteCall()
      .then((s) => {
        setState(s);
        setSyncError('');
      })
      .catch((err) => {
        setSyncError(err.message);
        api.learning().then(setState).catch(() => {});
      });
  }, []);

  const toggleFlashcard = useCallback(
    (id) => {
      const has = stateRef.current.flashcardIds.includes(id);
      apply(
        (s) => ({ ...s, flashcardIds: toggleIn(s.flashcardIds, id), knownIds: s.knownIds.filter((x) => x !== id) }),
        () => (has ? api.removeFlashcard(id) : api.addFlashcard(id))
      );
    },
    [apply]
  );
  const removeFlashcard = useCallback(
    (id) =>
      apply(
        (s) => ({ ...s, flashcardIds: s.flashcardIds.filter((x) => x !== id), knownIds: s.knownIds.filter((x) => x !== id) }),
        () => api.removeFlashcard(id)
      ),
    [apply]
  );
  const togglePractice = useCallback(
    (id) => {
      const has = stateRef.current.practiceIds.includes(id);
      apply(
        (s) => ({ ...s, practiceIds: toggleIn(s.practiceIds, id) }),
        () => (has ? api.removePractice(id) : api.addPractice(id))
      );
    },
    [apply]
  );
  const addAllToPractice = useCallback(
    (ids) => {
      if (!ids.length) return;
      apply(
        (s) => ({ ...s, practiceIds: [...s.practiceIds, ...ids.filter((id) => !s.practiceIds.includes(id))] }),
        () => api.addPracticeMany(ids)
      );
    },
    [apply]
  );
  const setKnown = useCallback(
    (id, value) =>
      apply(
        (s) => ({
          ...s,
          knownIds: value ? (s.knownIds.includes(id) ? s.knownIds : [...s.knownIds, id]) : s.knownIds.filter((x) => x !== id),
        }),
        () => api.setKnown(id, value)
      ),
    [apply]
  );
  const toggleMilestone = useCallback(
    (courseId, milestoneId) => {
      const done = (stateRef.current.completed[courseId] || []).includes(milestoneId);
      apply(
        (s) => ({ ...s, completed: { ...s.completed, [courseId]: toggleIn(s.completed[courseId] || [], milestoneId) } }),
        () => (done ? api.removeMilestone(courseId, milestoneId) : api.addMilestone(courseId, milestoneId))
      );
    },
    [apply]
  );

  const value = useMemo(
    () => ({
      ...state,
      syncError,
      flashcards: state.flashcardIds.map(getWord).filter(Boolean),
      practiceWords: state.practiceIds.map(getWord).filter(Boolean),
      toggleFlashcard,
      removeFlashcard,
      togglePractice,
      addAllToPractice,
      setKnown,
      toggleMilestone,
    }),
    [state, syncError, toggleFlashcard, removeFlashcard, togglePractice, addAllToPractice, setKnown, toggleMilestone]
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearning must be used inside <LearningProvider>');
  return ctx;
}
