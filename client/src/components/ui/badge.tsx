import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'primary' | 'accent'
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide',
        tone === 'neutral' && 'border-line bg-white text-muted',
        tone === 'primary' && 'border-transparent bg-primary-soft text-primary',
        tone === 'accent' && 'border-transparent bg-accent-soft text-accent',
        className,
      )}
      {...props}
    />
  )
}
