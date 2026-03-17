'use client'

import { useState, useEffect, useCallback } from 'react'
import { Video, Loader2, Clock } from 'lucide-react'

interface VideoConsultationButtonProps {
  bookingId: string
  scheduledAt: string
  durationMinutes: number
  status: string
}

type ButtonState = 'hidden' | 'countdown' | 'joinable' | 'ended'

function computeState(
  scheduledAt: string,
  durationMinutes: number,
  status: string
): { state: ButtonState; minutesUntil: number } {
  if (status !== 'confirmed') {
    return { state: 'hidden', minutesUntil: 0 }
  }

  const now = Date.now()
  const start = new Date(scheduledAt).getTime()
  const end = start + durationMinutes * 60_000

  const windowStart = start - 15 * 60_000
  const windowEnd = end + 15 * 60_000

  const minutesUntil = Math.ceil((start - now) / 60_000)

  if (now < windowStart) return { state: 'hidden', minutesUntil }
  if (now < start) return { state: 'countdown', minutesUntil }
  if (now <= windowEnd) return { state: 'joinable', minutesUntil: 0 }
  return { state: 'ended', minutesUntil: 0 }
}

export default function VideoConsultationButton({
  bookingId,
  scheduledAt,
  durationMinutes,
  status,
}: VideoConsultationButtonProps) {
  const [buttonState, setButtonState] = useState<ButtonState>('hidden')
  const [minutesUntil, setMinutesUntil] = useState(0)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateState = useCallback(() => {
    const result = computeState(scheduledAt, durationMinutes, status)
    setButtonState(result.state)
    setMinutesUntil(result.minutesUntil)
  }, [scheduledAt, durationMinutes, status])

  useEffect(() => {
    updateState()
    const interval = setInterval(updateState, 30_000)
    return () => clearInterval(interval)
  }, [updateState])

  const handleJoin = async () => {
    setJoining(true)
    setError(null)

    try {
      const res = await fetch(`/api/bookings/${bookingId}/join`)
      if (!res.ok) {
        const errData: { error?: string } = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to join call')
      }
      const data: { room_url: string } = await res.json()
      window.open(data.room_url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setJoining(false)
    }
  }

  if (buttonState === 'hidden') return null

  if (buttonState === 'ended') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium w-full justify-center">
        <Video className="w-4 h-4" aria-hidden="true" />
        Call ended
      </div>
    )
  }

  if (buttonState === 'countdown') {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {joining ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Clock className="w-4 h-4" aria-hidden="true" />
          )}
          {joining
            ? 'Opening...'
            : `Starts in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''} — Join early`}
        </button>
        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      </div>
    )
  }

  // joinable
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleJoin}
        disabled={joining}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {joining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {/* Pulsing green dot */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <Video className="w-4 h-4" aria-hidden="true" />
          </>
        )}
        {joining ? 'Opening...' : 'Join Now'}
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  )
}
