import {
  Clock, Wrench, Key, Zap, Flame, Wind, HardHat, Home, Hammer,
  PaintBucket, Sparkles, Layers, ChefHat, Brush, TreeDeciduous,
  type LucideIcon
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────

export interface ServiceItem {
  name: string
  slug: string
  icon: LucideIcon
  description: string
  urgent?: boolean
}

export interface ServiceCategory {
  category: string
  color: string
  icon: LucideIcon
  services: ServiceItem[]
}

export interface CityMenuItem { name: string; slug: string; population: string }
export interface RegionCities { region: string; cities: CityMenuItem[] }
export interface PopularCity { name: string; slug: string }
export interface MetroRegion { slug: string; name: string; states: { name: string; code: string; slug: string }[] }
export interface DomTomRegion { slug: string; name: string; states?: { name: string; code: string; slug: string }[] }

export type MenuType = 'services' | 'cities' | 'regions' | 'plus' | null
export type MobileAccordion = 'services' | 'cities' | 'regions' | null

// ── Constants ──────────────────────────────────────────

export const serviceCategories: ServiceCategory[] = [
  {
    category: 'Personal Injury',
    color: 'red',
    icon: Clock,
    services: [
      { name: 'Car Accident', slug: 'car-accident-lawyer', icon: Wrench, description: 'Auto collision claims', urgent: true },
      { name: 'Medical Malpractice', slug: 'medical-malpractice-lawyer', icon: Key, description: 'Healthcare negligence', urgent: true },
      { name: 'Slip & Fall', slug: 'slip-and-fall-lawyer', icon: Zap, description: 'Premises liability claims', urgent: true },
    ]
  },
  {
    category: 'Family Law',
    color: 'orange',
    icon: Flame,
    services: [
      { name: 'Divorce', slug: 'divorce-lawyer', icon: Flame, description: 'Divorce & separation' },
      { name: 'Child Custody', slug: 'child-custody-lawyer', icon: Wind, description: 'Custody & visitation' },
    ]
  },
  {
    category: 'Criminal Defense',
    color: 'blue',
    icon: HardHat,
    services: [
      { name: 'DUI Defense', slug: 'dui-lawyer', icon: HardHat, description: 'DUI & DWI charges' },
      { name: 'Drug Crimes', slug: 'drug-crimes-lawyer', icon: Home, description: 'Drug offense defense' },
      { name: 'White Collar', slug: 'white-collar-crime-lawyer', icon: Hammer, description: 'Fraud & financial crimes' },
    ]
  },
  {
    category: 'Business Law',
    color: 'green',
    icon: PaintBucket,
    services: [
      { name: 'Corporate', slug: 'corporate-lawyer', icon: PaintBucket, description: 'Business formation & compliance' },
      { name: 'Real Estate', slug: 'real-estate-lawyer', icon: Sparkles, description: 'Property transactions' },
      { name: 'Employment', slug: 'employment-lawyer', icon: Layers, description: 'Workplace disputes' },
    ]
  },
  {
    category: 'Estate Planning',
    color: 'pink',
    icon: ChefHat,
    services: [
      { name: 'Wills & Trusts', slug: 'estate-planning-lawyer', icon: ChefHat, description: 'Estate planning & probate' },
      { name: 'Bankruptcy', slug: 'bankruptcy-lawyer', icon: Brush, description: 'Debt relief & restructuring' },
    ]
  },
  {
    category: 'Immigration',
    color: 'emerald',
    icon: TreeDeciduous,
    services: [
      { name: 'Immigration', slug: 'immigration-lawyer', icon: TreeDeciduous, description: 'Visas, green cards & citizenship' },
    ]
  },
]

// ── Helpers ─────────────────────────────────────────────

export function getCategoryColors(color: string) {
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

// TODO: Replace with US geocoding service (e.g., Census Geocoder, Google Maps, or Mapbox)
// The previous implementation used the French government API (api-adresse.data.gouv.fr)
export async function getLocationFromCoords(_lon: number, _lat: number): Promise<string | null> {
  return null
}
