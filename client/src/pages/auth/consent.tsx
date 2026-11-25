import { CheckCircle2, FileText, Lock, Shield, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/brand/logo'
import { ButtonLink } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

export function ConsentPage() {
  return (
    <div className="min-h-screen bg-canvas py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <ButtonLink to="/sign-in" variant="ghost" size="sm">
            Back to Sign In
          </ButtonLink>
        </div>

        <Card className="p-8 sm:p-10 space-y-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-2">
              <Shield className="size-4" />
              Privacy & Consent Governance
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Audio Processing & Data Protection
            </h1>
            <p className="mt-2 text-sm text-muted">
              PrepHelp is built with strict privacy boundaries. Understand how your voice recordings are handled during practice sessions.
            </p>
          </div>

          <div className="space-y-6 text-sm text-ink/90 leading-relaxed border-t border-line pt-6">
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-bold text-ink text-base">
                <FileText className="size-4 text-primary" />
                1. What We Collect
              </h2>
              <p className="text-muted text-xs leading-relaxed">
                When you record audio during speaking sessions, we temporarily process your speech to compute:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-muted">
                <li>Verbal pace (words per minute).</li>
                <li>Filler word frequency (e.g. “um”, “uh”, “like”, “you know”).</li>
                <li>Pause distribution, vocal pitch regularity, and overall fluency score.</li>
                <li>Verbatim text transcript strictly for metrics extraction and self-review.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-bold text-ink text-base">
                <Lock className="size-4 text-primary" />
                2. Processing & Storage
              </h2>
              <p className="text-muted text-xs leading-relaxed">
                Audio snippets are processed in real time or via dedicated worker queues. We never use your private voice samples to train general foundation models without explicit affirmative opt-in. All audio transmissions are encrypted via TLS in transit and AES-256 at rest.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-bold text-ink text-base">
                <Trash2 className="size-4 text-primary" />
                3. Deletion & Data Retention
              </h2>
              <p className="text-muted text-xs leading-relaxed">
                You retain complete ownership over your practice recordings. At any time in your account settings, you may purge individual session recordings or permanently delete your account history.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-bold text-ink text-base">
                <CheckCircle2 className="size-4 text-emerald-600" />
                4. Summary of Commitments
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="rounded-xl bg-canvas p-3 border border-line">
                  <p className="font-semibold text-xs text-ink">No Third-Party Brokers</p>
                  <p className="text-[11px] text-muted mt-0.5">Your voice data is never rented or monetized.</p>
                </div>
                <div className="rounded-xl bg-canvas p-3 border border-line">
                  <p className="font-semibold text-xs text-ink">Institutional Sandboxing</p>
                  <p className="text-[11px] text-muted mt-0.5">Campus and cohort data remains partitioned.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <Link
              to="/get-started"
              className="text-xs font-semibold text-primary hover:underline"
            >
              ← Back to Registration
            </Link>
            <ButtonLink to="/get-started" size="md">
              Accept & Continue
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  )
}
