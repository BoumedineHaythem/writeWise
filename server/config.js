import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 3001,
  dbPath: process.env.DB_PATH || path.join(here, 'data', 'writewise.db'),
  tokenTtlDays: Number(process.env.TOKEN_TTL_DAYS) || 30,
  // AI feedback is used only when explicitly enabled; otherwise the built-in analyzer runs.
  aiFeedback: process.env.AI_FEEDBACK === '1',
  aiModel: process.env.AI_MODEL || 'claude-opus-5-5',
  distDir: path.join(here, '..', 'dist'),
  minWords: 20,
  maxWords: 5000,
};
