import { motion, useReducedMotion } from 'framer-motion'
import { steps } from '../../content/landing'
import { Container } from '../layout/container'
import { Reveal } from '../motion/reveal'
import { Badge } from '../ui/badge'

export function HowItWorks() {
  const reduce = useReducedMotion()

  return (
    <section id="how-it-works" className="scroll-mt-24 border-y border-line bg-white py-20 sm:py-28">
      <Container>
        <Reveal>
          <Badge>How it works</Badge>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-section">
            Speak, then practice the gap
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            The loop is the same shape for everyone. The exercise inside it is not.
          </p>
        </Reveal>
        <div className="relative mt-14">
          <div className="absolute top-5 right-0 left-0 hidden h-px bg-line md:block" aria-hidden>
            <motion.div
              className="h-full origin-left bg-primary"
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 0.08}>
                  <span className="relative z-10 grid size-10 place-items-center rounded-full border border-line bg-white text-sm font-semibold text-primary shadow-card">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
