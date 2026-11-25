import { Container } from '../layout/container'
import { ButtonLink } from '../ui/button'

export function Cta() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <div className="rounded-card border border-line bg-primary-soft px-6 py-12 text-center sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-section">
            Practice the answer you will actually give
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
            Accounts open in the next phase. You can review the sign-up layout now. It does not store
            anything.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink to="/get-started" size="lg" showArrow>
              Get started
            </ButtonLink>
            <ButtonLink to="/sign-in" variant="secondary" size="lg">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
