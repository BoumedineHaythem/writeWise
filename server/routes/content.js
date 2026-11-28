import { Router } from 'express';
import { COURSES, WORDS, TOPICS, getCourse, courseMinutes, wordOfTheDay } from '../../src/data/learningData.js';
import { mockWritingPrompts } from '../../src/data/mockData.js';
import { HttpError } from '../errors.js';

/** Read-only learning content. It lives in src/data so the frontend and backend share one source. */
const router = Router();

router.get('/prompts', (_req, res) => {
  res.json({ prompts: mockWritingPrompts });
});

router.get('/courses', (_req, res) => {
  res.json({
    courses: COURSES.map(({ milestones, ...c }) => ({
      ...c,
      minutes: courseMinutes({ milestones }),
      milestones: milestones.map(({ id, title, minutes, summary }) => ({ id, title, minutes, summary })),
    })),
  });
});

router.get('/courses/:id', (req, res) => {
  const course = getCourse(req.params.id);
  if (!course) throw new HttpError(404, 'Course not found.');
  res.json({ course: { ...course, minutes: courseMinutes(course) } });
});

router.get('/words', (req, res) => {
  const { topic, level, q } = req.query;
  let words = WORDS;
  if (topic) words = words.filter((w) => w.topic.toLowerCase() === String(topic).toLowerCase());
  if (level) words = words.filter((w) => w.level === String(level).toUpperCase());
  if (q) {
    const needle = String(q).toLowerCase();
    words = words.filter((w) => w.word.toLowerCase().includes(needle) || w.definition.toLowerCase().includes(needle));
  }
  res.json({ topics: TOPICS, words });
});

router.get('/words/today', (_req, res) => {
  res.json({ word: wordOfTheDay() });
});

export default router;
