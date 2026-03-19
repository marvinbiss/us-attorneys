'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle, X } from 'lucide-react'

const IDLE_TIMEOUT_MS = 20_000 // 20 seconds of inactivity
const SESSION_KEY = 'sa:proactive-prompt-shown'

interface ProactiveChatPromptProps {
  /** Service slug for contextual CTA */
  specialtySlug?: string
  /** City slug for quote link */
  citySlug?: string
  /** Custom message */
  message?: string
}

export default function ProactiveChatPrompt({
  specialtySlug,
  citySlug,
  message = 'Need help choosing an attorney? We can guide you for free.',
}: ProactiveChatPromptProps) {
  const [visible, setVisible] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Don't show if already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) return

    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        if (!sessionStorage.getItem(SESSION_KEY)) {
          sessionStorage.setItem(SESSION_KEY, '1')
          setVisible(true)
        }
      }, IDLE_TIMEOUT_MS)
    }

    resetTimer()
    window.addEventListener('scroll', resetTimer, { passive: true })
    window.addEventListener('mousemove', resetTimer, { passive: true })
    window.addEventListener('touchstart', resetTimer, { passive: true })
    window.addEventListener('keydown', resetTimer, { passive: true })

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      window.removeEventListener('scroll', resetTimer)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('keydown', resetTimer)
    }
  }, [])

  if (!visible) return null

  const quoteHref =
    specialtySlug && citySlug
      ? `/quotes/${specialtySlug}/${citySlug}`
      : specialtySlug
        ? `/quotes/${specialtySlug}`
        : '/quotes'

  return (
    <div className="animate-in slide-in-from-bottom-4 fixed bottom-20 left-4 z-40 max-w-xs duration-300 md:bottom-6">
      <div className="relative rounded-2xl border border-gray-200/60 bg-white p-4 shadow-2xl">
        <button
          onClick={() => setVisible(false)}
          className="absolute right-2 top-2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm leading-relaxed text-gray-700">{message}</p>
            <div className="mt-3 flex gap-2">
              <Link
                href={quoteHref}
                onClick={() => setVisible(false)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Free consultation
              </Link>
              <button
                onClick={() => setVisible(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
