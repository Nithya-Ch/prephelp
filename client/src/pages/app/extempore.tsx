import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe,
  GraduationCap,
  Users,
  Briefcase,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mic,
  Sparkles,
} from 'lucide-react'
import { api, type TopicCategory, type Topic, type TopicCategoryStats } from '../../lib/api'
import { useRecorder } from '../../lib/use-recorder'
import { AudioRecorder } from '../../components/practice/audio-recorder'
import { PrepTimer } from '../../components/practice/prep-timer'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { cn } from '../../lib/utils'

// ── Category metadata ───────────────────────────────────────────────────────

const CATEGORY_META: Record<
  TopicCategory,
  { label: string; icon: React.ElementType; color: string; bg: string; description: string }
> = {
  general: {
    label: 'General & Current Affairs',
    icon: Globe,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: 'Technology trends, society, digital media, and modern life dilemmas.',
  },
  academic: {
    label: 'Academic & Education',
    icon: GraduationCap,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    description: 'Curriculum debates, AI in education, pedagogy, and research ethics.',
  },
  social: {
    label: 'Social & Cultural',
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    description: 'Mental health, gig economy, urbanization, and public policy.',
  },
  professional: {
    label: 'Professional & Tech Leadership',
    icon: Briefcase,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    description: 'Engineering culture, technical debt, productivity, and leadership transitions.',
  },
}

type Stage =
  | 'pick-category'
  | 'topic'
  | 'prep'
  | 'recording'
  | 'submitting'
  | 'exhausted'

export function ExtemporePage() {
  const navigate = useNavigate()

  const [stage, setStage] = useState<Stage>('pick-category')
  const [_selectedCategory, setSelectedCategory] = useState<TopicCategory | null>(null)
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null)
  const [categoryStats, setCategoryStats] = useState<TopicCategoryStats[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [topicLoading, setTopicLoading] = useState(false)
  const [exhaustedMessage, setExhaustedMessage] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [exerciseId, setExerciseId] = useState<string | null>(null)

  const recorder = useRecorder({ timeLimitSeconds: 120 })

  // Load category stats on mount
  useEffect(() => {
    setStatsLoading(true)
    api.topics
      .getCategories()
      .then((res) => setCategoryStats(res.categories || []))
      .catch(() => setCategoryStats([]))
      .finally(() => setStatsLoading(false))
  }, [])

  // ── Fetch a topic ─────────────────────────────────────────────────────────
  const fetchNextTopic = useCallback(async (category: TopicCategory | null) => {
    setTopicLoading(true)
    setSubmitError(null)
    try {
      const res = await api.topics.getNextTopic(category ?? undefined)
      if (res.exhausted) {
        setExhaustedMessage(res.message || 'All topics in this category attempted.')
        setStage('exhausted')
      } else if (res.topic) {
        setCurrentTopic(res.topic)
        setStage('topic')
      }
    } catch {
      setSubmitError('Could not load an extempore topic. Please try again.')
      setStage('pick-category')
    } finally {
      setTopicLoading(false)
    }
  }, [])

  const handleSelectCategory = useCallback(
    async (category: TopicCategory | null) => {
      setSelectedCategory(category)
      await fetchNextTopic(category)
    },
    [fetchNextTopic]
  )

  const handlePrepDone = useCallback(() => {
    setStage('recording')
  }, [])

  // ── Submit audio ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (audioBlob: Blob) => {
      if (!currentTopic) return
      setStage('submitting')
      setSubmitError(null)
      try {
        let exId = exerciseId
        if (!exId) {
          const exercises = await api.exercises.getExercises('extempore')
          exId = exercises[0]?.id || null
          setExerciseId(exId)
        }

        if (!exId) {
          // Fallback to generic exercise if seed is initializing
          const fallbackList = await api.exercises.getExercises()
          exId = fallbackList[0]?.id || 'extempore-default'
        }

        const formData = new FormData()
        formData.append('exerciseId', exId)
        formData.append('mode', 'voice')
        formData.append('exerciseType', 'extempore')
        formData.append('questionText', currentTopic.text)
        formData.append('questionCategory', currentTopic.category)

        const ext = audioBlob.type.includes('webm') ? '.webm' : '.wav'
        formData.append('audio', audioBlob, `extempore${ext}`)

        const { sessionId: sid } = await api.sessions.createSession(formData)

        // Record attempt
        await api.topics.recordAttempt({
          topicId: currentTopic._id,
          category: currentTopic.category,
          sessionId: sid,
        })

        // Refresh stats
        api.topics
          .getCategories()
          .then((res) => setCategoryStats(res.categories || []))
          .catch(() => {})

        navigate(`/app/result/${sid}`)
      } catch (err: any) {
        setSubmitError(err.message || 'Submission failed. Please try again.')
        setStage('recording')
      }
    },
    [currentTopic, exerciseId, navigate]
  )

  // ── Category Picker View ──────────────────────────────────────────────────
  if (stage === 'pick-category') {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="primary" className="font-semibold text-xs">Spontaneous Speaking</Badge>
            <Badge tone="neutral" className="text-[10px]">Extempore</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Extempore Practice
          </h1>
          <p className="mt-1 text-sm text-muted max-w-xl">
            Think on your feet and deliver structured, persuasive responses on unfamiliar topics.
            Topics are unique to your account and will not repeat.
          </p>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="size-4 shrink-0" />
            {submitError}
          </div>
        )}

        {/* Quick Start Spotlight */}
        <div className="rounded-2xl border border-primary/20 bg-primary-soft p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="size-4" /> Quick Sprint — Random Topic
              </p>
              <p className="mt-0.5 text-xs text-primary/80">
                Receive an immediate unattempted topic from any category.
              </p>
            </div>
            <Button
              onClick={() => handleSelectCategory(null)}
              disabled={topicLoading}
              size="md"
              className="gap-2 shrink-0"
            >
              {topicLoading ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <>
                  <Mic className="size-4" /> Start Spontaneous Drill
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Category Grid */}
        <div>
          <p className="mb-3 text-xs font-bold text-muted uppercase tracking-wider">
            Or choose a specific subject category:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(CATEGORY_META) as TopicCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat]
              const Icon = meta.icon
              const stat = statsLoading ? undefined : categoryStats.find((s) => s.category === cat)
              const remaining = stat?.remaining ?? '…'
              const total = stat?.total ?? '…'

              return (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 text-left transition-all hover:border-primary/40 hover:shadow-card"
                >
                  <div className={cn('grid size-11 shrink-0 place-items-center rounded-xl', meta.bg)}>
                    <Icon className={cn('size-6', meta.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-ink text-sm">{meta.label}</p>
                      <ChevronRight className="size-4 shrink-0 text-muted group-hover:text-primary transition-colors" />
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{meta.description}</p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="text-[11px] text-muted">
                        {remaining === 0 ? (
                          <span className="text-emerald-600 font-medium">✓ All completed</span>
                        ) : (
                          <span>
                            <strong className="text-ink">{remaining}</strong> of {total} remaining
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Exhausted View ────────────────────────────────────────────────────────
  if (stage === 'exhausted') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center max-w-md mx-auto">
        <div className="grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-9" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">All Topics Completed!</h2>
          <p className="mt-2 text-xs text-muted leading-relaxed">{exhaustedMessage}</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => setStage('pick-category')} size="md">
            Back to Categories
          </Button>
        </div>
      </div>
    )
  }

  // ── Topic Display & Prep ──────────────────────────────────────────────────
  if (stage === 'topic' && currentTopic) {
    const meta = CATEGORY_META[currentTopic.category]
    const Icon = meta.icon

    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12">
        <div className="flex items-center gap-2">
          <div className={cn('grid size-8 place-items-center rounded-lg', meta.bg)}>
            <Icon className={cn('size-4', meta.color)} />
          </div>
          <span className={cn('text-xs font-bold uppercase tracking-wider', meta.color)}>
            {meta.label}
          </span>
        </div>

        <Card className="p-6 space-y-4">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
            Your Extempore Speaking Topic
          </p>
          <h2 className="text-xl font-bold text-ink leading-relaxed">
            "{currentTopic.text}"
          </h2>
          <div className="border-t border-line pt-4 flex gap-4 text-xs text-muted">
            <span>⏱ Prep: <strong className="text-ink">30 seconds</strong></span>
            <span>🎙 Speaking limit: <strong className="text-ink">120 seconds</strong></span>
          </div>
        </Card>

        {/* Spontaneous Framework Tip */}
        <div className="rounded-2xl border border-line bg-canvas p-5 space-y-2">
          <p className="text-xs font-bold text-ink uppercase tracking-wider">
            Recommended 3-Step Speech Structure:
          </p>
          <ul className="space-y-1.5 text-xs text-muted leading-relaxed">
            <li>
              <strong className="text-ink">1. Hook & Opening (15s):</strong> State your central viewpoint clearly right at the start.
            </li>
            <li>
              <strong className="text-ink">2. Two Supporting Pillars (60s):</strong> Give two concrete reasons, examples, or contrasts.
            </li>
            <li>
              <strong className="text-ink">3. Memorable Conclusion (20s):</strong> Summarize with a forward-looking takeaway.
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setStage('prep')} size="lg" className="gap-2">
            <Mic className="size-4" /> Start 30s Prep Timer
          </Button>
          <Button onClick={() => setStage('pick-category')} variant="secondary" size="lg">
            Choose Another Category
          </Button>
        </div>
      </div>
    )
  }

  // ── Prep Timer ────────────────────────────────────────────────────────────
  if (stage === 'prep' && currentTopic) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12">
        <Card className="p-5 bg-primary-soft border-primary/20">
          <p className="text-xs text-muted mb-1">Your topic:</p>
          <p className="text-base font-bold text-ink leading-relaxed">{currentTopic.text}</p>
        </Card>
        <PrepTimer totalSeconds={30} onComplete={handlePrepDone} />
      </div>
    )
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  if ((stage === 'recording' || stage === 'submitting') && currentTopic) {
    const meta = CATEGORY_META[currentTopic.category]
    const Icon = meta.icon

    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12">
        <Card className="p-5 bg-primary-soft/40 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn('size-4', meta.color)} />
            <span className={cn('text-xs font-bold uppercase tracking-wider', meta.color)}>
              {meta.label}
            </span>
          </div>
          <p className="text-base font-semibold text-ink leading-relaxed">{currentTopic.text}</p>
        </Card>

        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {submitError}
          </div>
        )}

        <AudioRecorder
          recorder={recorder}
          timeLimitSeconds={120}
          onSubmit={handleSubmit}
          isSubmitting={stage === 'submitting'}
        />

        <div className="flex items-center justify-between text-xs text-muted pt-2">
          <span>Target pace: 130–155 WPM</span>
          <span>Aim for 60–90 seconds</span>
        </div>
      </div>
    )
  }

  return null
}
