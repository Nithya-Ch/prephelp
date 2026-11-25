import { useState, useEffect } from 'react'
import { ArrowRight, Mic, Sparkles, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, type Session } from '../../lib/api'
import { Badge } from '../../components/ui/badge'
import { ButtonLink } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

export function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    async function loadSessions() {
      setIsLoading(true)
      try {
        const list = await api.sessions.getRecentSessions()
        setSessions(list)
      } catch {
        setSessions([])
      } finally {
        setIsLoading(false)
      }
    }
    loadSessions()
  }, [])

  const filtered = sessions.filter((s) => {
    if (filterType === 'all') return true
    const ex = s.exerciseId as any
    const type = typeof ex === 'object' && ex !== null ? ex.type || ex.category : 'interview'
    return type === filterType
  })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Practice History
          </h1>
          <p className="text-sm text-muted">
            All your recorded sessions, transcripts, and evaluation reports across every exercise.
          </p>
        </div>
        <ButtonLink to="/app/practice" size="md" className="gap-2 self-start sm:self-auto">
          <Mic className="size-4" />
          New Practice
        </ButtonLink>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-muted flex items-center gap-1 font-semibold pr-1">
          <Filter className="size-3.5" /> Filter:
        </span>
        {['all', 'professional-introduction', 'read-aloud', 'situational', 'extempore', 'pronunciation', 'rapid-fire'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`rounded-lg px-3 py-1 font-semibold capitalize whitespace-nowrap transition-all ${
              filterType === f
                ? 'bg-primary text-white shadow-sm'
                : 'bg-canvas text-muted hover:text-ink border border-line'
            }`}
          >
            {f === 'all' ? 'All Drills' : f.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <Card className="divide-y divide-line p-2">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-canvas" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-canvas text-muted mb-3">
              <Sparkles className="size-6 text-primary" />
            </div>
            <p className="text-sm font-bold text-ink">No sessions found</p>
            <p className="text-xs text-muted mt-1 max-w-sm">
              Complete your first speaking practice to unlock your unified assessment history.
            </p>
            <ButtonLink to="/app/practice" size="sm" className="mt-4">
              Start Practice Drill
            </ButtonLink>
          </div>
        ) : (
          filtered.map((sess) => {
            const ex = sess.exerciseId as any
            const title =
              sess.exerciseTitle ||
              (typeof ex === 'object' && ex !== null ? ex.prompt?.slice(0, 60) : 'Speaking Drill')
            const fluency = sess.scores?.fluency ?? sess.metrics?.fluencyScore
            const dateStr = new Date(sess.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={sess.id || sess._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-canvas rounded-xl transition-colors gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink truncate">{title}</p>
                    <Badge tone="neutral" className="text-[10px] capitalize">
                      {sess.mode}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {dateStr} · Status: <span className="capitalize font-medium text-ink">{sess.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  {fluency != null ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      {Math.round(fluency)} pts
                    </span>
                  ) : null}
                  <Link
                    to={`/app/result/${sess.id || sess._id}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    View Report <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}
