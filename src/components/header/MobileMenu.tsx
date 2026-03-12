'use client'

import Link from 'next/link'
import {
  Search, ChevronDown, MapPin, Wrench, ArrowRight, Star,
  Layers, Sparkles, Navigation, Map, Building2, Phone, Heart, BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  serviceCategories,
  type MobileAccordion, type PopularCity, type MetroRegion, type DomTomRegion
} from './header-data'

interface MobileMenuProps {
  serviceQuery: string
  setServiceQuery: (v: string) => void
  locationQuery: string
  setLocationQuery: (v: string) => void
  isLocating: boolean
  handleGeolocation: () => void
  handleSearch: (e?: React.FormEvent) => void
  mobileAccordion: MobileAccordion
  toggleMobileAccordion: (section: MobileAccordion) => void
  popularCities: PopularCity[]
  metroRegions: MetroRegion[]
  domTomRegions: DomTomRegion[]
  favoritesCount: number
  closeMobileMenu: () => void
}

export default function MobileMenu({
  serviceQuery,
  setServiceQuery,
  locationQuery,
  setLocationQuery,
  isLocating,
  handleGeolocation,
  handleSearch,
  mobileAccordion,
  toggleMobileAccordion,
  popularCities,
  metroRegions,
  domTomRegions,
  favoritesCount,
  closeMobileMenu,
}: MobileMenuProps) {
  const closeAndResetAccordion = () => {
    closeMobileMenu()
  }

  return (
    <div
      data-menu-content="mobile-menu"
      className="lg:hidden border-t border-gray-100/50 max-h-[calc(100vh-120px)] overflow-y-auto bg-white/95 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Search Mobile - Dual Field */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-clay-400 focus-within:shadow-lg focus-within:shadow-clay-400/10 transition-all duration-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <label htmlFor="mobile-search-service" className="sr-only">Service recherché</label>
              <input
                id="mobile-search-service"
                type="text"
                placeholder="Service..."
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                className="w-full h-12 pl-9 pr-2 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-sm"
              />
            </div>
            <div className="w-px h-7 bg-gray-200" />
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <label htmlFor="mobile-search-location" className="sr-only">Ville ou code postal</label>
              <input
                id="mobile-search-location"
                type="text"
                placeholder="Ville..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full h-12 pl-9 pr-10 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={isLocating}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                aria-label="Utiliser ma position"
                title="Ma position"
              >
                <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-clay-400' : 'text-gray-400'}`} />
              </button>
            </div>
            <button
              type="submit"
              className="flex-shrink-0 m-1.5 w-10 h-10 bg-clay-400 hover:bg-clay-600 text-white rounded-full transition-all flex items-center justify-center"
              aria-label="Rechercher"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        <nav className="space-y-2" aria-label="Menu mobile">
          {/* ===== Services Accordion ===== */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleMobileAccordion('services')}
              aria-expanded={mobileAccordion === 'services'}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3.5 transition-colors',
                mobileAccordion === 'services' ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mobileAccordion === 'services' ? 'bg-blue-100' : 'bg-white'
                }`}>
                  <Wrench className={`w-4 h-4 ${mobileAccordion === 'services' ? 'text-blue-600' : 'text-slate-500'}`} />
                </div>
                <span className={`font-semibold text-sm ${mobileAccordion === 'services' ? 'text-blue-700' : 'text-slate-900'}`}>
                  Services
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                mobileAccordion === 'services' ? 'rotate-180 text-blue-500' : ''
              }`} />
            </button>

            {mobileAccordion === 'services' && (
              <div className="px-4 pb-4 pt-2 bg-white">
                {serviceCategories.map((cat) => (
                  <div key={cat.category} className="mb-3 last:mb-0">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      {cat.category}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {cat.services.map((service) => {
                        const Icon = service.icon
                        return (
                          <Link
                            key={`mob-${cat.category}-${service.slug}`}
                            href={`/services/${service.slug}`}
                            className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                            onClick={closeAndResetAccordion}
                          >
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-700">{service.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <Link
                  href="/services"
                  className="flex items-center gap-2 text-blue-600 text-sm font-semibold mt-3 px-1"
                  onClick={closeAndResetAccordion}
                >
                  Voir tous les services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* ===== Villes Accordion ===== */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleMobileAccordion('villes')}
              aria-expanded={mobileAccordion === 'villes'}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3.5 transition-colors',
                mobileAccordion === 'villes' ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mobileAccordion === 'villes' ? 'bg-blue-100' : 'bg-white'
                }`}>
                  <Building2 className={`w-4 h-4 ${mobileAccordion === 'villes' ? 'text-blue-600' : 'text-slate-500'}`} />
                </div>
                <span className={`font-semibold text-sm ${mobileAccordion === 'villes' ? 'text-blue-700' : 'text-slate-900'}`}>
                  Villes
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                mobileAccordion === 'villes' ? 'rotate-180 text-blue-500' : ''
              }`} />
            </button>

            {mobileAccordion === 'villes' && (
              <div className="px-4 pb-4 pt-2 bg-white">
                <div className="flex flex-wrap gap-2">
                  {popularCities.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/villes/${city.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors"
                      onClick={closeAndResetAccordion}
                    >
                      <MapPin className="w-3 h-3" />
                      {city.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/villes"
                  className="flex items-center gap-2 text-blue-600 text-sm font-semibold mt-3 px-1"
                  onClick={closeAndResetAccordion}
                >
                  Voir toutes les villes
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* ===== Régions Accordion ===== */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleMobileAccordion('regions')}
              aria-expanded={mobileAccordion === 'regions'}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3.5 transition-colors',
                mobileAccordion === 'regions' ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mobileAccordion === 'regions' ? 'bg-blue-100' : 'bg-white'
                }`}>
                  <Map className={`w-4 h-4 ${mobileAccordion === 'regions' ? 'text-blue-600' : 'text-slate-500'}`} />
                </div>
                <span className={`font-semibold text-sm ${mobileAccordion === 'regions' ? 'text-blue-700' : 'text-slate-900'}`}>
                  Régions
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                mobileAccordion === 'regions' ? 'rotate-180 text-blue-500' : ''
              }`} />
            </button>

            {mobileAccordion === 'regions' && (
              <div className="px-4 pb-4 pt-2 bg-white">
                <div className="grid grid-cols-2 gap-1.5">
                  {[...metroRegions, ...domTomRegions].map((region) => (
                    <Link
                      key={region.slug}
                      href={`/regions/${region.slug}`}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                      onClick={closeAndResetAccordion}
                    >
                      <Map className="w-3.5 h-3.5 text-slate-400" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">{region.name}</div>
                        <div className="text-[11px] text-slate-400">{(region.departments?.length ?? 0)} dép.</div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/regions"
                  className="flex items-center gap-2 text-blue-600 text-sm font-semibold mt-3 px-1"
                  onClick={closeAndResetAccordion}
                >
                  Voir toutes les régions
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Liens directs SEO */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/avis"
              className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
              onClick={closeMobileMenu}
            >
              <Star className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-sm text-slate-700">Avis</span>
            </Link>
            <Link
              href="/tarifs"
              className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
              onClick={closeMobileMenu}
            >
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm text-slate-700">Tarifs</span>
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
              onClick={closeMobileMenu}
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-medium text-sm text-slate-700">Blog</span>
            </Link>
            <Link
              href="/guides"
              className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
              onClick={closeMobileMenu}
            >
              <BookOpen className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm text-slate-700">Guides</span>
            </Link>
          </div>

          {/* CTAs */}
          <div className="pt-3 space-y-3">
            <Link
              href="/mes-favoris"
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-red-100 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-all duration-200"
              onClick={closeMobileMenu}
            >
              <Heart className="w-5 h-5" />
              Mes favoris
              {favoritesCount > 0 && (
                <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-[11px] font-bold rounded-full px-1 leading-none">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>
            <Link
              href="/urgence"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 shadow-lg shadow-red-600/20"
              onClick={closeMobileMenu}
            >
              <Phone className="w-5 h-5" />
              Urgences 24h/24
            </Link>
            <div className="flex gap-3">
              <Link
                href="/connexion"
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                onClick={closeMobileMenu}
              >
                Connexion
              </Link>
              <Link
                href="/devis"
                className="flex-1 py-3 bg-gradient-to-r from-clay-400 to-clay-600 hover:from-clay-500 hover:to-clay-700 text-white rounded-xl font-semibold text-center shadow-md shadow-clay-400/20 transition-all duration-200"
                onClick={closeMobileMenu}
              >
                Devis gratuit
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
