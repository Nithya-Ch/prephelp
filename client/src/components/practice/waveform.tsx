import { useEffect, useRef } from 'react'

interface WaveformProps {
  analyserNode: AnalyserNode | null
  isRecording: boolean
  isPaused?: boolean
  className?: string
  height?: number
  barCount?: number
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (typeof (ctx as any).roundRect === 'function') {
    ;(ctx as any).roundRect(x, y, width, height, radius)
  } else {
    ctx.rect(x, y, width, height)
  }
}

export function Waveform({
  analyserNode,
  isRecording,
  isPaused = false,
  className = '',
  height = 96,
  barCount = 48,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let dataArray: Uint8Array | null = null
    if (analyserNode) {
      dataArray = new Uint8Array(analyserNode.frequencyBinCount)
    }

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = rect.width || 400
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    let phase = 0

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)

      ctx.clearRect(0, 0, width, height)

      const barWidth = Math.max(3, (width - (barCount - 1) * 3) / barCount)
      const gap = 3
      const centerY = height / 2

      if (isRecording && !isPaused && analyserNode && dataArray) {
        analyserNode.getByteFrequencyData(dataArray)

        const step = Math.floor(dataArray.length / barCount)

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0
          // Scale height proportionally
          const percent = value / 255
          const barHeight = Math.max(6, percent * (height - 12))

          const x = i * (barWidth + gap)
          const y = centerY - barHeight / 2

          // Smooth SaaS gradient
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
          gradient.addColorStop(0, '#2563eb')
          gradient.addColorStop(1, '#60a5fa')

          ctx.fillStyle = gradient
          ctx.beginPath()
          drawRoundedRect(ctx, x, y, barWidth, barHeight, 3)
          ctx.fill()
        }
      } else if (isRecording && isPaused) {
        // Paused state: subtle flat bars
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap)
          const barHeight = 8
          const y = centerY - barHeight / 2

          ctx.fillStyle = '#cbd5e1'
          ctx.beginPath()
          drawRoundedRect(ctx, x, y, barWidth, barHeight, 2)
          ctx.fill()
        }
      } else {
        // Idle state: subtle resting wave animation
        phase += 0.05
        for (let i = 0; i < barCount; i++) {
          const sinVal = Math.sin(phase + i * 0.18)
          const barHeight = 6 + Math.abs(sinVal) * 14
          const x = i * (barWidth + gap)
          const y = centerY - barHeight / 2

          ctx.fillStyle = '#e2e8f0'
          ctx.beginPath()
          drawRoundedRect(ctx, x, y, barWidth, barHeight, 2)
          ctx.fill()
        }
      }
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [analyserNode, isRecording, isPaused, height, barCount])

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-canvas p-4 border border-line ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}
