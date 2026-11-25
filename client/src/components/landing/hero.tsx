import { motion, useReducedMotion } from 'framer-motion'
import { Badge } from '../ui/badge'
import { Button, ButtonLink } from '../ui/button'
import { Card } from '../ui/card'
import { Container } from '../layout/container'

const bars = [
  { label: 'Grammar', value: 74 },
  { label: 'Pace', value: 61 },
  { label: 'Fillers', value: 58 },
  { label: 'Structure', value: 69 },
]

const wave = [8, 14, 22, 12, 28, 18, 10, 24, 16, 8, 20, 12]

type HeroProps = {
  onWatchTour: () => void
}

export function Hero({ onWatchTour }: HeroProps) {
  const reduce = useReducedMotion()

  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-8%] h-[420px] w-[min(720px,90vw)] -translate-x-1/2 rounded-full bg-glow-blue opacity-80 blur-3xl" />
        <div className="absolute right-[6%] top-[18%] h-[260px] w-[min(380px,70vw)] rounded-full bg-glow-lavender opacity-70 blur-3xl" />
      </div>
      <Container className="grid items-center gap-14 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-24">
        <div>
          <Badge>For interviews and presentations</Badge>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-hero">
            Practice speaking. See{' '}
            <span className="relative whitespace-nowrap text-primary">
              <span className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-sm bg-primary-soft sm:h-4" />
              measurable progress
            </span>
            .
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Record or write an answer, review grammar, pace, fillers, and structure, then practice the
            skill that still needs work.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/get-started" size="lg" showArrow>
              Get started
            </ButtonLink>
            <Button variant="secondary" size="lg" onClick={onWatchTour}>
              Watch tour
            </Button>
          </div>
        </div>

        <motion.div
          className="relative mx-auto w-full max-w-md"
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={reduce ? undefined : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute -left-4 top-8 hidden h-[92%] w-full rounded-card border border-line bg-white/80 shadow-card lg:block"
            aria-hidden
          />
          <Card className="relative p-5 shadow-float sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Skills snapshot</p>
                <p className="mt-1 text-xs text-subtle">Sample layout, not a student result</p>
              </div>
              <Badge tone="accent">Sample</Badge>
            </div>
            <ul className="mt-6 space-y-4">
              {bars.map((bar) => (
                <li key={bar.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{bar.label}</span>
                    <span className="tabular-nums text-muted">{bar.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${bar.value}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-line bg-canvas px-4 py-3">
              <p className="text-xs font-medium text-subtle">Last answer · sample</p>
              <div className="mt-3 flex h-8 items-end gap-1" aria-hidden>
                {wave.map((height, index) => (
                  <span
                    key={index}
                    className="w-1.5 rounded-full bg-primary/70"
                    style={{ height }}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm text-ink">128 wpm · 3 fillers · 1 long pause</p>
            </div>
          </Card>
        </motion.div>
      </Container>
    </section>
  )
}
