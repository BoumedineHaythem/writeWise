import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getWord } from '../data/learningData';

/**
 * Shared learning state: saved flashcards, words to practise, known cards and
 * finished course milestones. Saved in the browser (localStorage) so it survives a refresh.
 */
const LearningContext = createContext(null);

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

const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function LearningProvider({ children }) {
  const [flashcardIds, setFlashcardIds] = useState(() => load('ww-flashcards', []));
  const [practiceIds, setPracticeIds] = useState(() => load('ww-practice', []));
  const [knownIds, setKnownIds] = useState(() => load('ww-known', []));
  const [completed, setCompleted] = useState(() => load('ww-milestones', {}));

  useEffect(() => save('ww-flashcards', flashcardIds), [flashcardIds]);
  useEffect(() => save('ww-practice', practiceIds), [practiceIds]);
  useEffect(() => save('ww-known', knownIds), [knownIds]);
  useEffect(() => save('ww-milestones', completed), [completed]);

  const toggleFlashcard = useCallback((id) => {
    setFlashcardIds((list) => toggleIn(list, id));
    setKnownIds((list) => list.filter((x) => x !== id)); // a re-added card starts fresh
  }, []);
  const removeFlashcard = useCallback((id) => {
    setFlashcardIds((list) => list.filter((x) => x !== id));
    setKnownIds((list) => list.filter((x) => x !== id));
  }, []);
  const togglePractice = useCallback((id) => setPracticeIds((list) => toggleIn(list, id)), []);
  const addAllToPractice = useCallback(
    (ids) => setPracticeIds((list) => [...list, ...ids.filter((id) => !list.includes(id))]),
    []
  );
  const setKnown = useCallback(
    (id, value) => setKnownIds((list) => (value ? (list.includes(id) ? list : [...list, id]) : list.filter((x) => x !== id))),
    []
  );
  const toggleMilestone = useCallback((courseId, milestoneId) => {
    setCompleted((all) => {
      const current = all[courseId] || [];
      return { ...all, [courseId]: toggleIn(current, milestoneId) };
    });
  }, []);

  const value = useMemo(
    () => ({
      flashcardIds,
      practiceIds,
      knownIds,
      completed,
      flashcards: flashcardIds.map(getWord).filter(Boolean),
      practiceWords: practiceIds.map(getWord).filter(Boolean),
      toggleFlashcard,
      removeFlashcard,
      togglePractice,
      addAllToPractice,
      setKnown,
      toggleMilestone,
    }),
    [flashcardIds, practiceIds, knownIds, completed, toggleFlashcard, removeFlashcard, togglePractice, addAllToPractice, setKnown, toggleMilestone]
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error('useLearning must be used inside <LearningProvider>');
  return ctx;
}