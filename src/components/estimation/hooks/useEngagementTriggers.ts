'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { trackEvent } from '@/lib/analytics/tracking'
import { GREETING_STORAGE_KEY, RETURN_VISITOR_KEY } from '../constants'

export interface UseEngagementTriggersReturn {
  showGreeting: boolean
  isLauncherExpanded: boolean
  shouldWiggle: boolean
  isReturningVisitor: boolean
  dismissGreeting: () => void
}

export function useEngagementTriggers(
  isOpen: boolean,
  metierSlug?: string,
  ville?: string,
): UseEngagementTriggersReturn {
  const [showGreeting, setShowGreeting] = useState(false)
  const [isLauncherExpanded, setIsLauncherExpanded] = useState(true)
  const [shouldWiggle, setShouldWiggle] = useState(false)
  const [isReturningVisitor, setIsReturningVisitor] = useState(false)

  const greetingTriggeredRef = useRef(false)
  const hasWiggled = useRef(false)
  const exitIntentFired = useRef(false)

  // Detect returning visitor
  useEffect(() => {
    try {
      if (localStorage.getItem(RETURN_VISITOR_KEY)) {
        setIsReturningVisitor(true)
      } else {
        localStorage.setItem(RETURN_VISITOR_KEY, '1')
      }
    } catch { /* SSR / private browsing */ }
  }, [])

  // Show greeting bubble after 5s delay (unless dismissed this session)
  useEffect(() => {
    if (isOpen) return
    try {
      if (sessionStorage.getItem(GREETING_STORAGE_KEY)) return
    } catch { /* SSR / private browsing */ }

    const timer = setTimeout(() => {
      if (!greetingTriggeredRef.current) {
        greetingTriggeredRef.current = true
        setShowGreeting(true)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Combined scroll handler: greeting at 40% + wiggle on first scroll
  useEffect(() => {
    if (isOpen) return

    function handleScroll() {
      // Wiggle on first scroll (one-time)
      if (!hasWiggled.current) {
        hasWiggled.current = true
        setShouldWiggle(true)
        setTimeout(() => setShouldWiggle(false), 1000)
      }

      // Show greeting at 40% scroll
      if (greetingTriggeredRef.current) return
      try {
        if (sessionStorage.getItem(GREETING_STORAGE_KEY)) return
      } catch { /* noop */ }

      const scrollPercent =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      if (scrollPercent >= 0.4) {
        greetingTriggeredRef.current = true
        setShowGreeting(true)
        trackEvent('chat_opened' as any, {
          trigger: 'scroll',
          metier: metierSlug,
          ville,
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen, metierSlug, ville])

  // Exit intent (desktop only): show greeting bubble instead of auto-opening
  useEffect(() => {
    if (isOpen) return
    if (typeof window === 'undefined' || window.innerWidth < 640) return

    function handleMouseOut(e: MouseEvent) {
      if (exitIntentFired.current) return
      if (e.clientY <= 5 && e.relatedTarget === null) {
        exitIntentFired.current = true
        setShowGreeting(true)
        trackEvent('chat_opened' as any, {
          trigger: 'exit_intent_soft',
          metier: metierSlug,
          ville,
        })
      }
    }
    document.addEventListener('mouseout', handleMouseOut)
    return () => document.removeEventListener('mouseout', handleMouseOut)
  }, [isOpen, metierSlug, ville])

  // Collapse pill launcher to circle after 8s
  useEffect(() => {
    if (isOpen) return
    const timer = setTimeout(() => {
      setIsLauncherExpanded(false)
    }, 8000)
    return () => clearTimeout(timer)
  }, [isOpen])

  const dismissGreeting = useCallback(() => {
    setShowGreeting(false)
    try {
      sessionStorage.setItem(GREETING_STORAGE_KEY, '1')
    } catch { /* noop */ }
  }, [])

  return {
    showGreeting,
    isLauncherExpanded,
    shouldWiggle,
    isReturningVisitor,
    dismissGreeting,
  }
}
