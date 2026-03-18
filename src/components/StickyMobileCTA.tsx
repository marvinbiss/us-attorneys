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

  const devisHref = href || (
    specialtySlug && citySlug
      ? `/quotes/${specialtySlug}/${citySlug}`
      : specialtySlug
      ? `/quotes/${specialtySlug}`
      : '/quotes'
  )

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.12)] border border-gray-200/60 p-3">
        <button
          onClick={() => {
            setDismissed(true)
            sessionStorage.setItem('stickyMobileCTA_dismissed', '1')
          }}
          className="absolute -top-3 -right-2 w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {attorneyCount && attorneyCount > 0 && (
          <p className="text-xs text-gray-500 text-center mb-1.5">
            {attorneyCount} attorney{attorneyCount > 1 ? 's' : ''} available in your area
          </p>
        )}

        <Link
          href={devisHref}
          onClick={() => {
            trackEvent('sticky_cta_click', {
              service: specialtySlug,
              city: citySlug,
              href: devisHref,
            })
          }}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          <FileText className="w-4 h-4" />
          {ctaText}
        </Link>

        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Free · No obligation · Response within 24h
        </p>
      </div>
    </div>
  )
}
