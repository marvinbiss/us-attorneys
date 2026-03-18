import Link from 'next/link'
import {
  MapPin, Wrench, Zap, Key, Flame, PaintBucket, Hammer, HardHat,
  ArrowRight, Star, Users, Building2, TreeDeciduous,
  Shovel, Axe, Droplets, Shield, Building, Paintbrush, Construction,
  Link as LinkIcon, Grid3X3, Maximize, PanelTop, Bath, Ruler, Palette,
  Cpu, Thermometer, Sun, Snowflake, Leaf, PlugZap, Factory, Trees,
  Waves, ShieldAlert, Radio, ArrowUpDown, ClipboardCheck, Bug, Truck,
  Home, Wind, ChefHat, Layers, Sparkles, Square
} from 'lucide-react'
import {
  popularServices as popularServicesData,
  popularCities,
  popularRegions
} from '@/lib/constants/navigation'
import { cities, services, usRegions } from '@/lib/data/usa'

// Re-export for backward compatibility
export { popularCities, popularRegions }

// Add icons to services for client components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench, Zap, Key, Flame, PaintBucket, Hammer, HardHat, TreeDeciduous,
  Shovel, Axe, Droplets, Shield, Building, Paintbrush, Construction,
  Link: LinkIcon, Grid3X3, Maximize, PanelTop, Bath, Ruler, Palette,
  Cpu, Thermometer, Sun, Snowflake, Leaf, PlugZap, Factory, Trees,
  Waves, ShieldAlert, Radio, ArrowUpDown, ClipboardCheck, Bug, Truck,
  Home, Wind, ChefHat, Layers, Sparkles, Square, Blocks: Grid3X3,
}

export const popularServices = popularServicesData.map(s => ({
  ...s,
  icon: iconMap[s.icon] || Wrench
}))

// Component: Popular services
export function PopularServicesLinks({
  limit = 8,
  showTitle = true,
  className = ''
}: {
  limit?: number
  showTitle?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      {showTitle && (
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
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
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-[#FDF1EC] text-gray-700 hover:text-clay-400 rounded-full text-sm transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {service.name}
            </Link>
          )
        })}
      </div>
      <Link
        href="/services"
        className="inline-flex items-center gap-1 text-clay-400 hover:text-clay-600 text-sm font-medium mt-3"
      >
        All {services.length} practice areas <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

// Component: Popular cities
export function PopularCitiesLinks({
  limit = 10,
  showTitle = true,
  className = ''
}: {
  limit?: number
  showTitle?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      {showTitle && (
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-clay-400" />
          Popular cities
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {popularCities.slice(0, limit).map((city) => (
          <Link
            key={city.slug}
            href={`/cities/${city.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-[#FDF1EC] text-gray-700 hover:text-clay-400 rounded-full text-sm transition-colors"
          >
            {city.name}
          </Link>
        ))}
      </div>
      <Link
        href="/cities"
        className="inline-flex items-center gap-1 text-clay-400 hover:text-clay-600 text-sm font-medium mt-3"
      >
        Attorneys in {cities.length} cities <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

// Component: Geographic navigation
export function GeographicNavigation({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <Link
        href="/regions"
        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-clay-300 hover:shadow-md transition-all group"
      >
        <div className="w-10 h-10 bg-[#FDF1EC] rounded-lg flex items-center justify-center group-hover:bg-clay-100 transition-colors">
          <Building2 className="w-5 h-5 text-clay-400" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 group-hover:text-clay-400">By region</div>
          <div className="text-sm text-gray-500">{usRegions.length} regions</div>
        </div>
      </Link>
      <Link
        href="/states"
        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-clay-300 hover:shadow-md transition-all group"
      >
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
          <MapPin className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 group-hover:text-green-600">By state</div>
          <div className="text-sm text-gray-500">50 states + DC</div>
        </div>
      </Link>
      <Link
        href="/cities"
        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-clay-300 hover:shadow-md transition-all group"
      >
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
          <Users className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 group-hover:text-amber-600">By city</div>
          <div className="text-sm text-gray-500">{cities.length} cities</div>
        </div>
      </Link>
    </div>
  )
}

// Component: Popular service x city cross-links (homepage SEO)
export function PopularServiceCityLinks({
  limit = 12,
  showTitle = true,
  className = ''
}: {
  limit?: number
  showTitle?: boolean
  className?: string
}) {
  const topCombos = popularServices.slice(0, 4).flatMap(service =>
    popularCities.slice(0, 3).map(city => ({
      label: `${service.name} ${city.name}`,
      href: `/practice-areas/${service.slug}/${city.slug}`,
    }))
  )

  return (
    <div className={className}>
      {showTitle && (
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-clay-400" />
          Popular searches
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {topCombos.slice(0, limit).map((combo) => (
          <Link
            key={combo.href}
            href={combo.href}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-[#FDF1EC] text-gray-700 hover:text-clay-400 rounded-full text-sm transition-colors"
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
  className = ''
}: {
  service: string
  cities?: typeof popularCities
  className?: string
}) {
  const specialtyData = popularServices.find(s => s.slug === service)
  if (!specialtyData) return null

  return (
    <div className={className}>
      <h3 className="font-semibold text-gray-900 mb-3">
        {specialtyData.name} by city
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/practice-areas/${service}/${city.slug}`}
            className="px-3 py-2 bg-gray-50 hover:bg-[#FDF1EC] text-gray-700 hover:text-clay-400 rounded-lg text-sm transition-colors"
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
    <div className={`bg-gray-50 rounded-xl p-4 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3">Browse the site</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Link href="/" className="text-gray-600 hover:text-clay-400 py-1">
          Home
        </Link>
        <Link href="/services" className="text-gray-600 hover:text-clay-400 py-1">
          {services.length} practice areas
        </Link>
        <Link href="/cities" className="text-gray-600 hover:text-clay-400 py-1">
          {cities.length} cities
        </Link>
        <Link href="/regions" className="text-gray-600 hover:text-clay-400 py-1">
          By region
        </Link>
        <Link href="/search" className="text-gray-600 hover:text-clay-400 py-1">
          Search
        </Link>
        <Link href="/quotes" className="text-gray-600 hover:text-clay-400 py-1">
          Request a consultation
        </Link>
        <Link href="/how-it-works" className="text-gray-600 hover:text-clay-400 py-1">
          How it works
        </Link>
        <Link href="/contact" className="text-gray-600 hover:text-clay-400 py-1">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <PopularServicesLinks />
          <PopularCitiesLinks />
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-500" />
              By region
            </h3>
            <div className="space-y-1">
              {popularRegions.map((region) => (
                <Link
                  key={region.slug}
                  href={`/regions/${region.slug}`}
                  className="block text-gray-600 hover:text-clay-400 text-sm py-1 transition-colors"
                >
                  {region.name}
                </Link>
              ))}
            </div>
            <Link
              href="/regions"
              className="inline-flex items-center gap-1 text-clay-400 hover:text-clay-600 text-sm font-medium mt-3"
            >
              Attorneys by region <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
