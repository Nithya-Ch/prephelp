import { Clock, Sparkles, Timer } from 'lucide-react'
import type { Exercise } from '../../lib/api'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

interface PromptCardProps {
  exercise: Exercise
  className?: string
}

export function PromptCard({ exercise, className }: PromptCardProps) {
  const difficultyColor =
    exercise.difficulty === 'easy'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : exercise.difficulty === 'medium'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-rose-200 bg-rose-50 text-rose-700'

  return (
    <Card className={cn('p-6 sm:p-7', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary" className="capitalize font-semibold">
            {exercise.category.replace('-', ' ')}
          </Badge>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
              difficultyColor,
            )}
          >
            {exercise.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Timer className="size-3.5" />
            Prep: {exercise.prepTimeSeconds}s
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            Limit: {Math.floor(exercise.timeLimitSeconds / 60)}m {exercise.timeLimitSeconds % 60 ? `${exercise.timeLimitSeconds % 60}s` : ''}
          </span>
        </div>
      </div>

      <div className="pt-5 space-y-3">
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {exercise.title}
        </h2>
        <div className="rounded-xl bg-canvas p-4 text-base font-medium leading-relaxed text-ink/90 border border-line/60">
          "{exercise.prompt}"
        </div>
        {exercise.description && (
          <p className="text-xs text-muted leading-relaxed">
            {exercise.description}
          </p>
        )}
      </div>

      {exercise.tags && exercise.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
          {exercise.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted border border-line/50"
            >
              <Sparkles className="size-2.5 text-primary" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}
