/**
 * AssessmentResults — Reusable assessment result display component.
 *
 * Used by both the generic result page and exercise-specific pages
 * (Professional Introduction, Read Aloud). Renders scores, feedback,
 * transcript, sentence improvement examples, and read-aloud alignment.
 */
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  Gauge,
  GitCompare,
  Lightbulb,
  Mic,
  ShieldCheck,
  Sparkles,
  Type,
  Volume2,
  Zap,
} from 'lucide-react'
import type {
  AnalysisDoc,
  DimensionScores,
  SentenceExample,
  Session,
  SessionFeedback,
  SessionMetrics,
} from '../../lib/api'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'

// ── Helpers ──────────────────────────────────────────────────────────────────

export function extractAnalysis(session: Session): AnalysisDoc | null {
  if (session.analysisId && typeof session.analysisId === 'object') {
    return session.analysisId as AnalysisDoc
  }
  return null
}

export function getScores(session: Session): DimensionScores {
  const analysis = extractAnalysis(session)
  if (analysis?.scores) return analysis.scores
  if (session.scores) return session.scores
  return {}
}

export function getMetrics(session: Session): SessionMetrics {
  const analysis = extractAnalysis(session)
  if (analysis?.metrics) return analysis.metrics
  if (session.metrics) return session.metrics || {}
  return {}
}

export function getTranscript(session: Session): string {
  const analysis = extractAnalysis(session)
  return analysis?.transcript || session.transcript || session.text || ''
}

export function getFeedback(session: Session): SessionFeedback | null {
  return (session as any).feedback || session.feedback || null
}

export function getFlags(session: Session) {
  const analysis = extractAnalysis(session)
  return analysis?.flags || []
}

// ── Scoring utilities ─────────────────────────────────────────────────────────

export function scoreColor(val: number | null | undefined): string {
  if (val == null) return 'text-slate-400'
  if (val >= 80) return 'text-emerald-600'
  if (val >= 60) return 'text-amber-600'
  return 'text-rose-600'
}

export function scoreBg(val: number | null | undefined): string {
  if (val == null) return 'bg-slate-50'
  if (val >= 80) return 'bg-emerald-50'
  if (val >= 60) return 'bg-amber-50'
  return 'bg-rose-50'
}

export function scoreLabel(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  if (val >= 80) return 'Strong'
  if (val >= 60) return 'Developing'
  return 'Needs Work'
}

// ── ScoreCard ─────────────────────────────────────────────────────────────────

export function ScoreCard({
  label,
  value,
  icon: Icon,
  subtitle,
}: {
  label: string
  value: number | null | undefined
  icon: React.ElementType
  subtitle?: string
}) {
  return (
    <Card className="p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</span>
        <div className={`grid size-8 place-items-center rounded-lg ${scoreBg(value)} ${scoreColor(value)}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-2">
        {value != null ? (
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-extrabold tabular-nums ${scoreColor(value)}`}>
              {Math.round(value)}
            </span>
            <span className="text-[11px] text-muted font-medium">/ 100</span>
          </div>
        ) : (
          <span className="text-lg font-bold text-slate-300">—</span>
        )}
        <p className={`text-[11px] font-medium mt-0.5 ${scoreColor(value)}`}>
          {subtitle || scoreLabel(value)}
        </p>
      </div>
    </Card>
  )
}

// ── Dimension score config ───────────────────────────────────────────────────

export type DimensionDef = {
  key: keyof DimensionScores
  label: string
  icon: React.ElementType
  voiceOnly?: boolean
}

export const ALL_DIMENSIONS: DimensionDef[] = [
  { key: 'grammar', label: 'Grammar', icon: Type },
  { key: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
  { key: 'structure', label: 'Structure', icon: BarChart2 },
  { key: 'confidence', label: 'Confidence', icon: ShieldCheck },
  { key: 'pace', label: 'Pace', icon: Gauge, voiceOnly: true },
  { key: 'fluency', label: 'Fluency', icon: Sparkles, voiceOnly: true },
  { key: 'filler_control', label: 'Filler Control', icon: Volume2, voiceOnly: true },
]

// ── Transcript Viewer ─────────────────────────────────────────────────────────

export function TranscriptViewer({
  transcript,
  flags,
}: {
  transcript: string
  flags: Array<{ type: string; start?: number; end?: number; detail?: string }>
}) {
  if (!transcript) {
    return <p className="text-xs text-muted italic">Transcript not available.</p>
  }

  const charAnnotations: Map<number, { type: string; detail: string }> = new Map()
  for (const f of flags) {
    if ((f.type === 'grammar' || f.type === 'hedging') && f.start != null && f.end != null) {
      for (let i = f.start; i < f.end && i < transcript.length; i++) {
        charAnnotations.set(i, { type: f.type, detail: f.detail || '' })
      }
    }
  }

  const fillerFlags = flags.filter((f) => f.type === 'filler')
  const fillerWords = new Set(
    fillerFlags.map((f) => f.detail?.replace(/^Filler:\s*/i, '').toLowerCase() || '').filter(Boolean)
  )

  if (charAnnotations.size === 0) {
    const tokens = transcript.split(/(\s+|[.,!?;:]+)/)
    return (
      <div className="rounded-xl bg-canvas p-5 border border-line">
        <p className="text-sm leading-relaxed text-ink/90">
          {tokens.map((token, idx) => {
            const clean = token.toLowerCase().trim()
            const isFiller = fillerWords.has(clean) || ['um', 'uh', 'er', 'ah'].includes(clean)
            if (isFiller) {
              return (
                <mark
                  key={idx}
                  className="rounded bg-amber-100 px-1 py-0.5 font-semibold text-amber-800 border border-amber-200"
                  title="Filler word"
                >
                  {token}
                </mark>
              )
            }
            return <span key={idx}>{token}</span>
          })}
        </p>
      </div>
    )
  }

  const segments: Array<{ text: string; type: string | null; detail: string }> = []
  let currentType: string | null = null
  let currentDetail = ''
  let buffer = ''

  for (let i = 0; i < transcript.length; i++) {
    const ann = charAnnotations.get(i)
    const type = ann?.type || null
    if (type !== currentType) {
      if (buffer) segments.push({ text: buffer, type: currentType, detail: currentDetail })
      buffer = transcript[i]
      currentType = type
      currentDetail = ann?.detail || ''
    } else {
      buffer += transcript[i]
    }
  }
  if (buffer) segments.push({ text: buffer, type: currentType, detail: currentDetail })

  return (
    <div className="rounded-xl bg-canvas p-5 border border-line">
      <p className="text-sm leading-relaxed text-ink/90">
        {segments.map((seg, idx) => {
          if (seg.type === 'grammar') {
            return (
              <span
                key={idx}
                className="underline decoration-rose-400 decoration-wavy underline-offset-4 cursor-help"
                title={seg.detail}
              >
                {seg.text}
              </span>
            )
          }
          if (seg.type === 'hedging') {
            return (
              <mark
                key={idx}
                className="rounded bg-violet-50 px-0.5 text-violet-800 border-b border-violet-300"
                title={seg.detail}
              >
                {seg.text}
              </mark>
            )
          }
          return <span key={idx}>{seg.text}</span>
        })}
      </p>
    </div>
  )
}

// ── Read-Aloud Word Alignment View ───────────────────────────────────────────

export function ReadAloudAlignmentView({
  alignment,
  referenceText,
}: {
  alignment: Array<{ reference: string; spoken: string; status: string }>
  referenceText?: string
}) {
  if (!alignment || alignment.length === 0) {
    if (referenceText) {
      return (
        <div className="rounded-xl bg-canvas p-5 border border-line">
          <p className="text-xs text-muted italic mb-2">Word alignment data not available. Reference passage:</p>
          <p className="text-sm leading-relaxed text-ink/90">{referenceText}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl bg-canvas p-5 border border-line">
      <div className="flex flex-wrap gap-1.5 text-sm leading-loose">
        {alignment.map((item, idx) => {
          if (item.status === 'correct') {
            return (
              <span key={idx} className="text-ink/90 font-medium">
                {item.reference}
              </span>
            )
          }
          if (item.status === 'deleted') {
            return (
              <span
                key={idx}
                className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-700 font-semibold line-through text-xs border border-rose-200"
                title={`Skipped: "${item.reference}"`}
              >
                {item.reference}
              </span>
            )
          }
          if (item.status === 'substituted') {
            return (
              <span
                key={idx}
                className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 font-semibold text-xs border border-amber-200"
                title={`Said "${item.spoken}" instead of "${item.reference}"`}
              >
                {item.reference}
                <span className="text-[10px] text-amber-600 ml-1">→{item.spoken}</span>
              </span>
            )
          }
          if (item.status === 'inserted') {
            return (
              <span
                key={idx}
                className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700 font-semibold text-xs border border-sky-200"
                title={`Added word: "${item.spoken}"`}
              >
                +{item.spoken}
              </span>
            )
          }
          return null
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted border-t border-line pt-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded bg-rose-200 border border-rose-300" /> Skipped
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded bg-amber-200 border border-amber-300" /> Substituted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded bg-sky-200 border border-sky-300" /> Added
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded bg-white border border-line" /> Correct
        </span>
      </div>
    </div>
  )
}

// ── Sentence Example Cards ───────────────────────────────────────────────────

export function SentenceExamplesSection({
  examples,
}: {
  examples: SentenceExample[]
}) {
  if (!examples || examples.length === 0) return null

  return (
    <Card className="p-5 space-y-4">
      <h4 className="text-xs font-bold text-ink uppercase tracking-wide flex items-center gap-2">
        <ArrowUpRight className="size-3.5 text-primary" />
        Suggested Sentence Improvements
      </h4>
      <p className="text-[11px] text-muted">
        These are examples of phrasing from your response with suggested improvements. Your intended meaning is preserved.
      </p>
      <div className="space-y-3">
        {examples.map((ex, idx) => (
          <div key={idx} className="rounded-xl border border-line bg-canvas p-4 space-y-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Your phrase</span>
              <p className="text-xs text-ink/80 italic bg-rose-50 rounded-lg px-3 py-2 border border-rose-100">
                "{ex.original}"
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Suggested</span>
              <p className="text-xs text-ink/80 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100 font-medium">
                "{ex.improved}"
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Why</span>
              <p className="text-[11px] text-muted leading-relaxed">{ex.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Main AssessmentResults Component ─────────────────────────────────────────

interface AssessmentResultsProps {
  session: Session
  /** Restrict which dimension scores to show (defaults to all) */
  dimensionKeys?: Array<keyof DimensionScores>
  /** Show read-aloud alignment panel */
  showAlignment?: boolean
  /** Show sentence improvement examples */
  showSentenceExamples?: boolean
  /** Reference passage (for read-aloud) */
  referenceText?: string
}

export function AssessmentResults({
  session,
  dimensionKeys,
  showAlignment = false,
  showSentenceExamples = false,
  referenceText,
}: AssessmentResultsProps) {
  const scores = getScores(session)
  const metrics = getMetrics(session)
  const transcript = getTranscript(session)
  const feedback = getFeedback(session)
  const flags = getFlags(session)
  const isVoice = session.mode === 'voice' || session.mode === 'audio'

  const activeDims = ALL_DIMENSIONS.filter(
    (d) =>
      (!d.voiceOnly || isVoice) &&
      (dimensionKeys ? dimensionKeys.includes(d.key) : true) &&
      scores[d.key] != null
  )

  const readAloudData = metrics?.read_aloud
  const sentenceExamples = feedback?.sentenceExamples || []

  const errorPatterns = (() => {
    const analysis = extractAnalysis(session)
    return analysis?.errorPatterns
  })()

  return (
    <div className="space-y-6">
      {/* Score Grid */}
      {activeDims.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            Performance Dimensions
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {activeDims.map((dim) => (
              <ScoreCard
                key={dim.key}
                label={dim.label}
                value={scores[dim.key]}
                icon={dim.icon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Transcript / Alignment */}
        <div className="space-y-4 lg:col-span-3">
          {showAlignment && readAloudData && readAloudData.alignment ? (
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <GitCompare className="size-4 text-primary" />
                  <h3 className="text-base font-bold text-ink">Word-by-Word Comparison</h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted">
                  {readAloudData.accuracy_percentage != null && (
                    <Badge tone="primary" className="text-xs font-bold">
                      {readAloudData.accuracy_percentage}% accuracy
                    </Badge>
                  )}
                </div>
              </div>
              <ReadAloudAlignmentView
                alignment={readAloudData.alignment}
                referenceText={referenceText}
              />
              {/* Read-aloud stats strip */}
              <div className="mt-4 pt-4 border-t border-line flex flex-wrap gap-4 text-[11px] text-muted">
                {readAloudData.correct != null && (
                  <span><strong className="text-emerald-600">{readAloudData.correct}</strong> correct</span>
                )}
                {readAloudData.deletions != null && readAloudData.deletions > 0 && (
                  <span><strong className="text-rose-600">{readAloudData.deletions}</strong> skipped</span>
                )}
                {readAloudData.substitutions != null && readAloudData.substitutions > 0 && (
                  <span><strong className="text-amber-600">{readAloudData.substitutions}</strong> substituted</span>
                )}
                {readAloudData.insertions != null && readAloudData.insertions > 0 && (
                  <span><strong className="text-sky-600">{readAloudData.insertions}</strong> added</span>
                )}
                {readAloudData.wer != null && (
                  <span>WER: <strong className="text-ink">{(readAloudData.wer * 100).toFixed(0)}%</strong></span>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Mic className="size-4 text-primary" />
                  <h3 className="text-base font-bold text-ink">
                    {isVoice ? 'Verbatim Transcript' : 'Your Response'}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted">
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-2 rounded-full bg-amber-300" /> Fillers
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-2 rounded-full bg-rose-400" /> Grammar
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block size-2 rounded-full bg-violet-400" /> Hedging
                  </span>
                </div>
              </div>
              <TranscriptViewer transcript={transcript} flags={flags} />
              {isVoice && metrics && (
                <div className="mt-4 pt-4 border-t border-line flex flex-wrap gap-4 text-[11px] text-muted">
                  {metrics.wpm != null && (
                    <span><strong className="text-ink">{Math.round(metrics.wpm)}</strong> WPM</span>
                  )}
                  {metrics.pause_count != null && (
                    <span><strong className="text-ink">{metrics.pause_count}</strong> pauses</span>
                  )}
                  {metrics.filler_count != null && (
                    <span><strong className="text-ink">{metrics.filler_count}</strong> fillers</span>
                  )}
                  {metrics.total_duration != null && (
                    <span><strong className="text-ink">{metrics.total_duration.toFixed(1)}s</strong> total</span>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Grammar error patterns */}
          {errorPatterns && (() => {
            const entries = Object.entries(errorPatterns).filter(([, v]) => v > 0)
            if (entries.length === 0) return null
            return (
              <Card className="p-5">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Zap className="size-3.5 text-rose-500" />
                  Grammar Error Patterns
                </h4>
                <div className="flex flex-wrap gap-2">
                  {entries.map(([cat, count]) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-200"
                    >
                      <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] text-rose-500">×{count}</span>
                    </span>
                  ))}
                </div>
              </Card>
            )
          })()}

          {/* Sentence Examples (PI-specific) */}
          {showSentenceExamples && <SentenceExamplesSection examples={sentenceExamples} />}
        </div>

        {/* Right: Feedback */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-6 sm:p-7 space-y-6">
            {/* Summary */}
            <div>
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
                <BarChart2 className="size-4" />
                Coach Evaluation
              </div>
              <h3 className="text-base font-bold text-ink">Summary</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                {feedback?.summary ||
                  'Analysis complete. Review your dimension scores above for detailed performance insights.'}
              </p>
            </div>

            {/* Strengths */}
            <div className="space-y-2.5 border-t border-line pt-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Key Strengths
              </h4>
              <ul className="space-y-2 text-xs text-ink/90">
                {(
                  feedback?.strengths || [
                    'Complete your first practice session to receive personalised strengths.',
                  ]
                ).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="space-y-2.5 border-t border-line pt-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wide">
                <Flame className="size-4 text-primary" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2 text-xs text-ink/90">
                {(
                  feedback?.improvements || [
                    'Practice more to unlock personalised improvement suggestions.',
                  ]
                ).map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tip */}
            {feedback?.tip && (
              <div className="border-t border-line pt-4">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-1">
                    <Lightbulb className="size-4 text-amber-600" />
                    Quick Tip
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">{feedback.tip}</p>
                </div>
              </div>
            )}

            {/* Fallback notice */}
            {feedback?.fallbackUsed && (
              <p className="text-[10px] text-muted italic border-t border-line pt-3">
                AI coaching unavailable — feedback generated using rule-based analysis.
              </p>
            )}
          </Card>

          {/* Alert notice: estimated vs measured */}
          <div className="rounded-xl border border-line bg-canvas p-3">
            <p className="text-[10px] text-muted leading-relaxed">
              <AlertTriangle className="size-3 inline mr-1 text-amber-500" />
              Scores labelled <em>Confidence Indicator</em> and <em>Fluency</em> are
              estimated from acoustic signals, not directly measured.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
