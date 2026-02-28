'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search, Menu, X, ChevronDown, MapPin, Wrench, Zap, Key, Flame,
  PaintBucket, Home, Hammer, HardHat, Wind, TreeDeciduous,
  ShieldCheck, Sparkles, Star, Clock, Phone, ArrowRight, Users,
  ChefHat, Layers, Brush, Navigation, Map, Building2, Globe, Heart
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useMobileMenu } from '@/contexts/MobileMenuContext'
import { useFavorites } from '@/hooks/useFavorites'
import QuickSearch from '@/components/search/QuickSearch'
import { cn } from '@/lib/utils'
import { villes, regions, departements, services as allServices } from '@/lib/data/france'

// Reverse geocoding for mobile geolocation
async function getLocationFromCoords(lon: number, lat: number): Promise<string | null> {
  try {
    const url = `https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`
    const response = await fetch(url)

    if (!response.ok) return null

    const data = await response.json()
    return data.features?.[0]?.properties?.city || null
  } catch {
    return null
  }
}

// Services populaires organisés par catégorie
const serviceCategories = [
  {
    category: 'Urgences 24h/24',
    color: 'red',
    icon: Clock,
    services: [
      { name: 'Plombier', slug: 'plombier', icon: Wrench, description: 'Fuites, débouchage, installation', urgent: true },
      { name: 'Serrurier', slug: 'serrurier', icon: Key, description: 'Ouverture de porte, serrure', urgent: true },
      { name: 'Électricien', slug: 'electricien', icon: Zap, description: 'Panne, dépannage électrique', urgent: true },
    ]
  },
  {
    category: 'Chauffage & Clim',
    color: 'orange',
    icon: Flame,
    services: [
      { name: 'Chauffagiste', slug: 'chauffagiste', icon: Flame, description: 'Chaudière, pompe à chaleur' },
      { name: 'Climaticien', slug: 'climaticien', icon: Wind, description: 'Installation, entretien clim' },
    ]
  },
  {
    category: 'Bâtiment',
    color: 'blue',
    icon: HardHat,
    services: [
      { name: 'Maçon', slug: 'macon', icon: HardHat, description: 'Construction, rénovation' },
      { name: 'Couvreur', slug: 'couvreur', icon: Home, description: 'Toiture, zinguerie' },
      { name: 'Menuisier', slug: 'menuisier', icon: Hammer, description: 'Fenêtres, portes, escaliers' },
    ]
  },
  {
    category: 'Finitions',
    color: 'green',
    icon: PaintBucket,
    services: [
      { name: 'Peintre', slug: 'peintre-en-batiment', icon: PaintBucket, description: 'Peinture int. et ext.' },
      { name: 'Carreleur', slug: 'carreleur', icon: Sparkles, description: 'Carrelage, faïence' },
      { name: 'Solier', slug: 'solier', icon: Layers, description: 'Parquet, moquette, lino' },
    ]
  },
  {
    category: 'Aménagement',
    color: 'pink',
    icon: ChefHat,
    services: [
      { name: 'Cuisiniste', slug: 'cuisiniste', icon: ChefHat, description: 'Cuisines sur mesure' },
      { name: 'Nettoyage', slug: 'nettoyage', icon: Brush, description: 'Ménage professionnel' },
    ]
  },
  {
    category: 'Extérieur',
    color: 'emerald',
    icon: TreeDeciduous,
    services: [
      { name: 'Jardinier', slug: 'jardinier', icon: TreeDeciduous, description: 'Jardin, aménagement' },
    ]
  },
]

// Types for geo menu data fetched from /api/geo/menu-data
interface CityMenuItem { name: string; slug: string; population: string }
interface RegionCities { region: string; cities: CityMenuItem[] }
interface PopularCity { name: string; slug: string }
interface MetroRegion { slug: string; name: string; departments: { name: string; code: string; slug: string }[] }
interface DomTomRegion { slug: string; name: string; departments?: { name: string; code: string; slug: string }[] }

type MenuType = 'services' | 'villes' | 'regions' | 'plus' | null
type MobileAccordion = 'services' | 'villes' | 'regions' | null

export default function Header({ artisanCount = 0 }: { artisanCount?: number }) {
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

  // Geo menu data loaded from API to keep france.ts out of client bundle
  const [citiesByRegion, setCitiesByRegion] = useState<RegionCities[]>([])
  const [popularCities, setPopularCities] = useState<PopularCity[]>([])
  const [metroRegions, setMetroRegions] = useState<MetroRegion[]>([])
  const [domTomRegions, setDomTomRegions] = useState<DomTomRegion[]>([])

  const megaMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Wait for client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch geo menu data (keeps france.ts out of client bundle)
  useEffect(() => {
    fetch('/api/geo/menu-data')
      .then((res) => res.json())
      .then((data) => {
        setCitiesByRegion(data.citiesByRegion ?? [])
        setPopularCities(data.popularCities ?? [])
        setMetroRegions(data.metroRegions ?? [])
        setDomTomRegions(data.domTomRegions ?? [])
      })
      .catch(() => {
        // Silently ignore — menu simply stays empty until next load
      })
  }, [])

  // Scroll listener for floating navbar effect
  useEffect(() => {
    if (!mounted) return

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    // Check initial scroll position
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mounted])

  // Close desktop mega menus on route change.
  // Mobile menu is closed by individual link onClick handlers — no need
  // to force-close here (doing so caused the menu to snap shut on open).
  const prevPathnameRef = useRef(pathname)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      setOpenMenu(null)
      setMobileAccordion(null)
    }
  }, [pathname])

  // Track openMenu in a ref so the document click handler always sees the
  // current value without needing to be re-registered on every state change.
  const openMenuRef = useRef(openMenu)
  openMenuRef.current = openMenu

  // Close desktop mega menus when clicking outside.  Only runs when a
  // desktop mega menu is actually open to avoid interfering with mobile.
  useEffect(() => {
    if (!mounted) return

    const handleClick = (e: MouseEvent) => {
      if (!openMenuRef.current) return          // no mega menu open → skip
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu-trigger]') && !target.closest('[data-menu-content]')) {
        setOpenMenu(null)
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [mounted])

  // Close mega menus on Escape key
  useEffect(() => {
    if (!mounted) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mounted])

  // Mobile search handler
  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (serviceQuery.trim()) params.set('q', serviceQuery.trim())
    if (locationQuery.trim()) params.set('location', locationQuery.trim())

    if (params.toString()) {
      router.push(`/recherche?${params.toString()}`)
    }
  }, [serviceQuery, locationQuery, router])

  // Handle geolocation for mobile search
  const handleGeolocation = useCallback(async () => {
    if (!navigator.geolocation) return

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const city = await getLocationFromCoords(
            position.coords.longitude,
            position.coords.latitude
          )
          if (city) {
            setLocationQuery(city)
          }
        } catch {
          // Ignore errors
        } finally {
          setIsLocating(false)
        }
      },
      () => {
        setIsLocating(false)
      },
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
    megaMenuTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null)
    }, 400)
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

  // Get category color classes for the services mega menu
  const getCategoryColors = (color: string) => {
    const map: Record<string, { text: string; hoverBg: string; iconBg: string; border: string }> = {
      red: { text: 'text-red-700', hoverBg: 'hover:bg-red-50', iconBg: 'bg-red-100', border: 'border-red-200' },
      orange: { text: 'text-orange-700', hoverBg: 'hover:bg-orange-50', iconBg: 'bg-orange-100', border: 'border-orange-200' },
      blue: { text: 'text-blue-700', hoverBg: 'hover:bg-blue-50', iconBg: 'bg-blue-100', border: 'border-blue-200' },
      green: { text: 'text-green-700', hoverBg: 'hover:bg-green-50', iconBg: 'bg-green-100', border: 'border-green-200' },
      pink: { text: 'text-pink-700', hoverBg: 'hover:bg-pink-50', iconBg: 'bg-pink-100', border: 'border-pink-200' },
      emerald: { text: 'text-emerald-700', hoverBg: 'hover:bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-200' },
    }
    return map[color] || map.blue
  }

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
              <svg
                width="36"
                height="36"
                viewBox="0 0 48 48"
                fill="none"
                className="flex-shrink-0"
              >
                <defs>
                  <linearGradient id="headerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E86B4B" />
                    <stop offset="50%" stopColor="#D4553A" />
                    <stop offset="100%" stopColor="#C24B2A" />
                  </linearGradient>
                  <linearGradient id="headerAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#headerLogoGrad)" />
                <path d="M24 10L9 22.5H13.5V36H34.5V22.5H39L24 10Z" fill="white" fillOpacity="0.95" />
                <path d="M21.5 24.5C21.5 22.57 23.07 21 25 21C26.38 21 27.56 21.82 28.1 22.99L31.5 20.5L32.5 21.5L29.1 24.01C29.37 24.48 29.5 25.02 29.5 25.5C29.5 27.43 27.93 29 26 29C24.62 29 23.44 28.18 22.9 27.01L19.5 29.5L18.5 28.5L21.9 25.99C21.63 25.52 21.5 24.98 21.5 24.5Z" fill="#E86B4B" />
                <rect x="21.5" y="29.5" width="5" height="6.5" rx="1.5" fill="#E86B4B" fillOpacity="0.25" />
                <circle cx="39" cy="9" r="5" fill="url(#headerAccent)" />
                <path d="M37.5 9L38.5 10L40.5 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline text-xl font-heading font-extrabold tracking-tight text-gray-900 group-hover/logo:text-gray-700 transition-colors duration-200">
                Services<span className="text-clay-400 group-hover/logo:text-clay-300 transition-colors duration-200">Artisans</span>
              </span>
            </div>
          </Link>

          {/* Quick Search - Combined single-field search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
            {mounted ? (
              <QuickSearch />
            ) : (
              <div className="w-full rounded-full border border-gray-200 bg-gray-50 h-[38px] animate-pulse" />
            )}
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-0.5" aria-label="Navigation principale">
            {/* Services Dropdown Trigger */}
            <div
              className="relative"
              onMouseEnter={() => openMenuOnHover('services')}
              onMouseLeave={closeMenusWithDelay}
            >
              <button
                type="button"
                data-menu-trigger="services"
                onClick={() => toggleMenu('services')}
                aria-expanded={openMenu === 'services'}
                aria-haspopup="true"
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-[0.9rem] transition-all duration-200',
                  'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-clay-400 after:transition-all after:duration-300 after:rounded-full',
                  openMenu === 'services'
                    ? 'text-clay-400 bg-[#FDF1EC]/80 after:w-[60%]'
                    : 'text-gray-600 hover:text-clay-400 hover:bg-gray-50/80 after:w-0 hover:after:w-[60%]'
                )}
              >
                Services
                <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', openMenu === 'services' && 'rotate-180')} />
              </button>
            </div>

            {/* Villes Dropdown Trigger */}
            <div
              className="relative"
              onMouseEnter={() => openMenuOnHover('villes')}
              onMouseLeave={closeMenusWithDelay}
            >
              <button
                type="button"
                data-menu-trigger="villes"
                onClick={() => toggleMenu('villes')}
                aria-expanded={openMenu === 'villes'}
                aria-haspopup="true"
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-[0.9rem] transition-all duration-200',
                  'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-clay-400 after:transition-all after:duration-300 after:rounded-full',
                  openMenu === 'villes'
                    ? 'text-clay-400 bg-[#FDF1EC]/80 after:w-[60%]'
                    : 'text-gray-600 hover:text-clay-400 hover:bg-gray-50/80 after:w-0 hover:after:w-[60%]'
                )}
              >
                Villes
                <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', openMenu === 'villes' && 'rotate-180')} />
              </button>
            </div>

            {/* Régions Dropdown Trigger */}
            <div
              className="relative"
              onMouseEnter={() => openMenuOnHover('regions')}
              onMouseLeave={closeMenusWithDelay}
            >
              <button
                type="button"
                data-menu-trigger="regions"
                onClick={() => toggleMenu('regions')}
                aria-expanded={openMenu === 'regions'}
                aria-haspopup="true"
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-[0.9rem] transition-all duration-200',
                  'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-clay-400 after:transition-all after:duration-300 after:rounded-full',
                  openMenu === 'regions'
                    ? 'text-clay-400 bg-[#FDF1EC]/80 after:w-[60%]'
                    : 'text-gray-600 hover:text-clay-400 hover:bg-gray-50/80 after:w-0 hover:after:w-[60%]'
                )}
              >
                Régions
                <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', openMenu === 'regions' && 'rotate-180')} />
              </button>
            </div>

            {/* Plus dropdown — Avis, Tarifs, Guides, Blog */}
            <div
              className="relative"
              onMouseEnter={() => openMenuOnHover('plus')}
              onMouseLeave={closeMenusWithDelay}
            >
              <button
                type="button"
                onClick={() => toggleMenu('plus')}
                aria-expanded={openMenu === 'plus'}
                aria-haspopup="true"
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-[0.9rem] transition-all duration-200',
                  'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:bg-clay-400 after:transition-all after:duration-300 after:rounded-full',
                  openMenu === 'plus'
                    ? 'text-clay-400 bg-[#FDF1EC]/80 after:w-[60%]'
                    : 'text-gray-600 hover:text-clay-400 hover:bg-gray-50/80 after:w-0 hover:after:w-[60%]'
                )}
              >
                Plus
                <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', openMenu === 'plus' && 'rotate-180')} />
              </button>
              {openMenu === 'plus' && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <Link href="/avis" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-clay-400 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>Avis artisans</Link>
                  <Link href="/tarifs" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-clay-400 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>Tarifs</Link>
                  <Link href="/guides" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-clay-400 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>Guides pratiques</Link>
                  <Link href="/blog" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-clay-400 hover:bg-gray-50 transition-colors" onClick={() => setOpenMenu(null)}>Blog</Link>
                </div>
              )}
            </div>

            {/* Favoris */}
            <Link
              href="/mes-favoris"
              className="relative text-gray-600 hover:text-red-500 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-red-50/80"
              aria-label={`Mes favoris${favoritesCount > 0 ? ` (${favoritesCount})` : ''}`}
              title="Mes favoris"
            >
              <Heart className="w-5 h-5" />
              {mounted && favoritesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>

            <Link
              href="/connexion"
              className="relative text-gray-600 hover:text-clay-400 px-4 py-2 rounded-xl font-medium text-[0.9rem] hover:bg-gray-50/80 transition-all duration-200 after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-0 hover:after:w-[60%] after:h-[2px] after:bg-clay-400 after:transition-all after:duration-300 after:rounded-full"
            >
              Connexion
            </Link>

            <Link
              href="/urgence"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-200"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              Urgences 24h
            </Link>

            <Link
              href="/devis"
              className="ml-3 px-5 py-2.5 bg-gradient-to-r from-clay-400 to-clay-600 hover:from-clay-500 hover:to-clay-700 text-white font-semibold rounded-xl shadow-md shadow-clay-400/20 hover:shadow-lg hover:shadow-clay-400/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Devis gratuit
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
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

      {/* ==================== MEGA MENU DROPDOWNS (Full-width) ==================== */}
      {mounted && openMenu && (
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
              data-menu-content="services" role="menu" aria-label="Services artisans"
              className="absolute left-0 right-0 bg-white border-t border-gray-100 shadow-2xl rounded-b-xl"
              style={{ zIndex: 9995 }}
              onMouseEnter={() => openMenuOnHover('services')}
              onMouseLeave={closeMenusWithDelay}
            >
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-8 py-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-heading font-bold text-lg">Tous nos services artisans</h3>
                    <p className="text-slate-300 text-sm mt-0.5">{allServices.length} métiers, des milliers d&apos;artisans qualifiés partout en France</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-white/80 bg-white/10 px-4 py-2 rounded-lg">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>{artisanCount > 0 ? `${artisanCount.toLocaleString('fr-FR')}+` : 'Des milliers d\'artisans'} référencés</span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8">
                  <div className="grid grid-cols-3 xl:grid-cols-6 gap-6">
                    {serviceCategories.map((cat) => {
                      const CatIcon = cat.icon
                      const colors = getCategoryColors(cat.color)
                      const isUrgent = cat.color === 'red'
                      return (
                        <div key={cat.category} className="space-y-3">
                          {/* Category header */}
                          <div className={`flex items-center gap-2.5 pb-3 border-b ${colors.border}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.iconBg}`}>
                              <CatIcon className={`w-[18px] h-[18px] ${colors.text}`} />
                            </div>
                            <div>
                              <span className={`font-heading font-bold text-sm ${colors.text}`}>
                                {cat.category}
                              </span>
                              {isUrgent && (
                                <span className="ml-1.5 inline-flex items-center text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  24h/24
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Service links */}
                          <div className="space-y-0.5">
                            {cat.services.map((service) => {
                              const Icon = service.icon
                              return (
                                <Link
                                  key={`${cat.category}-${service.slug}`}
                                  href={`/services/${service.slug}`}
                                  onClick={closeMenus}
                                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group/link ${colors.hoverBg} hover:shadow-sm`}
                                >
                                  <Icon className="w-4 h-4 text-slate-400 group-hover/link:text-blue-600 transition-colors duration-200" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-700 group-hover/link:text-blue-600 transition-colors duration-200">
                                      {service.name}
                                    </div>
                                    <div className="text-xs text-slate-400 truncate">{service.description}</div>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200" />
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href="/services"
                      onClick={closeMenus}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group/cta transition-colors"
                    >
                      Voir tous les services
                      <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform duration-200" />
                    </Link>
                    <Link
                      href="/urgence"
                      onClick={closeMenus}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-semibold transition-all duration-200 hover:shadow-md"
                    >
                      <Phone className="w-4 h-4" />
                      Urgence ? Artisan disponible maintenant
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== VILLES MEGA MENU ===== */}
          {openMenu === 'villes' && (
            <div
              data-menu-content="villes" role="menu" aria-label="Villes"
              className="absolute left-0 right-0 bg-white border-t border-gray-100 shadow-2xl rounded-b-xl"
              style={{ zIndex: 9995 }}
              onMouseEnter={() => openMenuOnHover('villes')}
              onMouseLeave={closeMenusWithDelay}
            >
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-8 py-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-heading font-bold text-lg">Trouvez un artisan par ville</h3>
                    <p className="text-slate-300 text-sm mt-0.5">{villes.length} villes couvertes dans toute la France</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <Link
                      href="/regions"
                      onClick={closeMenus}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Map className="w-4 h-4" />
                      Voir par région
                    </Link>
                    <Link
                      href="/departements"
                      onClick={closeMenus}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <MapPin className="w-4 h-4" />
                      Par département
                    </Link>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {citiesByRegion.map((group) => (
                      <div key={group.region}>
                        {/* Region label */}
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                          <Globe className="w-4 h-4 text-blue-500" />
                          <span className="font-heading font-bold text-xs text-slate-500 uppercase tracking-wider">{group.region}</span>
                        </div>
                        {/* Cities */}
                        <div className="space-y-0.5">
                          {group.cities.map((city) => (
                            <Link
                              key={city.slug}
                              href={`/villes/${city.slug}`}
                              onClick={closeMenus}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-all duration-200 group/city"
                            >
                              <div className="flex items-center gap-2.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-300 group-hover/city:text-blue-500 transition-colors" />
                                <span className="text-sm font-medium text-slate-700 group-hover/city:text-blue-600 transition-colors">
                                  {city.name}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 bg-slate-50 group-hover/city:bg-blue-100 group-hover/city:text-blue-600 px-2 py-0.5 rounded-full transition-colors">
                                {city.population}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href="/villes"
                      onClick={closeMenus}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group/cta transition-colors"
                    >
                      Voir toutes les villes
                      <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform duration-200" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      Artisans référencés dans chaque ville
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== RÉGIONS MEGA MENU ===== */}
          {openMenu === 'regions' && (
            <div
              data-menu-content="regions" role="menu" aria-label="Régions"
              className="absolute left-0 right-0 bg-white border-t border-gray-100 shadow-2xl rounded-b-xl"
              style={{ zIndex: 9995 }}
              onMouseEnter={() => openMenuOnHover('regions')}
              onMouseLeave={closeMenusWithDelay}
            >
              <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-8 py-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-heading font-bold text-lg">Régions de France</h3>
                    <p className="text-slate-300 text-sm mt-0.5">{regions.length} régions, {departements.length} départements couverts</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <Link
                      href="/departements"
                      onClick={closeMenus}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <MapPin className="w-4 h-4" />
                      Tous les départements
                    </Link>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8">
                  {/* Metropolitan France */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Map className="w-4 h-4 text-blue-600" />
                      <h4 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">France métropolitaine</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {metroRegions.map((region) => (
                        <Link
                          key={region.slug}
                          href={`/regions/${region.slug}`}
                          onClick={closeMenus}
                          className="group/region flex items-start gap-3 p-4 bg-slate-50/80 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-200 transition-all duration-200 hover:shadow-md"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white group-hover/region:bg-blue-100 border border-slate-200 group-hover/region:border-blue-300 flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-sm">
                            <Map className="w-5 h-5 text-slate-400 group-hover/region:text-blue-600 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 group-hover/region:text-blue-700 transition-colors truncate">
                              {region.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {region.departments.length} département{region.departments.length > 1 ? 's' : ''}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* DOM-TOM */}
                  {domTomRegions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">Outre-mer</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {domTomRegions.map((region) => (
                          <Link
                            key={region.slug}
                            href={`/regions/${region.slug}`}
                            onClick={closeMenus}
                            className="group/region flex items-center gap-3 p-3 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-200 transition-all duration-200"
                          >
                            <Globe className="w-4 h-4 text-emerald-400 group-hover/region:text-emerald-600 transition-colors flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-700 group-hover/region:text-emerald-700 transition-colors truncate">
                                {region.name}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href="/regions"
                      onClick={closeMenus}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group/cta transition-colors"
                    >
                      Voir toutes les régions
                      <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform duration-200" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Star className="w-4 h-4 text-amber-500" />
                      Couverture nationale complète
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== MOBILE MENU ==================== */}
      {isMenuOpen && (
        <div
          data-menu-content="mobile-menu"
          className="lg:hidden border-t border-gray-100/50 max-h-[calc(100vh-120px)] overflow-y-auto bg-white/95 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            {/* Search Mobile - Dual Field */}
            <form
              onSubmit={handleSearch}
              className="mb-4"
            >
              <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-clay-400 focus-within:shadow-lg focus-within:shadow-clay-400/10 transition-all duration-200">
                {/* Service Input Mobile */}
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

                {/* Separator */}
                <div className="w-px h-7 bg-gray-200" />

                {/* Location Input Mobile */}
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
                  {/* Geolocation Button Mobile */}
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

                {/* Search Button Mobile */}
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
                                onClick={() => { setIsMenuOpen(false); setMobileAccordion(null) }}
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
                      onClick={() => { setIsMenuOpen(false); setMobileAccordion(null) }}
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
                          onClick={() => { setIsMenuOpen(false); setMobileAccordion(null) }}
                        >
                          <MapPin className="w-3 h-3" />
                          {city.name}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/villes"
                      className="flex items-center gap-2 text-blue-600 text-sm font-semibold mt-3 px-1"
                      onClick={() => { setIsMenuOpen(false); setMobileAccordion(null) }}
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
                          onClick={() => { setIsMenuOpen(false); setMobileAccordion(null) }}
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
                      onClick={() => { setIsMenuOpen(false); setMobileAccordion(null) }}
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
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-sm text-slate-700">Avis</span>
                </Link>
                <Link
                  href="/tarifs"
                  className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-sm text-slate-700">Tarifs</span>
                </Link>
                <Link
                  href="/guides"
                  className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-sm text-slate-700">Guides</span>
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm text-slate-700">Blog</span>
                </Link>
              </div>

              {/* CTAs */}
              <div className="pt-3 space-y-3">
                {/* Favoris mobile */}
                <Link
                  href="/mes-favoris"
                  className="flex items-center justify-center gap-2 w-full py-3 border-2 border-red-100 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
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
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Phone className="w-5 h-5" />
                  Urgences 24h/24
                </Link>
                <div className="flex gap-3">
                  <Link
                    href="/connexion"
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium text-center hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/devis"
                    className="flex-1 py-3 bg-gradient-to-r from-clay-400 to-clay-600 hover:from-clay-500 hover:to-clay-700 text-white rounded-xl font-semibold text-center shadow-md shadow-clay-400/20 transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Devis gratuit
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
    {/* Spacer to offset fixed header height (nav 64px) */}
    <div className="h-16" aria-hidden="true" />
    </>
  )
}
