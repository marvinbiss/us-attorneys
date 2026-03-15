'use client'

import { useReportWebVitals } from 'next/web-vitals'

/**
 * Reports Core Web Vitals (LCP, CLS, INP, FCP, TTFB) to Google Analytics 4.
 * Must be rendered once in the root layout.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to GA4 only if user has granted analytics consent
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        const prefs = localStorage.getItem('cookie_preferences')
        const hasConsent = prefs ? JSON.parse(prefs)?.analytics : false
        if (!hasConsent) return

        window.gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true,
        })
      } catch {
        // Silent failure — analytics should never break the app
      }
    }
  })

  return null
}
