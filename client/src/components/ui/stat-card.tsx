import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useCountUp } from '../../lib/use-count-up'
import { Card } from './card'

type StatCardProps = {
  value: number
  label: string
  detail: string
}

export function StatCard({ value, label, detail }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const reduce = useReducedMotion() ?? false
  const current = useCountUp(value, active, reduce)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true)
      },
      { threshold: 0.45 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Card ref={ref} className="p-6">
      <p className="text-4xl font-semibold tracking-tight text-ink tabular-nums">{Math.round(current)}</p>
      <p className="mt-3 font-medium text-ink">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </Card>
  )
}
