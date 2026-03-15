'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics/tracking'

interface MicroConversionsProps {
  /** Page type for context */
  pageType: string
  /** Service slug */
  specialtySlug?: string
  /** City name */
  cityName?: string
}

/**
 * Invisible component that tracks micro-conversions:
 * - Scroll depth (25%, 50%, 75%, 100%)
 * - Time on page (30s, 60s, 120s)
 * - Content engagement signals
 */
export default function MicroConversions({ pageType, specialtySlug, cityName }: MicroConversionsProps) {
  const scrollMilestones = useRef(new Set<number>())
  const timeMilestones = useRef(new Set<number>())

  useEffect(() => {
    // Scroll depth tracking
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100)

      const milestones = [25, 50, 75, 100]
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone)
          trackEvent('page_view', {
            action: 'scroll_depth',
            depth: milestone,
            pageType,
            specialtySlug,
            cityName,
          })
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pageType, specialtySlug, cityName])

  useEffect(() => {
    // Time on page tracking
    const timeouts: ReturnType<typeof setTimeout>[] = []
    const milestones = [30, 60, 120]

    for (const seconds of milestones) {
      const timeout = setTimeout(() => {
        if (!timeMilestones.current.has(seconds)) {
          timeMilestones.current.add(seconds)
          trackEvent('page_view', {
            action: 'time_on_page',
            seconds,
            pageType,
            specialtySlug,
            cityName,
          })
        }
      }, seconds * 1000)
      timeouts.push(timeout)
    }

    return () => timeouts.forEach(clearTimeout)
  }, [pageType, specialtySlug, cityName])

  return null
}
