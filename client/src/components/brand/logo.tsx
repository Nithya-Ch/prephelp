import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg font-semibold tracking-tight text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-white" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1.5" y="9" width="3" height="5.5" rx="0.7" />
          <rect x="6.5" y="5.5" width="3" height="9" rx="0.7" />
          <rect x="11.5" y="2" width="3" height="12.5" rx="0.7" />
        </svg>
      </span>
      PrepHelp
    </Link>
  )
}
