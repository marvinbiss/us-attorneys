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
  'new-york': { lat: 40.7128, lng: -74.0060 },
  'los-angeles': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'phoenix': { lat: 33.4484, lng: -112.0740 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 },
  'san-antonio': { lat: 29.4241, lng: -98.4936 },
  'san-diego': { lat: 32.7157, lng: -117.1611 },
  'dallas': { lat: 32.7767, lng: -96.7970 },
  'san-jose': { lat: 37.3382, lng: -121.8863 },
  'austin': { lat: 30.2672, lng: -97.7431 },
  'jacksonville': { lat: 30.3322, lng: -81.6557 },
  'san-francisco': { lat: 37.7749, lng: -122.4194 },
  'columbus': { lat: 39.9612, lng: -82.9988 },
  'charlotte': { lat: 35.2271, lng: -80.8431 },
  'indianapolis': { lat: 39.7684, lng: -86.1581 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'washington-dc': { lat: 38.9072, lng: -77.0369 },
  'miami': { lat: 25.7617, lng: -80.1918 },
}

// Default US center (geographic center of contiguous US)
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 }

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
