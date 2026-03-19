'use client'

import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { Loader2 } from 'lucide-react'
import { getAttorneyUrl } from '@/lib/utils'
import './map-styles.css'

interface Provider {
  id: string
  name: string
  stable_id?: string
  slug?: string
  latitude: number
  longitude: number
  rating_average?: number
  review_count?: number
  specialty?: string
  address_city?: string
  is_verified?: boolean
  phone?: string
  address_line1?: string
  address_zip?: string
}

interface GeographicMapProps {
  centerLat: number
  centerLng: number
  zoom?: number
  providers?: Provider[]
  highlightedProviderId?: string
  locationName?: string
  height?: string
  className?: string
  onMarkerHover?: (attorneyId: string | null) => void
  onSearchArea?: (bounds: import('leaflet').LatLngBounds) => void
}

export default function GeographicMap({
  centerLat,
  centerLng,
  zoom = 12,
  providers = [],
  highlightedProviderId,
  locationName: _locationName,
  height = '400px',
  className = '',
  onMarkerHover,
  onSearchArea,
}: GeographicMapProps) {
  const [mapReady, setMapReady] = useState(false)
  const [_L, setL] = useState<typeof import('leaflet') | null>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(null)
  const [mapMoved, setMapMoved] = useState(false)

  // Callback ref to detect when MapContainer actually mounts
  const mapCallbackRef = useCallback((node: import('leaflet').Map | null) => {
    mapRef.current = node
    setMapInstance(node)
  }, [])
  const clusterGroupRef = useRef<import('leaflet').LayerGroup | null>(null)

  // Store individual markers for highlight updates without recreating the cluster
  const markersMapRef = useRef(new Map<string, import('leaflet').Marker>())

  // Stable refs for callbacks — avoids them being effect dependencies
  const onMarkerHoverRef = useRef(onMarkerHover)
  useEffect(() => {
    onMarkerHoverRef.current = onMarkerHover
  }, [onMarkerHover])

  // Marker icon cache
  const markerIconCache = useRef(new Map<string, import('leaflet').DivIcon>())

  useEffect(() => {
    import('leaflet').then(async (leaflet) => {
      // Import markercluster plugin (side-effect: extends L)
      await import('leaflet.markercluster')
      setL(leaflet.default)
      setMapReady(true)
    })
  }, [])

  // Attach moveend listener for "Search this area"
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let isInitial = true
    const handler = () => {
      if (isInitial) {
        isInitial = false
        return
      }
      setMapMoved(true)
    }
    map.on('moveend', handler)
    return () => {
      map.off('moveend', handler)
    }
  }, [mapReady, mapInstance])

  // Pan to highlighted provider when it changes
  useEffect(() => {
    if (!highlightedProviderId || !mapRef.current) return
    const target = providers.find((p) => p.id === highlightedProviderId)
    if (target) {
      mapRef.current.setView([target.latitude, target.longitude], Math.max(zoom, 13), {
        animate: true,
        duration: 0.4,
      })
    }
  }, [highlightedProviderId, providers, zoom])

  // Memoized marker icon factory
  const createMarkerIcon = useCallback(
    (isVerified: boolean, isHighlighted: boolean) => {
      if (!_L) return undefined

      const size = isHighlighted ? 40 : 32
      const color = isHighlighted
        ? '#C4533A' // clay-600
        : isVerified
          ? '#E86B4B' // clay-400
          : '#78716c' // stone-500

      return _L.divIcon({
        className: 'custom-marker',
        html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${
            isVerified
              ? `<svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`
              : `<svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="8"/></svg>`
          }
        </div>
      `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      })
    },
    [_L]
  )

  // Get cached marker icon
  const getMarkerIcon = useCallback(
    (isVerified: boolean, isHighlighted: boolean) => {
      const key = `${isVerified}-${isHighlighted}`
      if (!markerIconCache.current.has(key)) {
        const icon = createMarkerIcon(isVerified, isHighlighted)
        if (icon) {
          markerIconCache.current.set(key, icon)
        }
      }
      return markerIconCache.current.get(key)
    },
    [createMarkerIcon]
  )

  // Clear icon cache when _L changes
  useEffect(() => {
    markerIconCache.current.clear()
  }, [_L])

  // Stable provider list for marker effect (avoids re-creating cluster on every render)
  const validProviders = useMemo(
    () =>
      providers.filter(
        (p) =>
          p.latitude &&
          p.longitude &&
          !isNaN(p.latitude) &&
          !isNaN(p.longitude) &&
          p.latitude >= -90 &&
          p.latitude <= 90 &&
          p.longitude >= -180 &&
          p.longitude <= 180
      ),
    [providers]
  )

  // Imperatively manage the MarkerClusterGroup
  // Only re-runs when the actual provider data or map instance changes — NOT on highlight/hover
  useEffect(() => {
    const map = mapRef.current
    if (!map || !_L) return

    // Remove previous cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current)
      clusterGroupRef.current = null
    }
    markersMapRef.current.clear()

    if (validProviders.length === 0) return

    // Create cluster group with clay-themed icons.
    // leaflet.markercluster plugin adds markerClusterGroup() to L at runtime;
    // no TS types exist for this plugin method, so we extend the type inline.
    type LeafletWithCluster = NonNullable<typeof _L> & {
      markerClusterGroup: (
        opts: Record<string, unknown>
      ) => ReturnType<(typeof import('leaflet'))['layerGroup']>
    }
    const clusterGroup = (_L as LeafletWithCluster).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: { getChildCount: () => number }) => {
        const count = cluster.getChildCount()
        const size = count < 10 ? 36 : count < 50 ? 44 : 52
        const fontSize = size >= 52 ? 16 : 13
        return _L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:#E86B4B;color:white;
            border-radius:50%;border:3px solid white;
            display:flex;align-items:center;justify-content:center;
            font-weight:bold;font-size:${fontSize}px;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
          ">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: _L.point(size, size),
        })
      },
    })

    for (const provider of validProviders) {
      const isVerified = provider.is_verified ?? false
      const icon = getMarkerIcon(isVerified, false)
      if (!icon) continue

      const marker = _L.marker([provider.latitude, provider.longitude], { icon })

      // Hover events — use ref so callback changes don't recreate cluster
      marker.on('mouseover', () => onMarkerHoverRef.current?.(provider.id))
      marker.on('mouseout', () => onMarkerHoverRef.current?.(null))

      // Popup content
      const ratingHtml =
        provider.rating_average &&
        provider.rating_average > 0 &&
        provider.review_count &&
        provider.review_count > 0
          ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <span style="font-weight:700;color:#111827;font-size:14px">${provider.rating_average.toFixed(1)}</span>
            </div>
            <span style="font-size:12px;color:#6b7280">${provider.review_count} reviews</span>
          </div>`
          : ''

      const addressText = provider.address_line1
        ? provider.address_zip && provider.address_line1.includes(provider.address_zip)
          ? provider.address_line1
          : `${provider.address_line1}, ${provider.address_zip ?? ''} ${provider.address_city ?? ''}`.trim()
        : `${provider.address_zip ?? ''} ${provider.address_city ?? ''}`.trim()

      const profileUrl = getAttorneyUrl({
        stable_id: provider.stable_id,
        slug: provider.slug,
        specialty: provider.specialty,
        city: provider.address_city,
      })

      const phoneBtn = provider.phone
        ? `<a href="tel:${provider.phone}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;background:linear-gradient(to right,#44403c,#292524);color:white;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </a>`
        : ''

      const popupHtml = `
        <div style="padding:16px">
          <div style="display:flex;align-items:start;justify-content:space-between;gap:12px;margin-bottom:8px">
            <h3 style="font-weight:700;color:#111827;font-size:16px;line-height:1.3;margin:0">${provider.name}</h3>
            ${isVerified ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#E86B4B;flex-shrink:0" title="Verified attorney"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg></span>` : ''}
          </div>
          ${provider.specialty ? `<p style="font-size:14px;color:#E86B4B;font-weight:500;margin:0 0 8px">${provider.specialty}</p>` : ''}
          ${ratingHtml}
          ${addressText ? `<p style="font-size:14px;color:#4b5563;margin:0 0 12px;display:flex;align-items:start;gap:6px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" style="flex-shrink:0;margin-top:2px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>${addressText}</span></p>` : ''}
          <div style="display:flex;gap:8px">
            ${phoneBtn}
            <a href="${profileUrl}" style="flex:1;text-align:center;padding:8px 12px;background:linear-gradient(to right,#E86B4B,#D4573D);color:white;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">View profile</a>
          </div>
        </div>
      `

      marker.bindPopup(popupHtml, { maxWidth: 320, minWidth: 280, className: 'custom-popup' })
      clusterGroup.addLayer(marker)
      markersMapRef.current.set(provider.id, marker)
    }

    map.addLayer(clusterGroup)
    clusterGroupRef.current = clusterGroup

    const currentMarkersMap = markersMapRef.current
    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current)
        clusterGroupRef.current = null
      }
      currentMarkersMap.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_L, validProviders, mapInstance])

  // Update highlighted marker icon without destroying the cluster/popups
  useEffect(() => {
    if (!_L) return
    markersMapRef.current.forEach((marker, id) => {
      const provider = validProviders.find((p) => p.id === id)
      if (!provider) return
      const isVerified = provider.is_verified ?? false
      const isHighlighted = id === highlightedProviderId
      const icon = getMarkerIcon(isVerified, isHighlighted)
      if (icon) marker.setIcon(icon)
    })
  }, [highlightedProviderId, _L, validProviders, getMarkerIcon])

  // Handle "Search this area" click
  const handleSearchArea = useCallback(() => {
    if (mapRef.current && onSearchArea) {
      onSearchArea(mapRef.current.getBounds())
    }
    setMapMoved(false)
  }, [onSearchArea])

  if (!mapReady) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-gray-100 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-clay-400" />
          <p>Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ height }}>
      <MapContainer
        ref={mapCallbackRef}
        center={[centerLat, centerLng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      {/* "Search this area" button */}
      {mapMoved && (
        <button
          onClick={handleSearchArea}
          className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-lg transition-all hover:bg-clay-50 hover:text-clay-600"
        >
          Search this area
        </button>
      )}
    </div>
  )
}
