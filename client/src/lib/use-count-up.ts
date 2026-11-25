import { useEffect, useState } from 'react'

/** Ease-out count for stat cards. Reduced motion jumps straight to the target. */
export function useCountUp(target: number, active: boolean, reduceMotion: boolean) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    if (reduceMotion) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()
    const duration = 1100

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setValue(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, reduceMotion, target])

  return value
}
