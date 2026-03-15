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

export async function getLocationFromCoords(lon: number, lat: number): Promise<string | null> {
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
