import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Handshake,
  Crown,
  GitBranch,
  Scale,
  Lightbulb,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mic,
  ArrowRight,
  BarChart2,
  Clock,
} from 'lucide-react'
import { api, type SituationalCategory, type Question, type CategoryStats } from '../../lib/api'
import { useRecorder } from '../../lib/use-recorder'
import { AudioRecorder } from '../../components/practice/audio-recorder'
import { PrepTimer } from '../../components/practice/prep-timer'
import { cn } from '../../lib/utils'

// ── Category metadata ───────────────────────────────────────────────────────

const CATEGORY_META: Record<
  SituationalCategory,
  { label: string; icon: React.ElementType; color: string; bg: string; description: string }
> = {
  teamwork: {
    label: 'Teamwork',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: 'Collaboration, support, and working effectively with others.',
  },
  'conflict-resolution': {
    label: 'Conflict Resolution',
    icon: Handshake,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    description: 'Handling disagreements, delivering feedback, and mediation.',
  },
  leadership: {
    label: 'Leadership',
    icon: Crown,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    description: 'Influencing, motivating, and guiding teams and individuals.',
  },
  'decision-making': {
    label: 'Decision-Making',
    icon: GitBranch,
    color: 'text-green-600',
    bg: 'bg-green-50',
    description: 'Evaluating options, managing ambiguity, and making sound judgements.',
  },
  'workplace-ethics': {
    label: 'Workplace Ethics',
    icon: Scale,
    color: 'text-red-600',
    bg: 'bg-red-50',
    description: 'Integrity, speaking up, and navigating ethical dilemmas.',
  },
  'problem-solving': {
    label: 'Problem-Solving',
    icon: Lightbulb,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    description: 'Analytical thinking, creativity, and structured approaches.',
  },
}

// ── Types ───────────────────────────────────────────────────────────────────

type Stage =
  | 'pick-category'   // choose a category or start general
  | 'question'        // show the question, let user prepare
  | 'prep'            // countdown timer before recording
  | 'recording'       // recording in progress
  | 'uploading'       // submitting audio
  | 'result'          // showing assessment
  | 'exhausted'       // all questions in category attempted

// ── Helper components ────────────────────────────────────────────────────────

function CategoryCard({
  category,
  stats,
  onSelect,
}: {
  category: SituationalCategory
  stats?: CategoryStats
  onSelect: () => void
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  const remaining = stats?.remaining ?? '…'
  const total = stats?.total ?? '…'

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 text-left transition-all hover:border-primary/40 hover:shadow-md',
      )}
    >
      <div className={cn('grid size-11 shrink-0 place-items-center rounded-xl', meta.bg)}>
        <Icon className={cn('size-6', meta.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-ink">{meta.label}</p>
          <ChevronRight className="size-4 shrink-0 text-muted group-hover:text-primary transition-colors" />
        </div>
        <p className="mt-0.5 text-xs text-muted leading-relaxed">{meta.description}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-muted">
            {remaining === 0 ? (
              <span className="text-green-600 font-medium">✓ All attempted</span>
            ) : (
              <span>
                <span className="font-medium text-ink">{remaining}</span> of {total} remaining
              </span>
            )}
          </span>
          {stats && stats.attempted > 0 && (
            <span className="text-[11px] text-muted bg-canvas px-1.5 py-0.5 rounded-md">
              {stats.attempted} done
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export function SituationalQuestionsPage() {
  const navigate = useNavigate()

  // State
  const [stage, setStage] = useState<Stage>('pick-category')
  const [selectedCategory, setSelectedCategory] = useState<SituationalCategory | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [exhaustedMessage, setExhaustedMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [_sessionId, setSessionId] = useState<string | null>(null)
  const [exerciseId, setExerciseId] = useState<string | null>(null)

  // Recorder
  const recorder = useRecorder({ timeLimitSeconds: 150 })

  // Load category stats on mount
  useEffect(() => {
    setStatsLoading(true)
    api.questions
      .getCategories()
      .then((res) => setCategoryStats(res.categories || []))
      .catch(() => setCategoryStats([]))
      .finally(() => setStatsLoading(false))
  }, [])

  // ── Fetch a question ──────────────────────────────────────────────────────
  const fetchNextQuestion = useCallback(async (category: SituationalCategory | null) => {
    setQuestionLoading(true)
    setSubmitError(null)
    try {
      const res = await api.questions.getNextQuestion(category ?? undefined)
      if (res.exhausted) {
        setExhaustedMessage(res.message || 'All questions attempted.')
        setStage('exhausted')
      } else if (res.question) {
        setCurrentQuestion(res.question)
        setStage('question')
      }
    } catch {
      setSubmitError('Could not load a question. Please try again.')
      setStage('pick-category')
    } finally {
      setQuestionLoading(false)
    }
  }, [])

  // ── Handle category selection ─────────────────────────────────────────────
  const handleSelectCategory = useCallback(
    async (category: SituationalCategory | null) => {
      setSelectedCategory(category)
      await fetchNextQuestion(category)
    },
    [fetchNextQuestion],
  )

  // ── Handle prep timer done ────────────────────────────────────────────────
  const handlePrepDone = useCallback(() => {
    setStage('recording')
  }, [])

  // ── Handle audio submission ───────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (audioBlob: Blob) => {
      if (!currentQuestion) return
      setStage('uploading')
      setSubmitError(null)
      try {
        // Look up the situational template exercise ID
        let exId = exerciseId
        if (!exId) {
          const exercises = await api.exercises.getExercises('situational')
          exId = exercises[0]?.id || 'situational-default'
          setExerciseId(exId)
        }

        const formData = new FormData()
        formData.append('exerciseId', exId)
        formData.append('mode', 'voice')
        formData.append('exerciseType', 'situational')
        formData.append('questionText', currentQuestion.text)
        formData.append('questionId', currentQuestion._id)
        formData.append('questionCategory', currentQuestion.category)

        const ext = audioBlob.type.includes('webm') ? '.webm' : '.wav'
        formData.append('audio', audioBlob, `recording${ext}`)

        const { sessionId: sid } = await api.sessions.createSession(formData)
        setSessionId(sid)

        // Record this question as attempted
        await api.questions.recordAttempt({
          questionId: currentQuestion._id,
          category: currentQuestion.category,
          sessionId: sid,
        })

        // Refresh category stats
        api.questions
          .getCategories()
          .then((res) => setCategoryStats(res.categories || []))
          .catch(() => {})

        // Navigate to the result page (polls for completion)
        navigate(`/app/result/${sid}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Submission failed.'
        setSubmitError(msg)
        setStage('recording')
      }
    },
    [currentQuestion, exerciseId, navigate],
  )

  // ── Render: Category Picker ───────────────────────────────────────────────
  if (stage === 'pick-category') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-ink">Situational Questions</h1>
          <p className="mt-1 text-sm text-muted max-w-xl">
            Practice answering real professional situations. Each question is unique to your session
            — questions you have already attempted will not repeat.
          </p>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {submitError}
          </div>
        )}

        {/* Quick Start */}
        <div className="rounded-2xl border border-primary/20 bg-primary-soft p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-primary">Quick Start — Any Category</p>
              <p className="mt-0.5 text-sm text-primary/70">
                Get a random unattempted question from any category.
              </p>
            </div>
            <button
              onClick={() => handleSelectCategory(null)}
              disabled={questionLoading}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60 transition-colors"
            >
              {questionLoading ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <>
                  <Mic className="size-4" /> Start Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category grid */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted">Or choose a specific category:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(CATEGORY_META) as SituationalCategory[]).map((cat) => (
              <CategoryCard
                key={cat}
                category={cat}
                stats={statsLoading ? undefined : categoryStats.find((s) => s.category === cat)}
                onSelect={() => handleSelectCategory(cat)}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Exhausted ─────────────────────────────────────────────────────
  if (stage === 'exhausted') {
    const catMeta = selectedCategory ? CATEGORY_META[selectedCategory] : null
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-green-50">
          <CheckCircle2 className="size-9 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">
            {catMeta ? `All ${catMeta.label} questions completed!` : 'All questions completed!'}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted">{exhaustedMessage}</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {selectedCategory && (
            <button
              onClick={() => handleSelectCategory(null)}
              className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-canvas"
            >
              <ArrowRight className="size-4" /> Try another category
            </button>
          )}
          <button
            onClick={() => setStage('pick-category')}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Back to categories
          </button>
        </div>
      </div>
    )
  }

  // ── Render: Loading question ──────────────────────────────────────────────
  if (questionLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <RefreshCw className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted">Loading your next question…</p>
      </div>
    )
  }

  // ── Render: Question (read and prepare) ───────────────────────────────────
  if (stage === 'question' && currentQuestion) {
    const meta = CATEGORY_META[currentQuestion.category]
    const Icon = meta.icon
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <div className={cn('grid size-8 place-items-center rounded-lg', meta.bg)}>
            <Icon className={cn('size-5', meta.color)} />
          </div>
          <span className={cn('text-sm font-semibold', meta.color)}>{meta.label}</span>
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">
            Your Question
          </p>
          <p className="text-lg font-medium text-ink leading-relaxed">
            {currentQuestion.text}
          </p>
        </div>

        {/* Preparation tips */}
        <div className="rounded-2xl border border-line bg-canvas p-5 space-y-2">
          <p className="text-sm font-semibold text-ink">Before you record:</p>
          <ul className="space-y-1.5 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">•</span>
              Think of a specific real or realistic example (use the STAR method: Situation, Task, Action, Result).
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">•</span>
              Aim for 60–120 seconds. Concise and relevant beats long and rambling.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">•</span>
              Speak naturally — you will get feedback on grammar, vocabulary, and delivery.
            </li>
          </ul>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setStage('prep')}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <Mic className="size-4" /> I'm ready — start prep timer
          </button>
          <button
            onClick={() => setStage('pick-category')}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-muted hover:text-ink hover:bg-canvas"
          >
            Back to categories
          </button>
        </div>
      </div>
    )
  }

  // ── Render: Prep Timer ────────────────────────────────────────────────────
  if (stage === 'prep' && currentQuestion) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Question</p>
          <p className="text-base font-medium text-ink leading-relaxed">{currentQuestion.text}</p>
        </div>
        <PrepTimer
          totalSeconds={20}
          onComplete={handlePrepDone}
        />
      </div>
    )
  }

  // ── Render: Recording ─────────────────────────────────────────────────────
  if ((stage === 'recording' || stage === 'uploading') && currentQuestion) {
    const meta = CATEGORY_META[currentQuestion.category]
    const Icon = meta.icon
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Question remains visible during recording */}
        <div className={cn('rounded-2xl border p-5', meta.bg, 'border-transparent')}>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn('size-4', meta.color)} />
            <span className={cn('text-xs font-semibold uppercase tracking-wide', meta.color)}>
              {meta.label}
            </span>
          </div>
          <p className="text-sm font-medium text-ink leading-relaxed">{currentQuestion.text}</p>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {submitError}
          </div>
        )}

        <AudioRecorder
          recorder={recorder}
          timeLimitSeconds={150}
          onSubmit={handleSubmit}
          isSubmitting={stage === 'uploading'}
        />

        {/* Tips during recording */}
        <div className="flex gap-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>60–120 sec ideal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart2 className="size-3.5" />
            <span>Use STAR structure</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Result (after navigation to result page) ─────────────────────
  // The navigate() call in handleSubmit takes the user to /app/result/:sessionId
  // so this shouldn't render, but as a safety fallback:
  return null
}
