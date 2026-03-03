'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getSessionId } from '@/lib/analytics/tracking'
import { getVisitorId } from '@/lib/analytics/visitor'

/**
 * Tracks page views on every client-side navigation.
 * Mounted once in RootLayout via dynamic import (ssr: false).
 *
 * Sends to /api/analytics with:
 * - visitor_id: persistent anonymous UUID (cookie, 13 months)
 * - session_id: per-tab session (sessionStorage)
 * - page_path: current pathname
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

    // Forward to GA4 if available
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_title: document.title,
      })
    }
  }, [pathname])

  return null
}
