import { useCallback, useEffect, useRef, useState } from 'react'

export type MicPermissionStatus = 'idle' | 'prompt' | 'granted' | 'denied'

export interface UseRecorderOptions {
  timeLimitSeconds?: number
  onTimeLimitReached?: () => void
}

export interface UseRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  recordingDuration: number
  audioBlob: Blob | null
  audioUrl: string | null
  micPermissionStatus: MicPermissionStatus
  analyserNode: AnalyserNode | null
  requestPermission: () => Promise<boolean>
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  reset: () => void
  error: string | null
}

function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
  ]
  if (typeof MediaRecorder === 'undefined') return ''
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime
    }
  }
  return ''
}

export function useRecorder(options: UseRecorderOptions = {}): UseRecorderReturn {
  const { timeLimitSeconds, onTimeLimitReached } = options

  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [micPermissionStatus, setMicPermissionStatus] = useState<MicPermissionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<number | null>(null)
  const durationRef = useRef(0)

  // Query microphone permissions if supported
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((permissionDesc) => {
          if (permissionDesc.state === 'granted') {
            setMicPermissionStatus('granted')
          } else if (permissionDesc.state === 'denied') {
            setMicPermissionStatus('denied')
          } else {
            setMicPermissionStatus('prompt')
          }

          permissionDesc.onchange = () => {
            if (permissionDesc.state === 'granted') {
              setMicPermissionStatus('granted')
            } else if (permissionDesc.state === 'denied') {
              setMicPermissionStatus('denied')
            } else {
              setMicPermissionStatus('prompt')
            }
          }
        })
        .catch(() => {
          // Fallback if browser doesn't support query for microphone
          setMicPermissionStatus('idle')
        })
    }
  }, [])

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close()
      } catch {
        // ignore
      }
      audioContextRef.current = null
    }
    sourceNodeRef.current = null
    setAnalyserNode(null)
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      setMicPermissionStatus('granted')
      // Immediately stop the check stream
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (err: any) {
      console.warn('Microphone permission request failed:', err)
      setMicPermissionStatus('denied')
      setError(err?.message || 'Microphone access denied. Please allow microphone permissions.')
      return false
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      chunksRef.current = []
      durationRef.current = 0
      setRecordingDuration(0)

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      setAudioBlob(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      setMicPermissionStatus('granted')

      // Set up AudioContext + AnalyserNode for live visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        const audioCtx = new AudioCtx()
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume()
        }
        audioContextRef.current = audioCtx

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        sourceNodeRef.current = source
        setAnalyserNode(analyser)
      }

      const mimeType = getSupportedMimeType()
      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, recorderOptions)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        })
        setAudioBlob(recordedBlob)
        const url = URL.createObjectURL(recordedBlob)
        setAudioUrl(url)
        stopTracks()
      }

      recorder.start(250) // slice every 250ms
      setIsRecording(true)
      setIsPaused(false)

      // Duration timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = window.setInterval(() => {
        durationRef.current += 1
        setRecordingDuration(durationRef.current)

        if (timeLimitSeconds && durationRef.current >= timeLimitSeconds) {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
            if (onTimeLimitReached) onTimeLimitReached()
          }
        }
      }, 1000)
    } catch (err: any) {
      console.error('Failed to start recording:', err)
      setMicPermissionStatus('denied')
      setError(err?.message || 'Unable to access microphone. Please check permissions.')
      stopTracks()
    }
  }, [audioUrl, onTimeLimitReached, stopTracks, timeLimitSeconds])

  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // ignore
      }
    }
    setIsRecording(false)
    setIsPaused(false)
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = window.setInterval(() => {
        durationRef.current += 1
        setRecordingDuration(durationRef.current)
      }, 1000)
    }
  }, [])

  const reset = useCallback(() => {
    stopRecording()
    stopTracks()
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingDuration(0)
    durationRef.current = 0
    setError(null)
  }, [audioUrl, stopRecording, stopTracks])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      stopTracks()
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl, stopTracks])

  return {
    isRecording,
    isPaused,
    recordingDuration,
    audioBlob,
    audioUrl,
    micPermissionStatus,
    analyserNode,
    requestPermission,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    error,
  }
}
