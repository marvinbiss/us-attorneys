'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Phone, Mail, MessageCircle, Shield } from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'
import { BookingFunnel } from '@/lib/analytics/tracking'

interface AttorneySidebarProps {
  attorney: LegacyAttorney
}

export function AttorneySidebar({ attorney }: AttorneySidebarProps) {
  const reducedMotion = useReducedMotion()
  const [shouldPulse, setShouldPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setShouldPulse(true)
      setTimeout(() => setShouldPulse(false), 600)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleEmail = () => {
    if (attorney.email) {
      window.location.href = `mailto:${attorney.email}`
    }
  }

  /** Open the EstimationWidget via custom DOM event */
  const openEstimationWidget = () => {
    window.dispatchEvent(new Event('sa:open-estimation'))
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.2 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-premium border border-stone-200/60 overflow-hidden"
    >
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-clay-400 via-clay-500 to-clay-600" />

      <div className="p-6">
        {/* Status */}
        {attorney.accepts_new_clients === true && (
          <div className="flex items-center gap-2 text-green-600 mb-4 pb-4 border-b border-gray-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-medium">Accepting new clients</span>
          </div>
        )}

        {/* Trust badges */}
        <div className="space-y-2.5 mb-6 pb-6 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Verifications</h4>
          {attorney.is_verified && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Identity verified (Bar Number)</span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 mb-6" role="group" aria-label="Contact actions">
          {attorney.phone && (
            <motion.a
              href={`tel:${attorney.phone.replace(/\s/g, '')}`}
              whileHover={reducedMotion ? undefined : { scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              onClick={() => {
                BookingFunnel.revealPhone(attorney.id, attorney.business_name || '', 'sidebar')
                BookingFunnel.clickPhone(attorney.id, attorney.business_name || '', 'sidebar')
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-soft hover:shadow-premium hover:from-stone-900 hover:to-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2"
              aria-label={`Call ${attorney.phone}`}
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
              {attorney.phone}
            </motion.a>
          )}

          <motion.button
            whileHover={reducedMotion ? undefined : { scale: 1.02 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            animate={reducedMotion ? {} : shouldPulse ? {
              scale: [1, 1.03, 1],
              boxShadow: [
                '0 10px 25px rgba(224, 112, 64, 0.3)',
                '0 10px 35px rgba(224, 112, 64, 0.5)',
                '0 10px 25px rgba(224, 112, 64, 0.3)',
              ],
            } : {}}
            transition={reducedMotion ? { duration: 0 } : shouldPulse ? { duration: 0.6, ease: 'easeInOut' } : {}}
            onClick={openEstimationWidget}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-clay-400 to-clay-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-glow-clay hover:shadow-glow-clay hover:from-clay-500 hover:to-clay-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
            aria-label="Open the estimation chat for a free consultation"
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            Request a Free Consultation
          </motion.button>

          {attorney.email && (
            <motion.button
              whileHover={reducedMotion ? undefined : { scale: 1.02 }}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              onClick={handleEmail}
              className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-slate-700 font-medium flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
              aria-label={`Send an email to ${attorney.email}`}
            >
              <Mail className="w-5 h-5 text-slate-400" aria-hidden="true" />
              Send an email
            </motion.button>
          )}
        </div>

        {/* Bar Number */}
        {attorney.siret && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-slate-400 font-mono">
              Bar #: {attorney.siret}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Mobile CTA bar — Single dominant CTA with subtle phone fallback
export function AttorneyMobileCTA({ attorney }: AttorneySidebarProps) {
  const reducedMotion = useReducedMotion()

  /** Open the EstimationWidget via custom DOM event */
  const openEstimationWidget = () => {
    window.dispatchEvent(new Event('sa:open-estimation'))
  }

  // Subtle pulse animation every 8 seconds
  const pulseVariants = {
    initial: { boxShadow: '0 0 0 0 rgba(194, 120, 68, 0)' },
    pulse: {
      boxShadow: [
        '0 0 0 0 rgba(194, 120, 68, 0.4)',
        '0 0 0 12px rgba(194, 120, 68, 0)',
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 6.5,
      },
    },
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { y: 100 }}
      animate={{ y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
      className="fixed bottom-16 left-0 right-0 bg-[#FFFCF8]/95 backdrop-blur-lg border-t border-stone-200/60 p-4 md:hidden z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      role="group"
      aria-label="Quick actions"
    >
      <div className="flex gap-3">
        {/* Primary: Estimation CTA */}
        <motion.button
          whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          variants={reducedMotion ? undefined : pulseVariants}
          initial={reducedMotion ? false : "initial"}
          animate={reducedMotion ? undefined : "pulse"}
          onClick={() => {
            BookingFunnel.clickPhone(attorney.id, attorney.business_name || '', 'mobile_cta')
            openEstimationWidget()
          }}
          className={`${attorney.phone ? 'flex-1' : 'w-full'} py-4 px-4 rounded-xl bg-gradient-to-r from-clay-400 to-clay-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-glow-clay hover:from-clay-500 hover:to-clay-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2`}
          aria-label="Open the estimation assistant for a free consultation"
        >
          <MessageCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          Free Consultation
        </motion.button>

        {/* Phone: Prominent call button */}
        {attorney.phone && (
          <motion.a
            href={`tel:${attorney.phone.replace(/\s/g, '')}`}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            onClick={() => {
              BookingFunnel.revealPhone(attorney.id, attorney.business_name || '', 'mobile_cta')
              BookingFunnel.clickPhone(attorney.id, attorney.business_name || '', 'mobile_cta')
            }}
            className="flex-1 py-4 px-4 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:from-stone-900 hover:to-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2"
            aria-label={`Call ${attorney.phone}`}
          >
            <Phone className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            Call
          </motion.a>
        )}
      </div>
    </motion.div>
  )
}
