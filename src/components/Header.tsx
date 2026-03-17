'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Heart } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useMobileMenu } from '@/contexts/MobileMenuContext'
import { useFavorites } from '@/hooks/useFavorites'
import QuickSearch from '@/components/search/QuickSearch'
import { trackEvent } from '@/lib/analytics/tracking'
import { cn } from '@/lib/utils'
import { cities, usRegions, states, practiceAreas as allServices } from '@/lib/data/usa'
import {
  getLocationFromCoords,
  type MenuType, type MobileAccordion,
  type RegionCities, type PopularCity, type MetroRegion, type DomTomRegion
} from './header/header-data'
import DesktopMegaMenus from './header/DesktopMegaMenus'
import MobileMenu from './header/MobileMenu'

export default function Header({ attorneyCount = 0 }: { attorneyCount?: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isMenuOpen, setIsMenuOpen } = useMobileMenu()
  const { count: favoritesCount } = useFavorites()

  // Mobile search state
  const [serviceQuery, setServiceQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<MenuType>(null)
  const [mobileAccordion, setMobileAccordion] = useState<MobileAccordion>(null)

  // Geo menu data loaded from API to keep usa.ts out of client bundle
  const [citiesByRegion, setCitiesByRegion] = useState<RegionCities[]>([])
  const [popularCities, setPopularCities] = useState<PopularCity[]>([])
  const [metroRegions, setMetroRegions] = useState<MetroRegion[]>([])
  const [domTomRegions, setDomTomRegions] = useState<DomTomRegion[]>([])

  const megaMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Fetch geo menu data
  useEffect(() => {
    fetch('/api/geo/menu-data')
      .then((res) => res.json())
      .then((data) => {
        setCitiesByRegion(data.citiesByRegion ?? [])
        setPopularCities(data.popularCities ?? [])
        setMetroRegions(data.metroRegions ?? [])
        setDomTomRegions(data.domTomRegions ?? [])
      })
      .catch(() => {})
  }, [])

  // Scroll listener
  useEffect(() => {
    if (!mounted) return
    const handleScroll = () => { setScrolled(window.scrollY > 50) }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mounted])

  // Close desktop mega menus on route change
  const prevPathnameRef = useRef(pathname)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      setOpenMenu(null)
      setMobileAccordion(null)
    }
  }, [pathname])

  // Track openMenu in a ref for document click handler
  const openMenuRef = useRef(openMenu)
  openMenuRef.current = openMenu

  // Close mega menus when clicking outside
  useEffect(() => {
    if (!mounted) return
    const handleClick = (e: MouseEvent) => {
      if (!openMenuRef.current) return
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu-trigger]') && !target.closest('[data-menu-content]')) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [mounted])

  // Close on Escape + arrow key navigation inside open menus
  useEffect(() => {
    if (!mounted) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close menu and return focus to the trigger button
        const currentMenu = openMenuRef.current
        if (currentMenu) {
          setOpenMenu(null)
          const trigger = document.querySelector<HTMLElement>(`[data-menu-trigger="${currentMenu}"]`)
          trigger?.focus()
        }
        return
      }

      // Arrow key navigation inside open menus
      if (!openMenuRef.current) return
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

      const menuContent = document.querySelector(`[data-menu-content="${openMenuRef.current}"]`)
      if (!menuContent) return

      const focusableItems = Array.from(
        menuContent.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [role="menuitem"]')
      )
      if (focusableItems.length === 0) return

      const currentIndex = focusableItems.indexOf(document.activeElement as HTMLElement)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex = currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0
        focusableItems[nextIndex].focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1
        focusableItems[prevIndex].focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mounted])

  // Mobile search handler
  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (serviceQuery.trim()) params.set('q', serviceQuery.trim())
    if (locationQuery.trim()) params.set('location', locationQuery.trim())
    if (params.toString()) router.push(`/search?${params.toString()}`)
  }, [serviceQuery, locationQuery, router])

  // Geolocation for mobile search
  const handleGeolocation = useCallback(async () => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const city = await getLocationFromCoords(position.coords.longitude, position.coords.latitude)
          if (city) setLocationQuery(city)
        } catch {
          // Ignore
        } finally {
          setIsLocating(false)
        }
      },
      () => { setIsLocating(false) },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  const toggleMenu = (menu: MenuType) => {
    setOpenMenu(current => current === menu ? null : menu)
  }

  const openMenuOnHover = (menu: MenuType) => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current)
      megaMenuTimeoutRef.current = null
    }
    setOpenMenu(menu)
  }

  const closeMenusWithDelay = () => {
    megaMenuTimeoutRef.current = setTimeout(() => { setOpenMenu(null) }, 400)
  }

  const closeMenus = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current)
      megaMenuTimeoutRef.current = null
    }
    setOpenMenu(null)
  }

  const toggleMobileAccordion = (section: MobileAccordion) => {
    setMobileAccordion(current => current === section ? null : section)
  }

  const closeMobileMenu = () => { setIsMenuOpen(false) }

  // Keyboard handler for mega menu trigger buttons
  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent, menu: MenuType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleMenu(menu)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Open the menu and focus the first item
      setOpenMenu(menu)
      requestAnimationFrame(() => {
        const menuContent = document.querySelector(`[data-menu-content="${menu}"]`)
        if (menuContent) {
          const firstItem = menuContent.querySelector<HTMLElement>('a[role="menuitem"], button[role="menuitem"], a[href]')
          firstItem?.focus()
        }
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpenMenu(menu)
      requestAnimationFrame(() => {
        const menuContent = document.querySelector(`[data-menu-content="${menu}"]`)
        if (menuContent) {
          const items = menuContent.querySelectorAll<HTMLElement>('a[role="menuitem"], button[role="menuitem"], a[href]')
          if (items.length > 0) items[items.length - 1].focus()
        }
      })
    }
  }, [toggleMenu])

  // Helper to render a nav trigger button
  const NavTrigger = ({ menu, label }: { menu: MenuType; label: string }) => (
    <div
      className="relative"
      onMouseEnter={() => openMenuOnHover(menu)}
      onMouseLeave={closeMenusWithDelay}
    >
      <button
        type="button"
        data-menu-trigger={menu}
        onClick={() => toggleMenu(menu)}
        onKeyDown={(e) => handleTriggerKeyDown(e, menu)}
        aria-expanded={openMenu === menu}
        aria-haspopup="true"
        className={cn(
          'relative flex items-center gap-1 px-3 py-2 rounded-xl font-medium text-[0.85rem] transition-all duration-200',
          'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-clay-400 after:transition-all after:duration-300 after:rounded-full',
          openMenu === menu
            ? 'text-clay-400 bg-[#FDF1EC]/80 after:w-[60%]'
            : 'text-gray-600 hover:text-clay-400 hover:bg-gray-50/80 after:w-0 hover:after:w-[60%]'
        )}
      >
        {label}
        <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', openMenu === menu && 'rotate-180')} />
      </button>
      {/* Plus dropdown inline */}
      {menu === 'plus' && openMenu === 'plus' && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50" role="menu" aria-label="More options">
          <Link href="/reviews" role="menuitem" tabIndex={0} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-clay-400 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>Attorney reviews</Link>
          <Link href="/pricing" role="menuitem" tabIndex={0} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-clay-400 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>Fees</Link>
          <Link href="/blog" role="menuitem" tabIndex={0} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-clay-400 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>Blog</Link>
          <Link href="/guides" role="menuitem" tabIndex={0} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-clay-400 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>Legal guides</Link>
        </div>
      )}
    </div>
  )

  return (
    <>
    <header className={cn(
      'fixed top-0 left-0 right-0 z-[9999] transition-all duration-300',
      scrolled
        ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-gray-900/5 border-b border-gray-200/50'
        : 'bg-white/95 backdrop-blur-sm border-b border-gray-100/80'
    )}>
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          'flex justify-between items-center transition-all duration-300',
          scrolled ? 'h-14' : 'h-16'
        )}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group/logo">
            <div className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none" className="flex-shrink-0">
                <defs>
                  <linearGradient id="headerBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E86B4B" />
                    <stop offset="1" stopColor="#C24B2A" />
                  </linearGradient>
                  <radialGradient id="headerShine" cx=".32" cy=".26" r=".65">
                    <stop stopColor="#fff" stopOpacity=".16" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#headerBg)" />
                <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#headerShine)" />
                <path fillRule="evenodd" fill="#fff" fillOpacity="0.95" d="M24 11 L38.5 24 L35 24 L35 37 L13 37 L13 24 L9.5 24Z M21 37 V29 A3 3 0 0 1 27 29 V37Z" />
              </svg>
              <span className="hidden sm:inline text-xl font-heading font-extrabold tracking-tight text-gray-900 group-hover/logo:text-gray-700 transition-colors duration-200">
                US<span className="text-clay-400 group-hover/logo:text-clay-300 transition-colors duration-200">Attorneys</span>
              </span>
            </div>
          </Link>

          {/* Quick Search */}
          <div className="hidden md:flex flex-1 min-w-[220px] max-w-xl mx-4 lg:mx-8">
            {mounted ? (
              <QuickSearch />
            ) : (
              <div className="w-full rounded-full border border-gray-200 bg-gray-50 h-[38px] animate-pulse" />
            )}
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-0.5" aria-label="Main navigation">
            <NavTrigger menu="services" label="Services" />
            <NavTrigger menu="cities" label="Cities" />
            <NavTrigger menu="regions" label="States" />
            <NavTrigger menu="plus" label="More" />

            {/* Favorites */}
            <Link
              href="/my-favorites"
              className="relative text-gray-600 hover:text-red-500 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-red-50/80"
              aria-label={`My favorites${favoritesCount > 0 ? ` (${favoritesCount})` : ''}`}
              title="My favorites"
            >
              <Heart className="w-5 h-5" />
              {mounted && favoritesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>

            <Link
              href="/login"
              className="relative text-gray-600 hover:text-clay-400 px-3 py-2 rounded-xl font-medium text-[0.85rem] hover:bg-gray-50/80 transition-all duration-200 after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-0 hover:after:w-[60%] after:h-[2px] after:bg-clay-400 after:transition-all after:duration-300 after:rounded-full"
            >
              Sign in
            </Link>

            <Link
              href="/emergency"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-200"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              24/7 Emergency
            </Link>

            <Link
              href="/quotes"
              onClick={() => trackEvent('header_quote_click', {})}
              className="ml-2 px-4 py-2 bg-gradient-to-r from-clay-400 to-clay-600 hover:from-clay-500 hover:to-clay-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-clay-400/20 hover:shadow-lg hover:shadow-clay-400/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Free consultation
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            className="lg:hidden flex items-center justify-center w-12 h-12 -mr-2 rounded-xl active:bg-gray-200 hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Mega Menus */}
      {mounted && openMenu && openMenu !== 'plus' && (
        <DesktopMegaMenus
          openMenu={openMenu}
          attorneyCount={attorneyCount}
          allServicesCount={allServices.length}
          villesCount={cities.length}
          regionsCount={usRegions.length}
          departementsCount={states.length}
          citiesByRegion={citiesByRegion}
          metroRegions={metroRegions}
          domTomRegions={domTomRegions}
          openMenuOnHover={openMenuOnHover}
          closeMenusWithDelay={closeMenusWithDelay}
          closeMenus={closeMenus}
        />
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <MobileMenu
          serviceQuery={serviceQuery}
          setServiceQuery={setServiceQuery}
          locationQuery={locationQuery}
          setLocationQuery={setLocationQuery}
          isLocating={isLocating}
          handleGeolocation={handleGeolocation}
          handleSearch={handleSearch}
          mobileAccordion={mobileAccordion}
          toggleMobileAccordion={toggleMobileAccordion}
          popularCities={popularCities}
          metroRegions={metroRegions}
          domTomRegions={domTomRegions}
          favoritesCount={favoritesCount}
          closeMobileMenu={closeMobileMenu}
        />
      )}
    </header>
    {/* Spacer to offset fixed header height (nav 64px) */}
    <div className="h-16" aria-hidden="true" />
    </>
  )
}
