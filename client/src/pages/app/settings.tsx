import { Shield, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth-context'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-sm text-muted">
          Manage your personal profile, audio preferences, and privacy controls.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <User className="size-4 text-primary" />
          Profile Information
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Full Name</label>
            <Input defaultValue={user?.name || ''} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Email Address</label>
            <Input defaultValue={user?.email || ''} disabled />
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-8 space-y-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Shield className="size-4 text-primary" />
          Audio Privacy & Consent
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          Your audio recordings are retained strictly to compute metrics and provide your personal transcript review.
        </p>
        <div className="flex items-center justify-between border-t border-line pt-4">
          <Link
            to="/consent"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Review Full Consent Policy
          </Link>
          <Button variant="secondary" size="sm">
            Purge Cached Recordings
          </Button>
        </div>
      </Card>
    </div>
  )
}
