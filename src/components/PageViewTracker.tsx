'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getSessionId } from '@/lib/analytics/tracking'
import { getVisitorId } from '@/lib/analytics/visitor'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Tracks page views on every client-side navigation.
 * Mounted once in RootLayout via dynamic import (ssr: false).
 *
 * Sends to:
 * 1. /api/analytics (backend tracking)
 * 2. GA4 via window.gtag (if analytics consent granted)
 *
 * Skips admin and private pages.
 */
export default function PageViewTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string>('')

  useEffect(() => {
    // Avoid duplicate tracking (React strict mode, same page)
    if (pathname === lastTracked.current) return
    lastTracked.current = pathname

    // Don't track admin or private pages
    if (pathname.startsWith('/admin') || pathname.startsWith('/espace-')) return

    // Defer to let Next.js update document.title before capturing it
    const timer = setTimeout(() => {
      const data = {
        event: 'page_view',
        properties: {
          page_path: pathname,
          url: window.location.href,
          referrer: document.referrer,
          title: document.title,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
        },
        sessionId: getSessionId(),
        visitorId: getVisitorId(),
      }

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics', JSON.stringify(data))
        } else {
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true,
          })
        }
      } catch {
        // Silent failure — analytics should never break the app
      }

      // Send page view to GA4 (respecting consent)
      if (typeof window !== 'undefined') {
        try {
          const prefs = localStorage.getItem('cookie_preferences')
          const hasConsent = prefs ? JSON.parse(prefs)?.analytics : false
          if (hasConsent && window.gtag) {
            window.gtag('event', 'page_view', {
              page_path: pathname,
              page_title: document.title,
              page_location: window.location.href,
            })
          }
        } catch {
          // Silent failure — analytics should never break the app
        }
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
