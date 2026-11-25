import type { HTMLAttributes, Ref } from 'react'
import { cn } from '../../lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean
  ref?: Ref<HTMLDivElement>
}

export function Card({ hover = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-white shadow-card',
        hover &&
          'transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-card-hover',
        className,
      )}
      {...props}
    />
  )
}
