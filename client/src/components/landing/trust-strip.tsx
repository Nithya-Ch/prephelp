import { trustMarks } from '../../content/landing'
import { Container } from '../layout/container'

export function TrustStrip() {
  return (
    <section aria-label="Placeholder institution marks" className="border-y border-line bg-white">
      <Container className="py-8">
        <p className="text-center text-xs font-medium tracking-wide text-subtle uppercase">
          Placeholder marks for layout. These are not partner logos.
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {trustMarks.map((mark) => (
            <li
              key={mark}
              className="rounded-xl border border-dashed border-line bg-canvas px-4 py-2 text-sm font-semibold text-subtle"
            >
              {mark}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
