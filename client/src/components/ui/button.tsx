import { ArrowRight } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background-color,box-shadow,border-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-sm hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md',
        secondary:
          'border border-line bg-white text-ink shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-card',
        ghost: 'bg-transparent text-ink hover:bg-slate-100',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonStyle = VariantProps<typeof buttonVariants> & {
  showArrow?: boolean
  className?: string
  children: ReactNode
}

function ButtonContent({ showArrow, children }: { showArrow?: boolean; children: ReactNode }) {
  return (
    <>
      {children}
      {showArrow ? (
        <ArrowRight
          className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
          aria-hidden
        />
      ) : null}
    </>
  )
}

type ButtonProps = ButtonStyle & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

export function Button({ variant, size, showArrow, className, children, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <ButtonContent showArrow={showArrow}>{children}</ButtonContent>
    </button>
  )
}

export function ButtonLink({
  to,
  variant,
  size,
  showArrow,
  className,
  children,
}: ButtonStyle & { to: string }) {
  return (
    <Link to={to} className={cn(buttonVariants({ variant, size }), className)}>
      <ButtonContent showArrow={showArrow}>{children}</ButtonContent>
    </Link>
  )
}
