'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Loader2 } from 'lucide-react'

// Dynamic import for the map component
const GeographicMap = dynamic(() => import('./GeographicMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-xl h-[300px] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
})

interface Provider {
  id: string
  name: string
  slug?: string
  latitude: number
  longitude: number
  rating_average?: number
  review_count?: number
  specialty?: string
}

interface CityMapProps {
  cityName: string
  citySlug: string
}

// City coordinates (main cities)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'paris': { lat: 48.8566, lng: 2.3522 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'lyon': { lat: 45.7640, lng: 4.8357 },
  'toulouse': { lat: 43.6047, lng: 1.4442 },
  'nice': { lat: 43.7102, lng: 7.2620 },
  'nantes': { lat: 47.2184, lng: -1.5536 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 },
  'montpellier': { lat: 43.6108, lng: 3.8767 },
  'bordeaux': { lat: 44.8378, lng: -0.5792 },
  'lille': { lat: 50.6292, lng: 3.0573 },
  'rennes': { lat: 48.1173, lng: -1.6778 },
  'reims': { lat: 49.2583, lng: 4.0317 },
  'le-havre': { lat: 49.4944, lng: 0.1079 },
  'saint-etienne': { lat: 45.4397, lng: 4.3872 },
  'toulon': { lat: 43.1242, lng: 5.9280 },
  'grenoble': { lat: 45.1885, lng: 5.7245 },
  'dijon': { lat: 47.3220, lng: 5.0415 },
  'angers': { lat: 47.4784, lng: -0.5632 },
  'nimes': { lat: 43.8367, lng: 4.3601 },
  'villeurbanne': { lat: 45.7669, lng: 4.8795 },
}

// Default France center
const DEFAULT_CENTER = { lat: 46.2276, lng: 2.2137 }

export default function CityMap({ cityName, citySlug }: CityMapProps) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [_loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get coordinates for this city
  const coordinates = CITY_COORDINATES[citySlug] || DEFAULT_CENTER

  useEffect(() => {
    async function fetchAttorneys() {
      try {
        const response = await fetch(`/api/attorneys/by-city?city=${encodeURIComponent(cityName)}&limit=20`)
        if (response.ok) {
          const data = await response.json()
          // Filter providers with valid coordinates
          const validProviders = (data.providers || []).filter(
            (p: Provider) => p.latitude && p.longitude
          )
          setProviders(validProviders)
        }
      } catch (err) {
        console.error('Error fetching providers:', err)
        setError('Unable to load the map')
      } finally {
        setLoading(false)
      }
    }

    fetchAttorneys()
  }, [cityName])

  // Don't render if we don't have coordinates
  if (!CITY_COORDINATES[citySlug]) {
    return null
  }

  if (error) {
    return null
  }

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-blue-600" />
        Attorneys on the map in {cityName}
      </h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <GeographicMap
          centerLat={coordinates.lat}
          centerLng={coordinates.lng}
          zoom={12}
          providers={providers}
          locationName={cityName}
          height="400px"
        />
        {providers.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              {providers.length} attorney{providers.length > 1 ? 's' : ''} found in {cityName}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
