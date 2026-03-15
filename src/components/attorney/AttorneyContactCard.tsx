'use client'

import { Phone, Mail, MessageCircle, Shield, Star } from 'lucide-react'
import type { LegacyArtisan } from '@/types/legacy'
import { trackEvent } from '@/lib/analytics/tracking'

interface AttorneyContactCardProps {
  artisan: LegacyArtisan
}

/** Check if a phone number is valid (not empty, not placeholder) */
function isValidPhone(phone: string | undefined | null): phone is string {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10
}

/** Format French phone: 0X XX XX XX XX */
function formatFrenchPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('33') && digits.length === 11
    ? '0' + digits.slice(2)
    : digits
  if (normalized.length !== 10 || !normalized.startsWith('0')) return phone
  return `${normalized.slice(0, 2)} ${normalized.slice(2, 4)} ${normalized.slice(4, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8, 10)}`
}

export function AttorneyContactCard({ artisan }: AttorneyContactCardProps) {
  const hasPhone = isValidPhone(artisan.phone)
  const hasEmail = !!artisan.email
  return (
    <div className="bg-[#FFFCF8] rounded-2xl shadow-premium border border-stone-200/60 overflow-hidden">
      {/* Header accent */}
      <div className="h-1 bg-gradient-to-r from-clay-400 via-clay-300 to-clay-500" />

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 font-heading mb-4">Contacter cet artisan</h3>

        {/* Availability + rating row */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {artisan.accepts_new_clients === true && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-semibold text-green-700">Disponible</span>
            </div>
          )}
          {artisan.average_rating > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
              <span className="font-semibold text-gray-900">{artisan.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* CTA Buttons — Ordre optimisé pour la conversion */}
        <div className="space-y-3">
          {/* 1. Téléphone (action la plus directe, haute conversion) */}
          {hasPhone && (
            <button
              type="button"
              onClick={() => {
                trackEvent('phone_reveal', { artisan_slug: artisan.slug })
                trackEvent('phone_click', { artisan_slug: artisan.slug })
                window.location.href = `tel:${artisan.phone!.replace(/\s/g, '')}`
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-medium transition-colors"
              aria-label={`Appeler le ${formatFrenchPhone(artisan.phone!)}`}
            >
              <Phone className="w-4 h-4" />
              {formatFrenchPhone(artisan.phone!)}
            </button>
          )}

          {/* 2. Devis IA gratuit (ouvre le widget d'estimation) */}
          <button
            type="button"
            onClick={() => {
              trackEvent('artisan_devis_click', { artisan_slug: artisan.slug })
              window.dispatchEvent(new Event('sa:open-estimation'))
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-clay-400 to-clay-500 text-white font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-glow-clay hover:shadow-glow-clay hover:from-clay-500 hover:to-clay-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 group"
          >
            <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" aria-hidden="true" />
            Demander un devis gratuit
          </button>

          {/* 3. Email (basse conversion) */}
          {hasEmail && (
            <a
              href={`mailto:${artisan.email}`}
              onClick={() => {
                trackEvent('artisan_email_click', { artisan_slug: artisan.slug })
              }}
              className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-slate-700 font-medium flex items-center justify-center gap-2.5 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 group"
              aria-label={`Envoyer un email à ${artisan.email}`}
            >
              <Mail className="w-5 h-5 text-slate-400 transition-colors group-hover:text-slate-600" aria-hidden="true" />
              Envoyer un email
            </a>
          )}

        </div>

        {/* Trust footer */}
        <div className="flex items-center gap-2 pt-4 mt-5 border-t border-gray-100">
          <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs text-gray-500">
            Service gratuit • Données protégées (RGPD) • Sans engagement
          </span>
        </div>
      </div>
    </div>
  )
}
