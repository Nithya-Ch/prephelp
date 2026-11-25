/**
 * Generic session result page — works for all exercise types.
 * Delegates rendering to the reusable AssessmentResults component.
 *
 * CHANGE: the old "demoSession" fake-data fallback has been removed.
 * If the backend can't be reached, the page now shows a real error
 * instead of pretending the analysis worked.
 */
import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type Session } from '../../lib/api'
import {
  AssessmentResults,
  getMetrics,
} from '../../components/practice/assessment-results'
import { Badge } from '../../components/ui/badge'
import { Button, ButtonLink } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

function exerciseTitle(session: Session): string {
  if (session.exerciseTitle) return session.exerciseTitle
  const ex = session.exerciseId
  if (typeof ex === 'object' && ex !== null) {
    if ((ex as any).type === 'situational' && (session as any).questionText) {
      return (session as any).questionText
    }
    return (ex as any).prompt?.slice(0, 60) || (ex as any).type || 'Exercise'
  }
  return 'Performance Evaluation'
}

function getExerciseType(session: Session): string {
  const ex = session.exerciseId
  if (typeof ex === 'object' && ex !== null) {
    return (ex as any).type || 'interview'
  }
  return 'interview'
}

export function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    let timer: number | null = null
    let failures = 0

    async function poll() {
      try {
        const data = await api.sessions.getSession(sessionId!)
        if (cancelled) return
        failures = 0
        setSession(data)

        if (data.status === 'queued' || data.status === 'processing') {
          timer = window.setTimeout(poll, 1500)
          setPollCount((prev) => prev + 1)
        }
      } catch (err) {
        if (cancelled) return
        failures += 1
        setPollCount((prev) => prev + 1)
        console.error('Failed to load session result:', err)

        if (failures >= 3) {
          const message =
            err instanceof Error && err.message
              ? err.message
              : 'Could not reach the server. Make sure the backend is running.'
          setSession({
            id: sessionId!,
            status: 'failed',
            error: `Could not load your result. ${message}`,
            createdAt: new Date().toISOString(),
          } as any)
        } else {
          timer = window.setTimeout(poll, 1500)
        }
      }
    }

    poll()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [sessionId])

  // ── Loading / Processing ──
  if (!session || session.status === 'queued' || session.status === 'processing') {
    const steps = [
      'Receiving your response...',
      'Transcribing and analysing speech patterns...',
      'Evaluating grammar, vocabulary, and structure...',
      'Computing confidence and coaching feedback...',
      'Finalising your personalised report...',
    ]
    const stepIndex = Math.min(pollCount, steps.length - 1)

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-6 grid size-20 place-items-center rounded-3xl bg-primary-soft text-primary shadow-float">
          <Sparkles className="size-10 animate-spin text-primary" />
          <div className="absolute inset-0 rounded-3xl border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Analysing Your Response
        </h2>
        <p className="mt-2 text-sm font-medium text-primary animate-pulse">{steps[stepIndex]}</p>
        <p className="mt-1 text-xs text-muted max-w-sm">
          This usually takes 3–8 seconds depending on response length.
        </p>
        <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-canvas border border-line" />
          ))}
        </div>
      </div>
    )
  }

  // ── Failed ──
  if (session.status === 'failed') {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="p-8 text-center space-y-4">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-ink">Analysis Incomplete</h2>
          <p className="text-xs text-muted leading-relaxed">
            {(session as any).error || 'We encountered an issue processing your response. Please try again.'}
          </p>
          {(session as any).errorCode && (
            <p className="font-mono text-[11px] text-muted">Error: {(session as any).errorCode}</p>
          )}
          <div className="pt-4 flex justify-center gap-3">
            <Button onClick={() => navigate('/app/practice')} size="md" className="gap-2">
              <RefreshCw className="size-4" /> Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Complete ──
  const isVoice = session.mode === 'voice' || session.mode === 'audio'
  const exerciseType = getExerciseType(session)
  const isReadAloud = exerciseType === 'read-aloud'
  const isPI = exerciseType === 'professional-introduction'
  const isSituational = exerciseType === 'situational'
  const metrics = getMetrics(session)
  const hasAlignment = isReadAloud && !!metrics?.read_aloud?.alignment?.length

  const referenceText = (() => {
    const ex = session.exerciseId
    if (typeof ex === 'object' && ex !== null) return (ex as any).referenceText
    return undefined
  })()

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="primary" className="font-semibold text-xs">
              Analysis Complete
            </Badge>
            <Badge tone="neutral" className="font-medium text-[10px]">
              {isVoice ? 'Voice' : 'Text'}
            </Badge>
            <span className="text-xs text-muted">
              {new Date(session.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {exerciseTitle(session)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink to="/app/practice" variant="secondary" size="sm" className="gap-1.5">
            <RefreshCw className="size-3.5" /> Practice Again
          </ButtonLink>
          {isSituational ? (
            <ButtonLink to="/app/exercise/situational-questions" size="sm" className="gap-1.5">
              Next Question <ArrowRight className="size-3.5" />
            </ButtonLink>
          ) : (
            <ButtonLink to="/app/practice" size="sm" className="gap-1.5">
              Next Exercise <ArrowRight className="size-3.5" />
            </ButtonLink>
          )}
        </div>
      </div>

      <AssessmentResults
        session={session}
        showAlignment={hasAlignment}
        showSentenceExamples={isPI || isSituational}
        referenceText={referenceText}
      />
    </div>
  )
}