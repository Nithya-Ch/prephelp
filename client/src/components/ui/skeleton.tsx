import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={cn('block animate-pulse rounded-lg bg-slate-200/80', className)}
      {...props}
    />
  )
}
