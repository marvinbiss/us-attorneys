'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MessageCircle, X } from 'lucide-react'

const IDLE_TIMEOUT_MS = 20_000 // 20 seconds of inactivity
const SESSION_KEY = 'sa:proactive-prompt-shown'

interface ProactiveChatPromptProps {
  /** Service slug for contextual CTA */
  specialtySlug?: string
  /** City slug for devis link */
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

  const devisHref = specialtySlug && citySlug
    ? `/quotes/${specialtySlug}/${citySlug}`
    : specialtySlug
    ? `/quotes/${specialtySlug}`
    : '/quotes'

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-40 max-w-xs animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/60 p-4 relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
            <div className="flex gap-2 mt-3">
              <Link
                href={devisHref}
                onClick={() => setVisible(false)}
                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Free consultation
              </Link>
              <button
                onClick={() => setVisible(false)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
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
