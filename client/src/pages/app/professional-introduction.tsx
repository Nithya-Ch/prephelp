/**
 * Professional Introduction Exercise Page
 *
 * Dedicated page for the professional-introduction exercise type.
 * Guides the user through instructions → recording → results.
 * Reuses existing audio-recording pipeline and displays exercise-specific assessment.
 */
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Mic,
  RefreshCw,
  RotateCw,
  Sparkles,
  User2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type Exercise, type Session, FALLBACK_EXERCISES } from '../../lib/api'
import { useRecorder } from '../../lib/use-recorder'
import { AudioRecorder } from '../../components/practice/audio-recorder'
import { MicPermission } from '../../components/practice/mic-permission'
import { PrepTimer } from '../../components/practice/prep-timer'
import { UploadProgress } from '../../components/practice/upload-progress'
import {
  AssessmentResults,
  getScores,
} from '../../components/practice/assessment-results'
import { Badge } from '../../components/ui/badge'
import { Button, ButtonLink } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

type PIStage = 'instructions' | 'prep' | 'recording' | 'submitting' | 'result'

// What a good professional introduction should cover
const PI_CHECKLIST = [
  { label: 'Your name and current role / education', icon: User2 },
  { label: 'Relevant background (1–2 sentences)', icon: BookOpen },
  { label: 'A specific achievement or project', icon: CheckCircle2 },
  { label: 'Key strengths relevant to the role', icon: Sparkles },
  { label: 'What you are looking for next', icon: ArrowRight },
]

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Beginner',
  medium: 'Intermediate',
  hard: 'Advanced',
}

export function ProfessionalIntroductionPage() {
  const { exerciseId } = useParams<{ exerciseId?: string }>()
  const navigate = useNavigate()

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [piExercises, setPIExercises] = useState<Exercise[]>([])
  const [isLoadingExercise, setIsLoadingExercise] = useState(true)
  const [stage, setStage] = useState<PIStage>('instructions')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [pollCount, setPollCount] = useState(0)

  const recorder = useRecorder({
    timeLimitSeconds: exercise?.timeLimitSeconds || 150,
    onTimeLimitReached: () => setStage('recording'),
  })

  // Fetch the PI exercise list and select the current one
  useEffect(() => {
    async function fetchExercise() {
      setIsLoadingExercise(true)
      try {
        const list = await api.exercises.getExercises('professional-introduction')
        const piList = list.filter(
          (e) => e.type === 'professional-introduction' || e.category === 'professional-introduction'
        )
        setPIExercises(piList.length > 0 ? piList : list.filter((e) => e.tags?.includes('professional-introduction')))

        const target = piList.length > 0 ? piList : list
        const selected = exerciseId
          ? target.find((e) => e.id === exerciseId) ||
            (await api.exercises.getExercise(exerciseId))
          : target[0] || FALLBACK_EXERCISES.find((e) => e.category === 'professional-introduction') || FALLBACK_EXERCISES[0]

        setExercise(selected)
      } catch {
        const fallback =
          FALLBACK_EXERCISES.find((e) => e.category === 'professional-introduction') ||
          FALLBACK_EXERCISES[0]
        setExercise(fallback)
      } finally {
        setIsLoadingExercise(false)
      }
    }
    fetchExercise()
  }, [exerciseId])

  // Poll session status after submission
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
        if (!cancelled) {
          setPollCount((p) => p + 1)
          if (pollCount < 20) timer = window.setTimeout(poll, 2000)
        }
      }
    }

    poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [session?.id, stage])

  const handleStartRecording = async () => {
    setStage('prep')
  }

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
      formData.append('exerciseType', 'professional-introduction')
      formData.append('exerciseTitle', exercise.title || 'Professional Introduction')
      formData.append('audio', blob, 'recording.webm')

      const result = await api.sessions.createSession(formData)
      // Start polling by creating a stub session
      const stub: Session = {
        id: result.sessionId,
        exerciseId: exercise.id,
        exerciseTitle: exercise.prompt.slice(0, 60),
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
    setStage('instructions')
    setSession(null)
    setSubmitError(null)
    setPollCount(0)
  }

  if (isLoadingExercise || !exercise) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-2xl bg-canvas border border-line" />
        <div className="h-64 animate-pulse rounded-2xl bg-canvas border border-line" />
      </div>
    )
  }

  // ── Result Stage ─────────────────────────────────────────────────────────
  if (stage === 'result' && session) {
    if (session.status === 'queued' || session.status === 'processing') {
      const steps = [
        'Receiving your recording...',
        'Transcribing your introduction...',
        'Analysing grammar and vocabulary...',
        'Evaluating structure and professional tone...',
        'Generating personalised feedback...',
      ]
      const stepIdx = Math.min(pollCount, steps.length - 1)
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-6 grid size-20 place-items-center rounded-3xl bg-primary-soft text-primary shadow-float">
            <Sparkles className="size-10 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-3xl border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Analysing Your Introduction
          </h2>
          <p className="mt-2 text-sm font-medium text-primary animate-pulse">{steps[stepIdx]}</p>
          <p className="mt-1 text-xs text-muted max-w-sm">
            This usually takes 5–15 seconds. Please wait while we evaluate your response.
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
              {(session as any).error || 'We encountered an issue processing your recording. Please try again.'}
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Button onClick={handleReset} size="md" className="gap-2">
                <RefreshCw className="size-4" /> Try Again
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    // Complete
    const scores = getScores(session)
    const hasResults = Object.values(scores).some((v) => v != null)

    return (
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone="primary" className="font-semibold text-xs">Analysis Complete</Badge>
              <Badge tone="neutral" className="font-medium text-[10px]">Professional Introduction</Badge>
              <span className="text-xs text-muted">
                {new Date(session.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Your Introduction Results
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleReset}>
              <RefreshCw className="size-3.5" /> Try Again
            </Button>
            {piExercises.length > 1 && (
              <ButtonLink
                to={`/app/exercise/professional-introduction/${piExercises.find((e) => e.id !== exercise.id)?.id || ''}`}
                size="sm"
                className="gap-1.5"
              >
                Next Level <ArrowRight className="size-3.5" />
              </ButtonLink>
            )}
          </div>
        </div>

        {hasResults ? (
          <AssessmentResults
            session={session}
            showSentenceExamples
            dimensionKeys={['grammar', 'vocabulary', 'structure', 'confidence', 'pace', 'fluency', 'filler_control']}
          />
        ) : (
          <div className="text-center py-12 text-muted text-sm">
            <p>Results are still being processed. Please refresh in a moment.</p>
            <Button className="mt-4" onClick={() => window.location.reload()} size="sm">Refresh</Button>
          </div>
        )}
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
            <Badge tone="primary" className="font-semibold text-xs">Professional Introduction</Badge>
            {exercise.difficulty && (
              <Badge tone="neutral" className="font-medium text-[10px] capitalize">
                {DIFFICULTY_LABELS[exercise.difficulty] || exercise.difficulty}
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Introduce Yourself
          </h1>
        </div>
        {/* Difficulty selector */}
        {piExercises.length > 1 && (
          <div className="flex items-center gap-2">
            {piExercises.map((ex) => (
              <ButtonLink
                key={ex.id}
                to={`/app/exercise/professional-introduction/${ex.id}`}
                variant={ex.id === exercise.id ? 'primary' : 'secondary'}
                size="sm"
                className="text-xs capitalize"
              >
                {DIFFICULTY_LABELS[ex.difficulty] || ex.difficulty}
              </ButtonLink>
            ))}
          </div>
        )}
      </div>

      {submitError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          {submitError}
        </div>
      )}

      {/* Instructions stage */}
      {stage === 'instructions' && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Checklist */}
          <Card className="p-6 space-y-5 lg:col-span-3">
            <div>
              <h2 className="text-base font-bold text-ink mb-1">What to include</h2>
              <p className="text-xs text-muted">
                A strong professional introduction covers these elements naturally and confidently.
              </p>
            </div>
            <ul className="space-y-3">
              {PI_CHECKLIST.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary shrink-0">
                    <item.icon className="size-4" />
                  </div>
                  <span className="text-sm text-ink/90">{item.label}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-1">
              <p className="text-xs font-bold text-amber-800">Pro tip</p>
              <p className="text-xs text-amber-900 leading-relaxed">
                Avoid saying "I am having experience of…" — instead say "I have experience in…".
                Use direct, confident statements. Aim for{' '}
                <strong>{Math.floor(exercise.timeLimitSeconds / 60)}–{Math.ceil(exercise.timeLimitSeconds / 60)} minutes</strong>.
              </p>
            </div>
          </Card>

          {/* Prompt + Start */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Your Prompt</p>
                <p className="text-sm text-ink leading-relaxed">{exercise.prompt}</p>
              </div>
              <div className="flex gap-3 text-xs text-muted border-t border-line pt-4">
                <span>⏱ Prep: <strong className="text-ink">{exercise.prepTimeSeconds}s</strong></span>
                <span>🎙 Limit: <strong className="text-ink">{exercise.timeLimitSeconds}s</strong></span>
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleStartRecording}
            >
              <Mic className="size-5" />
              Start Preparation Timer
            </Button>

            <p className="text-center text-[11px] text-muted">
              You will have {exercise.prepTimeSeconds} seconds to prepare, then recording begins.
            </p>
          </div>
        </div>
      )}

      {/* Prep timer stage */}
      {stage === 'prep' && (
        <div className="space-y-4">
          <Card className="p-5 bg-primary-soft border-primary/20">
            <p className="text-xs text-muted mb-2">Reminder — your prompt:</p>
            <p className="text-sm text-ink font-medium leading-relaxed">{exercise.prompt}</p>
          </Card>
          <PrepTimer
            totalSeconds={exercise.prepTimeSeconds}
            onComplete={handlePrepDone}
          />
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
              <Card className="p-4 bg-canvas border border-line">
                <p className="text-xs text-muted mb-1">Your prompt:</p>
                <p className="text-sm text-ink font-medium">{exercise.prompt}</p>
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
                    setStage('instructions')
                  }}
                  className="gap-1.5 text-xs text-muted"
                >
                  <RotateCw className="size-3.5" />
                  Back to Instructions
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Submitting stage */}
      {stage === 'submitting' && <UploadProgress />}
    </div>
  )
}
