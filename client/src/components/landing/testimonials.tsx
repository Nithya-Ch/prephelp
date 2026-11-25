import { Container } from '../layout/container'
import { Reveal } from '../motion/reveal'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'

const cards = [
  { label: 'Sample card A', role: 'Placeholder' },
  { label: 'Sample card B', role: 'Placeholder' },
  { label: 'Sample card C', role: 'Placeholder' },
]

export function Testimonials() {
  return (
    <section className="border-y border-line bg-white py-20 sm:py-28" aria-labelledby="quotes-heading">
      <Container>
        <Reveal>
          <Badge>Layout only</Badge>
          <h2 id="quotes-heading" className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-section">
            Testimonial slots
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            These cards reserve space for a later study. They are not quotes from real students, and no
            names are invented here.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <Reveal key={card.label} delay={index * 0.06}>
              <Card hover className="h-full p-6">
                <Badge tone="primary">Placeholder</Badge>
                <p className="mt-4 text-sm leading-6 text-muted">
                  Placeholder copy for spacing and tone. Replace this only with a quote you have permission
                  to publish.
                </p>
                <p className="mt-6 text-sm font-semibold text-ink">{card.label}</p>
                <p className="text-xs text-subtle">{card.role}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
