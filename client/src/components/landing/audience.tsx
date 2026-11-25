import { Container } from '../layout/container'
import { Reveal } from '../motion/reveal'
import { Card } from '../ui/card'

export function Audience() {
  return (
    <section className="py-20 sm:py-28" aria-label="Who PrepHelp is for">
      <Container className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card id="students" hover className="h-full scroll-mt-28 p-7">
            <p className="text-sm font-medium text-primary">For students</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">One prompt, then a clear review</h2>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base sm:leading-7">
              Practice an interview answer, a read-aloud, or a short written response. The review is
              meant to mark fillers, long pauses, and grammar on the transcript, then point at the
              skill to practice next.
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card id="institutions" hover className="h-full scroll-mt-28 p-7">
            <p className="text-sm font-medium text-primary">For institutions</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Cohort reporting is planned</h2>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base sm:leading-7">
              A later phase can cover shared practice activity for a class or placement cell. This
              phase has no institution accounts, rosters, or admin console.
            </p>
          </Card>
        </Reveal>
      </Container>
    </section>
  )
}
