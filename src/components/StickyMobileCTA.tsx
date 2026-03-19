'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, X } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/tracking'

interface StickyMobileCTAProps {
  /** The service slug for the quote link */
  specialtySlug?: string
  /** The city slug for the quote link */
  citySlug?: string
  /** Custom CTA text (defaults to "Get my free consultations") */
  ctaText?: string
  /** Custom href override */
  href?: string
  /** Show provider count for social proof */
  attorneyCount?: number
}

export default function StickyMobileCTA({
  specialtySlug,
  citySlug,
  ctaText = 'Get my free consultations',
  href,
  attorneyCount,
}: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Show immediately on mount (unless previously dismissed in this session)
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('stickyMobileCTA_dismissed')
    if (wasDismissed) {
      setDismissed(true)
    } else {
      setVisible(true)
    }
  }, [])

  if (!visible || dismissed) return null

  const quoteHref =
    href ||
    (specialtySlug && citySlug
      ? `/quotes/${specialtySlug}/${citySlug}`
      : specialtySlug
        ? `/quotes/${specialtySlug}`
        : '/quotes')

  return (
    <div className="animate-in slide-in-from-bottom-4 fixed bottom-16 left-0 right-0 z-40 duration-300 md:hidden">
      <div className="mx-2 rounded-2xl border border-gray-200/60 bg-white/95 p-3 shadow-[0_-2px_20px_rgba(0,0,0,0.12)] backdrop-blur-lg">
        <button
          onClick={() => {
            setDismissed(true)
            sessionStorage.setItem('stickyMobileCTA_dismissed', '1')
          }}
          className="absolute -right-2 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-400 shadow-md hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {attorneyCount && attorneyCount > 0 && (
          <p className="mb-1.5 text-center text-xs text-gray-500">
            {attorneyCount} attorney{attorneyCount > 1 ? 's' : ''} available in your area
          </p>
        )}

        <Link
          href={quoteHref}
          onClick={() => {
            trackEvent('sticky_cta_click', {
              service: specialtySlug,
              city: citySlug,
              href: quoteHref,
            })
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]"
        >
          <FileText className="h-4 w-4" />
          {ctaText}
        </Link>

        <p className="mt-1.5 text-center text-[10px] text-gray-400">
          Free · No obligation · Response within 24h
        </p>
      </div>
    </div>
  )
}
