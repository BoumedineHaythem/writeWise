import { Router } from 'express';
import { z } from 'zod';
import { db, transaction } from '../db.js';
import { requireAuth } from '../auth.js';
import { HttpError, parseBody } from '../errors.js';
import { getWord, getCourse } from '../../src/data/learningData.js';

/** Per-user learning state: flashcards, known cards, practice words and finished course milestones. */
const router = Router();
router.use('/learning', requireAuth);

function checkWord(id) {
  if (!getWord(id)) throw new HttpError(404, `Unknown word "${id}".`);
}

export function learningState(userId) {
  const cards = db.prepare('SELECT word_id, known FROM flashcards WHERE user_id = ? ORDER BY created_at, rowid').all(userId);
  const practice = db.prepare('SELECT word_id FROM practice_words WHERE user_id = ? ORDER BY created_at, rowid').all(userId);
  const done = db.prepare('SELECT course_id, milestone_id FROM milestones WHERE user_id = ? ORDER BY created_at, rowid').all(userId);
  const completed = {};
  for (const m of done) (completed[m.course_id] ??= []).push(m.milestone_id);
  return {
    flashcardIds: cards.map((c) => c.word_id),
    knownIds: cards.filter((c) => c.known).map((c) => c.word_id),
    practiceIds: practice.map((p) => p.word_id),
    completed,
  };
}

router.get('/learning', (req, res) => res.json(learningState(req.user.id)));

/** Replace the whole state in one go: used to import what was saved in the browser before logging in. */
const ImportSchema = z.object({
  flashcardIds: z.array(z.string()).max(1000).default([]),
  knownIds: z.array(z.string()).max(1000).default([]),
  practiceIds: z.array(z.string()).max(1000).default([]),
  completed: z.record(z.string(), z.array(z.string()).max(100)).default({}),
});

router.post('/learning/import', (req, res) => {
  const body = parseBody(ImportSchema, req.body);
  const uid = req.user.id;
  transaction(() => {
    const addCard = db.prepare('INSERT OR IGNORE INTO flashcards (user_id, word_id) VALUES (?, ?)');
    const markKnown = db.prepare('UPDATE flashcards SET known = 1 WHERE user_id = ? AND word_id = ?');
    const addPractice = db.prepare('INSERT OR IGNORE INTO practice_words (user_id, word_id) VALUES (?, ?)');
    const addMilestone = db.prepare('INSERT OR IGNORE INTO milestones (user_id, course_id, milestone_id) VALUES (?, ?, ?)');
    for (const id of body.flashcardIds) if (getWord(id)) addCard.run(uid, id);
    for (const id of body.knownIds) markKnown.run(uid, id);
    for (const id of body.practiceIds) if (getWord(id)) addPractice.run(uid, id);
    for (const [courseId, ids] of Object.entries(body.completed)) {
      const course = getCourse(courseId);
      if (!course) continue;
      for (const mid of ids) if (course.milestones.some((m) => m.id === mid)) addMilestone.run(uid, courseId, mid);
    }
  });
  res.json(learningState(uid));
});

// ── Flashcards ──
router.put('/learning/flashcards/:wordId', (req, res) => {
  checkWord(req.params.wordId);
  // re-adding a card starts it fresh
  db.prepare(
    'INSERT INTO flashcards (user_id, word_id) VALUES (?, ?) ON CONFLICT(user_id, word_id) DO UPDATE SET known = 0'
  ).run(req.user.id, req.params.wordId);
  res.json(learningState(req.user.id));
});

router.delete('/learning/flashcards/:wordId', (req, res) => {
  db.prepare('DELETE FROM flashcards WHERE user_id = ? AND word_id = ?').run(req.user.id, req.params.wordId);
  res.json(learningState(req.user.id));
});

router.put('/learning/flashcards/:wordId/known', (req, res) => {
  const { known } = parseBody(z.object({ known: z.boolean() }), req.body);
  const { changes } = db
    .prepare('UPDATE flashcards SET known = ? WHERE user_id = ? AND word_id = ?')
    .run(known ? 1 : 0, req.user.id, req.params.wordId);
  if (!changes) throw new HttpError(404, 'That word is not in your flashcards.');
  res.json(learningState(req.user.id));
});

// ── Practice list ──
router.put('/learning/practice/:wordId', (req, res) => {
  checkWord(req.params.wordId);
  db.prepare('INSERT OR IGNORE INTO practice_words (user_id, word_id) VALUES (?, ?)').run(req.user.id, req.params.wordId);
  res.json(learningState(req.user.id));
});

router.post('/learning/practice', (req, res) => {
  const { wordIds } = parseBody(z.object({ wordIds: z.array(z.string()).min(1).max(500) }), req.body);
  wordIds.forEach(checkWord);
  transaction(() => {
    const add = db.prepare('INSERT OR IGNORE INTO practice_words (user_id, word_id) VALUES (?, ?)');
    for (const id of wordIds) add.run(req.user.id, id);
  });
  res.json(learningState(req.user.id));
});

router.delete('/learning/practice/:wordId', (req, res) => {
  db.prepare('DELETE FROM practice_words WHERE user_id = ? AND word_id = ?').run(req.user.id, req.params.wordId);
  res.json(learningState(req.user.id));
});

// ── Course milestones ──
function checkMilestone(courseId, milestoneId) {
  const course = getCourse(courseId);
  if (!course) throw new HttpError(404, 'Course not found.');
  if (!course.milestones.some((m) => m.id === milestoneId)) throw new HttpError(404, 'Milestone not found.');
}

router.put('/learning/milestones/:courseId/:milestoneId', (req, res) => {
  const { courseId, milestoneId } = req.params;
  checkMilestone(courseId, milestoneId);
  db.prepare('INSERT OR IGNORE INTO milestones (user_id, course_id, milestone_id) VALUES (?, ?, ?)').run(req.user.id, courseId, milestoneId);
  res.json(learningState(req.user.id));
});

router.delete('/learning/milestones/:courseId/:milestoneId', (req, res) => {
  const { courseId, milestoneId } = req.params;
  db.prepare('DELETE FROM milestones WHERE user_id = ? AND course_id = ? AND milestone_id = ?').run(req.user.id, courseId, milestoneId);
  res.json(learningState(req.user.id));
});

export default router;
