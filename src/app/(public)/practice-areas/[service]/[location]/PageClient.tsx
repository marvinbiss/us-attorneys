'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, List, Map as MapIcon, Search, ChevronDown, ArrowRight, FileText, SearchX } from 'lucide-react'
import { Provider, Service, Location } from '@/types'
import AttorneyList from '@/components/AttorneyList'

const PAGE_SIZE = 50

// Import GeographicMap (world-class version) dynamically to avoid SSR issues with Leaflet
const GeographicMap = dynamic(() => import('@/components/maps/GeographicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center rounded-xl">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-clay-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <span className="text-gray-500 font-medium">Chargement de la carte...</span>
      </div>
    </div>
  ),
})

interface ServiceLocationPageClientProps {
  service: Service
  location: Location
  providers: Provider[]
  h1Text?: string
  totalCount?: number
  specialtySlug?: string
  locationSlug?: string
  recentDevisCount?: number
}

export default function ServiceLocationPageClient({
  service,
  location,
  providers: initialProviders,
  h1Text,
  totalCount = 0,
  specialtySlug,
  locationSlug,
  recentDevisCount = 0,
}: ServiceLocationPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allProviders, setAllProviders] = useState<Provider[]>(initialProviders)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split')
  const [_isMobile, setIsMobile] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mapHoveredProviderId, setMapHoveredProviderId] = useState<string | null>(null)

  // Read initial values from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [sortOrder, setSortOrder] = useState<'default' | 'name' | 'rating'>(
    (searchParams.get('sort') as 'default' | 'name' | 'rating') || 'default'
  )

  // Update URL params when search/sort change
  const updateUrlParams = useCallback((q: string, sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (q) {
      params.set('q', q)
    } else {
      params.delete('q')
    }
    if (sort && sort !== 'default') {
      params.set('sort', sort)
    } else {
      params.delete('sort')
    }
    const qs = params.toString()
    router.replace(`${window.location.pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [router, searchParams])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    updateUrlParams(value, sortOrder)
  }, [sortOrder, updateUrlParams])

  const handleSortChange = useCallback((value: 'default' | 'name' | 'rating') => {
    setSortOrder(value)
    updateUrlParams(searchQuery, value)
  }, [searchQuery, updateUrlParams])

  const hasMore = allProviders.length < totalCount

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !specialtySlug || !locationSlug) return
    setIsLoadingMore(true)
    try {
      const res = await fetch(
        `/api/attorneys/listing?service=${specialtySlug}&location=${locationSlug}&offset=${allProviders.length}&limit=${PAGE_SIZE}`
      )
      if (!res.ok) throw new Error('fetch error')
      const data = await res.json()
      if (data.providers?.length) {
        setAllProviders(prev => [...prev, ...data.providers])
      }
    } catch {
      // silently fail — user can retry by clicking again
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, specialtySlug, locationSlug, allProviders.length])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Memoize providers for the map — avoids recreating the cluster on every render
  const mapProviders = useMemo(() => allProviders.map(p => ({
    id: p.id,
    name: p.name || '',
    stable_id: p.stable_id ?? undefined,
    slug: p.slug,
    latitude: p.latitude || 0,
    longitude: p.longitude || 0,
    rating_average: p.rating_average,
    review_count: p.review_count,
    specialty: p.specialty,
    address_city: p.address_city,
    is_verified: p.is_verified || false,
    phone: p.phone,
    address_street: p.address_street,
    address_postal_code: p.address_postal_code,
  })), [allProviders])

  // Default center: location coordinates → provider average → France fallback
  let computedLat = location.latitude
  let computedLng = location.longitude
  if (!computedLat || !computedLng) {
    const withCoords = allProviders.filter(p => p.latitude && p.longitude)
    if (withCoords.length > 0) {
      computedLat = withCoords.reduce((sum, p) => sum + p.latitude!, 0) / withCoords.length
      computedLng = withCoords.reduce((sum, p) => sum + p.longitude!, 0) / withCoords.length
    }
  }
  const mapCenter: [number, number] = [
    computedLat || 46.603354,
    computedLng || 1.888334,
  ]
  const mapZoom = computedLat ? 12 : 6

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb & Header */}
      <div className="bg-white border-b md:sticky md:top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Title & View toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-xl md:text-2xl font-bold text-gray-900">
                {h1Text || `${service.name} à ${location.name}`}
              </h1>
              {(location.department_name || location.postal_code) && (
                <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {location.department_name
                    ? `${location.department_name}${location.department_code ? ` (${location.department_code})` : ''}`
                    : location.postal_code}
                </p>
              )}
              {recentDevisCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium mt-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {recentDevisCount} devis demand{'é'}{recentDevisCount > 1 ? 's' : ''} ce mois-ci
                </div>
              )}
            </div>

            {/* View toggle - Desktop */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Les deux
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                Liste
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                Carte
              </button>
            </div>

            {/* View toggle - Mobile */}
            <div className="flex md:hidden items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky search/filter bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm py-2 px-4 border-b border-gray-100 flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="flex items-center gap-2 flex-1 px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-500 min-h-[44px] active:bg-gray-200 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>{searchQuery || 'Rechercher un artisan...'}</span>
        </button>
        <select
          value={sortOrder}
          onChange={(e) => handleSortChange(e.target.value as 'default' | 'name' | 'rating')}
          className="px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-700 font-medium min-h-[44px] border-0 focus:ring-2 focus:ring-clay-400"
          aria-label="Trier les résultats"
        >
          <option value="default">Trier</option>
          <option value="name">Nom A-Z</option>
          <option value="rating">Avis</option>
        </select>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              viewMode !== 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
            aria-label="Vue liste"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
            aria-label="Vue carte"
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {mobileSearchOpen && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 md:hidden">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-clay-400 focus-within:ring-2 focus-within:ring-clay-400/20 transition-all">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Nom, spécialité, adresse..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none min-h-[40px]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="text-xs text-clay-400 font-semibold whitespace-nowrap px-2 py-1"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* CTA Banner - Devis above the fold */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-white">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/15 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-heading font-bold text-base sm:text-lg">
                Recevez jusqu&apos;&agrave; 3 devis gratuits de {service.name.toLowerCase()} &agrave; {location.name}
              </p>
              <p className="text-blue-100 text-sm hidden sm:block">
                Comparez les prix et choisissez le meilleur artisan
              </p>
            </div>
          </div>
          <Link
            href={`/quotes/${specialtySlug || service.slug}/${locationSlug || ''}`}
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-sm sm:text-base whitespace-nowrap"
          >
            Recevoir mes devis gratuits
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main content - Zillow style split view */}
      <div
        className={`flex flex-col md:flex-row md:h-[calc(100vh-180px)] ${viewMode === 'map' ? 'h-[calc(100vh-200px)]' : ''}`}
      >
        {/* Provider List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div
            className={`bg-white border-r border-gray-200 overflow-y-auto md:h-full md:overflow-y-auto ${
              viewMode === 'split' ? 'w-full md:w-1/2 lg:w-2/5' : 'w-full'
            }`}
          >
            {allProviders.length === 0 ? (
              /* Empty state when 0 providers */
              <div className="flex flex-col items-center justify-center text-center px-6 py-16 sm:py-24">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                  <SearchX className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-2">
                  Aucun {service.name.toLowerCase()} r&eacute;f&eacute;renc&eacute; &agrave; {location.name} pour le moment
                </h2>
                <p className="text-gray-500 max-w-md mb-8">
                  Demandez un devis et nous rechercherons un professionnel qualifi&eacute; pour vous dans les plus brefs d&eacute;lais.
                </p>
                <Link
                  href={`/quotes/${specialtySlug || service.slug}/${locationSlug || ''}`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-200 text-base"
                >
                  <FileText className="w-5 h-5" />
                  Recevoir mes devis gratuits
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            ) : (
              <>
                <AttorneyList
                  providers={allProviders}
                  onProviderHover={setSelectedProvider}
                  totalCount={totalCount || allProviders.length}
                  searchQuery={searchQuery}
                  sortOrder={sortOrder}
                  highlightedProviderId={mapHoveredProviderId}
                />
                {hasMore && (
                  <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
                    <button
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-clay-50 hover:bg-clay-100 text-clay-600 font-semibold rounded-xl transition-colors disabled:opacity-60"
                    >
                      {isLoadingMore ? (
                        <span className="w-4 h-4 border-2 border-clay-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      {isLoadingMore
                        ? 'Chargement...'
                        : `Afficher plus (${allProviders.length} / ${totalCount.toLocaleString('fr-FR')})`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Map */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div
            className={`${
              viewMode === 'split'
                ? 'hidden md:block md:w-1/2 lg:w-3/5'
                : 'w-full h-[calc(100vh-200px)] md:h-auto'
            }`}
          >
            <GeographicMap
              centerLat={mapCenter[0]}
              centerLng={mapCenter[1]}
              zoom={mapZoom}
              providers={mapProviders}
              highlightedProviderId={selectedProvider?.id}
              locationName={location.name}
              height="100%"
              className="h-full"
              onMarkerHover={setMapHoveredProviderId}
            />
          </div>
        )}
      </div>

    </div>
  )
}
