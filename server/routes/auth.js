import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { HttpError, parseBody } from '../errors.js';
import { hashPassword, verifyPassword, createToken, revokeToken, requireAuth, publicUser } from '../auth.js';

const router = Router();

const email = z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254);

const SignupSchema = z.object({
  name: z.string().trim().min(1, 'Your name is required.').max(80),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});

const LoginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.').max(200),
});

const UpdateMeSchema = z.object({
  name: z.string().trim().min(1, 'Your name is required.').max(80).optional(),
  weeklyGoal: z.number().int().min(1).max(21).optional(),
});

router.post('/auth/signup', (req, res) => {
  const body = parseBody(SignupSchema, req.body);
  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(body.email);
  if (exists) throw new HttpError(409, 'An account with this email already exists.', { fields: { email: 'This email is already registered. Try logging in.' } });
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(body.name, body.email, hashPassword(body.password));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
  res.status(201).json({ token: createToken(user.id), user: publicUser(user) });
});

router.post('/auth/login', (req, res) => {
  const body = parseBody(LoginSchema, req.body);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(body.email);
  if (!user || !verifyPassword(body.password, user.password_hash)) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  res.json({ token: createToken(user.id), user: publicUser(user) });
});

router.post('/auth/logout', requireAuth, (req, res) => {
  revokeToken(req.token);
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', requireAuth, (req, res) => {
  const body = parseBody(UpdateMeSchema, req.body);
  if (body.name !== undefined) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(body.name, req.user.id);
  if (body.weeklyGoal !== undefined) db.prepare('UPDATE users SET weekly_goal = ? WHERE id = ?').run(body.weeklyGoal, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

router.delete('/me', requireAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.status(204).end();
});

export default router;
