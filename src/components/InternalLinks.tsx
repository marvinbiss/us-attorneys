import Link from 'next/link'
import {
  MapPin,
  Wrench,
  Zap,
  Key,
  Flame,
  PaintBucket,
  Hammer,
  HardHat,
  ArrowRight,
  Star,
  Users,
  Building2,
  TreeDeciduous,
  Shovel,
  Axe,
  Droplets,
  Shield,
  Building,
  Paintbrush,
  Construction,
  Link as LinkIcon,
  Grid3X3,
  Maximize,
  PanelTop,
  Bath,
  Ruler,
  Palette,
  Cpu,
  Thermometer,
  Sun,
  Snowflake,
  Leaf,
  PlugZap,
  Factory,
  Trees,
  Waves,
  ShieldAlert,
  Radio,
  ArrowUpDown,
  ClipboardCheck,
  Bug,
  Truck,
  Home,
  Wind,
  ChefHat,
  Layers,
  Sparkles,
  Square,
} from 'lucide-react'
import {
  popularServices as popularServicesData,
  popularCities,
  popularRegions,
} from '@/lib/constants/navigation'
import { cities, services, usRegions } from '@/lib/data/usa'

// Re-export for backward compatibility
export { popularCities, popularRegions }

// Add icons to services for client components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Zap,
  Key,
  Flame,
  PaintBucket,
  Hammer,
  HardHat,
  TreeDeciduous,
  Shovel,
  Axe,
  Droplets,
  Shield,
  Building,
  Paintbrush,
  Construction,
  Link: LinkIcon,
  Grid3X3,
  Maximize,
  PanelTop,
  Bath,
  Ruler,
  Palette,
  Cpu,
  Thermometer,
  Sun,
  Snowflake,
  Leaf,
  PlugZap,
  Factory,
  Trees,
  Waves,
  ShieldAlert,
  Radio,
  ArrowUpDown,
  ClipboardCheck,
  Bug,
  Truck,
  Home,
  Wind,
  ChefHat,
  Layers,
  Sparkles,
  Square,
  Blocks: Grid3X3,
}

export const popularServices = popularServicesData.map((s) => ({
  ...s,
  icon: iconMap[s.icon] || Wrench,
}))

// Component: Popular services
export function PopularServicesLinks({
  limit = 8,
  showTitle = true,
  className = '',
}: {
  limit?: number
  showTitle?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      {showTitle && (
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <Star className="h-4 w-4 text-amber-500" />
          Popular services
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {popularServices.slice(0, limit).map((service) => {
          const Icon = service.icon
          return (
            <Link
              key={service.slug}
              href={`/practice-areas/${service.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-[#FDF1EC] hover:text-clay-400"
            >
              <Icon className="h-3.5 w-3.5" />
              {service.name}
            </Link>
          )
        })}
      </div>
      <Link
        href="/practice-areas"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-clay-400 hover:text-clay-600"
      >
        All {services.length} practice areas <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// Component: Popular cities
export function PopularCitiesLinks({
  limit = 10,
  showTitle = true,
  className = '',
}: {
  limit?: number
  showTitle?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      {showTitle && (
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <MapPin className="h-4 w-4 text-clay-400" />
          Popular cities
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {popularCities.slice(0, limit).map((city) => (
          <Link
            key={city.slug}
            href={`/cities/${city.slug}`}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-[#FDF1EC] hover:text-clay-400"
          >
            {city.name}
          </Link>
        ))}
      </div>
      <Link
        href="/cities"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-clay-400 hover:text-clay-600"
      >
        Attorneys in {cities.length} cities <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// Component: Geographic navigation
export function GeographicNavigation({ className = '' }: { className?: string }) {
  return (
    <nav
      aria-label="Browse attorneys by geography"
      className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`}
    >
      <Link
        href="/regions"
        className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-clay-300 hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDF1EC] transition-colors group-hover:bg-clay-100">
          <Building2 className="h-5 w-5 text-clay-400" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 group-hover:text-clay-400">By region</div>
          <div className="text-sm text-gray-500">{usRegions.length} regions</div>
        </div>
      </Link>
      <Link
        href="/states"
        className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-clay-300 hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 transition-colors group-hover:bg-green-200">
          <MapPin className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 group-hover:text-green-600">By state</div>
          <div className="text-sm text-gray-500">50 states + DC</div>
        </div>
      </Link>
      <Link
        href="/cities"
        className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-clay-300 hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 transition-colors group-hover:bg-amber-200">
          <Users className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 group-hover:text-amber-600">By city</div>
          <div className="text-sm text-gray-500">{cities.length} cities</div>
        </div>
      </Link>
    </nav>
  )
}

// Component: Popular service x city cross-links (homepage SEO)
export function PopularServiceCityLinks({
  limit = 12,
  showTitle = true,
  className = '',
}: {
  limit?: number
  showTitle?: boolean
  className?: string
}) {
  const topCombos = popularServices.slice(0, 4).flatMap((service) =>
    popularCities.slice(0, 3).map((city) => ({
      label: `${service.name} ${city.name}`,
      href: `/practice-areas/${service.slug}/${city.slug}`,
    }))
  )

  return (
    <div className={className}>
      {showTitle && (
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <Wrench className="h-4 w-4 text-clay-400" />
          Popular searches
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {topCombos.slice(0, limit).map((combo) => (
          <Link
            key={combo.href}
            href={combo.href}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-[#FDF1EC] hover:text-clay-400"
          >
            {combo.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Component: Service-city matrix (cross-links)
export function ServiceCityMatrix({
  service,
  cities = popularCities.slice(0, 6),
  className = '',
}: {
  service: string
  cities?: typeof popularCities
  className?: string
}) {
  const specialtyData = popularServices.find((s) => s.slug === service)
  if (!specialtyData) return null

  return (
    <div className={className}>
      <h3 className="mb-3 font-semibold text-gray-900">{specialtyData.name} by city</h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/practice-areas/${service}/${city.slug}`}
            className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-[#FDF1EC] hover:text-clay-400"
          >
            {specialtyData.name} {city.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Component: Quick links for dashboards
export function QuickSiteLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-gray-50 p-4 ${className}`}>
      <h4 className="mb-3 font-medium text-gray-900">Browse the site</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Link href="/" className="py-1 text-gray-600 hover:text-clay-400">
          Home
        </Link>
        <Link href="/practice-areas" className="py-1 text-gray-600 hover:text-clay-400">
          {services.length} practice areas
        </Link>
        <Link href="/cities" className="py-1 text-gray-600 hover:text-clay-400">
          {cities.length} cities
        </Link>
        <Link href="/regions" className="py-1 text-gray-600 hover:text-clay-400">
          By region
        </Link>
        <Link href="/search" className="py-1 text-gray-600 hover:text-clay-400">
          Search
        </Link>
        <Link href="/quotes" className="py-1 text-gray-600 hover:text-clay-400">
          Request a consultation
        </Link>
        <Link href="/how-it-works" className="py-1 text-gray-600 hover:text-clay-400">
          How it works
        </Link>
        <Link href="/contact" className="py-1 text-gray-600 hover:text-clay-400">
          Contact
        </Link>
      </div>
    </div>
  )
}

// Component: Internal linking footer for pages
export function InternalLinksFooter({ className = '' }: { className?: string }) {
  return (
    <section className={`bg-gray-50 py-12 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <PopularServicesLinks />
          <PopularCitiesLinks />
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <Building2 className="h-4 w-4 text-green-500" />
              By region
            </h3>
            <div className="space-y-1">
              {popularRegions.map((region) => (
                <Link
                  key={region.slug}
                  href={`/regions/${region.slug}`}
                  className="block py-1 text-sm text-gray-600 transition-colors hover:text-clay-400"
                >
                  {region.name}
                </Link>
              ))}
            </div>
            <Link
              href="/regions"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-clay-400 hover:text-clay-600"
            >
              Attorneys by region <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
