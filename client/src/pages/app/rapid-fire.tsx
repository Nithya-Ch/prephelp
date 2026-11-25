import { useState, useEffect, useCallback } from 'react'
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  RotateCw,
} from 'lucide-react'
import {
  api,
  type RapidFireSessionData,
  type RapidFireReport,
} from '../../lib/api'
import { useRecorder } from '../../lib/use-recorder'
import { AudioRecorder } from '../../components/practice/audio-recorder'
import { Badge } from '../../components/ui/badge'
import { Button, ButtonLink } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

export function RapidFirePage() {
  const [session, setSession] = useState<RapidFireSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [report, setReport] = useState<RapidFireReport | null>(null)
  const [acknowledgedMessage, setAcknowledgedMessage] = useState<string | null>(null)
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(null)

  const recorder = useRecorder({ timeLimitSeconds: 90 })

  // Initialize or resume rapid fire session
  const startSession = useCallback(async () => {
    setIsLoading(true)
    setSubmitError(null)
    setAcknowledgedMessage(null)
    setReport(null)

    try {
      const res = await api.rapidFire.start()
      setSession(res.session)

      if (res.session.status === 'complete') {
        const reportRes = await api.rapidFire.getReport(res.session._id)
        setReport(reportRes.report)
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Could not start rapid-fire session.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    startSession()
  }, [startSession])

  // Handle single question submission
  const handleSubmitAnswer = async (audioBlob: Blob) => {
    if (!session) return
    setIsSubmitting(true)
    setSubmitError(null)

    const currentIdx = session.currentQuestionIndex
    const currentQ = session.questions[currentIdx]

    try {
      // 1. Submit voice response to standard sessions endpoint
      const formData = new FormData()
      const exercises = await api.exercises.getExercises('rapid-fire')
      const exId = exercises[0]?.id || 'rapid-fire-default'

      formData.append('exerciseId', exId)
      formData.append('mode', 'voice')
      formData.append('exerciseType', 'rapid-fire')
      formData.append('questionText', currentQ.questionText)
      formData.append('questionCategory', currentQ.categoryLabel)

      const ext = audioBlob.type.includes('webm') ? '.webm' : '.wav'
      formData.append('audio', audioBlob, `rapidfire_q${currentIdx + 1}${ext}`)

      const { sessionId } = await api.sessions.createSession(formData)

      // 2. Submit answer to rapid-fire coordinator
      const answerRes = await api.rapidFire.submitAnswer(session._id, {
        questionIndex: currentIdx,
        sessionId,
        audioDuration: 45, // default estimated
      })

      setSession(answerRes.session)
      recorder.reset()

      if (answerRes.isComplete) {
        // Fetch final consolidated report
        const reportRes = await api.rapidFire.getReport(session._id)
        setReport(reportRes.report)
      } else {
        // Brief clean acknowledgment without blocking
        setAcknowledgedMessage(`✓ Question ${currentIdx + 1} recorded. Ready for Question ${currentIdx + 2}!`)
        setTimeout(() => setAcknowledgedMessage(null), 3500)
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit answer. Please retry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-2xl bg-canvas border border-line" />
        <div className="h-64 animate-pulse rounded-2xl bg-canvas border border-line" />
      </div>
    )
  }

  // ── Final Consolidated Report View ────────────────────────────────────────
  if (session?.status === 'complete' || report) {
    const finalReport = report || session?.consolidatedReport

    return (
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone="primary" className="font-semibold text-xs">Interview Sprint Complete</Badge>
              <Badge tone="neutral" className="text-[10px]">10 of 10 Answered</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Rapid Fire Performance Report
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={startSession} variant="secondary" size="sm" className="gap-1.5">
              <RotateCw className="size-3.5" /> Start New Sprint
            </Button>
            <ButtonLink to="/app/progress" size="sm" className="gap-1.5">
              View Skill Profile <ArrowRight className="size-3.5" />
            </ButtonLink>
          </div>
        </div>

        {/* Hero Score Card */}
        {finalReport && (
          <Card className="p-6 sm:p-8 bg-gradient-to-r from-primary-soft/40 via-canvas to-emerald-50/50 border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Award className="size-4" /> Comprehensive Evaluation
                </span>
                <p className="text-sm text-ink/90 leading-relaxed font-medium">
                  "{finalReport.summary}"
                </p>
              </div>
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-extrabold text-5xl text-ink tabular-nums">
                  {finalReport.overallScore}
                </span>
                <span className="text-sm font-semibold text-muted">/ 100</span>
              </div>
            </div>
          </Card>
        )}

        {/* Two-Column Breakdown: Strengths vs Recurring Weaknesses */}
        {finalReport && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 space-y-4 border-emerald-200/60 bg-emerald-50/30">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" /> Key Communication Strengths
              </h3>
              <ul className="space-y-2 text-xs text-ink/90 leading-relaxed">
                {finalReport.overallStrengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 space-y-4 border-amber-200/60 bg-amber-50/30">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-600" /> Recurring Areas to Polish
              </h3>
              <ul className="space-y-2 text-xs text-ink/90 leading-relaxed">
                {finalReport.recurringWeaknesses.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-amber-600 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Best Questions vs Questions Needing Polish */}
        {finalReport && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-5 space-y-3">
              <p className="text-xs font-bold text-ink uppercase tracking-wider">
                🌟 Highest Impact Answers:
              </p>
              <ul className="space-y-1.5 text-xs text-muted">
                {finalReport.bestQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium text-ink">
                    <span className="size-1.5 rounded-full bg-primary" /> {q}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 space-y-3">
              <p className="text-xs font-bold text-ink uppercase tracking-wider">
                🎯 Answers to Structure Better:
              </p>
              <ul className="space-y-1.5 text-xs text-muted">
                {finalReport.needsImprovementQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium text-ink">
                    <span className="size-1.5 rounded-full bg-amber-500" /> {q}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Sentence Improvements */}
        {finalReport?.sentenceImprovements && finalReport.sentenceImprovements.length > 0 && (
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Recommended Sentence Refinements
            </h3>
            <div className="space-y-3">
              {finalReport.sentenceImprovements.map((ex, idx) => (
                <div key={idx} className="rounded-xl bg-canvas p-4 space-y-2 border border-line text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase">Original: </span>
                    <span className="text-ink line-through decoration-rose-300">"{ex.original}"</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Suggested: </span>
                    <span className="text-ink font-semibold">"{ex.improved}"</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed pt-1 border-t border-line">
                    Why: {ex.reason}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Question-by-Question Expandable Accordion */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <Layers className="size-4 text-primary" /> Question-by-Question Review (10 Prompts)
          </h3>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white overflow-hidden">
            {session?.questions.map((q, idx) => {
              const isExpanded = expandedQuestionIdx === idx
              return (
                <div key={idx} className="p-4 transition-colors">
                  <div
                    onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                    className="flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">{q.categoryLabel}</span>
                        {q.answeredAt ? (
                          <Badge tone="neutral" className="text-[10px] text-emerald-700">Answered</Badge>
                        ) : (
                          <Badge tone="neutral" className="text-[10px]">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted line-clamp-1">{q.questionText}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-muted shrink-0" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-line text-xs space-y-2">
                      <p className="text-ink font-medium">"{q.questionText}"</p>
                      {q.transcript ? (
                        <div className="rounded-lg bg-canvas p-3 text-muted leading-relaxed">
                          <strong className="text-ink">Transcript: </strong>"{q.transcript}"
                        </div>
                      ) : (
                        <p className="text-muted italic">No transcript recorded for this prompt.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Sequential Question Flow (Questions 1 to 10) ──────────────────────────
  if (!session) return null

  const currentIdx = session.currentQuestionIndex
  const currentQ = session.questions[currentIdx] || session.questions[0]
  const progressPercent = Math.round((currentIdx / 10) * 100)

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Progress Bar & Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted">
          <span className="flex items-center gap-1.5 text-primary font-bold">
            <Zap className="size-3.5 fill-primary" /> Rapid Fire Drill
          </span>
          <span>
            Question <strong className="text-ink">{currentIdx + 1}</strong> of 10
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {acknowledgedMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          {acknowledgedMessage}
        </div>
      )}

      {submitError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Current Question Card */}
      <Card className="p-6 space-y-4">
        <div>
          <Badge tone="primary" className="text-[10px] font-bold uppercase tracking-wider mb-2">
            {currentQ.categoryLabel}
          </Badge>
          <h2 className="text-xl font-bold text-ink leading-relaxed">
            "{currentQ.questionText}"
          </h2>
        </div>
        <div className="border-t border-line pt-3 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> 60–90 seconds optimal
          </span>
          <span>Keep it concise and punchy</span>
        </div>
      </Card>

      {/* Voice Recorder */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink">Speak your answer:</span>
          <span className="text-[11px] text-muted">Click stop when finished</span>
        </div>

        <AudioRecorder
          recorder={recorder}
          timeLimitSeconds={90}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isSubmitting}
        />
      </Card>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>No interruptions — feedback consolidates at the end.</span>
        <span>Auto-saves your progress</span>
      </div>
    </div>
  )
}
