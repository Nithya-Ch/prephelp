import {
  Mic,
  Pause,
  Play,
  RotateCcw,
  Send,
  Square,
  Volume2,
} from 'lucide-react'
import type { UseRecorderReturn } from '../../lib/use-recorder'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Waveform } from './waveform'

interface AudioRecorderProps {
  recorder: UseRecorderReturn
  timeLimitSeconds: number
  onSubmit: (audioBlob: Blob) => void
  isSubmitting?: boolean
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function AudioRecorder({
  recorder,
  timeLimitSeconds,
  onSubmit,
  isSubmitting = false,
}: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    recordingDuration,
    audioBlob,
    audioUrl,
    analyserNode,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    error,
  } = recorder

  const remaining = Math.max(0, timeLimitSeconds - recordingDuration)

  const handleSubmit = () => {
    if (audioBlob) {
      onSubmit(audioBlob)
    }
  }

  return (
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-3 rounded-full ${
              isRecording
                ? isPaused
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500 animate-ping'
                : audioBlob
                  ? 'bg-emerald-500'
                  : 'bg-muted/40'
            }`}
          />
          <span className="text-sm font-semibold text-ink">
            {isRecording
              ? isPaused
                ? 'Recording Paused'
                : 'Recording in Progress...'
              : audioBlob
                ? 'Recording Ready'
                : 'Microphone Ready'}
          </span>
        </div>

        {/* Timers */}
        <div className="flex items-center gap-4 text-xs font-medium tabular-nums">
          <span className="text-muted">
            Duration:{' '}
            <strong className="text-ink font-semibold">
              {formatDuration(recordingDuration)}
            </strong>
          </span>
          <span className="text-muted">
            Time Left:{' '}
            <strong className="text-ink font-semibold">
              {formatDuration(remaining)}
            </strong>
          </span>
        </div>
      </div>

      {/* Waveform Visualization */}
      <Waveform
        analyserNode={analyserNode}
        isRecording={isRecording}
        isPaused={isPaused}
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Audio Playback Preview (if recorded) */}
      {audioUrl && !isRecording && (
        <div className="flex flex-col gap-2 rounded-xl bg-canvas p-4 border border-line">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Volume2 className="size-4 text-primary" />
            <span>Playback Preview</span>
          </div>
          <audio
            src={audioUrl}
            controls
            className="w-full h-10 outline-none"
            preload="metadata"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {!isRecording && !audioBlob && (
            <Button
              type="button"
              onClick={startRecording}
              size="md"
              className="gap-2 bg-primary hover:bg-primary-hover"
            >
              <Mic className="size-4" />
              Start Speaking
            </Button>
          )}

          {isRecording && (
            <>
              {isPaused ? (
                <Button
                  type="button"
                  onClick={resumeRecording}
                  variant="secondary"
                  size="md"
                  className="gap-2"
                >
                  <Play className="size-4 fill-ink" />
                  Resume
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={pauseRecording}
                  variant="secondary"
                  size="md"
                  className="gap-2"
                >
                  <Pause className="size-4" />
                  Pause
                </Button>
              )}

              <Button
                type="button"
                onClick={stopRecording}
                size="md"
                className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Square className="size-4 fill-white" />
                Done Speaking
              </Button>
            </>
          )}

          {audioBlob && !isRecording && (
            <Button
              type="button"
              onClick={reset}
              variant="secondary"
              size="md"
              disabled={isSubmitting}
              className="gap-2"
            >
              <RotateCcw className="size-4" />
              Record Again
            </Button>
          )}
        </div>

        {audioBlob && !isRecording && (
          <Button
            type="button"
            onClick={handleSubmit}
            size="md"
            disabled={isSubmitting}
            className="gap-2"
          >
            <Send className="size-4" />
            {isSubmitting ? 'Submitting...' : 'Analyze Speech'}
          </Button>
        )}
      </div>
    </Card>
  )
}
