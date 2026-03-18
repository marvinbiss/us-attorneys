'use client'

import { useState, useRef, useEffect } from 'react'
import { Square, Trash2, Send, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  onRecorded: (audioBlob: Blob) => void
  onCancel: () => void
}

export function VoiceRecorder({ onRecorded, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startRecording()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(audioBlob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error: unknown) {
      console.error('Error accessing microphone:', error)
      onCancel()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
  }

  const handleSend = () => {
    if (chunksRef.current.length > 0) {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      onRecorded(audioBlob)
    }
  }

  const handleCancel = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    onCancel()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-full"
        title="Cancel"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording indicator and duration */}
      <div className="flex items-center gap-3 flex-1">
        <div
          className={cn(
            'w-3 h-3 rounded-full',
            isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
          )}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {formatDuration(duration)}
        </span>

        {/* Audio preview when stopped */}
        {audioUrl && !isRecording && (
          <audio src={audioUrl} controls className="h-8" />
        )}

        {/* Waveform placeholder */}
        {isRecording && (
          <div className="flex-1 flex items-center justify-center gap-0.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 bg-red-400 rounded-full transition-all',
                  isPaused ? 'h-1' : 'animate-pulse'
                )}
                style={{
                  height: isPaused ? '4px' : `${Math.random() * 20 + 4}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pause/Resume button */}
      {isRecording && (
        <button
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      )}

      {/* Stop/Send button */}
      {isRecording ? (
        <button
          onClick={stopRecording}
          className="p-2 bg-red-600 text-white hover:bg-red-700 rounded-full"
          title="Stop recording"
        >
          <Square className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-full"
          title="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export default VoiceRecorder
