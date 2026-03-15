'use client'

import 'leaflet/dist/leaflet.css'
import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Loader2, MapPin, Filter, Users, ChevronDown, X, List, Map as MapIcon, AlertTriangle } from 'lucide-react'
import {
  cityMarkers,
  mapRegions,
  getMarkerColor,
  getMarkerRadius,
} from '@/lib/data/map-coverage'
import { services } from '@/lib/data/usa'

// Dynamic imports for Leaflet (SSR-incompatible)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
)

// France metropolitan center
const FRANCE_CENTER: [number, number] = [46.603354, 1.888334]
const FRANCE_ZOOM = 6

/* ─── List Fallback ──────────────────────────────────────────── */

function CityListFallback({
  markers,
  selectedService,
}: {
  markers: typeof cityMarkers
  selectedService: string
}) {
  const [sortBy, setSortBy] = useState<'name' | 'count'>('count')
  const sorted = useMemo(() => {
    const copy = [...markers]
    return sortBy === 'count'
      ? copy.sort((a, b) => b.attorneyCount - a.attorneyCount)
      : copy.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [markers, sortBy])

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700">
          {markers.length} cities
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-gray-500">Trier par</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'count')}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="count">Nombre d&apos;artisans</option>
            <option value="name">Nom de ville</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[540px] overflow-y-auto divide-y divide-gray-100">
        {sorted.map((city) => (
          <Link
            key={city.slug}
            href={selectedService ? `/practice-areas/${selectedService}/${city.slug}` : `/cities/${city.slug}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getMarkerColor(city.attorneyCount) }}
              />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-blue-700 truncate">
                  {city.name}
                </p>
                <p className="text-xs text-gray-500">
                  {city.departement} &middot; {city.region}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className="text-sm font-semibold text-gray-700">
                {city.attorneyCount.toLocaleString('fr-FR')}
              </span>
              <span className="text-xs text-gray-400">artisans</span>
              <MapPin className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function CarteClient() {
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedService, setSelectedService] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)

  useEffect(() => {
    // Load Leaflet with timeout fallback
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled && !mapReady) {
        setMapError(true)
        setViewMode('list')
      }
    }, 10000) // 10s timeout

    import('leaflet')
      .then((L) => {
        if (!cancelled) {
          leafletRef.current = L
          setMapReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMapError(true)
          setViewMode('list')
        }
      })

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Deduplicate city markers (remove duplicate slugs)
  const uniqueMarkers = useMemo(() => {
    const seen = new Set<string>()
    return cityMarkers.filter((m) => {
      if (seen.has(m.slug)) return false
      seen.add(m.slug)
      return true
    })
  }, [])

  // Filter markers by region
  const filteredMarkers = useMemo(() => {
    if (!selectedRegion) return uniqueMarkers
    return uniqueMarkers.filter((m) => m.region === selectedRegion)
  }, [uniqueMarkers, selectedRegion])

  // Total artisans in filtered zone
  const totalArtisans = useMemo(() => {
    return filteredMarkers.reduce((sum, m) => sum + m.attorneyCount, 0)
  }, [filteredMarkers])

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    if (!region) {
      mapRef.current?.setView(FRANCE_CENTER, FRANCE_ZOOM, { animate: true })
    } else {
      const regionCities = uniqueMarkers.filter((m) => m.region === region)
      if (regionCities.length > 0 && mapRef.current && leafletRef.current) {
        const bounds = leafletRef.current.latLngBounds(
          regionCities.map((c) => [c.lat, c.lng] as [number, number])
        )
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 })
      }
    }
  }

  const clearFilters = () => {
    setSelectedRegion('')
    setSelectedService('')
    mapRef.current?.setView(FRANCE_CENTER, FRANCE_ZOOM, { animate: true })
  }

  const showMap = viewMode === 'map' && mapReady && !mapError

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1">
        {/* Stats card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-blue-100">
                {selectedRegion ? `Artisans en ${selectedRegion}` : 'Total artisans référencés'}
              </p>
              <p className="text-2xl font-bold">
                {selectedRegion
                  ? totalArtisans.toLocaleString('fr-FR')
                  : '350 000+'}
              </p>
            </div>
          </div>
          <p className="text-sm text-blue-200">
            {filteredMarkers.length} cities affichées
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('map')}
            disabled={mapError}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            } ${mapError ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <MapIcon className="w-4 h-4" />
            Carte
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            Liste
          </button>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl mb-4"
        >
          <span className="flex items-center gap-2 font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            Filtres
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Filters */}
        <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          {/* Region filter */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label htmlFor="region-filter" className="block text-sm font-semibold text-gray-700 mb-2">
              Filtrer par région
            </label>
            <select
              id="region-filter"
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Toute la France</option>
              {mapRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Service filter */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label htmlFor="service-filter" className="block text-sm font-semibold text-gray-700 mb-2">
              Filtrer par métier
            </label>
            <select
              id="service-filter"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Tous les métiers</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {(selectedRegion || selectedService) && (
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Réinitialiser les filtres
            </button>
          )}

          {/* Legend (only in map mode) */}
          {showMap && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Légende</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-600" />
                  <span className="text-sm text-gray-600">Forte couverture (3&nbsp;000+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <span className="text-sm text-gray-600">Couverture moyenne (1&nbsp;000-3&nbsp;000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Couverture limitée (&lt; 1&nbsp;000)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map / List content */}
      <div className="flex-1 order-1 lg:order-2">
        {/* Map view */}
        {showMap && (
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '600px' }}>
            <MapContainer
              ref={mapRef}
              center={FRANCE_CENTER}
              zoom={FRANCE_ZOOM}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              minZoom={5}
              maxZoom={13}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filteredMarkers.map((city) => {
                const color = getMarkerColor(city.attorneyCount)
                const radius = getMarkerRadius(city.attorneyCount)

                return (
                  <CircleMarker
                    key={city.slug}
                    center={[city.lat, city.lng]}
                    radius={radius}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.7,
                      color: '#ffffff',
                      weight: 2,
                      opacity: 1,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -radius]}>
                      <span className="font-medium">{city.name}</span>
                      <br />
                      <span className="text-xs">{city.attorneyCount.toLocaleString('fr-FR')} artisans</span>
                    </Tooltip>
                    <Popup maxWidth={280}>
                      <div className="p-3">
                        <h3 className="font-bold text-gray-900 text-base mb-1">{city.name}</h3>
                        <p className="text-sm text-gray-600 mb-1">{city.departement} &middot; {city.region}</p>
                        <p className="text-sm font-medium text-blue-700 mb-3">
                          {city.attorneyCount.toLocaleString('fr-FR')} artisans référencés
                        </p>

                        <div className="flex gap-2">
                          <Link
                            href={selectedService ? `/practice-areas/${selectedService}/${city.slug}` : `/cities/${city.slug}`}
                            className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {selectedService ? 'Voir les artisans' : 'Voir la ville'}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        )}

        {/* Loading state (map mode, not yet ready) */}
        {viewMode === 'map' && !mapReady && !mapError && (
          <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: '600px' }}>
            <div className="text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Chargement de la carte...</p>
              <button
                onClick={() => setViewMode('list')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Voir en liste
              </button>
            </div>
          </div>
        )}

        {/* Error state (map failed) */}
        {viewMode === 'map' && mapError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center" style={{ height: '300px' }}>
            <div className="text-center px-6">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <p className="font-medium text-gray-900 mb-1">La carte n&apos;a pas pu se charger</p>
              <p className="text-sm text-gray-600 mb-4">
                Utilisez la vue liste ci-dessous pour parcourir les cities.
              </p>
              <button
                onClick={() => setViewMode('list')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <List className="w-4 h-4" />
                Voir en liste
              </button>
            </div>
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <CityListFallback markers={filteredMarkers} selectedService={selectedService} />
        )}
      </div>
    </div>
  )
}
