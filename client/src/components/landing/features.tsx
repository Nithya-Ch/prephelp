import { useRef, useState } from 'react'
import { features } from '../../content/landing'
import { Container } from '../layout/container'
import { Reveal } from '../motion/reveal'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <Reveal>
          <Badge>Features</Badge>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-section">
            Feedback you can point to
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Each part of an answer stays visible: how it was said, how it was written, and which skill
            should come next.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} index={index} title={feature.title} body={feature.body} icon={feature.icon} />
          ))}
        </div>
      </Container>
    </section>
  )
}

function FeatureCard({
  title,
  body,
  icon: Icon,
  index,
}: {
  title: string
  body: string
  icon: (typeof features)[number]['icon']
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null)

  return (
    <Reveal delay={index * 0.05} className="h-full">
      <Card
        ref={ref}
        hover
        className="relative h-full overflow-hidden p-6"
        onMouseMove={(event) => {
          const bounds = ref.current?.getBoundingClientRect()
          if (!bounds) return
          setSpot({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
        }}
        onMouseLeave={() => setSpot(null)}
      >
        {spot ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(160px circle at ${spot.x}px ${spot.y}px, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 70%)`,
            }}
          />
        ) : null}
        <span className="relative grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <h3 className="relative mt-5 text-lg font-semibold text-ink">{title}</h3>
        <p className="relative mt-2 text-sm leading-6 text-muted">{body}</p>
      </Card>
    </Reveal>
  )
}
