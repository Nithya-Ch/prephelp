import {
  FileText,
  Mic,
  RotateCw,
  Shuffle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, type Exercise, FALLBACK_EXERCISES } from '../../lib/api'
import { useRecorder } from '../../lib/use-recorder'
import { AudioRecorder } from '../../components/practice/audio-recorder'
import { MicPermission } from '../../components/practice/mic-permission'
import { PrepTimer } from '../../components/practice/prep-timer'
import { PromptCard } from '../../components/practice/prompt-card'
import { TextInput } from '../../components/practice/text-input'
import { UploadProgress } from '../../components/practice/upload-progress'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

type PracticeStage = 'prep' | 'recording' | 'preview'

export function PracticePage() {
  const { exerciseId } = useParams<{ exerciseId?: string }>()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [isLoadingExercise, setIsLoadingExercise] = useState(true)
  const [stage, setStage] = useState<PracticeStage>('prep')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const recorder = useRecorder({
    timeLimitSeconds: exercise?.timeLimitSeconds || 120,
    onTimeLimitReached: () => {
      setStage('preview')
    },
  })

  // Fetch exercise data
  useEffect(() => {
    async function fetchExercise() {
      setIsLoadingExercise(true)
      try {
        const list = await api.exercises.getExercises()
        setAllExercises(list)

        const selected = exerciseId
          ? list.find((e) => e.id === exerciseId) || (await api.exercises.getExercise(exerciseId))
          : list[0] || FALLBACK_EXERCISES[0]

        setExercise(selected)
      } catch (err) {
        console.warn('Exercise fetch failed, using fallback:', err)
        setExercise(FALLBACK_EXERCISES[0])
      } finally {
        setIsLoadingExercise(false)
        setStage('prep')
        recorder.reset()
      }
    }

    fetchExercise()
  }, [exerciseId])

  const handlePickRandomExercise = () => {
    if (allExercises.length > 1) {
      const candidates = allExercises.filter((e) => e.id !== exercise?.id)
      const random = candidates[Math.floor(Math.random() * candidates.length)]
      navigate(`/app/practice/${random.id}`)
    }
  }

  const handlePrepDone = async () => {
    setStage('recording')
    if (recorder.micPermissionStatus !== 'granted') {
      const ok = await recorder.requestPermission()
      if (ok) {
        recorder.startRecording()
      }
    } else {
      recorder.startRecording()
    }
  }

  const handleSubmitAudio = async (blob: Blob) => {
    if (!exercise) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('exerciseId', exercise.id)
      formData.append('exerciseTitle', exercise.title)
      formData.append('mode', 'audio')
      formData.append('audio', blob, 'recording.webm')

      const result = await api.sessions.createSession(formData)
      navigate(`/app/result/${result.sessionId}`)
    } catch (err: any) {
      console.warn('Audio session upload error, redirecting with client mock session if offline:', err)
      // If server session create fails (e.g. mock development), create local session ID
      const mockSessionId = 'sess_' + Date.now().toString(36)
      navigate(`/app/result/${mockSessionId}?mode=audio&exerciseId=${exercise.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitText = async (text: string) => {
    if (!exercise) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('exerciseId', exercise.id)
      formData.append('exerciseTitle', exercise.title)
      formData.append('mode', 'text')
      formData.append('text', text)

      const result = await api.sessions.createSession(formData)
      navigate(`/app/result/${result.sessionId}`)
    } catch (err: any) {
      const mockSessionId = 'sess_' + Date.now().toString(36)
      navigate(`/app/result/${mockSessionId}?mode=text&exerciseId=${exercise.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingExercise || !exercise) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-2xl bg-canvas border border-line" />
        <div className="h-64 animate-pulse rounded-2xl bg-canvas border border-line" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        {/* Mode Selector Toggle */}
        <div className="flex items-center rounded-xl bg-canvas p-1 border border-line">
          <button
            type="button"
            onClick={() => {
              setMode('voice')
              recorder.reset()
              setStage('prep')
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
              mode === 'voice'
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink',
            )}
          >
            <Mic className="size-3.5 text-primary" />
            Voice Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('text')
              recorder.reset()
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
              mode === 'text'
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink',
            )}
          >
            <FileText className="size-3.5 text-primary" />
            Text Mode
          </button>
        </div>

        {/* Change / Random Prompt */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePickRandomExercise}
            className="gap-1.5 text-xs text-muted hover:text-ink"
          >
            <Shuffle className="size-3.5" />
            Random Prompt
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {submitError}
        </div>
      )}

      {/* Prompt Card */}
      <PromptCard exercise={exercise} />

      {/* Main Practice Workspace */}
      {isSubmitting ? (
        <UploadProgress />
      ) : mode === 'text' ? (
        <TextInput
          onSubmit={handleSubmitText}
          isSubmitting={isSubmitting}
          minWords={15}
          placeholder={`Type your answer to: "${exercise.prompt}"...`}
        />
      ) : (
        /* Voice Mode */
        <div className="space-y-4">
          {recorder.micPermissionStatus === 'denied' ? (
            <MicPermission
              isDenied
              onRequestPermission={recorder.requestPermission}
              onSwitchToTextMode={() => setMode('text')}
            />
          ) : stage === 'prep' ? (
            <div className="space-y-3">
              <PrepTimer
                totalSeconds={exercise.prepTimeSeconds}
                onComplete={handlePrepDone}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <AudioRecorder
                recorder={recorder}
                timeLimitSeconds={exercise.timeLimitSeconds}
                onSubmit={handleSubmitAudio}
                isSubmitting={isSubmitting}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    recorder.reset()
                    setStage('prep')
                  }}
                  className="gap-1.5 text-xs text-muted"
                >
                  <RotateCw className="size-3.5" />
                  Restart Preparation Timer
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
