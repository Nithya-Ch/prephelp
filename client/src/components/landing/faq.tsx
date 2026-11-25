import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { faqs } from '../../content/landing'
import { Container } from '../layout/container'
import { Reveal } from '../motion/reveal'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

export function Faq() {
  const [openIndex, setOpenIndex] = useState(0)
  const reduce = useReducedMotion()

  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Reveal>
          <Badge>FAQ</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-section">
            Straight answers
          </h2>
          <p className="mt-4 text-base leading-7 text-muted">
            What this phase includes, and what is still a plan.
          </p>
        </Reveal>
        <div className="divide-y divide-line rounded-card border border-line bg-white shadow-card">
          {faqs.map((item, index) => {
            const open = openIndex === index
            const panelId = `faq-panel-${index}`
            const buttonId = `faq-button-${index}`
            return (
              <div key={item.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? -1 : index)}
                  >
                    <span className="text-sm font-semibold text-ink sm:text-base">{item.question}</span>
                    <ChevronDown
                      className={cn('size-4 shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-6 text-muted">{item.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
