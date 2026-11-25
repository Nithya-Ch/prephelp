import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Container } from '../components/layout/container'

type AccountPreviewProps = {
  mode: 'sign-in' | 'get-started'
}

export function AccountPreview({ mode }: AccountPreviewProps) {
  const [message, setMessage] = useState('')
  const isSignIn = mode === 'sign-in'

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('Accounts are not active in this phase. Nothing was submitted or stored.')
  }

  return (
    <main id="main" className="py-16">
      <Container className="max-w-lg">
        <p className="text-sm font-medium text-primary">Layout preview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          {isSignIn ? 'Sign in' : 'Get started'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          This screen shows the account form. It does not create a session, and the fields stay in the
          browser.
        </p>
        <Card className="mt-8 p-6">
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            {isSignIn ? null : (
              <Input label="Name" name="name" autoComplete="name" placeholder="Your name" />
            )}
            <Input label="Email" name="email" type="email" autoComplete="email" placeholder="you@college.edu" required />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              placeholder="At least 8 characters"
              required
            />
            {isSignIn ? null : (
              <label className="flex items-start gap-3 text-sm leading-6 text-muted">
                <input type="checkbox" name="audioConsent" className="mt-1 size-4 accent-primary" />
                <span>
                  Allow PrepHelp to store recordings. This choice is not saved yet. Consent will be required
                  before any audio is kept.
                </span>
              </label>
            )}
            <Button type="submit" className="w-full" showArrow>
              {isSignIn ? 'Sign in' : 'Create account'}
            </Button>
          </form>
          {message ? (
            <p role="status" className="mt-4 rounded-xl bg-canvas px-3 py-3 text-sm text-ink">
              {message}
            </p>
          ) : null}
        </Card>
        <p className="mt-6 text-sm text-muted">
          {isSignIn ? (
            <>
              New here?{' '}
              <Link to="/get-started" className="font-medium text-primary hover:text-primary-hover">
                Get started
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link to="/sign-in" className="font-medium text-primary hover:text-primary-hover">
                Sign in
              </Link>
            </>
          )}
        </p>
      </Container>
    </main>
  )
}
