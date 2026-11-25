import { stats } from '../../content/landing'
import { Container } from '../layout/container'
import { Reveal } from '../motion/reveal'
import { Badge } from '../ui/badge'
import { StatCard } from '../ui/stat-card'

export function Stats() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="stats-heading">
      <Container>
        <Reveal>
          <Badge>Scope, not usage</Badge>
          <h2 id="stats-heading" className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-section">
            What one session is built to show
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            These counts describe the product. They are not user totals, accuracy rates, or survey results.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.06}>
              <StatCard value={stat.value} label={stat.label} detail={stat.detail} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
