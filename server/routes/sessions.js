import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { config } from '../config.js';
import { requireAuth } from '../auth.js';
import { HttpError, asyncRoute, parseBody } from '../errors.js';
import { analyzeWriting, countWords, areaLabel, FOCUS_AREAS } from '../feedback/analyze.js';
import { analyzeWithClaude } from '../feedback/claude.js';

/** Writing sessions: submit a piece of writing, get feedback, list history, see progress. */
const router = Router();
router.use(['/sessions', '/progress'], requireAuth);

const SubmitSchema = z.object({
  prompt: z.string().trim().min(1, 'A prompt is required.').max(500),
  text: z.string().max(60000),
  blocks: z.array(z.unknown()).max(2000).optional(),
});

function toSession(row, { full = false } = {}) {
  const base = {
    id: row.id,
    prompt: row.prompt,
    wordCount: row.word_count,
    focusArea: row.focus_area,
    focusLabel: areaLabel(row.focus_area),
    scores: JSON.parse(row.scores_json),
    createdAt: row.created_at,
  };
  if (!full) return base;
  return {
    ...base,
    text: row.text,
    blocks: row.blocks_json ? JSON.parse(row.blocks_json) : null,
    feedback: JSON.parse(row.feedback_json),
  };
}

router.post(
  '/sessions',
  asyncRoute(async (req, res) => {
    const body = parseBody(SubmitSchema, req.body);
    const wordCount = countWords(body.text);
    if (wordCount < config.minWords) {
      throw new HttpError(400, `Please write at least ${config.minWords} words. You have ${wordCount} so far.`);
    }
    if (wordCount > config.maxWords) {
      throw new HttpError(400, `Please keep each piece under ${config.maxWords} words.`);
    }

    let feedback;
    if (config.aiFeedback) {
      try {
        feedback = await analyzeWithClaude(body.text, body.prompt);
      } catch (err) {
        console.warn('[feedback] Claude feedback failed, using built-in analyzer:', err.message);
      }
    }
    feedback ??= analyzeWriting(body.text, body.prompt);

    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO writing_sessions (user_id, prompt, text, blocks_json, word_count, focus_area, scores_json, feedback_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.id,
        body.prompt,
        body.text,
        body.blocks ? JSON.stringify(body.blocks) : null,
        wordCount,
        feedback.focusArea,
        JSON.stringify(feedback.scores),
        JSON.stringify(feedback)
      );
    const row = db.prepare('SELECT * FROM writing_sessions WHERE id = ?').get(lastInsertRowid);
    res.status(201).json({ session: toSession(row, { full: true }) });
  })
);

router.get('/sessions', (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const rows = db
    .prepare('SELECT * FROM writing_sessions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?')
    .all(req.user.id, limit, offset);
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM writing_sessions WHERE user_id = ?').get(req.user.id);
  res.json({ sessions: rows.map((r) => toSession(r)), total });
});

router.get('/sessions/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM writing_sessions WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
  if (!row) throw new HttpError(404, 'Session not found.');
  res.json({ session: toSession(row, { full: true }) });
});

router.delete('/sessions/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM writing_sessions WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
  if (!changes) throw new HttpError(404, 'Session not found.');
  res.status(204).end();
});

// ── Progress ──

const DAY = 86400000;

/** Local calendar day number for a timestamp, given the client's getTimezoneOffset() in minutes. */
const dayNumber = (iso, tzOffset) => Math.floor((Date.parse(iso) - tzOffset * 60000) / DAY);
/** Monday-based week start, as a day number. (Day 0 = Thu 1 Jan 1970, so +3 aligns to Monday.) */
const weekStart = (day) => day - ((day + 3) % 7);
const dayToDate = (day) => new Date(day * DAY);
const fmt = (day) => dayToDate(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

router.get('/progress', (req, res) => {
  const tzOffset = Math.max(-840, Math.min(840, Number(req.query.tzOffset) || 0));
  const weeks = Math.min(26, Math.max(1, Number(req.query.weeks) || 6));
  const rows = db
    .prepare('SELECT word_count, scores_json, created_at FROM writing_sessions WHERE user_id = ? ORDER BY created_at')
    .all(req.user.id);

  const today = dayNumber(new Date().toISOString(), tzOffset);
  const thisWeek = weekStart(today);

  // Streaks over distinct writing days.
  const days = [...new Set(rows.map((r) => dayNumber(r.created_at, tzOffset)))].sort((a, b) => a - b);
  let longestStreak = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }
  const daySet = new Set(days);
  let currentStreak = 0;
  // A streak stays alive through today even if you haven't written yet today.
  for (let d = daySet.has(today) ? today : today - 1; daySet.has(d); d--) currentStreak++;

  // Weekly buckets, oldest first.
  const weekly = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = thisWeek - i * 7;
    const inWeek = rows.filter((r) => weekStart(dayNumber(r.created_at, tzOffset)) === start);
    weekly.push({
      weekStart: dayToDate(start).toISOString().slice(0, 10),
      label: i === 0 ? 'This week' : `Week of ${fmt(start)}`,
      sessions: inWeek.length,
      words: inWeek.reduce((a, r) => a + r.word_count, 0),
    });
  }

  // Focus area progress: average of the last 5 scores in each area.
  const recent = rows.slice(-5).map((r) => JSON.parse(r.scores_json));
  const focusAreas = FOCUS_AREAS.map((a) => {
    const vals = recent.map((s) => s[a.id]).filter((v) => typeof v === 'number');
    return { id: a.id, label: a.label, progress: vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : 0 };
  });

  res.json({
    totals: {
      totalSessions: rows.length,
      totalWords: rows.reduce((a, r) => a + r.word_count, 0),
      currentStreak,
      longestStreak,
    },
    weeklyGoal: req.user.weekly_goal,
    sessionsThisWeek: weekly[weekly.length - 1].sessions,
    weekly,
    focusAreas,
  });
});

export default router;
