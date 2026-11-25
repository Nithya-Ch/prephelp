import {
  Brain,
  ArrowRight,
  Compass,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { ButtonLink } from '../../components/ui/button'
import { api, type DashboardSummary } from '../../lib/api'

interface DimensionStats {
  score: number
  uncertainty: number
  trend: number
  attempts: number
}

interface ProfileData {
  dimensions: Record<string, DimensionStats>
  errorPatterns?: Record<string, number>
  isBaseline?: boolean
}

export function ProgressPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, dashRes] = await Promise.all([
          fetch('/api/profile', { credentials: 'include' }).then((r) => r.json()),
          api.profile.getDashboard().catch(() => null),
        ])
        setProfile(profRes)
        setDashboard(dashRes)
      } catch (err) {
        console.error('Failed to load profile data', err)
      }
    }
    loadData()
  }, [])

  const dims = profile?.dimensions || {
    grammar: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
    vocabulary: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
    structure: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
    confidence: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
    pace: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
    fluency: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
    filler_control: { score: 50, uncertainty: 30, trend: 0, attempts: 0 },
  }

  const dimLabels: Record<string, string> = {
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    structure: 'Structure',
    confidence: 'Confidence',
    pace: 'Speaking Pace',
    fluency: 'Fluency',
    filler_control: 'Filler Control',
  }

  const rec = dashboard?.recommendation

  const breakdown = dashboard?.breakdown || {
    'professional-introduction': 0,
    'read-aloud': 0,
    situational: 0,
    extempore: 0,
    pronunciation: 0,
    'rapid-fire': 0,
  }

  const exerciseLabels: Record<string, string> = {
    'professional-introduction': 'Professional Intro',
    'read-aloud': 'Read Aloud',
    situational: 'Situational Qs',
    extempore: 'Extempore',
    pronunciation: 'Pronunciation',
    'rapid-fire': 'Rapid Fire',
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="primary" className="font-semibold text-xs">
              Adaptive Learner Profile
            </Badge>
            {profile?.isBaseline && (
              <Badge tone="neutral" className="text-[10px]">
                Cold Start (Diagnostic Mode)
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Skill Profile & Evolution
          </h1>
          <p className="text-xs text-muted mt-1">
            Bayesian skill tracking, uncertainty reduction, and targeted next-step recommendations.
          </p>
        </div>
      </div>

      {/* Adaptive Recommendation Banner */}
      {rec && (
        <Card className="p-6 bg-gradient-to-r from-primary-soft/40 via-canvas to-accent-soft/30 border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Compass className="size-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Adaptive Recommendation ({rec.strategy})
                </span>
              </div>
              <h3 className="text-base font-bold text-ink">
                {rec.exerciseId?.prompt || 'Recommended Next Exercise'}
              </h3>
              <p className="text-xs text-muted max-w-2xl leading-relaxed">
                {rec.explanation}
              </p>
            </div>
            <div className="shrink-0">
              <ButtonLink
                to={`/app/practice/${rec.exerciseId?._id || ''}`}
                size="md"
                className="gap-2 shadow-sm"
              >
                Start Practice <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </Card>
      )}

      {/* Exercise Completion Breakdown (All 6 Modalities) */}
      <div>
        <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          Exercise Completion Breakdown
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(breakdown).map(([k, count]) => (
            <Card key={k} className="p-4 text-center space-y-1">
              <span className="text-[11px] font-semibold text-muted truncate block">
                {exerciseLabels[k] || k}
              </span>
              <p className="text-2xl font-extrabold text-ink tabular-nums">{count}</p>
              <span className="text-[10px] text-muted">{count === 1 ? 'drill' : 'drills'} done</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Strongest vs Areas Needing Improvement Summary */}
      {dashboard && (dashboard.strongestArea || dashboard.weakestArea) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {dashboard.strongestArea && (
            <Card className="p-5 flex items-start gap-3 bg-emerald-50/40 border-emerald-200/60">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-ink">Strongest Communication Area</p>
                <p className="text-sm font-semibold text-emerald-800 capitalize mt-0.5">
                  {dimLabels[dashboard.strongestArea.dimension] || dashboard.strongestArea.dimension} ({dashboard.strongestArea.score}/100)
                </p>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Consistent performance observed across your recent speech recordings.
                </p>
              </div>
            </Card>
          )}

          {dashboard.weakestArea && (
            <Card className="p-5 flex items-start gap-3 bg-amber-50/40 border-amber-200/60">
              <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-ink">Recommended Growth Focus</p>
                <p className="text-sm font-semibold text-amber-800 capitalize mt-0.5">
                  {dimLabels[dashboard.weakestArea.dimension] || dashboard.weakestArea.dimension} ({dashboard.weakestArea.score}/100)
                </p>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Targeted drills in this area will yield the greatest improvement in communication impact.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 7 Dimensions Grid */}
      <div>
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <Brain className="size-4 text-primary" />
          Dimension Mastery & Uncertainty
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(dims).map(([key, stats]) => {
            const score = Math.round(stats.score)
            const uncertainty = Math.round(stats.uncertainty)
            return (
              <Card key={key} className="p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">
                    {dimLabels[key] || key}
                  </span>
                  <span className="text-[10px] text-muted font-medium">
                    ±{uncertainty} uncertainty
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-extrabold text-ink tabular-nums">
                      {score}
                    </span>
                    <span className="text-xs text-muted">
                      {stats.attempts} {stats.attempts === 1 ? 'drill' : 'drills'}
                    </span>
                  </div>

                  {/* Score Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 75
                          ? 'bg-emerald-500'
                          : score >= 55
                          ? 'bg-primary'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.max(5, score)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-line">
                  <span>Trend:</span>
                  <span
                    className={`font-semibold ${
                      stats.trend > 0
                        ? 'text-emerald-600'
                        : stats.trend < 0
                        ? 'text-rose-500'
                        : 'text-muted'
                    }`}
                  >
                    {stats.trend > 0 ? `+${stats.trend}` : stats.trend} pts/session
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
