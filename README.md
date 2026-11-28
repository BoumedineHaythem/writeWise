# Writewise

An English writing-practice app: React + Vite frontend (`src/`) and a Node.js backend (`server/`).

## Running it

Requires Node.js 22.5+ (the backend uses the built-in `node:sqlite`).

```bash
npm install
npm run server   # API on http://localhost:3001 (restarts on file changes)
npm run dev      # frontend on http://localhost:5173, proxies /api to the server
```

Production: `npm run build` then `npm start`. The server then serves the built frontend from `dist/` and the API from the same port.

Tests: `npm test` (runs against an in-memory database).

## Backend

- **Express 5** + **SQLite** (`node:sqlite`, no native build). The database file is `server/data/writewise.db`, created on first start.
- **Auth:** email + password (scrypt hashed). Login returns a random bearer token. Only its SHA-256 hash is stored, and tokens expire after 30 days.
- **Feedback:** a built-in rule-based analyzer scores each piece on grammar, vocabulary, sentence structure and coherence. It also flags common misspellings, weak words, very long or repetitive sentences, and missing linking words.
  - Optional AI feedback through Claude: set `AI_FEEDBACK=1` and `ANTHROPIC_API_KEY`. If that call fails, the server falls back to the built-in analyzer.
- **Content** (courses, words, prompts) is read from `src/data/`, so the frontend and backend share one source.

### Environment variables

| Variable | Default | |
|---|---|---|
| `PORT` | `3001` | |
| `DB_PATH` | `server/data/writewise.db` | `:memory:` for a throwaway DB |
| `TOKEN_TTL_DAYS` | `30` | |
| `AI_FEEDBACK` | off | `1` to use Claude for feedback |
| `AI_MODEL` | `claude-opus-5-5` | |
| `ANTHROPIC_API_KEY` | | needed only when `AI_FEEDBACK=1` |

### API

All routes are under `/api`. Routes marked 🔒 need `Authorization: Bearer <token>`.

| Method | Path | |
|---|---|---|
| POST | `/auth/signup` | `{name, email, password}` → `{token, user}` |
| POST | `/auth/login` | `{email, password}` → `{token, user}` |
| POST | `/auth/logout` 🔒 | revokes the token |
| GET / PATCH / DELETE | `/me` 🔒 | profile (`name`, `weeklyGoal`); DELETE removes the account and its data |
| GET | `/prompts` | writing prompts |
| GET | `/courses`, `/courses/:id` | courses and milestones |
| GET | `/words?topic=&level=&q=`, `/words/today` | vocabulary |
| POST | `/sessions` 🔒 | `{prompt, text, blocks?}` → saved session with feedback (20+ words) |
| GET | `/sessions?limit=&offset=` 🔒 | history (summaries) |
| GET / DELETE | `/sessions/:id` 🔒 | one session with text and feedback |
| GET | `/progress?tzOffset=` 🔒 | totals, streaks, weekly words, focus-area scores |
| GET | `/learning` 🔒 | flashcards, known cards, practice list, finished milestones |
| POST | `/learning/import` 🔒 | merge state saved in the browser before login |
| PUT / DELETE | `/learning/flashcards/:wordId` 🔒 | add or remove a flashcard |
| PUT | `/learning/flashcards/:wordId/known` 🔒 | `{known: boolean}` |
| PUT / DELETE | `/learning/practice/:wordId` 🔒, POST `/learning/practice` `{wordIds}` | practice list |
| PUT / DELETE | `/learning/milestones/:courseId/:milestoneId` 🔒 | course progress |

Errors are returned as `{error, fields?}`, where `fields` maps an input name to a message.
