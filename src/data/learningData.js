// Content for Courses and Explore. Edit freely: add courses, milestones and words here.

export const COURSES = [
  {
    id: 'writing-from-prompts',
    title: 'Writing from prompts',
    tagline: 'Turn any prompt into a clear, finished piece.',
    level: 'Beginner',
    milestones: [
      {
        id: 'read',
        title: 'Read the prompt closely',
        minutes: 8,
        summary: 'Find the task words before you write a single sentence.',
        notes: [
          'Underline the task words: describe, explain, compare, argue, tell.',
          'Circle the details: who, where, when, how long.',
          'Notice the tense. A story is usually in the past, advice is usually in the present.',
          'Write the prompt in your own words in one short line.',
        ],
        keyIdea: 'If you misread the task, even perfect grammar will not save the piece.',
        tryIt: 'Pick any prompt in the workspace and write its task in one sentence of your own.',
      },
      {
        id: 'plan',
        title: 'Plan in three minutes',
        minutes: 10,
        summary: 'A tiny plan makes the draft much easier.',
        notes: [
          'Write one main idea in a single sentence.',
          'Add three supports: reasons, examples or details.',
          'Put them in order: strongest last, or in time order for stories.',
          'Decide how you will begin and how you will end.',
        ],
        keyIdea: 'One idea, three supports. Everything else is decoration.',
        tryIt: 'Make a four-line plan for a prompt before you write.',
      },
      {
        id: 'draft',
        title: 'Draft without stopping',
        minutes: 12,
        summary: 'Get the ideas out first. Fix them later.',
        notes: [
          'Set a timer for ten minutes and keep your hands moving.',
          'Use simple words you know. You can upgrade them later.',
          'If you are stuck, write a note like [add detail] and move on.',
          'Do not delete. A messy draft is a useful draft.',
        ],
        keyIdea: 'A finished messy draft beats a perfect first paragraph.',
        tryIt: 'Write for ten minutes in the workspace with no editing.',
      },
      {
        id: 'revise',
        title: 'Revise and polish',
        minutes: 12,
        summary: 'Fix one thing at a time.',
        notes: [
          'First pass: does it answer the prompt?',
          'Second pass: is each paragraph about one idea?',
          'Third pass: grammar, spelling and word choice.',
          'Read it out loud. Your ear finds mistakes your eyes skip.',
        ],
        keyIdea: 'Revise in layers: meaning first, then structure, then words.',
        tryIt: 'Take an old draft and do the three passes in order.',
      },
    ],
  },
  {
    id: 'writing-emails',
    title: 'Writing emails',
    tagline: 'Clear, polite emails that get a reply.',
    level: 'Beginner',
    milestones: [
      {
        id: 'subject',
        title: 'Subject lines and greetings',
        minutes: 8,
        summary: 'Help the reader understand your email before they open it.',
        notes: [
          'Write a subject line that states the purpose: “Question about Friday’s meeting”.',
          'Keep it short, about eight words or fewer.',
          'Use “Dear Ms Rossi” for formal and “Hi Sam” for friendly.',
          'If you do not know the name, “Hello” or “Dear Hiring Team” works.',
        ],
        keyIdea: 'A good subject line is a tiny summary.',
        tryIt: 'Write three subject lines for the same email: formal, friendly and urgent.',
      },
      {
        id: 'body',
        title: 'One purpose, short paragraphs',
        minutes: 10,
        summary: 'Make the message easy to scan.',
        notes: [
          'State your reason in the first two lines.',
          'One idea per paragraph, two or three sentences each.',
          'Put dates, times and numbers where they are easy to see.',
          'End the body with a clear request: what should the reader do?',
        ],
        keyIdea: 'Say what you want early, then give the details.',
        tryIt: 'Rewrite a long email you have sent so the purpose is in the first line.',
      },
      {
        id: 'tone',
        title: 'Tone and useful phrases',
        minutes: 10,
        summary: 'Sound polite and natural, not stiff.',
        notes: [
          'Formal: “I am writing to ask about…”, “I would be grateful if…”.',
          'Friendly: “Just checking in…”, “Thanks so much for…”.',
          'Avoid very long sentences and heavy words you would never say aloud.',
          'Soften requests: “Could you…?” sounds better than “You must…”.',
        ],
        keyIdea: 'Match the tone to the reader, not to the dictionary.',
        tryIt: 'Write the same request twice: once to a manager and once to a friend.',
      },
      {
        id: 'close',
        title: 'Closing and proofreading',
        minutes: 8,
        summary: 'Finish well and catch mistakes before you send.',
        notes: [
          'Close with thanks or a next step: “I look forward to your reply.”',
          'Sign off: “Kind regards” (formal), “Best” or “Thanks” (friendly).',
          'Check the name, the attachment and the dates.',
          'Read it aloud once, then send.',
        ],
        keyIdea: 'Proofread the details that cost you the most when they are wrong.',
        tryIt: 'Proofread an email using the four checks above.',
      },
    ],
  },
  {
    id: 'writing-scenarios',
    title: 'Writing scenes and scenarios',
    tagline: 'Short scenes with a place, a goal and a change.',
    level: 'Intermediate',
    milestones: [
      {
        id: 'setting',
        title: 'Set the scene',
        minutes: 10,
        summary: 'Tell the reader who, where and when.',
        notes: [
          'Open with a place and a time, not a long background.',
          'Use two or three senses: what can they see, hear, smell?',
          'Choose specific nouns: “a cracked blue mug”, not “a thing”.',
          'Keep the setting short. Action should begin quickly.',
        ],
        keyIdea: 'A few exact details feel richer than many vague ones.',
        tryIt: 'Describe a kitchen at 6 a.m. in five sentences using three senses.',
      },
      {
        id: 'goal',
        title: 'Give characters a goal',
        minutes: 10,
        summary: 'A scene moves when someone wants something.',
        notes: [
          'Decide what your character wants in this scene.',
          'Add an obstacle: a person, a rule, a lack of time.',
          'Show feelings through actions, not labels: “she folded the note twice”.',
          'Keep the goal small and clear.',
        ],
        keyIdea: 'Want plus obstacle equals story.',
        tryIt: 'Write a scene where someone must return a lost wallet but is running late.',
      },
      {
        id: 'dialogue',
        title: 'Dialogue that sounds real',
        minutes: 12,
        summary: 'People talk in short, uneven, interrupted lines.',
        notes: [
          'Read each line aloud. Cut anything you would never say.',
          'Use “said” most of the time. Let the words carry the emotion.',
          'Start a new line each time the speaker changes.',
          'Let characters avoid the question sometimes. Real people do.',
        ],
        keyIdea: 'Dialogue is action. Every line should want something.',
        tryIt: 'Write a ten-line conversation where one person is hiding something.',
      },
      {
        id: 'ending',
        title: 'End the scene with a change',
        minutes: 8,
        summary: 'Something should be different when the scene ends.',
        notes: [
          'Ask: what changed? A choice, a secret, a feeling, a plan.',
          'Stop a little early, right after the key moment.',
          'Leave a small question for the next scene.',
          'Check that the ending connects to the goal you set.',
        ],
        keyIdea: 'If nothing changes, the scene can probably be cut.',
        tryIt: 'Take your scene from the goal milestone and rewrite its last three lines to show a change.',
      },
    ],
  },
  {
    id: 'writing-a-novel',
    title: 'Writing a novel',
    tagline: 'From first idea to a revised first chapter.',
    level: 'Advanced',
    milestones: [
      {
        id: 'premise',
        title: 'Find your premise',
        minutes: 12,
        summary: 'One sentence that holds the whole book.',
        notes: [
          'Use the pattern: a character wants X, but Y stands in the way.',
          'Choose an idea you can live with for months.',
          'Write your premise on a card and keep it visible.',
          'Test it: could you tell it to a friend in ten seconds?',
        ],
        keyIdea: 'A strong premise makes every later decision easier.',
        tryIt: 'Write three different one-sentence premises and choose one.',
      },
      {
        id: 'characters',
        title: 'Build characters and conflict',
        minutes: 15,
        summary: 'Readers follow people, not plots.',
        notes: [
          'Give your main character a want, a need and a fear.',
          'Make the opponent believable. They think they are right.',
          'Create two supporting characters who push in different directions.',
          'List what your hero would never do, then make them do it.',
        ],
        keyIdea: 'Conflict comes from characters who want different things.',
        tryIt: 'Fill in a character card: want, need, fear, secret, habit.',
      },
      {
        id: 'plot',
        title: 'Plan the plot in three acts',
        minutes: 15,
        summary: 'A simple map keeps a long project moving.',
        notes: [
          'Act one: show the normal world and the problem that disturbs it.',
          'Act two: raise the difficulty, with a turning point in the middle.',
          'Act three: the final choice, the result, and the new normal.',
          'Write one line per chapter. Plans can change.',
        ],
        keyIdea: 'A plan is a map, not a cage.',
        tryIt: 'Write a nine-line outline: three lines for each act.',
      },
      {
        id: 'chapter',
        title: 'Write the first chapter',
        minutes: 20,
        summary: 'Start close to the trouble.',
        notes: [
          'Open with a character who is already doing something.',
          'Hint at the problem within the first page.',
          'Introduce only the characters we need right now.',
          'Set a daily word goal you can actually keep, such as 300 words.',
        ],
        keyIdea: 'Begin where things start to go wrong.',
        tryIt: 'Write 300 words of chapter one in the workspace.',
      },
      {
        id: 'revise-book',
        title: 'Revise the whole book',
        minutes: 15,
        summary: 'Zoom out first, then zoom in.',
        notes: [
          'Let the draft rest for a week before you reread it.',
          'First read for story: pace, gaps and anything confusing.',
          'Second read for scenes: does each one change something?',
          'Last read for sentences: repeated words, clichés, grammar.',
        ],
        keyIdea: 'Big problems first, small problems last.',
        tryIt: 'List three things to fix in a draft: one story, one scene, one sentence.',
      },
    ],
  },
];

export const TOPICS = ['Emails', 'Stories', 'Everyday', 'Academic'];

// `example` must contain `word` exactly: Practice hides it to make a fill-in-the-blank.
export const WORDS = [
  { id: 'concise', word: 'concise', pos: 'adjective', level: 'B2', topic: 'Emails', definition: 'Giving a lot of information in a few clear words.', example: 'Keep your email concise so the reader can reply quickly.' },
  { id: 'courteous', word: 'courteous', pos: 'adjective', level: 'C1', topic: 'Emails', definition: 'Polite and respectful toward other people.', example: 'A courteous reply makes a good impression, even in a short message.' },
  { id: 'attach', word: 'attach', pos: 'verb', level: 'B1', topic: 'Emails', definition: 'To add a file to an email or message.', example: 'Please attach your CV to the email before you send it.' },
  { id: 'regarding', word: 'regarding', pos: 'preposition', level: 'B2', topic: 'Emails', definition: 'About; used to introduce the subject of a message.', example: 'I am writing regarding the meeting on Thursday.' },
  { id: 'follow-up', word: 'follow up', pos: 'phrasal verb', level: 'B2', topic: 'Emails', definition: 'To contact someone again about something you discussed earlier.', example: 'I will follow up with you on Monday if I hear nothing.' },
  { id: 'apologise', word: 'apologise', pos: 'verb', level: 'B1', topic: 'Emails', definition: 'To say that you are sorry about something.', example: 'I want to apologise for the late reply.' },
  { id: 'vivid', word: 'vivid', pos: 'adjective', level: 'B2', topic: 'Stories', definition: 'Producing strong, clear pictures in the mind.', example: 'She painted a vivid picture of the old market.' },
  { id: 'suspense', word: 'suspense', pos: 'noun', level: 'B2', topic: 'Stories', definition: 'An exciting feeling of waiting to find out what will happen.', example: 'The long silence filled the room with suspense.' },
  { id: 'reluctant', word: 'reluctant', pos: 'adjective', level: 'B2', topic: 'Stories', definition: 'Not wanting to do something and slow to do it.', example: 'He was reluctant to open the door.' },
  { id: 'glimpse', word: 'glimpse', pos: 'noun', level: 'B2', topic: 'Stories', definition: 'A very brief look at someone or something.', example: 'She caught a glimpse of a face in the window.' },
  { id: 'whisper', word: 'whisper', pos: 'verb', level: 'B1', topic: 'Stories', definition: 'To speak very quietly so that few people can hear.', example: 'They had to whisper so nobody would hear.' },
  { id: 'tension', word: 'tension', pos: 'noun', level: 'B2', topic: 'Stories', definition: 'A feeling of worry or excitement when something might go wrong.', example: 'You could feel the tension before the final scene.' },
  { id: 'appreciate', word: 'appreciate', pos: 'verb', level: 'B1', topic: 'Everyday', definition: 'To be thankful for something.', example: 'I really appreciate your help with my essay.' },
  { id: 'mention', word: 'mention', pos: 'verb', level: 'B1', topic: 'Everyday', definition: 'To say something briefly, without going into detail.', example: 'Did I mention that the lake is beautiful in autumn?' },
  { id: 'reliable', word: 'reliable', pos: 'adjective', level: 'B1', topic: 'Everyday', definition: 'Able to be trusted to do what you expect.', example: 'A reliable friend always replies when you need advice.' },
  { id: 'postpone', word: 'postpone', pos: 'verb', level: 'B2', topic: 'Everyday', definition: 'To move an event to a later time.', example: 'We had to postpone the meeting until next week.' },
  { id: 'evidence', word: 'evidence', pos: 'noun', level: 'B2', topic: 'Academic', definition: 'Facts or signs that show something is true.', example: 'Good writing supports every claim with evidence.' },
  { id: 'conclude', word: 'conclude', pos: 'verb', level: 'B2', topic: 'Academic', definition: 'To finish something, or to decide something after thinking about it.', example: 'You can conclude your essay with one strong sentence.' },
  { id: 'summarise', word: 'summarise', pos: 'verb', level: 'B2', topic: 'Academic', definition: 'To give the main points in a short form.', example: 'Try to summarise the article in two sentences.' },
  { id: 'impact', word: 'impact', pos: 'noun', level: 'B2', topic: 'Academic', definition: 'The strong effect that something has on someone or something.', example: 'One small habit can have a big impact on your writing.' },
];

export const getCourse = (id) => COURSES.find((c) => c.id === id);
export const getWord = (id) => WORDS.find((w) => w.id === id);
export const courseMinutes = (course) => course.milestones.reduce((sum, m) => sum + m.minutes, 0);

/** Replace the word in its example sentence with a blank, for Practice. */
export function maskWord(example, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return example.replace(new RegExp(escaped, 'i'), '____');
}

/** A new "word of the day" every calendar day. */
export function wordOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return WORDS[dayOfYear % WORDS.length];
}