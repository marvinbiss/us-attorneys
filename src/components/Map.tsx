'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LegacyProvider } from '@/types/legacy'
import 'leaflet/dist/leaflet.css'

// Custom marker icon using divIcon (CSS-based, no external images needed)
const createDivIcon = (isVerified: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="w-8 h-8 ${isVerified ? 'bg-green-600' : 'bg-blue-600'} rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

interface MapProps {
  providers: LegacyProvider[]
  center: [number, number]
  zoom?: number
  onMarkerClick?: (provider: LegacyProvider) => void
  selectedProvider?: LegacyProvider | null
}

// Component to recenter map when center changes
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function Map({
  providers,
  center,
  zoom = 12,
  onMarkerClick,
  selectedProvider: _selectedProvider,
}: MapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading map...</span>
      </div>
    )
  }

  // Filter providers with valid coordinates
  const validProviders = providers.filter(
    (p) => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude)
  )

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full rounded-lg"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} zoom={zoom} />

      {validProviders.map((provider) => (
        <Marker
          key={provider.id}
          position={[provider.latitude!, provider.longitude!]}
          icon={createDivIcon(!!provider.is_verified)}
          eventHandlers={{
            click: () => onMarkerClick?.(provider),
          }}
        >
          <Popup>
            <div className="p-1 min-w-[200px]">
              <h3 className="font-semibold text-gray-900">{provider.name}</h3>
              {provider.address_city && (
                <p className="text-sm text-gray-600 mt-1">
                  {provider.address_postal_code} {provider.address_city}
                </p>
              )}
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="text-sm text-blue-600 hover:underline mt-1 block"
                >
                  {provider.phone}
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
