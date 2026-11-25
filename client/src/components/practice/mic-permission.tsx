import { AlertCircle, CheckCircle2, Lock, Mic, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

interface MicPermissionProps {
  onRequestPermission: () => Promise<boolean>
  onSwitchToTextMode?: () => void
  isDenied?: boolean
}

export function MicPermission({
  onRequestPermission,
  onSwitchToTextMode,
  isDenied = false,
}: MicPermissionProps) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div
          className={`grid size-14 place-items-center rounded-2xl mb-4 ${
            isDenied ? 'bg-rose-50 text-rose-600' : 'bg-primary-soft text-primary'
          }`}
        >
          {isDenied ? (
            <AlertCircle className="size-7" />
          ) : (
            <Mic className="size-7" />
          )}
        </div>

        <h3 className="text-lg font-bold text-ink">
          {isDenied ? 'Microphone Access Blocked' : 'Microphone Access Required'}
        </h3>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted">
          {isDenied
            ? 'Your browser has blocked microphone access for this website. To practice speaking, please allow permission in your browser address bar.'
            : 'PrepHelp evaluates speech fluency, pacing, and filler words using your microphone.'}
        </p>

        {isDenied ? (
          <div className="mt-6 w-full max-w-md rounded-xl bg-canvas p-4 text-left text-xs border border-line">
            <h4 className="flex items-center gap-1.5 font-semibold text-ink mb-2">
              <Lock className="size-3.5 text-primary" />
              How to enable your microphone:
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-muted">
              <li>Click the lock or settings icon in your browser address bar.</li>
              <li>Find <strong>Microphone</strong> in the permissions menu.</li>
              <li>Change the setting to <strong>Allow</strong>.</li>
              <li>Refresh this page or click "Check Again" below.</li>
            </ol>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 text-xs text-muted max-w-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Audio is processed securely for metrics analysis.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>You can delete or review your recordings anytime.</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={onRequestPermission}
            size="md"
            className="gap-2"
          >
            {isDenied ? (
              <>
                <RefreshCw className="size-4" />
                Check Again
              </>
            ) : (
              <>
                <Mic className="size-4" />
                Enable Microphone
              </>
            )}
          </Button>

          {onSwitchToTextMode && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onSwitchToTextMode}
            >
              Practice in Text Mode Instead
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
