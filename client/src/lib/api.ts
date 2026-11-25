export interface User {
  id: string
  name: string
  email: string
  role?: string
  createdAt?: string
}

export interface Exercise {
  id: string
  title: string
  prompt: string
  category:
    | 'interview'
    | 'read-aloud'
    | 'presentation'
    | 'casual'
    | 'behavioral'
    | 'professional-introduction'
    | 'situational'
    | 'extempore'
    | 'pronunciation'
    | 'rapid-fire'
  difficulty: 'easy' | 'medium' | 'hard'
  prepTimeSeconds: number
  timeLimitSeconds: number
  description?: string
  tags?: string[]
  // Backend fields (from MongoDB)
  type?: string
  referenceText?: string
  targetSkills?: string[]
  difficultyScore?: number
}

export interface SessionMetrics {
  // Speech-specific (null for text mode)
  wpm?: number | null
  articulation_wpm?: number | null
  pause_count?: number | null
  long_pause_count?: number | null
  pause_rate_per_min?: number | null
  pause_ratio?: number | null
  mean_length_of_run?: number | null
  filler_count?: number | null
  fillers_per_minute?: number | null
  pitch_mean?: number | null
  pitch_std?: number | null
  volume_mean?: number | null
  volume_std?: number | null
  speech_duration?: number | null
  total_duration?: number | null
  // Legacy keys for backward compatibility
  fluencyScore?: number
  fillerPercentage?: number
  confidenceScore?: number
  fillerCount?: number
  durationSeconds?: number
  pauseCount?: number
  // Text analysis nested metrics
  grammar?: {
    error_count?: number
    word_count?: number
    errors_per_100_words?: number
  }
  vocabulary?: {
    total_words?: number
    unique_words?: number
    ttr?: number
    mtld?: number
    short_sample?: boolean
    cefr_distribution?: Record<string, number>
    b2_plus_ratio?: number
    advanced_words?: string[]
  }
  hedging?: {
    hedging_count?: number
    hedging_ratio?: number
    repetition_count?: number
    sentence_count?: number
    completeness_ratio?: number
  }
  structure?: {
    rule_score?: number
    llm_score?: number
    opening_detected?: boolean
    sequencing_count?: number
    example_count?: number
    conclusion_detected?: boolean
    rubric_scores?: Record<string, number>
    comment?: string
  }
  // Read-aloud alignment data
  read_aloud?: {
    reference_word_count?: number
    spoken_word_count?: number
    insertions?: number
    deletions?: number
    substitutions?: number
    correct?: number
    wer?: number
    accuracy_percentage?: number
    alignment?: Array<{
      reference: string
      spoken: string
      status: 'correct' | 'substituted' | 'deleted' | 'inserted'
    }>
  }
}

export interface DimensionScores {
  grammar?: number | null
  vocabulary?: number | null
  fluency?: number | null
  pace?: number | null
  filler_control?: number | null
  structure?: number | null
  confidence?: number | null
}

export interface AnalysisFlag {
  type: string
  start?: number
  end?: number
  detail?: string
}

export interface FillerOccurrence {
  word: string
  count: number
  index?: number
}

export interface SentenceExample {
  original: string
  improved: string
  reason: string
}

// ── Situational Questions ──────────────────────────────────────────────────

export type SituationalCategory =
  | 'teamwork'
  | 'conflict-resolution'
  | 'leadership'
  | 'decision-making'
  | 'workplace-ethics'
  | 'problem-solving'

export interface Question {
  _id: string
  category: SituationalCategory
  text: string
  difficulty: number
  targetSkills: string[]
  tags: string[]
}

export interface CategoryStats {
  category: SituationalCategory
  label: string
  total: number
  attempted: number
  remaining: number
}

export interface QuestionHistoryEntry {
  _id: string
  questionId: Question | string
  category: SituationalCategory
  sessionId?: string
  attemptedAt: string
}

// ── Extempore Topics ───────────────────────────────────────────────────────

export type TopicCategory = 'general' | 'academic' | 'social' | 'professional'

export interface Topic {
  _id: string
  text: string
  category: TopicCategory
  difficulty: number
  tags: string[]
}

export interface TopicCategoryStats {
  category: TopicCategory
  label: string
  total: number
  attempted: number
  remaining: number
}

export interface TopicHistoryEntry {
  _id: string
  topicId: Topic | string
  category: TopicCategory
  sessionId?: string
  attemptedAt: string
}

// ── Pronunciation Words ───────────────────────────────────────────────────

export type WordDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface WordItem {
  _id: string
  word: string
  phonetic?: string
  difficulty: WordDifficulty
  category: string
  exampleSentence?: string
}

export interface WordProgressStats {
  difficulty: WordDifficulty
  totalWords: number
  attemptedCount: number
  recognizedCount: number
  accuracy: number
}

// ── Interview Rapid Fire ──────────────────────────────────────────────────

export interface RapidFireQuestionItem {
  order: number
  questionType: 'introduction' | 'behavioral' | 'competency' | 'situational' | 'career_motivation'
  questionText: string
  categoryLabel: string
  sessionId?: string
  transcript?: string
  audioDuration?: number
  scores?: Record<string, number>
  metrics?: Record<string, any>
  strengths?: string[]
  improvements?: string[]
  answeredAt?: string
}

export interface RapidFireReport {
  overallScore: number
  overallStrengths: string[]
  recurringWeaknesses: string[]
  bestQuestions: string[]
  needsImprovementQuestions: string[]
  commonLanguageMistakes: string[]
  repeatedFillerWords: string[]
  structureSuggestions: string[]
  sentenceImprovements: Array<{
    original: string
    improved: string
    reason: string
  }>
  summary: string
}

export interface RapidFireSessionData {
  _id: string
  userId: string
  status: 'in-progress' | 'complete' | 'abandoned'
  currentQuestionIndex: number
  questions: RapidFireQuestionItem[]
  consolidatedReport?: RapidFireReport
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface DashboardSummary {
  totalCompleted: number
  breakdown: Record<string, number>
  profile: {
    dimensions: Record<string, { score: number; uncertainty: number; trend: number; attempts: number }>
    isBaseline?: boolean
  }
  recommendation?: {
    strategy: string
    explanation: string
    exerciseId?: {
      _id: string
      title?: string
      prompt: string
      type: string
      difficulty: number
    }
  }
  strongestArea: { dimension: string; score: number } | null
  weakestArea: { dimension: string; score: number } | null
}

export interface SessionFeedback {
  summary?: string
  strengths: string[]
  improvements: string[]
  sentenceExamples?: SentenceExample[]
  tip?: string
  fallbackUsed?: boolean
}

export interface AnalysisDoc {
  _id: string
  sessionId: string
  transcript: string
  words: Array<{ w: string; start: number; end: number; flag?: string }>
  metrics: SessionMetrics
  scores: DimensionScores
  flags: AnalysisFlag[]
  errorPatterns?: Record<string, number>
  llmUsed?: boolean
  fallbackUsed?: boolean
  versions?: {
    whisperModel?: string
    formulaVersion?: string
    promptVersions?: Record<string, string>
  }
}

export interface Session {
  id: string
  _id?: string
  exerciseId: string | Record<string, any>
  exerciseTitle?: string
  mode: 'audio' | 'text' | 'voice'
  status: 'queued' | 'processing' | 'complete' | 'failed'
  audioUrl?: string
  text?: string
  transcript?: string
  metrics?: SessionMetrics
  scores?: DimensionScores
  fillerWords?: FillerOccurrence[]
  feedback?: SessionFeedback
  analysisId?: string | AnalysisDoc
  error?: string
  errorCode?: string
  createdAt: string
  updatedAt?: string
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const BASE_URL = '/api'

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers || {})

  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  let data: any
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    if (data && typeof data === 'object') {
      if (typeof data.error === 'string') {
        errorMessage = data.error
      } else if (data.error && typeof data.error === 'object' && data.error.message) {
        errorMessage = data.error.message
      } else if (data.message && typeof data.message === 'string') {
        errorMessage = data.message
      }
    }
    const errorCode =
      data && typeof data === 'object' && data.error && typeof data.error === 'object'
        ? data.error.code
        : data?.code
    throw new ApiError(errorMessage, response.status, errorCode)
  }

  return data as T
}

// Built-in fallback sample exercises in case backend exercises endpoint is initializing
export const FALLBACK_EXERCISES: Exercise[] = [
  {
    id: 'tell-me-about-yourself',
    title: 'Professional Introduction',
    category: 'professional-introduction',
    type: 'professional-introduction',
    difficulty: 'easy',
    prepTimeSeconds: 15,
    timeLimitSeconds: 120,
    prompt:
      'Give a concise 2-minute professional introduction highlighting your background, key achievements, and current aspirations.',
    description: 'The classic elevator pitch question asked in 95% of job interviews.',
    tags: ['Interview', 'Introduction', 'Elevator Pitch', 'professional-introduction'],
  },
  {
    id: 'read-aloud-scientific',
    title: 'Precision Articulation: Cognitive Load',
    category: 'read-aloud',
    type: 'read-aloud',
    difficulty: 'medium',
    prepTimeSeconds: 10,
    timeLimitSeconds: 90,
    prompt:
      'Cognitive architecture theory suggests working memory capacity is strictly constrained during high-stakes verbal retrieval. By pacing vocal inflection deliberately, communicators preserve attentional bandwidth.',
    referenceText:
      'Cognitive architecture theory suggests working memory capacity is strictly constrained during high-stakes verbal retrieval. By pacing vocal inflection deliberately, communicators preserve attentional bandwidth.',
    description: 'Read aloud with steady cadence, clear enunciations, and measured pausing.',
    tags: ['Read Aloud', 'Articulation', 'Cadence', 'read-aloud'],
  },
  {
    id: 'situational-default',
    title: 'Situational Workplace Scenario',
    category: 'situational',
    type: 'situational',
    difficulty: 'medium',
    prepTimeSeconds: 20,
    timeLimitSeconds: 150,
    prompt:
      'Describe how you would address a critical project delay when two team members disagree on the technical direction.',
    description: 'Evaluates your communication, conflict resolution, and leadership.',
    tags: ['situational', 'teamwork', 'leadership'],
  },
  {
    id: 'extempore-default',
    title: 'Extempore Speaking Prompt',
    category: 'extempore',
    type: 'extempore',
    difficulty: 'medium',
    prepTimeSeconds: 30,
    timeLimitSeconds: 120,
    prompt:
      'The impact of artificial intelligence on communication and critical thinking in modern engineering.',
    description: 'Evaluates your spontaneous speaking structure, vocabulary, and depth.',
    tags: ['extempore', 'spontaneous', 'public-speaking'],
  },
  {
    id: 'pronunciation-default',
    title: 'Pronunciation Articulation Practice',
    category: 'pronunciation',
    type: 'pronunciation',
    difficulty: 'easy',
    prepTimeSeconds: 5,
    timeLimitSeconds: 15,
    prompt: 'Pronounce the target word clearly.',
    referenceText: 'communication',
    description: 'Word-level phonetics and enunciation practice.',
    tags: ['pronunciation', 'word-level'],
  },
  {
    id: 'rapid-fire-default',
    title: 'Interview Rapid Fire Simulation',
    category: 'rapid-fire',
    type: 'rapid-fire',
    difficulty: 'hard',
    prepTimeSeconds: 15,
    timeLimitSeconds: 90,
    prompt: '10-question rapid fire interview session testing consistency and stamina.',
    description: 'Comprehensive sequential interview simulation.',
    tags: ['rapid-fire', 'interview'],
  },
  {
    id: 'conflict-resolution',
    title: 'Handling Team Conflict',
    category: 'behavioral',
    difficulty: 'medium',
    prepTimeSeconds: 20,
    timeLimitSeconds: 150,
    prompt:
      'Describe a situation where you had a serious disagreement with a colleague or stakeholder. How did you handle the discussion, and what was the resolution?',
    description: 'Evaluate your ability to empathize, stay objective, and drive consensus.',
    tags: ['Behavioral', 'Collaboration', 'Problem Solving'],
  },
  {
    id: 'product-pitch',
    title: 'Executive Pitch: Technical Architecture',
    category: 'presentation',
    difficulty: 'hard',
    prepTimeSeconds: 30,
    timeLimitSeconds: 180,
    prompt:
      'Explain a complex system or technical architectural decision to a non-technical executive board, explaining why it creates business value while mitigating risk.',
    description: 'Tests your pacing, structural clarity, and executive presence.',
    tags: ['Presentation', 'Executive', 'Communication'],
  },
]

/** Normalize a raw backend exercise document to the frontend Exercise shape. */
function normalizeExercise(raw: any): Exercise {
  const id = raw.id || raw._id?.toString() || ''
  const type: string = raw.type || raw.category || 'interview'
  // Map backend type to frontend category
  const categoryMap: Record<string, Exercise['category']> = {
    'professional-introduction': 'professional-introduction',
    'read-aloud': 'read-aloud',
    interview: 'interview',
    description: 'casual',
    written: 'casual',
    retelling: 'behavioral',
    situational: 'situational',
    extempore: 'extempore',
    pronunciation: 'pronunciation',
    'rapid-fire': 'rapid-fire',
  }
  const category = categoryMap[type] ?? 'interview'

  // Map numeric difficulty to label
  const diffScore: number = typeof raw.difficulty === 'number' ? raw.difficulty : 50
  const difficulty: Exercise['difficulty'] =
    diffScore <= 35 ? 'easy' : diffScore <= 65 ? 'medium' : 'hard'

  return {
    id,
    title: raw.title || raw.prompt?.slice(0, 50) || type,
    prompt: raw.prompt || '',
    category,
    difficulty,
    prepTimeSeconds: raw.prepTimeSec ?? raw.prepTimeSeconds ?? 20,
    timeLimitSeconds: raw.timeLimitSec ?? raw.timeLimitSeconds ?? 120,
    description: raw.description || '',
    tags: raw.tags || [],
    type,
    referenceText: raw.referenceText,
    targetSkills: raw.targetSkills || [],
    difficultyScore: diffScore,
  }
}

export const api = {
  auth: {
    signup: async (payload: { name: string; email: string; password: string }): Promise<{ user: User }> => {
      return request<{ user: User }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    login: async (payload: { email: string; password: string }): Promise<{ user: User }> => {
      return request<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    logout: async (): Promise<{ message: string }> => {
      return request<{ message: string }>('/auth/logout', {
        method: 'POST',
      })
    },
    getMe: async (): Promise<{ user: User | null }> => {
      try {
        return await request<{ user: User | null }>('/auth/me')
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return { user: null }
        }
        throw err
      }
    },
  },

  exercises: {
    getExercises: async (typeFilter?: string): Promise<Exercise[]> => {
      try {
        const query = typeFilter ? `?type=${encodeURIComponent(typeFilter)}` : ''
        const res = await request<{ exercises?: any[] } | any[]>(`/exercises${query}`)
        const rawList: any[] = Array.isArray(res)
          ? res
          : res.exercises && Array.isArray(res.exercises)
          ? res.exercises
          : []
        if (rawList.length > 0) return rawList.map(normalizeExercise)
        return FALLBACK_EXERCISES
      } catch {
        return typeFilter
          ? FALLBACK_EXERCISES.filter((e) => e.category === typeFilter || e.type === typeFilter)
          : FALLBACK_EXERCISES
      }
    },
    getExercise: async (id: string): Promise<Exercise> => {
      try {
        const res = await request<any>(`/exercises/${id}`)
        if (res && (res.id || res._id)) return normalizeExercise(res)
        if (res && res.exercise) return normalizeExercise(res.exercise)
        throw new Error('Exercise not found')
      } catch (err) {
        const fallback = FALLBACK_EXERCISES.find((e) => e.id === id)
        if (fallback) return fallback
        throw err
      }
    },
  },

  questions: {
    /** Fetch the next unattempted question for this user. */
    getNextQuestion: async (category?: SituationalCategory): Promise<{ question?: Question; exhausted?: boolean; message?: string; totalAttempted?: number; totalAvailable?: number }> => {
      const query = category ? `?category=${encodeURIComponent(category)}` : ''
      return request<any>(`/questions/next${query}`)
    },
    /** Fetch per-category stats (total, attempted, remaining) for the picker. */
    getCategories: async (): Promise<{ categories: CategoryStats[] }> => {
      return request<{ categories: CategoryStats[] }>('/questions/categories')
    },
    /** Record that the user attempted a question. */
    recordAttempt: async (payload: { questionId: string; category: SituationalCategory; sessionId?: string }): Promise<{ history: QuestionHistoryEntry; created: boolean }> => {
      return request<{ history: QuestionHistoryEntry; created: boolean }>('/questions/history', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    /** Fetch the user's question attempt history. */
    getHistory: async (category?: SituationalCategory): Promise<{ history: QuestionHistoryEntry[] }> => {
      const query = category ? `?category=${encodeURIComponent(category)}` : ''
      return request<{ history: QuestionHistoryEntry[] }>(`/questions/history${query}`)
    },
  },

  topics: {
    getNextTopic: async (category?: TopicCategory): Promise<{ topic?: Topic; exhausted?: boolean; message?: string; totalAttempted?: number; totalAvailable?: number }> => {
      const query = category ? `?category=${encodeURIComponent(category)}` : ''
      return request<any>(`/topics/next${query}`)
    },
    getCategories: async (): Promise<{ categories: TopicCategoryStats[] }> => {
      return request<{ categories: TopicCategoryStats[] }>('/topics/categories')
    },
    recordAttempt: async (payload: { topicId: string; category: TopicCategory; sessionId?: string }): Promise<{ history: TopicHistoryEntry; created: boolean }> => {
      return request<{ history: TopicHistoryEntry; created: boolean }>('/topics/history', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    getHistory: async (category?: TopicCategory): Promise<{ history: TopicHistoryEntry[] }> => {
      const query = category ? `?category=${encodeURIComponent(category)}` : ''
      return request<{ history: TopicHistoryEntry[] }>(`/topics/history${query}`)
    },
  },

  words: {
    getNextWord: async (difficulty?: WordDifficulty): Promise<{ word: WordItem; allMastered?: boolean }> => {
      const query = difficulty ? `?difficulty=${encodeURIComponent(difficulty)}` : ''
      return request<{ word: WordItem; allMastered?: boolean }>(`/words/next${query}`)
    },
    recordAttempt: async (payload: { wordId: string; recognized: boolean; transcribedText?: string }): Promise<{ history: any }> => {
      return request<{ history: any }>('/words/attempt', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    getProgress: async (): Promise<{ stats: WordProgressStats[] }> => {
      return request<{ stats: WordProgressStats[] }>('/words/progress')
    },
  },

  rapidFire: {
    start: async (): Promise<{ session: RapidFireSessionData; resumed: boolean }> => {
      return request<{ session: RapidFireSessionData; resumed: boolean }>('/rapid-fire/start', {
        method: 'POST',
      })
    },
    getSession: async (id: string): Promise<{ session: RapidFireSessionData }> => {
      return request<{ session: RapidFireSessionData }>(`/rapid-fire/${id}`)
    },
    submitAnswer: async (id: string, payload: { questionIndex: number; sessionId?: string; transcript?: string; scores?: any; metrics?: any; audioDuration?: number }): Promise<{ session: RapidFireSessionData; isComplete: boolean; nextIndex: number }> => {
      return request<{ session: RapidFireSessionData; isComplete: boolean; nextIndex: number }>(`/rapid-fire/${id}/answer`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    getReport: async (id: string): Promise<{ report: RapidFireReport; questions: RapidFireQuestionItem[]; session: RapidFireSessionData }> => {
      return request<{ report: RapidFireReport; questions: RapidFireQuestionItem[]; session: RapidFireSessionData }>(`/rapid-fire/${id}/report`)
    },
    getRecent: async (): Promise<{ sessions: RapidFireSessionData[] }> => {
      return request<{ sessions: RapidFireSessionData[] }>('/rapid-fire/recent')
    },
  },

  profile: {
    getDashboard: async (): Promise<DashboardSummary> => {
      return request<DashboardSummary>('/profile/dashboard')
    },
  },

  sessions: {
    createSession: async (formData: FormData): Promise<{ sessionId: string }> => {
      const res = await request<{ sessionId?: string; id?: string }>('/sessions', {
        method: 'POST',
        body: formData,
      })
      const sessionId = res.sessionId || res.id
      if (!sessionId) {
        throw new Error('Server did not return a session ID')
      }
      return { sessionId }
    },
    getSession: async (id: string): Promise<Session> => {
      const res = await request<{ session?: Session } | Session>(`/sessions/${id}`)
      if ('session' in res && res.session) return res.session
      return res as Session
    },
    getRecentSessions: async (): Promise<Session[]> => {
      try {
        const res = await request<{ sessions?: Session[] } | Session[]>('/sessions/recent')
        if (Array.isArray(res)) return res
        if (res && res.sessions) return res.sessions
        return []
      } catch {
        return []
      }
    },
  },
}

