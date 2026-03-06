'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react'
import type { LegacyArtisan } from '@/types/legacy'

const GeographicMap = dynamic(() => import('@/components/maps/GeographicMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: '280px' }}>
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
})

interface ArtisanMapProps {
  artisan: LegacyArtisan
}

export function ArtisanMap({ artisan }: ArtisanMapProps) {
  const hasCoordinates = artisan.latitude && artisan.longitude
  const hasCity = !!artisan.city
  const hasAddress = artisan.address && artisan.address.length > 0
  const hasZones = artisan.intervention_zones && artisan.intervention_zones.length > 0
  const hasRadius = !!artisan.intervention_zone

  if (!hasCoordinates && !hasCity && !hasAddress && !hasZones && !hasRadius) {
    return null
  }

  // Google Maps search link — used as CTA when no GPS coordinates are available
  const mapsQuery = artisan.address
    ? `${artisan.address}, ${artisan.postal_code} ${artisan.city}, France`
    : artisan.postal_code
    ? `${artisan.city} ${artisan.postal_code} France`
    : `${artisan.city} France`
  const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`

  // Provider marker for the map
  const mapProvider = hasCoordinates ? [{
    id: 'artisan',
    name: artisan.business_name || `${artisan.first_name || ''} ${artisan.last_name || ''}`.trim() || '',
    latitude: artisan.latitude!,
    longitude: artisan.longitude!,
    specialty: artisan.specialty,
    address_city: artisan.city,
    is_verified: artisan.is_verified || false,
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
        Zone d&apos;intervention
      </h2>

      {/* Leaflet map when GPS coordinates are available */}
      {hasCoordinates ? (
        <div className="rounded-xl overflow-hidden mb-4">
          <GeographicMap
            centerLat={artisan.latitude!}
            centerLng={artisan.longitude!}
            zoom={14}
            providers={mapProvider}
            locationName={artisan.city}
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
          aria-label={`Voir ${artisan.city} sur Google Maps`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clay-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Voir sur Google Maps</p>
              <p className="text-xs text-slate-500">
                {artisan.city}{artisan.postal_code ? ` (${artisan.postal_code})` : ''}
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-clay-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </a>
      ) : null}

      {/* Structured address */}
      {artisan.address && (
        <address className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 mb-4 not-italic">
          <Navigation className="w-5 h-5 text-gray-400 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-gray-900">{artisan.address}</p>
            <p className="text-gray-500">{artisan.postal_code} {artisan.city}</p>
          </div>
        </address>
      )}

      {/* Intervention zones */}
      {artisan.intervention_zones && artisan.intervention_zones.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Communes desservies</h3>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Communes desservies">
            {artisan.intervention_zones.map((zone, i) => (
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
      {artisan.intervention_zone && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <Navigation className="w-4 h-4" aria-hidden="true" />
            <span>Rayon d&apos;intervention : <strong>{artisan.intervention_zone}</strong></span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
