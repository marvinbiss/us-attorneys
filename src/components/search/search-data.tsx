import { searchCities as cities } from '@/lib/data/usa-search-data'
import type { SearchCity as City } from '@/lib/data/usa-search-data'
import { Wrench, Zap, Key, Flame, PaintBucket, Hammer, Grid3X3, Home, TreeDeciduous } from 'lucide-react'

// ── Icon map ─────────────────────────────────────────────────────────
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench, Zap, Key, Flame, PaintBucket, Hammer, Grid3X3, Home, TreeDeciduous
}

// ── Services ─────────────────────────────────────────────────────────
export const services = [
  { name: 'Personal Injury', slug: 'personal-injury', icon: 'Wrench', color: 'from-blue-500 to-blue-600', searches: '15k/mo', urgent: true },
  { name: 'Criminal Defense', slug: 'criminal-defense', icon: 'Zap', color: 'from-amber-500 to-amber-600', searches: '12k/mo', urgent: true },
  { name: 'Family Law', slug: 'family-law', icon: 'Key', color: 'from-slate-600 to-slate-700', searches: '9k/mo', urgent: true },
  { name: 'Immigration', slug: 'immigration', icon: 'Flame', color: 'from-orange-500 to-orange-600', searches: '7k/mo', urgent: false },
  { name: 'Real Estate', slug: 'real-estate', icon: 'PaintBucket', color: 'from-purple-500 to-purple-600', searches: '6k/mo', urgent: false },
  { name: 'Employment Law', slug: 'employment-law', icon: 'Hammer', color: 'from-amber-600 to-amber-700', searches: '5k/mo', urgent: false },
  { name: 'Estate Planning', slug: 'estate-planning', icon: 'Grid3X3', color: 'from-teal-500 to-teal-600', searches: '4k/mo', urgent: false },
  { name: 'Bankruptcy', slug: 'bankruptcy', icon: 'Home', color: 'from-red-500 to-red-600', searches: '4k/mo', urgent: false },
  { name: 'Business Law', slug: 'business-law', icon: 'Wrench', color: 'from-stone-500 to-stone-600', searches: '3k/mo', urgent: false },
  { name: 'Tax Law', slug: 'tax-law', icon: 'TreeDeciduous', color: 'from-green-500 to-green-600', searches: '3k/mo', urgent: false },
]

export type Service = typeof services[number]

// ── Normalize text (strip accents, lowercase) ───────────────────────
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// ── Format population for display ───────────────────────────────────
export function formatPopulation(pop: string): string {
  const cleaned = pop.replace(/\s/g, '')
  const num = parseInt(cleaned, 10)
  if (isNaN(num)) return pop
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.0', '')}M pop.`
  if (num >= 1_000) return `${Math.round(num / 1_000).toLocaleString('en-US')}k pop.`
  return `${num.toLocaleString('en-US')} pop.`
}

// ── Fuzzy city search with prioritized matching ─────────────────────
export function searchCities(query: string, limit = 8): City[] {
  if (!query || query.length < 2) return []

  const normalized = normalizeText(query)

  const prefixMatches: City[] = []
  const containsMatches: City[] = []
  const postalMatches: City[] = []
  const deptMatches: City[] = []

  for (const v of cities) {
    const normalizedName = normalizeText(v.name)

    if (normalizedName.startsWith(normalized)) {
      prefixMatches.push(v)
    } else if (normalizedName.includes(normalized)) {
      containsMatches.push(v)
    } else if (v.zipCode.startsWith(query.trim())) {
      postalMatches.push(v)
    } else if (normalizeText(v.stateName).includes(normalized)) {
      deptMatches.push(v)
    }
  }

  const sortByPop = (a: City, b: City) => {
    const popA = parseInt(a.population.replace(/\s/g, ''), 10) || 0
    const popB = parseInt(b.population.replace(/\s/g, ''), 10) || 0
    return popB - popA
  }

  prefixMatches.sort(sortByPop)
  containsMatches.sort(sortByPop)
  postalMatches.sort(sortByPop)
  deptMatches.sort(sortByPop)

  return [...prefixMatches, ...containsMatches, ...postalMatches, ...deptMatches].slice(0, limit)
}

// ── Highlight matching text in a city name ──────────────────────────
export function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>

  const normalizedQuery = normalizeText(query)
  const normalizedText = normalizeText(text)
  const matchIndex = normalizedText.indexOf(normalizedQuery)

  if (matchIndex === -1) return <>{text}</>

  const before = text.slice(0, matchIndex)
  const match = text.slice(matchIndex, matchIndex + query.length)
  const after = text.slice(matchIndex + query.length)

  return (
    <>
      {before}
      <span className="font-bold text-blue-600">{match}</span>
      {after}
    </>
  )
}

// ── Recent searches (localStorage) ──────────────────────────────────
const RECENT_KEY = 'sa-recent-searches'

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5)
  } catch {
    return []
  }
}

export function addRecentSearch(city: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentSearches().filter(s => s !== city)
    recent.unshift(city)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)))
  } catch {
    // localStorage may be full or disabled
  }
}

export function removeRecentSearch(city: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentSearches().filter(s => s !== city)
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch {
    // ignore
  }
}

// ── Large fallback cities for "no match" state ──────────────────────
export const fallbackCities = [
  { name: 'New York', dept: 'NY' },
  { name: 'Los Angeles', dept: 'CA' },
  { name: 'Chicago', dept: 'IL' },
  { name: 'Houston', dept: 'TX' },
  { name: 'Phoenix', dept: 'AZ' },
  { name: 'Miami', dept: 'FL' },
]

// ── Popular cities for empty state ──────────────────────────────────
export const popularCities = [
  { name: 'New York', slug: 'new-york', stateName: 'New York (NY)', pop: '8.3M' },
  { name: 'Los Angeles', slug: 'los-angeles', stateName: 'California (CA)', pop: '3.9M' },
  { name: 'Chicago', slug: 'chicago', stateName: 'Illinois (IL)', pop: '2.7M' },
  { name: 'Houston', slug: 'houston', stateName: 'Texas (TX)', pop: '2.3M' },
  { name: 'Phoenix', slug: 'phoenix', stateName: 'Arizona (AZ)', pop: '1.6M' },
  { name: 'Miami', slug: 'miami', stateName: 'Florida (FL)', pop: '442k' },
  { name: 'Dallas', slug: 'dallas', stateName: 'Texas (TX)', pop: '1.3M' },
  { name: 'San Francisco', slug: 'san-francisco', stateName: 'California (CA)', pop: '874k' },
]

// ── Dropdown animation variants ─────────────────────────────────────
export const dropdownVariants = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
}
