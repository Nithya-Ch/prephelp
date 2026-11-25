import { ArrowRight, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

interface PrepTimerProps {
  totalSeconds: number
  onComplete: () => void
}

export function PrepTimer({ totalSeconds, onComplete }: PrepTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    if (remaining <= 0) {
      onComplete()
      return
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [remaining, onComplete])

  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100))

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        Preparation Time
      </p>
      <h3 className="mt-1 text-lg font-semibold text-ink">
        Gather your thoughts before recording
      </h3>

      {/* Countdown Ring */}
      <div className="relative my-8 grid size-36 place-items-center">
        <svg className="size-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            stroke="currentColor"
            strokeWidth="8"
            className="text-canvas"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={326.7}
            strokeDashoffset={326.7 - (326.7 * progressPercent) / 100}
            strokeLinecap="round"
            className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
            fill="none"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-4xl font-extrabold text-ink tabular-nums">
            {remaining}
          </span>
          <span className="text-[11px] font-medium text-muted">seconds</span>
        </div>
      </div>

      <p className="max-w-md text-xs text-muted mb-6">
        Take a deep breath, structure your main talking points, and hit start when ready.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onComplete} size="md" className="gap-2">
          <Play className="size-4 fill-white" />
          Start Speaking Now
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </Card>
  )
}
