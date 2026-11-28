import crypto from 'node:crypto';
import { db } from './db.js';
import { config } from './config.js';
import { HttpError } from './errors.js';

const SCRYPT_KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// Only a hash of each token is stored, so a leaked database can't be used to log in.
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export function createToken(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + config.tokenTtlDays * 86400000).toISOString();
  db.prepare('INSERT INTO auth_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), userId, expires);
  return token;
}

export function revokeToken(token) {
  db.prepare('DELETE FROM auth_tokens WHERE token_hash = ?').run(sha256(token));
}

export function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    weeklyGoal: row.weekly_goal,
    joinedAt: row.created_at,
  };
}

function readToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

/** Express middleware: requires a valid Bearer token and sets req.user / req.token. */
export function requireAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Please log in.'));
  const row = db
    .prepare(
      `SELECT u.* FROM auth_tokens t JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ? AND t.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
    .get(sha256(token));
  if (!row) return next(new HttpError(401, 'Your session has expired. Please log in again.'));
  req.user = row;
  req.token = token;
  next();
}

export function purgeExpiredTokens() {
  db.prepare("DELETE FROM auth_tokens WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").run();
}
