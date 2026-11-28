import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.AI_FEEDBACK = '0';
const { createApp } = await import('./index.js');
const { analyzeWriting } = await import('./feedback/analyze.js');

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const SAMPLE =
  'My favourite place is the old library near my house. i go there every weekend because it is very quiet and very nice. ' +
  'The tall windows let in a lot of light, and I definately feel calm when I read there. However, it can be cold in winter. ' +
  'In the end, it is the place where I recieve the most peace.';

test('signup, login, me, logout', async () => {
  const bad = await call('POST', '/auth/signup', { body: { name: '', email: 'nope', password: 'short' } });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.fields.email && bad.body.fields.password && bad.body.fields.name);

  const signup = await call('POST', '/auth/signup', { body: { name: 'Sam', email: 'Sam@Example.com', password: 'password123' } });
  assert.equal(signup.status, 201);
  assert.equal(signup.body.user.email, 'sam@example.com');

  const dup = await call('POST', '/auth/signup', { body: { name: 'Sam', email: 'sam@example.com', password: 'password123' } });
  assert.equal(dup.status, 409);

  const wrong = await call('POST', '/auth/login', { body: { email: 'sam@example.com', password: 'wrongpass' } });
  assert.equal(wrong.status, 401);

  const login = await call('POST', '/auth/login', { body: { email: 'SAM@example.com', password: 'password123' } });
  assert.equal(login.status, 200);
  const { token } = login.body;

  assert.equal((await call('GET', '/me', { token })).body.user.name, 'Sam');
  assert.equal((await call('PATCH', '/me', { token, body: { weeklyGoal: 5 } })).body.user.weeklyGoal, 5);
  assert.equal((await call('POST', '/auth/logout', { token })).status, 204);
  assert.equal((await call('GET', '/me', { token })).status, 401);
});

test('content endpoints', async () => {
  assert.ok((await call('GET', '/prompts')).body.prompts.length > 0);
  const courses = (await call('GET', '/courses')).body.courses;
  assert.ok(courses.length > 0 && courses[0].minutes > 0);
  assert.equal((await call('GET', `/courses/${courses[0].id}`)).body.course.id, courses[0].id);
  assert.equal((await call('GET', '/courses/nope')).status, 404);
  const emails = (await call('GET', '/words?topic=emails')).body.words;
  assert.ok(emails.length > 0 && emails.every((w) => w.topic === 'Emails'));
  assert.ok((await call('GET', '/words/today')).body.word.id);
});

test('writing sessions, feedback and progress', async () => {
  const { token } = (await call('POST', '/auth/signup', { body: { name: 'Ana', email: 'ana@example.com', password: 'password123' } })).body;

  assert.equal((await call('GET', '/sessions')).status, 401);
  const tooShort = await call('POST', '/sessions', { token, body: { prompt: 'Describe a calm place.', text: 'Too short.' } });
  assert.equal(tooShort.status, 400);

  const created = await call('POST', '/sessions', { token, body: { prompt: 'Describe a place that makes you feel calm.', text: SAMPLE } });
  assert.equal(created.status, 201);
  const fb = created.body.session.feedback;
  assert.equal(fb.observations.length, 4);
  assert.deepEqual(fb.mistakes.map((m) => m.word).sort(), ['definitely', 'receive']);
  assert.ok(fb.observations.find((o) => o.id === 'grammar').text.includes('“I”'));

  const list = await call('GET', '/sessions', { token });
  assert.equal(list.body.total, 1);
  assert.equal(list.body.sessions[0].text, undefined); // summary only

  const one = await call('GET', `/sessions/${created.body.session.id}`, { token });
  assert.equal(one.body.session.text, SAMPLE);

  const progress = (await call('GET', '/progress?tzOffset=0', { token })).body;
  assert.equal(progress.totals.totalSessions, 1);
  assert.equal(progress.totals.currentStreak, 1);
  assert.equal(progress.sessionsThisWeek, 1);
  assert.equal(progress.weekly.length, 6);
  assert.equal(progress.focusAreas.length, 4);

  // other users can't see it
  const other = (await call('POST', '/auth/signup', { body: { name: 'Bo', email: 'bo@example.com', password: 'password123' } })).body.token;
  assert.equal((await call('GET', `/sessions/${created.body.session.id}`, { token: other })).status, 404);
});

test('learning state', async () => {
  const { token } = (await call('POST', '/auth/signup', { body: { name: 'Li', email: 'li@example.com', password: 'password123' } })).body;
  let s = (await call('PUT', '/learning/flashcards/concise', { token })).body;
  assert.deepEqual(s.flashcardIds, ['concise']);
  s = (await call('PUT', '/learning/flashcards/concise/known', { token, body: { known: true } })).body;
  assert.deepEqual(s.knownIds, ['concise']);
  s = (await call('PUT', '/learning/flashcards/concise', { token })).body; // re-add resets known
  assert.deepEqual(s.knownIds, []);
  assert.equal((await call('PUT', '/learning/flashcards/not-a-word', { token })).status, 404);

  s = (await call('POST', '/learning/practice', { token, body: { wordIds: ['vivid', 'impact'] } })).body;
  assert.deepEqual(s.practiceIds, ['vivid', 'impact']);
  s = (await call('DELETE', '/learning/practice/vivid', { token })).body;
  assert.deepEqual(s.practiceIds, ['impact']);

  s = (await call('PUT', '/learning/milestones/writing-emails/subject', { token })).body;
  assert.deepEqual(s.completed, { 'writing-emails': ['subject'] });
  assert.equal((await call('PUT', '/learning/milestones/writing-emails/nope', { token })).status, 404);

  s = (await call('POST', '/learning/import', { token, body: { flashcardIds: ['vivid', 'bogus'], knownIds: ['vivid'] } })).body;
  assert.deepEqual(s.flashcardIds.sort(), ['concise', 'vivid']);
  assert.deepEqual(s.knownIds, ['vivid']);
});

test('analyzer praises clean writing more than messy writing', () => {
  const clean = analyzeWriting(
    'Every morning, I walk to the small park beside the river. The air feels fresh, and the birds sing loudly. ' +
      'However, the best moment comes when the sun rises over the water. Because the light changes so quickly, ' +
      'I always bring my notebook. Overall, this short walk gives me energy for the whole day.'
  );
  const messy = analyzeWriting('i think it is good. it is good. it is very very good and nice thing i like it alot it is good good');
  assert.ok(clean.scores.grammar > messy.scores.grammar);
  assert.ok(clean.scores.vocabulary > messy.scores.vocabulary);
});
