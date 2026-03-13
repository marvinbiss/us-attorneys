'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, X } from 'lucide-react'

interface StickyMobileCTAProps {
  /** The service slug for the devis link */
  serviceSlug?: string
  /** The city slug for the devis link */
  citySlug?: string
  /** Custom CTA text (defaults to "Recevoir mes devis gratuits") */
  ctaText?: string
  /** Custom href override */
  href?: string
  /** Show provider count for social proof */
  providerCount?: number
}

export default function StickyMobileCTA({
  serviceSlug,
  citySlug,
  ctaText = 'Recevoir mes devis gratuits',
  href,
  providerCount,
}: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Show after scrolling 300px (user has shown intent)
  useEffect(() => {
    const handleScroll = () => {
      if (dismissed) return
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [dismissed])

  if (!visible || dismissed) return null

  const devisHref = href || (
    serviceSlug && citySlug
      ? `/devis/${serviceSlug}/${citySlug}`
      : serviceSlug
      ? `/devis/${serviceSlug}`
      : '/devis'
  )

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 md:hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="mx-2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.12)] border border-gray-200/60 p-3">
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-gray-600"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {providerCount && providerCount > 0 && (
          <p className="text-xs text-gray-500 text-center mb-1.5">
            {providerCount} artisan{providerCount > 1 ? 's' : ''} disponible{providerCount > 1 ? 's' : ''} dans votre zone
          </p>
        )}

        <Link
          href={devisHref}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          <FileText className="w-4 h-4" />
          {ctaText}
        </Link>

        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Gratuit · Sans engagement · Réponse sous 24h
        </p>
      </div>
    </div>
  )
}
