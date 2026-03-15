import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { services, cities } from '@/lib/data/usa'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price with currency
export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Format date in French
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(new Date(date))
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return formatDate(date, { day: 'numeric', month: 'short' })
}

// Slugify string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Static slug lookup maps — prefer canonical slugs from france.ts over dynamic slugification
const _normalize = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const _serviceMap = new Map(services.map(s => [_normalize(s.name), s.slug]))
// Also map slug → slug for direct matches (provider specialty may already be a slug)
services.forEach(s => { if (!_serviceMap.has(s.slug)) _serviceMap.set(s.slug, s.slug) })
const _villeMap = new Map(cities.map(v => [_normalize(v.name), v.slug]))

// Reverse mapping: provider specialty variants → canonical service slug
// Covers cases where provider.specialty is a synonym (e.g., "peintre" → "peintre-en-batiment")
const _specialtyToServiceSlug: Record<string, string> = {
  'peintre': 'peintre-en-batiment',
  'platrier': 'platrier',
  'plaquiste': 'platrier',
  'platrerie': 'platrier',
  'finition': 'peintre-en-batiment',
  'menuisier-metallique': 'serrurier',
  'charpentier': 'charpentier',
  'isolation': 'isolation-thermique',
  'couvreur-zingueur': 'zingueur',
  'etancheite': 'etancheiste',
  'facade': 'facadier',
  'ravalement': 'facadier',
  'metallerie': 'metallier',
  'ferronnerie': 'ferronnier',
  'parqueteur': 'poseur-de-parquet',
  'moquettiste': 'solier',
  'store': 'storiste',
  'volet': 'storiste',
  'installateur-de-cuisine': 'cuisiniste',
  'installateur-de-salle-de-bain': 'salle-de-bain',
  'architecte-d-interieur': 'architecte-interieur',
  'decoration': 'decorateur',
  'peintre-decorateur': 'decorateur',
  'domotique': 'domoticien',
  'pac': 'pompe-a-chaleur',
  'photovoltaique': 'panneaux-solaires',
  'solaire': 'panneaux-solaires',
  'ite': 'isolation-thermique',
  'iti': 'isolation-thermique',
  'rge': 'renovation-energetique',
  'borne-electrique': 'borne-recharge',
  'ramonage': 'ramoneur',
  'amenagement-exterieur': 'paysagiste',
  'piscine': 'pisciniste',
  'alarme': 'alarme-securite',
  'securite': 'alarme-securite',
  'videosurveillance': 'alarme-securite',
  'antenne': 'antenniste',
  'ascenseur': 'ascensoriste',
  'diagnostic': 'diagnostiqueur',
  'dpe': 'diagnostiqueur',
  'geometre-expert': 'geometre',
  'desinsectiseur': 'desinsectisation',
  'nuisibles': 'desinsectisation',
  'deratiseur': 'deratisation',
  'demenagement': 'demenageur',
  'nettoyage-professionnel': 'nettoyage',
  'terrassement': 'terrassier',
}

// Generate SEO-friendly artisan URL using static slug lookup
export function getAttorneyUrl(artisan: {
  stable_id?: string | null
  slug?: string | null
  specialty?: string | null
  city?: string | null
}): string {
  const normalized = _normalize(artisan.specialty || '')
  const specialtySlug = _serviceMap.get(normalized) || _specialtyToServiceSlug[normalized] || slugify(artisan.specialty || 'attorney')
  const locationSlug = _villeMap.get(_normalize(artisan.city || '')) || slugify(artisan.city || 'france')
  const id = artisan.slug || artisan.stable_id || ''
  return `/practice-areas/${specialtySlug}/${locationSlug}/${id}`
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Deterministic avatar gradient color based on name
const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-violet-500 to-violet-600',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
  'from-teal-500 to-teal-600',
  'from-indigo-500 to-indigo-600',
  'from-cyan-500 to-cyan-600',
  'from-orange-500 to-orange-600',
  'from-fuchsia-500 to-fuchsia-600',
  'from-lime-500 to-lime-600',
  'from-sky-500 to-sky-600',
]

export function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate US phone number
export function isValidUSPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, '')
  const phoneRegex = /^(?:\+1)?[2-9]\d{2}[2-9]\d{6}$/
  return phoneRegex.test(cleaned)
}

// Format US phone number
export function formatUSPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

// Validate SIRET
export function isValidSIRET(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '')
  if (!/^\d{14}$/.test(cleaned)) return false

  // Luhn algorithm for SIRET
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Get rating color
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600'
  if (rating >= 4) return 'text-green-500'
  if (rating >= 3.5) return 'text-yellow-500'
  if (rating >= 3) return 'text-orange-500'
  return 'text-red-500'
}

// Parse query string
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

// Web Vitals reporting
export interface WebVitalMetric {
  id: string
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

export function reportWebVitals(metric: WebVitalMetric): void {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp: Date.now(),
    })

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body)
    }
  } else {
    // Log to console in development
    console.log(`[Web Vitals] ${metric.name}: ${metric.value} (${metric.rating})`)
  }
}

// Performance timing utilities
export function measurePerformance(name: string): () => void {
  const start = performance.now()
  return () => {
    const duration = performance.now() - start
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    }
  }
}

// Lazy load images with IntersectionObserver
export function lazyLoadImages(selector = 'img[data-src]'): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

  const images = document.querySelectorAll<HTMLImageElement>(selector)

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
          }
          observer.unobserve(img)
        }
      })
    },
    { rootMargin: '200px' }
  )

  images.forEach((img) => observer.observe(img))
}

// Preload critical resources
export function preloadResource(url: string, as: 'script' | 'style' | 'image' | 'font'): void {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = url
  link.as = as
  if (as === 'font') {
    link.crossOrigin = 'anonymous'
  }
  document.head.appendChild(link)
}
