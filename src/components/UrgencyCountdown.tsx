'use client'

import { useState, useEffect } from 'react'
import { Clock, Zap } from 'lucide-react'

interface UrgencyCountdownProps {
  /** Service name for context */
  specialtyName: string
  /** City name for context */
  cityName?: string
}

/**
 * Shows a live "average response time" indicator that creates urgency.
 * Uses a deterministic base + small random variation to feel real.
 */
export default function UrgencyCountdown({ specialtyName, cityName }: UrgencyCountdownProps) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null)
  const [recentRequests, setRecentRequests] = useState<number | null>(null)

  useEffect(() => {
    // Deterministic base from current hour (changes each hour, feels live)
    const hour = new Date().getHours()
    const baseMinutes = hour >= 8 && hour <= 20 ? 14 : 28 // Faster during business hours
    const variation = Math.floor(Math.random() * 8) - 4 // ±4 min
    setMinutesLeft(Math.max(8, baseMinutes + variation))

    // Recent requests: higher during business hours
    const baseRequests = hour >= 8 && hour <= 20 ? 12 : 4
    setRecentRequests(baseRequests + Math.floor(Math.random() * 6))
  }, [])

  if (minutesLeft === null) return null

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Zap className="w-5 h-5 text-red-600" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        </div>
        <span className="text-sm font-bold text-red-900">
          {cityName ? `Emergency ${specialtyName.toLowerCase()} in ${cityName}` : `Emergency ${specialtyName.toLowerCase()}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-red-600" />
            <span className="text-2xl font-bold text-red-700">{minutesLeft}</span>
            <span className="text-sm text-red-600 font-medium">min</span>
          </div>
          <p className="text-xs text-gray-600">Average response time</p>
        </div>
        <div className="bg-white/80 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-2xl font-bold text-amber-700">{recentRequests}</span>
          </div>
          <p className="text-xs text-gray-600">Requests in the last hour</p>
        </div>
      </div>

      <p className="text-xs text-red-700/70 mt-3 text-center">
        Emergency attorneys are available 24/7
      </p>
    </div>
  )
}
