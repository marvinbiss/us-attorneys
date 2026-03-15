'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/tracking'

interface FAQTrackerProps {
  pageType: string
  specialtySlug?: string
}

/**
 * Tracks FAQ accordion interactions via event delegation.
 * Listens for clicks on <details> or <summary> elements.
 */
export default function FAQTracker({ pageType, specialtySlug }: FAQTrackerProps) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const summary = target.closest('summary')
      const details = target.closest('details')

      if (summary || details) {
        const questionText = summary?.textContent?.trim().slice(0, 80) || 'unknown'
        trackEvent('page_view', {
          action: 'faq_click',
          question: questionText,
          pageType,
          specialtySlug,
        })
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pageType, specialtySlug])

  return null
}
