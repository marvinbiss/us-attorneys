'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'
import { getDisplayName } from '@/components/attorney/types'

const SESSION_KEY = 'sa:exit-intent-shown'
const AUTO_DISMISS_MS = 10_000
const MOBILE_IDLE_MS = 45_000

interface AttorneyExitIntentProps {
  attorney: LegacyAttorney
  onOpenEstimation: () => void
}

export function AttorneyExitIntent({ attorney, onOpenEstimation }: AttorneyExitIntentProps) {
  const [visible, setVisible] = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shouldSuppress = useCallback(() => {
    if (typeof window === 'undefined') return true
    if (sessionStorage.getItem(SESSION_KEY)) return true
    if (document.body.hasAttribute('data-estimation-open')) return true
    return false
  }, [])

  const show = useCallback(() => {
    if (shouldSuppress()) return
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(true)
  }, [shouldSuppress])

  const close = useCallback(() => {
    setVisible(false)
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
  }, [])

  const handleCTA = useCallback(() => {
    close()
    onOpenEstimation()
  }, [close, onOpenEstimation])

  // Auto-dismiss after 10s
  useEffect(() => {
    if (!visible) return
    dismissTimer.current = setTimeout(() => setVisible(false), AUTO_DISMISS_MS)
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [visible])

  // Desktop: mouseleave at top of viewport
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    if (isMobile) return

    const handler = (e: MouseEvent) => {
      if (e.clientY < 10) show()
    }
    document.addEventListener('mouseleave', handler)
    return () => document.removeEventListener('mouseleave', handler)
  }, [show])

  // Mobile: 45s idle timer, reset on scroll/touch
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    if (!isMobile) return

    const resetTimer = () => {
      if (mobileTimer.current) clearTimeout(mobileTimer.current)
      mobileTimer.current = setTimeout(show, MOBILE_IDLE_MS)
    }

    resetTimer()
    window.addEventListener('scroll', resetTimer, { passive: true })
    window.addEventListener('touchstart', resetTimer, { passive: true })

    return () => {
      if (mobileTimer.current) clearTimeout(mobileTimer.current)
      window.removeEventListener('scroll', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
  }, [show])

  const displayName = getDisplayName(attorney)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100%-2rem)] max-w-sm"
          role="complementary"
          aria-label="Free consultation"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200/60 p-5 relative">
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-sand-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <p className="text-sm font-medium text-slate-500 mb-1">Before you go...</p>
            <p className="text-base font-semibold text-gray-900 font-heading mb-2 pr-6">
              {displayName}
            </p>
            <p className="text-sm text-slate-600 mb-4">
              Get your free consultation estimate in 30 seconds
            </p>

            {/* CTA */}
            <button
              onClick={handleCTA}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-clay-400 to-clay-500 text-white text-sm font-semibold rounded-xl hover:from-clay-500 hover:to-clay-600 transition-all shadow-md shadow-glow-clay"
            >
              Get my free estimate
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
