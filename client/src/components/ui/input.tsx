import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: ReactNode
}

export function Input({ label, hint, id, className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="block">
      {label ? (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink shadow-sm outline-none transition duration-200 placeholder:text-subtle focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30',
          className,
        )}
        {...props}
      />
      {hint ? <p className="mt-1.5 text-xs leading-5 text-subtle">{hint}</p> : null}
    </div>
  )
}
