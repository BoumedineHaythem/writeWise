// Small client for the Writewise backend (server/). In dev, Vite proxies /api to it.

const TOKEN_KEY = 'ww-token';

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: the session lasts until the tab closes */
  }
}

export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

async function request(method, path, body) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the Writewise server. Is it running?');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) setToken(null);
    throw new ApiError(res.status, data?.error || `Request failed (${res.status}).`, data?.fields);
  }
  return data;
}

const enc = encodeURIComponent;

export const api = {
  // auth
  async signup(name, email, password) {
    const data = await request('POST', '/auth/signup', { name, email, password });
    setToken(data.token);
    return data.user;
  },
  async login(email, password) {
    const data = await request('POST', '/auth/login', { email, password });
    setToken(data.token);
    return data.user;
  },
  async logout() {
    try {
      await request('POST', '/auth/logout');
    } finally {
      setToken(null);
    }
  },
  me: () => request('GET', '/me').then((d) => d.user),
  updateMe: (changes) => request('PATCH', '/me', changes).then((d) => d.user),

  // content
  prompts: () => request('GET', '/prompts').then((d) => d.prompts),

  // writing sessions
  submitWriting: (prompt, text, blocks) => request('POST', '/sessions', { prompt, text, blocks }).then((d) => d.session),
  sessions: (limit = 20) => request('GET', `/sessions?limit=${limit}`),
  session: (id) => request('GET', `/sessions/${enc(id)}`).then((d) => d.session),
  progress: () => request('GET', `/progress?tzOffset=${new Date().getTimezoneOffset()}`),

  // learning state (each call returns the full updated state)
  learning: () => request('GET', '/learning'),
  importLearning: (state) => request('POST', '/learning/import', state),
  addFlashcard: (id) => request('PUT', `/learning/flashcards/${enc(id)}`),
  removeFlashcard: (id) => request('DELETE', `/learning/flashcards/${enc(id)}`),
  setKnown: (id, known) => request('PUT', `/learning/flashcards/${enc(id)}/known`, { known }),
  addPractice: (id) => request('PUT', `/learning/practice/${enc(id)}`),
  addPracticeMany: (wordIds) => request('POST', '/learning/practice', { wordIds }),
  removePractice: (id) => request('DELETE', `/learning/practice/${enc(id)}`),
  addMilestone: (courseId, milestoneId) => request('PUT', `/learning/milestones/${enc(courseId)}/${enc(milestoneId)}`),
  removeMilestone: (courseId, milestoneId) => request('DELETE', `/learning/milestones/${enc(courseId)}/${enc(milestoneId)}`),
};
