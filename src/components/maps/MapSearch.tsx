'use client'

import 'leaflet/dist/leaflet.css'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Star, Phone, MapPin, Loader2, Navigation, Layers, Shield
} from 'lucide-react'
import Link from 'next/link'
import NextImage from 'next/image'
import { getAttorneyUrl } from '@/lib/utils'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useMapSearchCache } from '@/hooks/useMapSearchCache'
import MapFilters from './MapFilters'
import type { Filters } from './MapFilters'
import {
  DesktopResultsSidebar,
  MobileResultsToggle,
  MobileResultsDrawer,
} from './MapResultsList'
import type { MapProvider } from './MapResultsList'
import './map-styles.css'

// Dynamic imports for Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const MapBoundsHandler = dynamic(
  () => import('./MapBoundsHandler'),
  { ssr: false }
)
const MapPerformanceIndicator = dynamic(
  () => import('./MapPerformanceIndicator'),
  { ssr: false }
)
const MapViewController = dynamic(
  () => import('./MapViewController'),
  { ssr: false }
)

interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

const MAP_STYLES = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap'
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB'
  }
}

export default function MapSearch() {
  const reducedMotion = useReducedMotion()
  const [providers, setProviders] = useState<MapProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<MapProvider | null>(null)
  const [hoveredProvider, setHoveredProvider] = useState<MapProvider | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null)
  const [mapStyle, setMapStyle] = useState<'street' | 'light' | 'dark'>('light')
  const [showStylePicker, setShowStylePicker] = useState(false)
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [responseTime, setResponseTime] = useState<number | undefined>()
  const [showPerformance, setShowPerformance] = useState(false)

  const searchDebounceRef = useRef<NodeJS.Timeout>()

  // World-class geolocation hook
  const geolocation = useGeolocation({ enableHighAccuracy: true })
  const userLocation: [number, number] | null = geolocation.latitude && geolocation.longitude
    ? [geolocation.latitude, geolocation.longitude]
    : null

  // World-class caching system
  const searchCache = useMapSearchCache<MapProvider[]>()
  const listRef = useRef<HTMLDivElement>(null)

  const [filters, setFilters] = useState<Filters>({
    service: '',
    minRating: 0,
    verified: false,
    emergency: false
  })

  const [mapCenter, setMapCenter] = useState<[number, number]>([46.603354, 1.888334])
  const [mapZoom, setMapZoom] = useState(6)

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return [
      filters.service,
      filters.minRating > 0,
      filters.verified,
      filters.emergency
    ].filter(Boolean).length
  }, [filters])

  // World-class search with caching and performance monitoring
  const searchInBounds = useCallback(async (bounds: MapBounds, query?: string) => {
    if (!bounds) return

    // Check cache first
    const cacheKey = { ...filters, query }
    const cachedData = searchCache.get(bounds, cacheKey)

    if (cachedData) {
      setProviders(cachedData)
      setShowPerformance(true)
      return
    }

    setLoading(true)
    const startTime = performance.now()

    try {
      const params = new URLSearchParams({
        north: bounds.north.toString(),
        south: bounds.south.toString(),
        east: bounds.east.toString(),
        west: bounds.west.toString(),
        limit: '100',
        ...(query && { q: query }),
        ...(filters.service && { service: filters.service }),
        ...(filters.minRating > 0 && { minRating: filters.minRating.toString() }),
        ...(filters.verified && { verified: 'true' }),
      })

      const response = await fetch(`/api/search/map?${params}`)
      const data = await response.json()

      if (data.success && data.providers) {
        setProviders(data.providers)
        // Cache the results
        searchCache.set(bounds, data.providers, cacheKey)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      const endTime = performance.now()
      setResponseTime(Math.round(endTime - startTime))
      setShowPerformance(true)
      setLoading(false)
    }
  }, [filters, searchCache])

  // Handle bounds change with debounce
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setCurrentBounds(bounds)

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(() => {
      searchInBounds(bounds, searchQuery)
    }, 300)
  }, [searchInBounds, searchQuery])

  // Handle search input change with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (currentBounds) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = setTimeout(() => {
        searchInBounds(currentBounds, value)
      }, 500)
    }
  }, [currentBounds, searchInBounds])

  // World-class user location with better error handling
  const getUserLocation = useCallback(() => {
    geolocation.getLocation()
  }, [])

  // Update map when geolocation changes
  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude) {
      setMapCenter([geolocation.latitude, geolocation.longitude])
      setMapZoom(13)
    }
  }, [geolocation.latitude, geolocation.longitude])

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Select provider and center map
  const handleSelectProvider = useCallback((provider: MapProvider) => {
    setSelectedProvider(provider)
    setMapCenter([provider.latitude, provider.longitude])
    setMapZoom(15)
  }, [])

  // Custom marker icon
  const createMarkerIcon = useCallback((provider: MapProvider, isHovered: boolean, isSelected: boolean) => {
    if (typeof window === 'undefined') return null

    const L = require('leaflet')

    const isHighlighted = isHovered || isSelected
    const size = isHighlighted ? 48 : 38
    const zIndex = isHighlighted ? 1000 : 1

    let bgColor = '#3b82f6' // blue default
    if (provider.is_verified) bgColor = '#22c55e' // green

    // World-class: pulse animation for selected
    const pulseAnimation = isSelected ? `
      @keyframes pulse {
        0%, 100% { transform: rotate(-45deg) scale(1); }
        50% { transform: rotate(-45deg) scale(1.05); }
      }
    ` : ''

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <style>${pulseAnimation}</style>
        <div style="
          background: ${bgColor};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg) ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          display: flex;
          align-items: center;
          justify-content: center;
          border: ${isHighlighted ? '4px' : '3px'} solid white;
          box-shadow: ${isHighlighted ? '0 6px 20px rgba(0,0,0,0.45)' : '0 3px 12px rgba(0,0,0,0.35)'};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: ${isSelected ? 'pulse 2s ease-in-out infinite' : 'none'};
          z-index: ${zIndex};
          cursor: pointer;
          position: relative;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: ${isHighlighted ? '15px' : '13px'};
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">${provider.rating_average?.toFixed(1) || '—'}</span>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
    })
  }, [])

  // Scroll to provider in list
  const scrollToProvider = (attorneyId: string) => {
    const element = document.getElementById(`provider-${attorneyId}`)
    if (element && listRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  useEffect(() => {
    setMapReady(true)
  }, [])

  // Initial load
  useEffect(() => {
    if (mapReady && currentBounds) {
      searchInBounds(currentBounds)
    }
  }, [mapReady, filters])

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Search Header */}
      <MapFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        activeFilterCount={activeFilterCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Results Sidebar */}
        <DesktopResultsSidebar
          providers={providers}
          loading={loading}
          selectedProvider={selectedProvider}
          hoveredProvider={hoveredProvider}
          viewMode={viewMode}
          favorites={favorites}
          listRef={listRef}
          onSelectProvider={handleSelectProvider}
          onHoverProvider={setHoveredProvider}
          onToggleFavorite={toggleFavorite}
        />

        {/* Map */}
        <div className={`flex-1 relative ${viewMode === 'list' ? 'hidden md:block' : ''}`}>
          {mapReady && (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="w-full h-full z-10"
              style={{ height: '100%' }}
            >
              <TileLayer
                attribution={MAP_STYLES[mapStyle].attribution}
                url={MAP_STYLES[mapStyle].url}
              />

              <MapBoundsHandler onBoundsChange={handleBoundsChange} />
              <MapViewController selectedProvider={selectedProvider} providers={providers} />

              {providers
                .filter(p =>
                  p.latitude &&
                  p.longitude &&
                  !isNaN(p.latitude) &&
                  !isNaN(p.longitude) &&
                  p.latitude >= -90 &&
                  p.latitude <= 90 &&
                  p.longitude >= -180 &&
                  p.longitude <= 180
                )
                .map((provider) => (
                  <Marker
                    key={provider.id}
                    position={[provider.latitude, provider.longitude]}
                    icon={createMarkerIcon(
                      provider,
                      hoveredProvider?.id === provider.id,
                      selectedProvider?.id === provider.id
                    )}
                    eventHandlers={{
                      click: () => {
                        setSelectedProvider(provider)
                        scrollToProvider(provider.id)
                      },
                      mouseover: () => setHoveredProvider(provider),
                      mouseout: () => setHoveredProvider(null)
                    }}
                  >
                    <Popup className="custom-popup" maxWidth={340} minWidth={300}>
                      <div className="p-2">
                        <div className="flex gap-3">
                          <div className="relative flex-shrink-0 rounded-xl">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center overflow-hidden">
                              {provider.avatar_url ? (
                                <NextImage src={provider.avatar_url} alt={provider.name} width={80} height={80} sizes="80px" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-3xl font-bold text-gray-400">
                                  {provider.name.charAt(0)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            {/* Name and verification */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 text-base leading-tight">{provider.name}</h3>
                              {provider.is_verified && (
                                <span title="Verified attorney">
                                  <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                                </span>
                              )}
                            </div>

                            {/* Specialty */}
                            <p className="text-sm text-blue-600 font-medium mb-2">{provider.specialty || 'Attorney'}</p>

                            {/* Rating - Enhanced */}
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="font-bold text-gray-900 text-sm">{provider.rating_average?.toFixed(1)}</span>
                              </div>
                              <span className="text-gray-500 text-sm">({provider.review_count} reviews)</span>
                            </div>

                            {/* Location */}
                            <p className="text-sm text-gray-600 mt-1.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {provider.address_city}
                            </p>

                          </div>
                        </div>

                        {/* Actions - World Class Design */}
                        <div className="flex gap-2 mt-4">
                          <Link
                            href={getAttorneyUrl({ stable_id: provider.stable_id, slug: provider.slug, specialty: provider.specialty, city: provider.address_city })}
                            className="flex-1 text-center py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                          >
                            View profile
                          </Link>
                          {provider.phone && (
                            <a
                              href={`tel:${provider.phone}`}
                              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                              title="Call now"
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </a>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))
              }

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={(() => {
                    if (typeof window === 'undefined') return undefined
                    const L = require('leaflet')
                    return L.divIcon({
                      className: 'user-location-marker',
                      html: `
                        <div style="
                          width: 20px;
                          height: 20px;
                          background: #3b82f6;
                          border: 4px solid white;
                          border-radius: 50%;
                          box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
                        "></div>
                      `,
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                    })
                  })()}
                />
              )}
            </MapContainer>
          )}

          {/* World-class Performance Indicator */}
          <MapPerformanceIndicator
            cacheStats={searchCache.stats}
            responseTime={responseTime}
            resultsCount={providers.length}
            show={showPerformance}
          />

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            {/* Geolocation - World Class */}
            <button
              onClick={getUserLocation}
              disabled={geolocation.loading}
              className={`p-3 bg-white rounded-xl shadow-lg transition-colors disabled:opacity-50 ${
                geolocation.error ? 'border-2 border-red-400' : 'hover:bg-gray-50'
              } ${userLocation ? 'bg-blue-50 border-2 border-blue-400' : ''}`}
              title={geolocation.error || (userLocation ? 'Location detected' : 'My location')}
            >
              {geolocation.loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <Navigation className={`w-5 h-5 ${userLocation ? 'text-blue-600' : 'text-gray-700'}`} />
              )}
            </button>

            {/* Map Style */}
            <div className="relative">
              <button
                onClick={() => setShowStylePicker(!showStylePicker)}
                className="p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
                title="Map style"
              >
                <Layers className="w-5 h-5 text-gray-700" />
              </button>

              <AnimatePresence>
                {showStylePicker && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
                    className="absolute right-full mr-2 top-0 bg-white rounded-xl shadow-lg p-2 min-w-[120px]"
                  >
                    {(['street', 'light', 'dark'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => {
                          setMapStyle(style)
                          setShowStylePicker(false)
                        }}
                        className={`w-full px-3 py-2 text-left rounded-lg text-sm capitalize transition-colors ${
                          mapStyle === style ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {style === 'street' ? 'Standard' : style === 'light' ? 'Light' : 'Dark'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Loading Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
              >
                <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium">Searching...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hovered Provider Card */}
          <AnimatePresence>
            {hoveredProvider && viewMode === 'map' && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-400">
                        {hoveredProvider.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{hoveredProvider.name}</h3>
                      <p className="text-sm text-blue-600">{hoveredProvider.specialty}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-medium">{hoveredProvider.rating_average?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Results Toggle */}
          <MobileResultsToggle
            attorneyCount={providers.length}
            mobileDrawerOpen={mobileDrawerOpen}
            onToggle={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileResultsDrawer
        providers={providers}
        mobileDrawerOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </div>
  )
}
