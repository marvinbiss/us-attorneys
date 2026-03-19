'use client'

import Link from 'next/link'
import {
  Search,
  ChevronDown,
  MapPin,
  Wrench,
  ArrowRight,
  Star,
  Layers,
  Sparkles,
  Navigation,
  Map,
  Building2,
  Phone,
  Heart,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  serviceCategories,
  type MobileAccordion,
  type PopularCity,
  type MetroRegion,
  type DomTomRegion,
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
      className="relative z-[9998] max-h-[calc(100vh-120px)] overflow-y-auto border-t border-gray-100/50 bg-white/95 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 lg:hidden"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {/* Search Mobile - Dual Field */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex items-center overflow-hidden rounded-2xl border-2 border-gray-200 bg-white transition-all duration-200 focus-within:border-clay-400 focus-within:shadow-lg focus-within:shadow-clay-400/10 dark:border-gray-600 dark:bg-gray-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <label htmlFor="mobile-search-service" className="sr-only">
                Search service
              </label>
              <input
                id="mobile-search-service"
                type="text"
                placeholder="Service..."
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                className="h-12 w-full bg-transparent pl-9 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>
            <div className="h-7 w-px bg-gray-200" />
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <label htmlFor="mobile-search-location" className="sr-only">
                City or ZIP code
              </label>
              <input
                id="mobile-search-location"
                type="text"
                placeholder="City..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="h-12 w-full bg-transparent pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
              />
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={isLocating}
                className="absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full p-3 transition-colors hover:bg-gray-100 disabled:opacity-50"
                aria-label="Use my location"
                title="My location"
              >
                <Navigation
                  className={`h-4 w-4 ${isLocating ? 'animate-spin text-clay-400' : 'text-gray-400'}`}
                />
              </button>
            </div>
            <button
              type="submit"
              className="m-1.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-clay-400 text-white transition-all hover:bg-clay-600"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <nav className="space-y-2" aria-label="Mobile menu">
          {/* ===== Services Accordion ===== */}
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <button
              type="button"
              onClick={() => toggleMobileAccordion('services')}
              aria-expanded={mobileAccordion === 'services'}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3.5 transition-colors',
                mobileAccordion === 'services' ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    mobileAccordion === 'services' ? 'bg-blue-100' : 'bg-white'
                  }`}
                >
                  <Wrench
                    className={`h-4 w-4 ${mobileAccordion === 'services' ? 'text-blue-600' : 'text-slate-500'}`}
                  />
                </div>
                <span
                  className={`text-sm font-semibold ${mobileAccordion === 'services' ? 'text-blue-700' : 'text-slate-900'}`}
                >
                  Services
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                  mobileAccordion === 'services' ? 'rotate-180 text-blue-500' : ''
                }`}
              />
            </button>

            {mobileAccordion === 'services' && (
              <div className="bg-white px-4 pb-4 pt-2">
                {serviceCategories.map((cat) => (
                  <div key={cat.category} className="mb-3 last:mb-0">
                    <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {cat.category}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {cat.services.map((service) => {
                        const Icon = service.icon
                        return (
                          <Link
                            key={`mob-${cat.category}-${service.slug}`}
                            href={`/practice-areas/${service.slug}`}
                            className="flex min-h-[44px] items-center gap-2 rounded-lg bg-gray-50 p-2.5 transition-colors hover:bg-blue-50"
                            onClick={closeAndResetAccordion}
                          >
                            <Icon className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-700">
                              {service.name}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <Link
                  href="/practice-areas"
                  className="mt-3 flex items-center gap-2 px-1 text-sm font-semibold text-blue-600"
                  onClick={closeAndResetAccordion}
                >
                  View all services
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* ===== Cities Accordion ===== */}
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <button
              type="button"
              onClick={() => toggleMobileAccordion('cities')}
              aria-expanded={mobileAccordion === 'cities'}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3.5 transition-colors',
                mobileAccordion === 'cities' ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    mobileAccordion === 'cities' ? 'bg-blue-100' : 'bg-white'
                  }`}
                >
                  <Building2
                    className={`h-4 w-4 ${mobileAccordion === 'cities' ? 'text-blue-600' : 'text-slate-500'}`}
                  />
                </div>
                <span
                  className={`text-sm font-semibold ${mobileAccordion === 'cities' ? 'text-blue-700' : 'text-slate-900'}`}
                >
                  Cities
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                  mobileAccordion === 'cities' ? 'rotate-180 text-blue-500' : ''
                }`}
              />
            </button>

            {mobileAccordion === 'cities' && (
              <div className="bg-white px-4 pb-4 pt-2">
                <div className="flex flex-wrap gap-2">
                  {popularCities.map((city) => (
                    <Link
                      key={city.slug}
                      href={`/cities/${city.slug}`}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-100 hover:text-blue-700"
                      onClick={closeAndResetAccordion}
                    >
                      <MapPin className="h-3 w-3" />
                      {city.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/cities"
                  className="mt-3 flex items-center gap-2 px-1 text-sm font-semibold text-blue-600"
                  onClick={closeAndResetAccordion}
                >
                  View all cities
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* ===== Regions Accordion ===== */}
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <button
              type="button"
              onClick={() => toggleMobileAccordion('regions')}
              aria-expanded={mobileAccordion === 'regions'}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3.5 transition-colors',
                mobileAccordion === 'regions' ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    mobileAccordion === 'regions' ? 'bg-blue-100' : 'bg-white'
                  }`}
                >
                  <Map
                    className={`h-4 w-4 ${mobileAccordion === 'regions' ? 'text-blue-600' : 'text-slate-500'}`}
                  />
                </div>
                <span
                  className={`text-sm font-semibold ${mobileAccordion === 'regions' ? 'text-blue-700' : 'text-slate-900'}`}
                >
                  States
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                  mobileAccordion === 'regions' ? 'rotate-180 text-blue-500' : ''
                }`}
              />
            </button>

            {mobileAccordion === 'regions' && (
              <div className="bg-white px-4 pb-4 pt-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {[...metroRegions, ...domTomRegions].map((region) => (
                    <Link
                      key={region.slug}
                      href={`/regions/${region.slug}`}
                      className="flex min-h-[44px] items-center gap-2 rounded-lg bg-gray-50 p-2.5 transition-colors hover:bg-blue-50"
                      onClick={closeAndResetAccordion}
                    >
                      <Map className="h-3.5 w-3.5 text-slate-400" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-700">
                          {region.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {region.states?.length ?? 0} states
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/regions"
                  className="mt-3 flex items-center gap-2 px-1 text-sm font-semibold text-blue-600"
                  onClick={closeAndResetAccordion}
                >
                  View all regions
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Liens directs SEO */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/reviews"
              className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-blue-50"
              onClick={closeMobileMenu}
            >
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">Reviews</span>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-blue-50"
              onClick={closeMobileMenu}
            >
              <Layers className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-700">Fees</span>
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-blue-50"
              onClick={closeMobileMenu}
            >
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-slate-700">Blog</span>
            </Link>
            <Link
              href="/guides"
              className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-blue-50"
              onClick={closeMobileMenu}
            >
              <BookOpen className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-slate-700">Guides</span>
            </Link>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-3">
            <Link
              href="/my-favorites"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-100 py-3 font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
              onClick={closeMobileMenu}
            >
              <Heart className="h-5 w-5" />
              My favorites
              {favoritesCount > 0 && (
                <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>
            <Link
              href="/emergency"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-semibold text-white shadow-lg shadow-red-600/20 transition-colors duration-200 hover:bg-red-700"
              onClick={closeMobileMenu}
            >
              <Phone className="h-5 w-5" />
              24/7 Emergency
            </Link>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-center font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
                onClick={closeMobileMenu}
              >
                Sign in
              </Link>
              <Link
                href="/quotes"
                className="flex-1 rounded-xl bg-gradient-to-r from-clay-400 to-clay-600 py-3 text-center font-semibold text-white shadow-md shadow-clay-400/20 transition-all duration-200 hover:from-clay-500 hover:to-clay-700"
                onClick={closeMobileMenu}
              >
                Free consultation
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
