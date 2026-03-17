'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'

const GeographicMap = dynamic(() => import('@/components/maps/GeographicMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: '280px' }}>
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
})

interface AttorneyMapProps {
  attorney: LegacyAttorney
}

export function AttorneyMap({ attorney }: AttorneyMapProps) {
  const hasCoordinates = attorney.latitude && attorney.longitude
  const hasCity = !!attorney.city
  const hasAddress = attorney.address && attorney.address.length > 0
  const hasZones = attorney.intervention_zones && attorney.intervention_zones.length > 0
  const hasRadius = !!attorney.intervention_zone

  if (!hasCoordinates && !hasCity && !hasAddress && !hasZones && !hasRadius) {
    return null
  }

  // Google Maps search link — used as CTA when no GPS coordinates are available
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-clay-400" aria-hidden="true" />
        Service area
      </h2>

      {/* Leaflet map when GPS coordinates are available */}
      {hasCoordinates ? (
        <div className="rounded-xl overflow-hidden mb-4">
          <GeographicMap
            centerLat={attorney.latitude!}
            centerLng={attorney.longitude!}
            zoom={14}
            providers={mapProvider}
            locationName={attorney.city}
            height="280px"
          />
        </div>
      ) : hasCity ? (
        /* No GPS coordinates — show a styled Google Maps link */
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 p-4 rounded-xl bg-clay-50 border border-clay-100 mb-4 hover:bg-clay-100 transition-colors group"
          aria-label={`View ${attorney.city} on Google Maps`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clay-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">View on Google Maps</p>
              <p className="text-xs text-slate-500">
                {attorney.city}{attorney.postal_code ? ` (${attorney.postal_code})` : ''}
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-clay-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </a>
      ) : null}

      {/* Structured address */}
      {attorney.address && (
        <address className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 mb-4 not-italic">
          <Navigation className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-gray-900">{attorney.address}</p>
            <p className="text-gray-500">{attorney.postal_code} {attorney.city}</p>
          </div>
        </address>
      )}

      {/* Intervention zones */}
      {attorney.intervention_zones && attorney.intervention_zones.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Areas served</h3>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Areas served">
            {attorney.intervention_zones.map((zone, i) => (
              <span
                key={i}
                role="listitem"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-200 text-stone-700 text-sm"
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
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <Navigation className="w-4 h-4" aria-hidden="true" />
            <span>Service radius: <strong>{attorney.intervention_zone}</strong></span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
