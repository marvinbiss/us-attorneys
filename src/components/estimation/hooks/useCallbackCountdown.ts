'use client'

import { useState, useEffect, useCallback } from 'react'

export interface UseCallbackCountdownReturn {
  countdown: number | null
  startCountdown: (seconds: number) => void
  isActive: boolean
}

export function useCallbackCountdown(): UseCallbackCountdownReturn {
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) =>
        prev !== null && prev > 0 ? prev - 1 : 0,
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const startCountdown = useCallback((seconds: number) => {
    setCountdown(seconds)
  }, [])

  return {
    countdown,
    startCountdown,
    isActive: countdown !== null && countdown > 0,
  }
}
