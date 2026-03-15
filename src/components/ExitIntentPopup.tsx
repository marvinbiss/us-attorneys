'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics/tracking'

const AUTO_DISMISS_MS = 10_000
const MOBILE_IDLE_MS = 45_000

interface ExitIntentPopupProps {
  /** Unique session key to avoid showing twice */
  sessionKey?: string
  /** Title text */
  title?: string
  /** Subtitle/description */
  description?: string
  /** CTA button text */
  ctaText?: string
  /** CTA link href */
  ctaHref?: string
  /** Optional: CTA onClick handler (if no href) */
  onCtaClick?: () => void
}

export default function ExitIntentPopup({
  sessionKey = 'sa:exit-intent-shown',
  title = 'Before you go...',
  description = 'Receive up to 3 free consultations from qualified attorneys in less than 60 seconds.',
  ctaText = 'Get my free consultations',
  ctaHref = '/quotes',
  onCtaClick,
}: ExitIntentPopupProps) {
  const [visible, setVisible] = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shouldSuppress = useCallback(() => {
    if (typeof window === 'undefined') return true
    if (sessionStorage.getItem(sessionKey)) return true
    return false
  }, [sessionKey])

  const show = useCallback(() => {
    if (shouldSuppress()) return
    sessionStorage.setItem(sessionKey, '1')
    setVisible(true)
    trackEvent('exit_intent_shown', { ctaHref, ctaText })
  }, [shouldSuppress, sessionKey, ctaHref, ctaText])

  const close = useCallback(() => {
    setVisible(false)
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
  }, [])

  const handleCTA = useCallback(() => {
    trackEvent('exit_intent_click', { ctaHref, ctaText })
    close()
    if (onCtaClick) onCtaClick()
  }, [close, onCtaClick, ctaHref, ctaText])

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

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/60 p-5 relative">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-sm text-slate-600 mb-4 pr-6">{description}</p>

        {/* CTA */}
        {onCtaClick ? (
          <button
            onClick={handleCTA}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
          >
            {ctaText}
          </button>
        ) : (
          <Link
            href={ctaHref}
            onClick={() => {
              trackEvent('exit_intent_click', { ctaHref, ctaText })
              close()
            }}
            className="block w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md text-center"
          >
            {ctaText}
          </Link>
        )}

        <p className="text-[10px] text-gray-400 text-center mt-2">
          Free · No obligation · Response within 24h
        </p>
      </div>
    </div>
  )
}
