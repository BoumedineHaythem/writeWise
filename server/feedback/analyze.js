/**
 * Rule-based writing analysis. Runs locally with no external service, so the
 * app gives real (if simple) feedback out of the box.
 *
 * Returns per-area scores (0-100), observations, spelling mistakes found and a next step.
 */

export const FOCUS_AREAS = [
  { id: 'grammar', label: 'Grammar' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'structure', label: 'Sentence Structure' },
  { id: 'coherence', label: 'Coherence' },
];
export const areaLabel = (id) => FOCUS_AREAS.find((a) => a.id === id)?.label ?? id;

// Common learner misspellings → correct form.
const MISSPELLINGS = {
  definately: 'definitely', definatly: 'definitely', recieve: 'receive', recieved: 'received',
  seperate: 'separate', seperately: 'separately', neccessary: 'necessary', necesary: 'necessary',
  ocassion: 'occasion', occassion: 'occasion', accomodate: 'accommodate', untill: 'until',
  wich: 'which', becuase: 'because', beacause: 'because', beleive: 'believe', freind: 'friend',
  goverment: 'government', enviroment: 'environment', tommorow: 'tomorrow', tomorow: 'tomorrow',
  begining: 'beginning', occured: 'occurred', wierd: 'weird', thier: 'their', alot: 'a lot',
  realy: 'really', finaly: 'finally', truely: 'truly', arguement: 'argument', calender: 'calendar',
  embarass: 'embarrass', existance: 'existence', foward: 'forward', grammer: 'grammar',
  independant: 'independent', knowlege: 'knowledge', libary: 'library', noticable: 'noticeable',
  persue: 'pursue', posession: 'possession', prefered: 'preferred', publically: 'publicly',
  succesful: 'successful', successfull: 'successful', suprise: 'surprise', writting: 'writing',
  diffrent: 'different', intresting: 'interesting', beautifull: 'beautiful', comming: 'coming',
};

const WEAK_WORDS = {
  good: ['helpful', 'enjoyable', 'valuable'], nice: ['pleasant', 'welcoming', 'thoughtful'],
  bad: ['unpleasant', 'harmful', 'disappointing'], very: ['(a stronger adjective)'],
  really: ['(a stronger adjective)'], thing: ['(the specific noun)'], things: ['(the specific nouns)'],
  stuff: ['(the specific nouns)'], big: ['huge', 'significant', 'vast'], got: ['received', 'became', 'reached'],
  a_lot: ['many', 'much', 'plenty of'], happy: ['delighted', 'content', 'cheerful'], sad: ['upset', 'disappointed', 'gloomy'],
};

const TRANSITIONS = [
  'however', 'therefore', 'moreover', 'furthermore', 'for example', 'for instance', 'in addition',
  'also', 'because', 'although', 'though', 'first', 'firstly', 'second', 'secondly', 'then', 'next',
  'finally', 'in conclusion', 'as a result', 'on the other hand', 'meanwhile', 'afterwards', 'later',
  'so', 'but', 'while', 'since', 'instead', 'overall', 'in fact', 'especially', 'after', 'before',
];

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const tokenize = (text) => text.toLowerCase().match(/[a-z']+/g) || [];

export function countWords(text) {
  const t = String(text || '').trim();
  return t === '' ? 0 : t.split(/\s+/).length;
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=["'(]?[A-Za-z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function quote(s, max = 60) {
  const t = s.trim();
  return t.length > max ? `“${t.slice(0, max - 1)}…”` : `“${t}”`;
}

function analyzeGrammar(text, sentences, words) {
  const issues = [];
  const mistakes = [];

  const seen = new Set();
  for (const w of words) {
    const fix = MISSPELLINGS[w];
    if (fix && !seen.has(w)) {
      seen.add(w);
      mistakes.push({ mistake: w, word: fix });
    }
  }
  if (mistakes.length) {
    issues.push(`Check your spelling: ${mistakes.slice(0, 4).map((m) => `“${m.mistake}” → “${m.word}”`).join(', ')}.`);
  }

  const lowerI = text.match(/(^|[\s(])i(?=[\s',.!?;:]|$)/g);
  if (lowerI) issues.push('The pronoun “I” is always written with a capital letter.');

  const repeated = text.match(/\b(\w+)\s+\1\b/gi)?.filter((m) => !/^(that that|had had)$/i.test(m));
  if (repeated?.length) issues.push(`A word is repeated by accident: ${quote(repeated[0])}.`);

  const lowerStart = sentences.filter((s) => /^[a-z]/.test(s));
  if (lowerStart.length) issues.push(`Start every sentence with a capital letter, e.g. ${quote(lowerStart[0], 40)}.`);

  const aBeforeVowel = text.match(/\ba\s+(?:[aeio]\w+|u(?!ni|se|su|ro|ti)\w*|hour\w*|honest\w*)/gi);
  if (aBeforeVowel?.length) issues.push(`Use “an” before a vowel sound: ${quote(aBeforeVowel[0])} → “an ${aBeforeVowel[0].split(/\s+/)[1]}”.`);

  const agreement = text.match(/\b(he|she|it)\s+(have|do|go|are|were|don't)\b/gi);
  if (agreement?.length) issues.push(`Check subject-verb agreement: ${quote(agreement[0])} (he/she/it takes “has”, “does”, “goes”, “is”, “doesn't”).`);

  const lastChar = text.trim().slice(-1);
  if (!/[.!?"')\]]/.test(lastChar)) issues.push('Finish your last sentence with a full stop.');

  if (/ ,|\s\./.test(text)) issues.push('Put commas and full stops straight after the word, with no space before them.');

  const per100 = (issues.length + mistakes.length * 0.5) / Math.max(1, words.length / 100);
  return { score: clamp(100 - per100 * 12), issues, mistakes };
}

function analyzeVocabulary(words) {
  const issues = [];
  const unique = new Set(words);
  const diversity = unique.size / Math.max(1, words.length);
  const counts = {};
  const joined = ` ${words.join(' ')} `;
  for (const key of Object.keys(WEAK_WORDS)) {
    const phrase = key.replace('_', ' ');
    const n = joined.split(` ${phrase} `).length - 1;
    if (n) counts[key] = n;
  }
  const weakTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const topWeak = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (topWeak.length) {
    issues.push(
      topWeak
        .map(([k, n]) => `“${k.replace('_', ' ')}”${n > 1 ? ` (${n}×)` : ''} could become ${WEAK_WORDS[k].map((s) => (s.startsWith('(') ? s : `“${s}”`)).join(' or ')}`)
        .join('; ') + '.'
    );
  }

  const contentCounts = {};
  for (const w of words) if (w.length > 4) contentCounts[w] = (contentCounts[w] || 0) + 1;
  const overused = Object.entries(contentCounts).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1])[0];
  if (overused) issues.push(`You use “${overused[0]}” ${overused[1]} times. Try a synonym or a pronoun in some places.`);

  const longWords = words.filter((w) => w.length >= 8).length / Math.max(1, words.length);
  // Shorter texts naturally have higher type/token ratio; adjust the target for length.
  const target = words.length < 80 ? 0.7 : words.length < 200 ? 0.6 : 0.5;
  const score = clamp(60 + (diversity - target) * 120 + longWords * 120 - (weakTotal / Math.max(1, words.length)) * 300);
  return { score, issues, diversity };
}

function analyzeStructure(sentences) {
  const issues = [];
  const lengths = sentences.map((s) => countWords(s));
  const avg = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const variance = lengths.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(1, lengths.length);
  const sd = Math.sqrt(variance);

  const long = sentences.filter((s) => countWords(s) > 35);
  if (long.length) issues.push(`Some sentences are very long (35+ words). Split ${quote(long[0], 45)} into two.`);
  if (avg < 8 && sentences.length >= 3) issues.push('Most sentences are short. Join some with “because”, “although” or “which” to show how ideas connect.');
  if (sd < 3 && sentences.length >= 4) issues.push('Your sentences are all a similar length. Mix short sentences with longer ones for rhythm.');

  const starts = sentences.map((s) => s.split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
  const startCounts = {};
  for (const w of starts) startCounts[w] = (startCounts[w] || 0) + 1;
  const repeatedStart = Object.entries(startCounts).find(([, n]) => n >= 3 && n / starts.length > 0.3);
  if (repeatedStart) issues.push(`${repeatedStart[1]} sentences begin with “${repeatedStart[0]}”. Vary how your sentences start.`);

  let score = 85;
  if (avg < 8) score -= (8 - avg) * 5;
  if (avg > 25) score -= (avg - 25) * 3;
  score += Math.min(10, sd * 1.5) - 5;
  score -= long.length * 6 + (repeatedStart ? 10 : 0);
  if (sentences.length < 2) score -= 20;
  return { score: clamp(score), issues, avgLength: avg };
}

function analyzeCoherence(text, sentences, words, paragraphs) {
  const issues = [];
  const lower = ` ${words.join(' ')} `;
  const found = TRANSITIONS.filter((t) => lower.includes(` ${t} `));
  const perSentence = found.length / Math.max(1, sentences.length);
  if (found.length === 0) issues.push('Add linking words such as “because”, “however” or “for example” to guide the reader between ideas.');
  else if (perSentence < 0.15 && sentences.length > 5) issues.push(`You use some linking words (${found.slice(0, 3).map((t) => `“${t}”`).join(', ')}). A few more would make the flow smoother.`);

  if (paragraphs.length === 1 && words.length > 150) issues.push('This is one long block. Split it into paragraphs, one main idea each.');

  const last = sentences[sentences.length - 1] || '';
  if (sentences.length >= 4 && !/\b(so|overall|in conclusion|finally|that is why|this is why|in the end|to sum up)\b/i.test(last)) {
    issues.push('End with a sentence that wraps up your main idea.');
  }

  let score = 55 + Math.min(30, perSentence * 100) + (paragraphs.length > 1 ? 10 : 0);
  if (words.length < 60) score -= 5;
  score -= issues.length * 6;
  return { score: clamp(score), issues, transitions: found };
}

const PRAISE = {
  grammar: 'Your grammar is accurate: I didn’t spot common errors.',
  vocabulary: 'You use a good range of words and avoid repeating yourself.',
  structure: 'Your sentences have a nice mix of lengths and are easy to follow.',
  coherence: 'Your ideas connect well, and linking words guide the reader.',
};

const NEXT_STEPS = {
  grammar: 'Next session, reread your draft once just for capitals, spelling and verb endings before you submit.',
  vocabulary: 'Next session, replace three everyday words (like “good” or “very”) with more precise ones. Explore has words to try.',
  structure: 'Next session, aim for at least one short sentence and one longer sentence that joins two ideas with “because” or “although”.',
  coherence: 'Next session, plan three points first, and use a linking word at the start of each new idea.',
};

/**
 * @param {string} text plain text of the writing
 * @param {string} prompt the prompt it answers
 */
export function analyzeWriting(text, prompt = '') {
  const clean = String(text || '').replace(/\r\n/g, '\n');
  const paragraphs = clean.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  const sentences = splitSentences(clean);
  const words = tokenize(clean);

  const grammar = analyzeGrammar(clean, sentences, words);
  const vocabulary = analyzeVocabulary(words);
  const structure = analyzeStructure(sentences);
  const coherence = analyzeCoherence(clean, sentences, words, paragraphs);

  const results = { grammar, vocabulary, structure, coherence };
  const scores = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.score]));
  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0];
  const strongest = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

  const observations = FOCUS_AREAS.map((area) => {
    const { issues } = results[area.id];
    return {
      id: area.id,
      category: area.label,
      score: scores[area.id],
      text: issues.length ? issues.slice(0, 2).join(' ') : PRAISE[area.id],
    };
  });

  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);
  const opener =
    avg >= 80 ? 'Excellent work!' : avg >= 65 ? 'Great effort!' : avg >= 50 ? 'Good start!' : 'Thanks for writing!';
  const promptWords = new Set(tokenize(prompt).filter((w) => w.length > 4));
  const onTopic = promptWords.size === 0 || [...promptWords].some((w) => words.includes(w) || words.includes(w.replace(/s$/, '')));
  const overallComment =
    `${opener} You wrote ${words.length} words in ${sentences.length} ${sentences.length === 1 ? 'sentence' : 'sentences'}. ` +
    `Your strongest area this time is ${areaLabel(strongest).toLowerCase()}; ` +
    `${areaLabel(weakest).toLowerCase()} is the best place to focus next.` +
    (onTopic ? '' : ' Make sure your writing answers the prompt directly.');

  return {
    source: 'rules',
    overallComment,
    observations,
    mistakes: grammar.mistakes,
    scores,
    focusArea: weakest,
    nextStep: NEXT_STEPS[weakest],
  };
}
