import { Loader2, UploadCloud } from 'lucide-react'
import { Card } from '../ui/card'

interface UploadProgressProps {
  progress?: number
  label?: string
  sublabel?: string
}

export function UploadProgress({
  progress,
  label = 'Uploading audio recording...',
  sublabel = 'Securely transferring audio to the processing pipeline',
}: UploadProgressProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
      <div className="relative mb-5 grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary">
        <UploadCloud className="size-8 animate-bounce text-primary" />
        <div className="absolute -top-1 -right-1">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-ink">{label}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted">{sublabel}</p>

      {progress !== undefined && (
        <div className="mt-6 w-full max-w-xs">
          <div className="flex justify-between text-xs font-medium text-muted mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-canvas border border-line">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
