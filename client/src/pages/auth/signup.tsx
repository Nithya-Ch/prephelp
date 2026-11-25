import { ArrowRight, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/brand/logo'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { useAuth } from '../../lib/auth-context'

export function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [audioConsent, setAudioConsent] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !email || !password) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (!audioConsent) {
      setError('Consent for audio analysis is required to evaluate your speech.')
      return
    }

    try {
      setIsLoading(true)
      await signup({ name, email, password })
      navigate('/app/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Start your speech practice
          </h1>
          <p className="mt-2 text-sm text-muted">
            Create your account to access real-time speaking exercises and fluency analytics.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="flex items-center gap-1.5 text-xs font-semibold text-ink"
              >
                <User className="size-3.5 text-muted" />
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="flex items-center gap-1.5 text-xs font-semibold text-ink"
              >
                <Mail className="size-3.5 text-muted" />
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="flex items-center gap-1.5 text-xs font-semibold text-ink"
              >
                <Lock className="size-3.5 text-muted" />
                Password (min. 6 characters)
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Audio Consent Checkbox */}
            <div className="rounded-xl bg-canvas p-3.5 border border-line">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={audioConsent}
                  onChange={(e) => setAudioConsent(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-line text-primary focus:ring-primary"
                />
                <span className="text-xs text-muted leading-relaxed">
                  I agree to audio processing for speech transcription and metric calculation.{' '}
                  <Link
                    to="/consent"
                    target="_blank"
                    className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
                  >
                    View audio privacy terms
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2 mt-2"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck className="size-4 text-primary" />
            <span>Encrypted data · No ads · No voice selling</span>
          </div>

          <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link
              to="/sign-in"
              className="font-semibold text-primary hover:text-primary-hover underline underline-offset-2"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
