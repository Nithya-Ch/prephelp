/**
 * Read Aloud Exercise Page
 *
 * Displays a passage for the user to read aloud, records audio, sends it
 * through the existing speech-analysis pipeline (with referenceText), and
 * shows word-by-word alignment using the existing Levenshtein implementation.
 *
 * Three difficulty levels: beginner / intermediate / advanced.
 */
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers,
  Mic,
  RefreshCw,
  RotateCw,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type Exercise, type Session } from '../../lib/api'
import { useRecorder } from '../../lib/use-recorder'
import { AudioRecorder } from '../../components/practice/audio-recorder'
import { MicPermission } from '../../components/practice/mic-permission'
import { PrepTimer } from '../../components/practice/prep-timer'
import { UploadProgress } from '../../components/practice/upload-progress'
import {
  AssessmentResults,
  getMetrics,
} from '../../components/practice/assessment-results'
import { Badge } from '../../components/ui/badge'
import { Button, ButtonLink } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

type RAStage = 'passage' | 'prep' | 'recording' | 'submitting' | 'result'

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: 'Beginner', color: 'text-emerald-700' },
  medium: { label: 'Intermediate', color: 'text-amber-700' },
  hard: { label: 'Advanced', color: 'text-rose-700' },
}

// Fallback read-aloud passages if backend is not seeded
const FALLBACK_PASSAGES: Exercise[] = [
  {
    id: 'ra-beginner',
    title: 'Read Aloud — Beginner',
    prompt: 'Read the following passage aloud clearly, paying attention to natural pausing.',
    category: 'read-aloud',
    difficulty: 'easy',
    prepTimeSeconds: 15,
    timeLimitSeconds: 60,
    type: 'read-aloud',
    referenceText:
      'Technology connects people across the world. Every day, millions of messages are sent between friends, family, and colleagues. Clear communication helps us understand each other better.',
    tags: ['beginner', 'read-aloud'],
  },
  {
    id: 'ra-intermediate',
    title: 'Read Aloud — Intermediate',
    prompt: 'Read the executive summary aloud with natural inflection and professional confidence.',
    category: 'read-aloud',
    difficulty: 'medium',
    prepTimeSeconds: 20,
    timeLimitSeconds: 75,
    type: 'read-aloud',
    referenceText:
      'Microservices architecture structures an application as a collection of loosely coupled, independently deployable services. Each service communicates through well-defined APIs and can be maintained by specialised engineering teams.',
    tags: ['intermediate', 'read-aloud'],
  },
  {
    id: 'ra-advanced',
    title: 'Read Aloud — Advanced',
    prompt: 'Read the client advisory aloud with composure, cadence, and clear articulation.',
    category: 'read-aloud',
    difficulty: 'hard',
    prepTimeSeconds: 30,
    timeLimitSeconds: 90,
    type: 'read-aloud',
    referenceText:
      'We acknowledge the discrepancy observed during the cloud data synchronisation cycle. Our incident response team has isolated the intermittent network partition, rolled out an immutable hotfix, and initiated comprehensive integrity audits across all tenant namespaces.',
    tags: ['advanced', 'read-aloud'],
  },
]

export function ReadAloudPage() {
  const { exerciseId } = useParams<{ exerciseId?: string }>()
  const navigate = useNavigate()

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [raExercises, setRAExercises] = useState<Exercise[]>([])
  const [isLoadingExercise, setIsLoadingExercise] = useState(true)
  const [stage, setStage] = useState<RAStage>('passage')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [pollCount, setPollCount] = useState(0)

  const recorder = useRecorder({
    timeLimitSeconds: exercise?.timeLimitSeconds || 90,
    onTimeLimitReached: () => {},
  })

  // Fetch read-aloud exercises
  useEffect(() => {
    async function fetchExercises() {
      setIsLoadingExercise(true)
      try {
        const list = await api.exercises.getExercises('read-aloud')
        const raList = list.filter(
          (e) => e.type === 'read-aloud' || e.category === 'read-aloud'
        )
        const finalList = raList.length > 0 ? raList : FALLBACK_PASSAGES

        // Sort by difficulty
        const order: Record<string, number> = { easy: 0, medium: 1, hard: 2 }
        finalList.sort((a, b) => (order[a.difficulty] ?? 1) - (order[b.difficulty] ?? 1))
        setRAExercises(finalList)

        const selected = exerciseId
          ? finalList.find((e) => e.id === exerciseId) ||
            (await api.exercises.getExercise(exerciseId))
          : finalList[0]

        setExercise(selected || finalList[0])
      } catch {
        setRAExercises(FALLBACK_PASSAGES)
        setExercise(FALLBACK_PASSAGES[0])
      } finally {
        setIsLoadingExercise(false)
      }
    }
    fetchExercises()
  }, [exerciseId])

  // Poll session after submission
  useEffect(() => {
    if (!session || stage !== 'result') return
    if (session.status === 'complete' || session.status === 'failed') return

    let cancelled = false
    let timer: number | null = null

    async function poll() {
      try {
        const updated = await api.sessions.getSession(session!.id || (session as any)._id)
        if (cancelled) return
        setSession(updated)
        if (updated.status === 'queued' || updated.status === 'processing') {
          setPollCount((p) => p + 1)
          timer = window.setTimeout(poll, 1500)
        }
      } catch {
        if (!cancelled && pollCount < 20) {
          setPollCount((p) => p + 1)
          timer = window.setTimeout(poll, 2000)
        }
      }
    }

    poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [session?.id, stage])

  const handlePrepDone = async () => {
    setStage('recording')
    if (recorder.micPermissionStatus !== 'granted') {
      const ok = await recorder.requestPermission()
      if (ok) recorder.startRecording()
    } else {
      recorder.startRecording()
    }
  }

  const handleSubmit = async (blob: Blob) => {
    if (!exercise) return
    setStage('submitting')
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('exerciseId', exercise.id)
      formData.append('mode', 'voice')
      formData.append('exerciseType', 'read-aloud')
      formData.append('exerciseTitle', exercise.title || 'Read the Passage')
      formData.append(
        'referenceText',
        exercise.referenceText || exercise.prompt || '',
      )
      formData.append('audio', blob, 'recording.webm')

      const result = await api.sessions.createSession(formData)
      const stub: Session = {
        id: result.sessionId,
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        mode: 'voice',
        status: 'queued',
        createdAt: new Date().toISOString(),
      }
      setSession(stub)
      setStage('result')
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit recording. Please try again.')
      setStage('recording')
    }
  }

  const handleReset = () => {
    recorder.reset()
    setStage('passage')
    setSession(null)
    setSubmitError(null)
    setPollCount(0)
  }

  if (isLoadingExercise || !exercise) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-canvas border border-line" />
        <div className="h-56 animate-pulse rounded-2xl bg-canvas border border-line" />
      </div>
    )
  }

  const passageText = exercise.referenceText || exercise.prompt
  const diffInfo = DIFFICULTY_LABELS[exercise.difficulty] || { label: exercise.difficulty, color: 'text-ink' }

  // ── Result Stage ──────────────────────────────────────────────────────────
  if (stage === 'result' && session) {
    if (session.status === 'queued' || session.status === 'processing') {
      const steps = [
        'Receiving your recording...',
        'Transcribing your reading...',
        'Aligning words against the reference passage...',
        'Computing fluency and pace metrics...',
        'Generating your personalised report...',
      ]
      const stepIdx = Math.min(pollCount, steps.length - 1)
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6 grid size-20 place-items-center rounded-3xl bg-primary-soft text-primary shadow-float">
            <Sparkles className="size-10 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-3xl border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Analysing Your Reading
          </h2>
          <p className="mt-2 text-sm font-medium text-primary animate-pulse">{steps[stepIdx]}</p>
          <p className="mt-1 text-xs text-muted max-w-sm">
            Comparing your speech to the reference passage word by word…
          </p>
          <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-canvas border border-line" />
            ))}
          </div>
        </div>
      )
    }

    if (session.status === 'failed') {
      return (
        <div className="mx-auto max-w-xl py-12">
          <Card className="p-8 text-center space-y-4">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="size-7" />
            </div>
            <h2 className="text-xl font-bold text-ink">Analysis Incomplete</h2>
            <p className="text-xs text-muted leading-relaxed">
              {(session as any).error || 'We encountered an issue. Please try again.'}
            </p>
            <div className="pt-4 flex justify-center">
              <Button onClick={handleReset} size="md" className="gap-2">
                <RefreshCw className="size-4" /> Try Again
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    // Complete
    const metrics = getMetrics(session)
    const hasAlignment = !!metrics?.read_aloud?.alignment?.length

    return (
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone="primary" className="font-semibold text-xs">Analysis Complete</Badge>
              <Badge tone="neutral" className="font-medium text-[10px]">Read Aloud · {diffInfo.label}</Badge>
              <span className="text-xs text-muted">
                {new Date(session.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Read Aloud Results
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleReset}>
              <RefreshCw className="size-3.5" /> Try Again
            </Button>
            {raExercises.length > 1 && (() => {
              const nextEx = raExercises.find((e) => e.id !== exercise.id)
              return nextEx ? (
                <ButtonLink
                  to={`/app/exercise/read-aloud/${nextEx.id}`}
                  size="sm"
                  className="gap-1.5"
                >
                  Next Level <ArrowRight className="size-3.5" />
                </ButtonLink>
              ) : null
            })()}
          </div>
        </div>

        {/* Reference passage reminder */}
        <Card className="p-5 border-primary/20 bg-primary-soft/30">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="size-3.5" /> Reference Passage
          </p>
          <p className="text-sm text-ink/90 leading-relaxed">{passageText}</p>
        </Card>

        <AssessmentResults
          session={session}
          showAlignment={hasAlignment}
          referenceText={passageText}
          dimensionKeys={['pace', 'fluency', 'filler_control', 'confidence']}
        />
      </div>
    )
  }

  // ── Exercise stages ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="primary" className="font-semibold text-xs">Read Aloud</Badge>
            <Badge tone="neutral" className={`font-medium text-[10px] ${diffInfo.color}`}>
              {diffInfo.label}
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Read the Passage</h1>
        </div>
        {/* Level selector */}
        {raExercises.length > 1 && (
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted" />
            {raExercises.map((ex) => {
              const info = DIFFICULTY_LABELS[ex.difficulty] || { label: ex.difficulty, color: '' }
              return (
                <ButtonLink
                  key={ex.id}
                  to={`/app/exercise/read-aloud/${ex.id}`}
                  variant={ex.id === exercise.id ? 'primary' : 'secondary'}
                  size="sm"
                  className="text-xs"
                >
                  {info.label}
                </ButtonLink>
              )
            })}
          </div>
        )}
      </div>

      {submitError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          {submitError}
        </div>
      )}

      {/* Passage Display */}
      {stage === 'passage' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="size-3.5" /> Passage to Read
                </p>
                <p className="text-base text-ink leading-relaxed font-medium">{passageText}</p>
              </div>
              <div className="border-t border-line pt-4 flex gap-4 text-xs text-muted">
                <span>
                  <strong className="text-ink">
                    {passageText.split(/\s+/).filter(Boolean).length}
                  </strong>{' '}
                  words
                </span>
                <span>⏱ Prep: <strong className="text-ink">{exercise.prepTimeSeconds}s</strong></span>
                <span>🎙 Limit: <strong className="text-ink">{exercise.timeLimitSeconds}s</strong></span>
              </div>
            </Card>

            {/* Tips */}
            <div className="rounded-xl bg-canvas border border-line p-4 space-y-2">
              <p className="text-xs font-bold text-ink">Reading tips</p>
              <ul className="space-y-1.5 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  Read at a natural, steady pace — not too fast.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  Pause briefly at commas and longer at full stops.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  Pronounce every word clearly — do not skip words.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  If you lose your place, resume from the last clear word.
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <Card className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                  What will be assessed
                </p>
                <ul className="space-y-2 text-xs text-ink/90">
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    Word accuracy vs. reference passage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    Skipped, substituted, or added words
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    Speaking pace (target: 120–160 WPM)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    Fluency and pause patterns
                  </li>
                </ul>
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => setStage('prep')}
            >
              <Mic className="size-5" />
              I'm Ready — Start Timer
            </Button>
          </div>
        </div>
      )}

      {/* Prep stage */}
      {stage === 'prep' && (
        <div className="space-y-4">
          <Card className="p-5 bg-primary-soft border-primary/20">
            <p className="text-xs text-muted mb-2">Passage to read:</p>
            <p className="text-sm text-ink font-medium leading-relaxed">{passageText}</p>
          </Card>
          <PrepTimer
            totalSeconds={exercise.prepTimeSeconds}
            onComplete={handlePrepDone}
          />
          <p className="text-center text-xs text-muted">
            Study the passage carefully. Recording begins automatically when the timer ends.
          </p>
        </div>
      )}

      {/* Recording stage */}
      {stage === 'recording' && (
        <div className="space-y-4">
          {recorder.micPermissionStatus === 'denied' ? (
            <MicPermission
              isDenied
              onRequestPermission={recorder.requestPermission}
              onSwitchToTextMode={() => navigate('/app/practice')}
            />
          ) : (
            <>
              {/* Reference passage visible during recording */}
              <Card className="p-5 bg-sky-50 border-sky-200">
                <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="size-3.5" /> Read this passage
                </p>
                <p className="text-sm text-ink leading-relaxed font-medium">{passageText}</p>
              </Card>

              <AudioRecorder
                recorder={recorder}
                timeLimitSeconds={exercise.timeLimitSeconds}
                onSubmit={handleSubmit}
                isSubmitting={false}
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    recorder.reset()
                    setStage('passage')
                  }}
                  className="gap-1.5 text-xs text-muted"
                >
                  <RotateCw className="size-3.5" />
                  Back to Passage
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Submitting */}
      {stage === 'submitting' && <UploadProgress />}
    </div>
  )
}
