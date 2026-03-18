'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { MapPin, Navigation, ExternalLink, Loader2, Phone, Mail, Clock, Globe } from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'
import { BookingFunnel } from '@/lib/analytics/tracking'

const GeographicMap = dynamic(() => import('@/components/maps/GeographicMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center" style={{ height: '280px' }}>
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
})

interface AttorneyMapProps {
  attorney: LegacyAttorney
}

/** Format opening hours day keys (French DB keys -> English display) */
const dayMap: Record<string, string> = {
  lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday',
  jeudi: 'Thursday', vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday',
}

const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

export function AttorneyMap({ attorney }: AttorneyMapProps) {
  const reducedMotion = useReducedMotion()
  const hasCoordinates = attorney.latitude && attorney.longitude
  const hasCity = !!attorney.city
  const hasAddress = attorney.address && attorney.address.length > 0
  const hasZones = attorney.intervention_zones && attorney.intervention_zones.length > 0
  const hasRadius = !!attorney.intervention_zone
  const hasPhone = attorney.phone && attorney.phone.replace(/\D/g, '').length >= 10
  const hasEmail = !!attorney.email
  const hasWebsite = !!attorney.website
  const hasOpeningHours = attorney.opening_hours && Object.keys(attorney.opening_hours).length > 0

  const hasAnyLocation = hasCoordinates || hasCity || hasAddress || hasZones || hasRadius
  const hasAnyContact = hasPhone || hasEmail || hasWebsite || hasOpeningHours

  if (!hasAnyLocation && !hasAnyContact) {
    return null
  }

  // Google Maps search link
  const mapsQuery = attorney.address
    ? `${attorney.address}, ${attorney.city}, ${attorney.postal_code}`
    : attorney.postal_code
    ? `${attorney.city} ${attorney.postal_code}`
    : `${attorney.city}`
  const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`

  // Provider marker for the map
  const mapProvider = hasCoordinates ? [{
    id: 'attorney',
    name: attorney.business_name || `${attorney.first_name || ''} ${attorney.last_name || ''}`.trim() || '',
    latitude: attorney.latitude!,
    longitude: attorney.longitude!,
    specialty: attorney.specialty,
    address_city: attorney.city,
    is_verified: attorney.is_verified || false,
  }] : []

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.3 }}
      className="bg-[#FFFCF8] dark:bg-gray-800 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-clay-50 dark:bg-clay-900/30 flex items-center justify-center">
          <MapPin className="w-4.5 h-4.5 text-clay-400" aria-hidden="true" />
        </div>
        Location &amp; Contact
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Map + Address */}
        <div>
          {/* Leaflet map when GPS coordinates are available */}
          {hasCoordinates ? (
            <div className="rounded-xl overflow-hidden mb-4">
              <GeographicMap
                centerLat={attorney.latitude!}
                centerLng={attorney.longitude!}
                zoom={14}
                providers={mapProvider}
                locationName={attorney.city}
                height="240px"
              />
            </div>
          ) : hasCity ? (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 p-4 rounded-xl bg-clay-50 dark:bg-clay-900/30 border border-clay-100 dark:border-clay-700 mb-4 hover:bg-clay-100 dark:hover:bg-clay-900/50 transition-colors group"
              aria-label={`View ${attorney.city} on Google Maps`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-clay-400 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">View on Google Maps</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {attorney.city}{attorney.postal_code ? ` (${attorney.postal_code})` : ''}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-clay-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </a>
          ) : null}

          {/* Structured address */}
          {attorney.address && (
            <address className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 mb-4 not-italic">
              <Navigation className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-gray-900 dark:text-gray-100">{attorney.address}</p>
                <p className="text-gray-500 dark:text-gray-400">{attorney.postal_code} {attorney.city}</p>
              </div>
            </address>
          )}

          {/* Intervention zones */}
          {attorney.intervention_zones && attorney.intervention_zones.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Areas served</h3>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Areas served">
                {attorney.intervention_zones.map((zone, i) => (
                  <span
                    key={i}
                    role="listitem"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-gray-700 text-stone-700 dark:text-gray-300 text-sm"
                  >
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    {zone}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Intervention radius */}
          {attorney.intervention_zone && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Navigation className="w-4 h-4" aria-hidden="true" />
                <span>Service radius: <strong>{attorney.intervention_zone}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Contact info + Office hours */}
        <div className="space-y-4">
          {/* Phone */}
          {hasPhone && (
            <button
              type="button"
              onClick={() => {
                BookingFunnel.revealPhone(attorney.id, attorney.business_name || '', 'location_section')
                BookingFunnel.clickPhone(attorney.id, attorney.business_name || '', 'location_section')
                window.location.href = `tel:${attorney.phone!.replace(/\s/g, '')}`
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-white transition-colors"
              aria-label={`Call ${attorney.phone}`}
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{attorney.phone}</p>
                <p className="text-xs text-stone-300">Click to call</p>
              </div>
            </button>
          )}

          {/* Email */}
          {hasEmail && (
            <a
              href={`mailto:${attorney.email}`}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-stone-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              aria-label={`Send email to ${attorney.email}`}
            >
              <div className="w-10 h-10 rounded-lg bg-clay-50 dark:bg-clay-900/30 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-clay-400" aria-hidden="true" />
              </div>
              <div className="text-left min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Send an email</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{attorney.email}</p>
              </div>
            </a>
          )}

          {/* Website */}
          {hasWebsite && (
            <a
              href={attorney.website!.startsWith('http') ? attorney.website! : `https://${attorney.website}`}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-stone-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-clay-50 dark:bg-clay-900/30 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-clay-400" aria-hidden="true" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">Visit website</p>
                <p className="text-xs text-clay-500 dark:text-clay-400 truncate">
                  {attorney.website!.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </a>
          )}

          {/* Office hours */}
          {hasOpeningHours && (
            <div className="rounded-xl border border-stone-200 dark:border-gray-600 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-clay-400" aria-hidden="true" />
                Office Hours
              </h3>
              <div className="space-y-1.5">
                {dayOrder.map((dayKey) => {
                  const val = attorney.opening_hours?.[dayKey]
                  if (!val) return null
                  const dayName = dayMap[dayKey] || dayKey
                  return (
                    <div key={dayKey} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-gray-400 font-medium">{dayName}</span>
                      {val.ouvert ? (
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{val.debut} - {val.fin}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-gray-500">Closed</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
