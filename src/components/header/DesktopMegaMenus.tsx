'use client'

import Link from 'next/link'
import { MapPin, Phone, ArrowRight, Users, Map, Globe, ShieldCheck, Star } from 'lucide-react'
import {
  serviceCategories,
  getCategoryColors,
  type MenuType,
  type RegionCities,
  type MetroRegion,
  type DomTomRegion,
} from './header-data'

interface DesktopMegaMenusProps {
  openMenu: MenuType
  attorneyCount: number
  allServicesCount: number
  villesCount: number
  regionsCount: number
  departementsCount: number
  citiesByRegion: RegionCities[]
  metroRegions: MetroRegion[]
  domTomRegions: DomTomRegion[]
  openMenuOnHover: (menu: MenuType) => void
  closeMenusWithDelay: () => void
  closeMenus: () => void
}

export default function DesktopMegaMenus({
  openMenu,
  attorneyCount,
  allServicesCount,
  villesCount,
  regionsCount,
  departementsCount,
  citiesByRegion,
  metroRegions,
  domTomRegions,
  openMenuOnHover,
  closeMenusWithDelay,
  closeMenus,
}: DesktopMegaMenusProps) {
  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-[1px] transition-opacity duration-300"
        style={{ zIndex: 9990 }}
        onClick={closeMenus}
        aria-hidden="true"
      />

      {/* ===== SERVICES MEGA MENU ===== */}
      {openMenu === 'services' && (
        <div
          data-menu-content="services"
          role="menu"
          aria-label="Attorney services"
          className="absolute left-0 right-0 rounded-b-xl border-t border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          style={{ zIndex: 9995 }}
          onMouseEnter={() => openMenuOnHover('services')}
          onMouseLeave={closeMenusWithDelay}
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-8 py-5">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  All our legal services
                </h3>
                <p className="mt-0.5 text-sm text-slate-300">
                  {allServicesCount} practice areas, thousands of qualified attorneys across the US
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span>
                    {attorneyCount > 0
                      ? `${attorneyCount.toLocaleString('en-US')}+`
                      : 'Thousands of attorneys'}{' '}
                    listed
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-3 gap-6 xl:grid-cols-6">
                {serviceCategories.map((cat) => {
                  const CatIcon = cat.icon
                  const colors = getCategoryColors(cat.color)
                  const isUrgent = cat.color === 'red'
                  return (
                    <div key={cat.category} className="space-y-3">
                      <div className={`flex items-center gap-2.5 border-b pb-3 ${colors.border}`}>
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors.iconBg}`}
                        >
                          <CatIcon className={`h-[18px] w-[18px] ${colors.text}`} />
                        </div>
                        <div>
                          <span className={`font-heading text-sm font-bold ${colors.text}`}>
                            {cat.category}
                          </span>
                          {isUrgent && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                              24h/24
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        {cat.services.map((service) => {
                          const Icon = service.icon
                          return (
                            <Link
                              key={`${cat.category}-${service.slug}`}
                              href={`/practice-areas/${service.slug}`}
                              onClick={closeMenus}
                              role="menuitem"
                              tabIndex={0}
                              className={`group/link flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 ${colors.hoverBg} hover:shadow-sm`}
                            >
                              <Icon className="h-4 w-4 text-slate-400 transition-colors duration-200 group-hover/link:text-blue-600" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-slate-700 transition-colors duration-200 group-hover/link:text-blue-600">
                                  {service.name}
                                </div>
                                <div className="truncate text-xs text-slate-400">
                                  {service.description}
                                </div>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-slate-300 opacity-0 transition-all duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-100" />
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
                <Link
                  href="/practice-areas"
                  onClick={closeMenus}
                  className="group/cta inline-flex items-center gap-2 font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  View all services
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
                </Link>
                <Link
                  href="/emergency"
                  onClick={closeMenus}
                  className="flex items-center gap-2 rounded-xl bg-red-50 px-5 py-2.5 font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 hover:shadow-md"
                >
                  <Phone className="h-4 w-4" />
                  Emergency? Attorney available now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== VILLES MEGA MENU ===== */}
      {openMenu === 'cities' && (
        <div
          data-menu-content="cities"
          role="menu"
          aria-label="Cities"
          className="absolute left-0 right-0 rounded-b-xl border-t border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          style={{ zIndex: 9995 }}
          onMouseEnter={() => openMenuOnHover('cities')}
          onMouseLeave={closeMenusWithDelay}
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-8 py-5">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Find an attorney by city
                </h3>
                <p className="mt-0.5 text-sm text-slate-300">
                  {villesCount} cities covered across the US
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/regions"
                  onClick={closeMenus}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  <Map className="h-4 w-4" />
                  View by region
                </Link>
                <Link
                  href="/states"
                  onClick={closeMenus}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  <MapPin className="h-4 w-4" />
                  By state
                </Link>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
                {citiesByRegion.map((group) => (
                  <div key={group.region}>
                    <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">
                        {group.region}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {group.cities.map((city) => (
                        <Link
                          key={city.slug}
                          href={`/cities/${city.slug}`}
                          onClick={closeMenus}
                          role="menuitem"
                          tabIndex={0}
                          className="group/city flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-blue-50"
                        >
                          <div className="flex items-center gap-2.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover/city:text-blue-500" />
                            <span className="text-sm font-medium text-slate-700 transition-colors group-hover/city:text-blue-600">
                              {city.name}
                            </span>
                          </div>
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-400 transition-colors group-hover/city:bg-blue-100 group-hover/city:text-blue-600">
                            {city.population}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
                <Link
                  href="/cities"
                  onClick={closeMenus}
                  className="group/cta inline-flex items-center gap-2 font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  View all cities
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Attorneys listed in every city
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== REGIONS MEGA MENU ===== */}
      {openMenu === 'regions' && (
        <div
          data-menu-content="regions"
          role="menu"
          aria-label="States"
          className="absolute left-0 right-0 rounded-b-xl border-t border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          style={{ zIndex: 9995 }}
          onMouseEnter={() => openMenuOnHover('regions')}
          onMouseLeave={closeMenusWithDelay}
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-8 py-5">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">US Regions</h3>
                <p className="mt-0.5 text-sm text-slate-300">
                  {regionsCount} regions, {departementsCount} states covered
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/states"
                  onClick={closeMenus}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  <MapPin className="h-4 w-4" />
                  All states
                </Link>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-2">
                  <Map className="h-4 w-4 text-blue-600" />
                  <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-900">
                    Continental US
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {metroRegions.map((region) => (
                    <Link
                      key={region.slug}
                      href={`/regions/${region.slug}`}
                      onClick={closeMenus}
                      role="menuitem"
                      tabIndex={0}
                      className="group/region flex items-start gap-3 rounded-xl border border-transparent bg-slate-50/80 p-4 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 group-hover/region:border-blue-300 group-hover/region:bg-blue-100">
                        <Map className="h-5 w-5 text-slate-400 transition-colors group-hover/region:text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover/region:text-blue-700">
                          {region.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {region.states.length} state{region.states.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {domTomRegions.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-900">
                      Territories
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {domTomRegions.map((region) => (
                      <Link
                        key={region.slug}
                        href={`/regions/${region.slug}`}
                        onClick={closeMenus}
                        role="menuitem"
                        tabIndex={0}
                        className="group/region flex items-center gap-3 rounded-xl border border-transparent bg-emerald-50/50 p-3 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50"
                      >
                        <Globe className="h-4 w-4 flex-shrink-0 text-emerald-400 transition-colors group-hover/region:text-emerald-600" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-700 transition-colors group-hover/region:text-emerald-700">
                            {region.name}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
                <Link
                  href="/regions"
                  onClick={closeMenus}
                  className="group/cta inline-flex items-center gap-2 font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  View all regions
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Star className="h-4 w-4 text-amber-500" />
                  Complete national coverage
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
