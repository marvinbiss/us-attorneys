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
    <div
      className="flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700"
      style={{ height: '280px' }}
    >
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  ),
})

interface AttorneyMapProps {
  attorney: LegacyAttorney
}

/** Day key to display name mapping for opening hours */
const dayMap: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

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
  const mapProvider = hasCoordinates
    ? [
        {
          id: 'attorney',
          name:
            attorney.business_name ||
            `${attorney.first_name || ''} ${attorney.last_name || ''}`.trim() ||
            '',
          latitude: attorney.latitude as number,
          longitude: attorney.longitude as number,
          specialty: attorney.specialty,
          address_city: attorney.city,
          is_verified: attorney.is_verified || false,
        },
      ]
    : []

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-stone-200/60 bg-[#FFFCF8] p-6 shadow-soft dark:border-gray-700 dark:bg-gray-800"
    >
      <h2 className="mb-5 flex items-center gap-2.5 text-xl font-semibold text-gray-900 dark:text-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-clay-50 dark:bg-clay-900/30">
          <MapPin className="w-4.5 h-4.5 text-clay-400" aria-hidden="true" />
        </div>
        Location &amp; Contact
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Map + Address */}
        <div>
          {/* Leaflet map when GPS coordinates are available */}
          {hasCoordinates ? (
            <div className="mb-4 overflow-hidden rounded-xl">
              <GeographicMap
                centerLat={attorney.latitude as number}
                centerLng={attorney.longitude as number}
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
              className="group mb-4 flex items-center justify-between gap-3 rounded-xl border border-clay-100 bg-clay-50 p-4 transition-colors hover:bg-clay-100 dark:border-clay-700 dark:bg-clay-900/30 dark:hover:bg-clay-900/50"
              aria-label={`View ${attorney.city} on Google Maps`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-clay-400">
                  <MapPin className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    View on Google Maps
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {attorney.city}
                    {attorney.postal_code ? ` (${attorney.postal_code})` : ''}
                  </p>
                </div>
              </div>
              <ExternalLink
                className="h-4 w-4 text-clay-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          ) : null}

          {/* Structured address */}
          {attorney.address && (
            <address className="mb-4 flex items-start gap-3 rounded-xl bg-gray-50 p-4 not-italic dark:bg-gray-700/50">
              <Navigation
                className="mt-0.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
              <div>
                <p className="text-gray-900 dark:text-gray-100">{attorney.address}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {attorney.postal_code} {attorney.city}
                </p>
              </div>
            </address>
          )}

          {/* Intervention zones */}
          {attorney.intervention_zones && attorney.intervention_zones.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Areas served
              </h3>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Areas served">
                {attorney.intervention_zones.map((zone, i) => (
                  <span
                    key={i}
                    role="listitem"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sand-200 px-3 py-1.5 text-sm text-stone-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {zone}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Intervention radius */}
          {attorney.intervention_zone && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Navigation className="h-4 w-4" aria-hidden="true" />
                <span>
                  Service radius: <strong>{attorney.intervention_zone}</strong>
                </span>
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
                BookingFunnel.revealPhone(
                  attorney.id,
                  attorney.business_name || '',
                  'location_section'
                )
                BookingFunnel.clickPhone(
                  attorney.id,
                  attorney.business_name || '',
                  'location_section'
                )
                window.location.href = `tel:${(attorney.phone ?? '').replace(/\s/g, '')}`
              }}
              className="flex w-full items-center gap-3 rounded-xl bg-stone-800 p-4 text-white transition-colors hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600"
              aria-label={`Call ${attorney.phone}`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Phone className="h-5 w-5" aria-hidden="true" />
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
              className="group flex w-full items-center gap-3 rounded-xl border border-stone-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              aria-label={`Send email to ${attorney.email}`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-clay-50 dark:bg-clay-900/30">
                <Mail className="h-5 w-5 text-clay-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Send an email
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-gray-400">
                  {attorney.email}
                </p>
              </div>
            </a>
          )}

          {/* Website */}
          {hasWebsite && (
            <a
              href={
                (attorney.website ?? '').startsWith('http')
                  ? (attorney.website ?? '')
                  : `https://${attorney.website}`
              }
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="group flex w-full items-center gap-3 rounded-xl border border-stone-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-clay-50 dark:bg-clay-900/30">
                <Globe className="h-5 w-5 text-clay-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Visit website
                </p>
                <p className="truncate text-xs text-clay-500 dark:text-clay-400">
                  {(attorney.website ?? '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </p>
              </div>
              <ExternalLink
                className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          )}

          {/* Office hours */}
          {hasOpeningHours && (
            <div className="rounded-xl border border-stone-200 p-4 dark:border-gray-600">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Clock className="h-4 w-4 text-clay-400" aria-hidden="true" />
                Office Hours
              </h3>
              <div className="space-y-1.5">
                {dayOrder.map((dayKey) => {
                  const val = attorney.opening_hours?.[dayKey]
                  if (!val) return null
                  const dayName = dayMap[dayKey] || dayKey
                  return (
                    <div key={dayKey} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600 dark:text-gray-400">
                        {dayName}
                      </span>
                      {val.open ? (
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {val.start} - {val.end}
                        </span>
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
