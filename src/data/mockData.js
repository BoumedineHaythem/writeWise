// =============================================
// Writewise — Mock Data (prototype only)
// =============================================

export const mockUser = {
  name: 'Alex',
  email: 'alex@example.com',
  joinedDate: 'October 2026',
  weeklyGoal: 3,       // sessions per week
  sessionsThisWeek: 2,
};

export const mockFocusAreas = [
  {
    id: 'grammar',
    label: 'Grammar',
    description: 'Sentence structure, verb tenses, and punctuation.',
    icon: '📝',
    progress: 68,
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    description: 'Word choice, range, and precision.',
    icon: '📚',
    progress: 52,
  },
  {
    id: 'structure',
    label: 'Sentence Structure',
    description: 'Variety, flow, and clarity across sentences.',
    icon: '🔗',
    progress: 41,
  },
  {
    id: 'coherence',
    label: 'Coherence',
    description: 'How well ideas connect and flow across paragraphs.',
    icon: '🧩',
    progress: 35,
  },
];

export const mockRecentActivity = [
  {
    id: 1,
    date: 'Nov 6, 2026',
    prompt: 'Describe a place that makes you feel calm.',
    wordCount: 142,
    focusArea: 'Grammar',
    status: 'Reviewed',
  },
  {
    id: 2,
    date: 'Nov 4, 2026',
    prompt: 'What is one skill you would like to improve?',
    wordCount: 98,
    focusArea: 'Vocabulary',
    status: 'Reviewed',
  },
  {
    id: 3,
    date: 'Nov 2, 2026',
    prompt: 'Tell me about a memorable meal.',
    wordCount: 115,
    focusArea: 'Sentence Structure',
    status: 'Reviewed',
  },
];

export const mockWritingPrompts = [
  'Describe a place that makes you feel peaceful. What do you see, hear, and feel there?',
  'What is one goal you are working toward right now? Why does it matter to you?',
  'Write about a person who has had a positive influence on your life.',
  'Describe a challenge you faced and how you approached it.',
  'What is a hobby or activity you enjoy? Explain why it is meaningful to you.',
];

export const mockSampleFeedback = {
  disclaimer:
    '⚠️ This is sample feedback for prototype purposes only. No real analysis has been performed.',
  overallComment:
    'Great effort! Your writing communicates your ideas clearly. Here are a few areas to explore as you keep practising.',
  observations: [
    {
      id: 1,
      category: 'Grammar',
      icon: '📝',
      text: 'Most sentences are grammatically correct. Watch for subject-verb agreement in longer sentences (e.g., "The team are" → "The team is").',
    },
    {
      id: 2,
      category: 'Vocabulary',
      icon: '📚',
      text: 'You used some vivid word choices. Try varying adjectives like "good" or "nice" with more specific alternatives such as "refreshing" or "reassuring".',
    },
    {
      id: 3,
      category: 'Sentence Structure',
      icon: '🔗',
      text: 'Your sentences are clear and readable. Adding an occasional complex sentence can make writing feel more dynamic.',
    },
  ],
  nextStep:
    'Try your next session focusing on vocabulary — aim to use at least three new words you have recently learned.',
};

export const mockProgressSessions = [
  { week: 'Week 1', sessions: 1, words: 95 },
  { week: 'Week 2', sessions: 2, words: 230 },
  { week: 'Week 3', sessions: 2, words: 275 },
  { week: 'Week 4', sessions: 3, words: 420 },
  { week: 'Week 5', sessions: 2, words: 355 },
  { week: 'Week 6 (this week)', sessions: 2, words: 240 },
];

export const mockTotalStats = {
  totalSessions: 12,
  totalWords: 1615,
  currentStreak: 4,  // days
  longestStreak: 7,
};

/** Full list of completed sessions shown on the Progress page */
export const mockCompletedSessions = [
  { date: 'Nov 6, 2026', prompt: 'Describe a place that makes you feel calm.', words: 142, focus: 'Grammar' },
  { date: 'Nov 4, 2026', prompt: 'What is one skill you would like to improve?', words: 98, focus: 'Vocabulary' },
  { date: 'Nov 2, 2026', prompt: 'Tell me about a memorable meal.', words: 115, focus: 'Sentence Structure' },
  { date: 'Oct 29, 2026', prompt: 'Write about a person who has had a positive influence on your life.', words: 134, focus: 'Coherence' },
  { date: 'Oct 26, 2026', prompt: 'Describe a challenge you faced and how you approached it.', words: 121, focus: 'Grammar' },
];

export const mockBenefits = [
  {
    icon: '✍️',
    title: 'Practise at your own pace',
    body: 'Write whenever it suits you. Short daily sessions build real habits over time.',
  },
  {
    icon: '🎯',
    title: 'Targeted feedback',
    body: 'Focus on the areas that matter most to you — grammar, vocabulary, or fluency.',
  },
  {
    icon: '📈',
    title: 'See your progress',
    body: 'A clear progress view shows how far you have come, session by session.',
  },
  {
    icon: '🌍',
    title: 'Built for English learners',
    body: 'Friendly, encouraging language that meets you where you are.',
  },
];
