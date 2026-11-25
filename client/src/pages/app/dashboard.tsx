import {
  Activity,
  ArrowRight,
  BookOpen,
  Clock,
  MessageSquare,
  Mic,
  Play,
  Sparkles,
  TrendingUp,
  User2,
  Volume2,
  Globe,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Exercise, type Session, type DashboardSummary } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { Badge } from '../../components/ui/badge'
import { ButtonLink } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

export function DashboardPage() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [exData, sessData, dashData] = await Promise.all([
          api.exercises.getExercises(),
          api.sessions.getRecentSessions(),
          api.profile.getDashboard().catch(() => null),
        ])
        setExercises(exData)
        setRecentSessions(sessData)
        setDashboard(dashData)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Derived real KPI metrics from recent sessions
  const completedSessions = recentSessions.filter((s) => s.status === 'complete')
  const totalCount = dashboard?.totalCompleted ?? completedSessions.length

  const avgFluency =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.scores?.fluency ?? s.metrics?.fluencyScore ?? 75), 0) /
            completedSessions.length
        )
      : (dashboard?.profile?.dimensions?.fluency?.score ? Math.round(dashboard.profile.dimensions.fluency.score) : 75)

  const avgPace =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.metrics?.wpm ?? 140), 0) /
            completedSessions.length
        )
      : 140

  const avgFillers =
    completedSessions.length > 0
      ? (
          completedSessions.reduce((acc, s) => acc + (s.metrics?.fillers_per_minute ?? 1.5), 0) /
          completedSessions.length
        ).toFixed(1)
      : '1.5'

  const totalMinutes = Math.round(
    completedSessions.reduce((acc, s) => acc + (s.metrics?.total_duration ?? 60), 0) / 60
  )

  const recommendedExercise =
    dashboard?.recommendation?.exerciseId && typeof dashboard.recommendation.exerciseId === 'object'
      ? {
          id: (dashboard.recommendation.exerciseId as any)._id || 'rec-drill',
          title: (dashboard.recommendation.exerciseId as any).title || 'Targeted Practice',
          prompt: dashboard.recommendation.exerciseId.prompt,
          prepTimeSeconds: 20,
          timeLimitSeconds: 120,
          category: ((dashboard.recommendation.exerciseId as any).type || 'interview') as Exercise['category'],
          difficulty: 'medium' as const,
        }
      : exercises[0]

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Communicator'}
          </h1>
          <p className="text-sm text-muted">
            Track your verbal metrics, reduce fillers, and build speaking confidence.
          </p>
        </div>
        <ButtonLink to="/app/practice" size="md" className="gap-2 shrink-0 self-start sm:self-auto">
          <Mic className="size-4" />
          Start New Practice
        </ButtonLink>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
            <Activity className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Average Fluency</p>
            <p className="text-2xl font-bold tracking-tight text-ink">
              {totalCount > 0 ? `${avgFluency} / 100` : '—'}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">
              {totalCount > 0 ? 'Estimated speech flow' : 'Complete 1 drill to calibrate'}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Average Pace</p>
            <p className="text-2xl font-bold tracking-tight text-ink">
              {totalCount > 0 ? `${avgPace} WPM` : '—'}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">
              Target: 130–160 WPM
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <Volume2 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Filler Frequency</p>
            <p className="text-2xl font-bold tracking-tight text-ink">
              {totalCount > 0 ? `${avgFillers}/min` : '—'}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">
              {totalCount > 0 ? 'Target: < 2.0 / min' : 'Calibrated per session'}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-canvas text-ink border border-line">
            <Clock className="size-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Completed Drills</p>
            <p className="text-2xl font-bold tracking-tight text-ink">
              {totalCount} {totalCount === 1 ? 'drill' : 'drills'}
            </p>
            <p className="text-[11px] text-muted">
              {totalMinutes > 0 ? `~${totalMinutes} mins spoken` : 'Start your first session'}
            </p>
          </div>
        </Card>
      </div>

      {/* ── All 6 Communication Exercises ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-ink">Adaptive Exercise Suite</h2>
            <p className="text-xs text-muted">Six specialized modalities targeting different communication capabilities</p>
          </div>
          <span className="text-xs text-muted font-medium">6 modules ready</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Professional Introduction */}
          <Card className="relative overflow-hidden p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <User2 className="size-5" />
                </div>
                <Badge tone="primary" className="text-[10px]">Beginner → Advanced</Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Professional Introduction</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Deliver a structured self-introduction. Evaluates professional tone, grammar, and sentence construction.
                </p>
              </div>
            </div>
            <div className="pt-4">
              <ButtonLink to="/app/exercise/professional-introduction" size="sm" className="w-full gap-1.5 text-xs justify-center">
                Start Introduction <ArrowRight className="size-3.5" />
              </ButtonLink>
            </div>
          </Card>

          {/* 2. Read Aloud */}
          <Card className="relative overflow-hidden p-5 border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-transparent flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <BookOpen className="size-5" />
                </div>
                <Badge tone="neutral" className="text-[10px]">Word Accuracy</Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Read Aloud</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Read technical and business passages. Evaluates skipped, substituted, and added words with Levenshtein alignment.
                </p>
              </div>
            </div>
            <div className="pt-4">
              <ButtonLink to="/app/exercise/read-aloud" size="sm" variant="secondary" className="w-full gap-1.5 text-xs justify-center">
                Start Reading <ArrowRight className="size-3.5" />
              </ButtonLink>
            </div>
          </Card>

          {/* 3. Situational Questions */}
          <Card className="p-5 flex flex-col justify-between border-orange-200/60 bg-gradient-to-br from-orange-50/40 to-transparent">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600">
                  <MessageSquare className="size-5" />
                </div>
                <Badge tone="neutral" className="text-[10px]">6 Categories</Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Situational Questions</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Real professional workplace scenarios. Evaluates STAR structure, diplomacy, and practical decision-making without question repetition.
                </p>
              </div>
            </div>
            <div className="pt-4">
              <ButtonLink to="/app/exercise/situational-questions" size="sm" variant="secondary" className="w-full gap-1.5 text-xs justify-center">
                Practice Scenarios <ArrowRight className="size-3.5" />
              </ButtonLink>
            </div>
          </Card>

          {/* 4. Extempore */}
          <Card className="p-5 flex flex-col justify-between border-purple-200/60 bg-gradient-to-br from-purple-50/40 to-transparent">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
                  <Globe className="size-5" />
                </div>
                <Badge tone="neutral" className="text-[10px]">Spontaneous</Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Extempore Speaking</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Think on your feet with 30s prep. Evaluates logical flow, depth of discussion, opening hook, and conclusion structure.
                </p>
              </div>
            </div>
            <div className="pt-4">
              <ButtonLink to="/app/exercise/extempore" size="sm" variant="secondary" className="w-full gap-1.5 text-xs justify-center">
                Start Extempore <ArrowRight className="size-3.5" />
              </ButtonLink>
            </div>
          </Card>

          {/* 5. Pronunciation Practice */}
          <Card className="p-5 flex flex-col justify-between border-sky-200/60 bg-gradient-to-br from-sky-50/40 to-transparent">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-600">
                  <Volume2 className="size-5" />
                </div>
                <Badge tone="neutral" className="text-[10px]">Phonetic Bank</Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Pronunciation Drill</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Hear terminology via speech synthesis, record your voice, and verify recognition against target words across 3 levels.
                </p>
              </div>
            </div>
            <div className="pt-4">
              <ButtonLink to="/app/exercise/pronunciation" size="sm" variant="secondary" className="w-full gap-1.5 text-xs justify-center">
                Practice Words <ArrowRight className="size-3.5" />
              </ButtonLink>
            </div>
          </Card>

          {/* 6. Interview Rapid Fire */}
          <Card className="p-5 flex flex-col justify-between border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-transparent">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="size-5" />
                </div>
                <Badge tone="primary" className="text-[10px]">10-Question Sprint</Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Interview Rapid Fire</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Complete 10 sequential interview questions with uninterrupted pacing. Generates a consolidated assessment report upon completion.
                </p>
              </div>
            </div>
            <div className="pt-4">
              <ButtonLink to="/app/exercise/rapid-fire" size="sm" className="w-full gap-1.5 text-xs justify-center">
                Start 10-Q Sprint <ArrowRight className="size-3.5" />
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Start Spotlight Card */}
      {recommendedExercise && (
        <Card className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent border-primary/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone="primary" className="font-semibold text-xs">
                  Featured Sprint
                </Badge>
                <span className="text-xs text-muted">
                  Prep: {recommendedExercise.prepTimeSeconds}s · Limit: {recommendedExercise.timeLimitSeconds}s
                </span>
              </div>
              <h2 className="text-xl font-bold text-ink sm:text-2xl">
                {recommendedExercise.title}
              </h2>
              <p className="text-xs text-muted leading-relaxed">
                "{recommendedExercise.prompt}"
              </p>
            </div>
            <ButtonLink
              to={`/app/practice/${recommendedExercise.id}`}
              size="lg"
              className="gap-2 shrink-0 self-start sm:self-auto"
            >
              <Play className="size-4 fill-white" />
              Practice Prompt
            </ButtonLink>
          </div>
        </Card>
      )}

      {/* Two Column Section: Exercise Recommendations & Recent Sessions */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Recommended Exercises (3 cols) */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink">Exercise Prompts</h3>
              <p className="text-xs text-muted">Pick a targeted scenario to practice today</p>
            </div>
            <Link
              to="/app/practice"
              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
            >
              Browse all <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-canvas border border-line" />
                ))}
              </div>
            ) : (
              exercises.slice(0, 4).map((exercise) => (
                <Link
                  key={exercise.id}
                  to={`/app/practice/${exercise.id}`}
                  className="group flex flex-col justify-between gap-3 rounded-2xl border border-line bg-white p-4 transition-all hover:border-primary/40 hover:shadow-card sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors">
                        {exercise.title}
                      </span>
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium text-muted capitalize border border-line">
                        {exercise.category}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted">
                      {exercise.prompt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-[11px] font-medium text-muted">
                      {exercise.timeLimitSeconds}s limit
                    </span>
                    <span className="grid size-8 place-items-center rounded-lg bg-canvas text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Sessions Snippet (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink">Recent Sessions</h3>
              <p className="text-xs text-muted">Your latest completed analyses</p>
            </div>
          </div>

          <Card className="divide-y divide-line p-2">
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="grid size-10 place-items-center rounded-xl bg-canvas text-muted mb-2">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-ink">No sessions recorded yet</p>
                <p className="text-[11px] text-muted mt-1 max-w-[200px]">
                  Complete your first speaking practice to unlock detailed speech analytics.
                </p>
                <ButtonLink to="/app/practice" size="sm" className="mt-4">
                  Start First Drill
                </ButtonLink>
              </div>
            ) : (
              recentSessions.map((sess) => (
                <Link
                  key={sess.id}
                  to={`/app/result/${sess.id}`}
                  className="flex items-center justify-between p-3.5 hover:bg-canvas rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate text-xs font-semibold text-ink">
                      {sess.exerciseTitle || 'Speaking Practice'}
                    </p>
                    <p className="text-[11px] text-muted">
                      {new Date(sess.createdAt).toLocaleDateString()} · {sess.mode === 'audio' ? 'Voice' : 'Text'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sess.metrics ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        {sess.metrics.fluencyScore} pts
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted capitalize">
                        {sess.status}
                      </span>
                    )}
                    <ArrowRight className="size-3.5 text-muted" />
                  </div>
                </Link>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
