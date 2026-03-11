'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, MessageCircle, Shield } from 'lucide-react'
import type { LegacyArtisan } from '@/types/legacy'
import { BookingFunnel } from '@/lib/analytics/tracking'

interface ArtisanSidebarProps {
  artisan: LegacyArtisan
}

export function ArtisanSidebar({ artisan }: ArtisanSidebarProps) {
  const [showPhone, setShowPhone] = useState(false)
  const [shouldPulse, setShouldPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setShouldPulse(true)
      setTimeout(() => setShouldPulse(false), 600)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleCall = () => {
    if (artisan.phone) {
      window.location.href = `tel:${artisan.phone.replace(/\s/g, '')}`
    }
  }

  const handleEmail = () => {
    if (artisan.email) {
      window.location.href = `mailto:${artisan.email}`
    }
  }

  /** Open the EstimationWidget via custom DOM event */
  const openEstimationWidget = () => {
    window.dispatchEvent(new Event('sa:open-estimation'))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-premium border border-stone-200/60 overflow-hidden"
    >
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-clay-400 via-clay-500 to-clay-600" />

      <div className="p-6">
        {/* Status */}
        {artisan.accepts_new_clients === true && (
          <div className="flex items-center gap-2 text-green-600 mb-4 pb-4 border-b border-gray-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-medium">Accepte de nouveaux clients</span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-3 mb-6" role="group" aria-label="Actions de contact">
          {artisan.phone && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (showPhone) {
                  BookingFunnel.clickPhone(artisan.id, artisan.business_name || '', 'sidebar')
                  handleCall()
                } else {
                  BookingFunnel.revealPhone(artisan.id, artisan.business_name || '', 'sidebar')
                  setShowPhone(true)
                }
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-stone-800 to-stone-900 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-soft hover:shadow-premium hover:from-stone-900 hover:to-black transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2"
              aria-label={showPhone ? `Appeler ${artisan.phone}` : 'Afficher le numéro de téléphone'}
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
              {showPhone ? artisan.phone : 'Afficher le téléphone'}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={shouldPulse ? {
              scale: [1, 1.03, 1],
              boxShadow: [
                '0 10px 25px rgba(224, 112, 64, 0.3)',
                '0 10px 35px rgba(224, 112, 64, 0.5)',
                '0 10px 25px rgba(224, 112, 64, 0.3)',
              ],
            } : {}}
            transition={shouldPulse ? { duration: 0.6, ease: 'easeInOut' } : {}}
            onClick={openEstimationWidget}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-clay-400 to-clay-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-glow-clay hover:shadow-glow-clay hover:from-clay-500 hover:to-clay-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
            aria-label="Ouvrir le chat d'estimation pour un devis gratuit"
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            Demander un devis gratuit
          </motion.button>

          {artisan.email && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEmail}
              className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-slate-700 font-medium flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
              aria-label={`Envoyer un email à ${artisan.email}`}
            >
              <Mail className="w-5 h-5 text-slate-400" aria-hidden="true" />
              Envoyer un email
            </motion.button>
          )}
        </div>

        {/* Trust badges */}
        <div className="space-y-2.5 mb-6 pb-6 border-b border-gray-100">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">V&eacute;rifications</h4>
          {artisan.is_verified && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Identit&eacute; v&eacute;rifi&eacute;e (SIRET)</span>
            </div>
          )}
        </div>

        {/* SIRET */}
        {artisan.siret && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-xs text-slate-400 font-mono">
              SIRET : {artisan.siret}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Mobile CTA bar — Single dominant CTA with subtle phone fallback
export function ArtisanMobileCTA({ artisan }: ArtisanSidebarProps) {
  const [showPhone, setShowPhone] = useState(false)

  const handleCall = () => {
    if (artisan.phone) {
      window.location.href = `tel:${artisan.phone.replace(/\s/g, '')}`
    }
  }

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
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-16 left-0 right-0 bg-[#FFFCF8]/95 backdrop-blur-lg border-t border-stone-200/60 p-4 md:hidden z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      role="group"
      aria-label="Actions rapides"
    >
      <div className="flex flex-col items-center gap-2">
        {/* Primary: Full-width estimation CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          variants={pulseVariants}
          initial="initial"
          animate="pulse"
          onClick={() => {
            BookingFunnel.clickPhone(artisan.id, artisan.business_name || '', 'mobile_cta')
            openEstimationWidget()
          }}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-clay-400 to-clay-500 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-glow-clay hover:from-clay-500 hover:to-clay-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
          aria-label="Ouvrir l'assistant d'estimation pour un devis gratuit"
        >
          <MessageCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          Devis IA gratuit — Réponse instantanée
        </motion.button>

        {/* Secondary: Small phone text link */}
        {artisan.phone && (
          <button
            type="button"
            onClick={() => {
              if (showPhone) {
                BookingFunnel.clickPhone(artisan.id, artisan.business_name || '', 'mobile_cta')
                handleCall()
              } else {
                BookingFunnel.revealPhone(artisan.id, artisan.business_name || '', 'mobile_cta')
                setShowPhone(true)
              }
            }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors py-1 focus:outline-none focus:underline"
            aria-label={showPhone ? `Appeler le ${artisan.phone}` : 'Afficher le numéro de téléphone'}
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            {showPhone ? (
              <span className="font-medium text-slate-700">{artisan.phone}</span>
            ) : (
              <span>ou appeler directement</span>
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}
