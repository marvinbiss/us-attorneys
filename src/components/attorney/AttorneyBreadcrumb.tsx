import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { Artisan, getDisplayName } from './types'
import { slugify } from '@/lib/utils'

interface AttorneyBreadcrumbProps {
  attorney: Artisan
}

export function AttorneyBreadcrumb({ attorney }: AttorneyBreadcrumbProps) {
  const displayName = getDisplayName(attorney)
  // Use provided slugs or generate them
  const specialtySlug = attorney.specialty_slug || slugify(attorney.specialty)
  const citySlug = attorney.city_slug || slugify(attorney.city)

  // Build breadcrumb with 5 levels for SEO clarity
  // Structure: Home > Practice Areas > {Service} > {City} > {Attorney name}
  const items: Array<{ label: string; href?: string; icon?: typeof Home }> = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Practice Areas', href: '/services' },
    { label: attorney.specialty, href: `/practice-areas/${specialtySlug}` },
  ]

  // Add city with service+city URL structure
  if (attorney.city && citySlug) {
    items.push({ label: attorney.city, href: `/practice-areas/${specialtySlug}/${citySlug}` })
  }

  // Add attorney name (no link - current page)
  items.push({ label: displayName })

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 overflow-x-auto pb-2 scrollbar-hide" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1 whitespace-nowrap">
            {index > 0 && <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-clay-400 transition-colors flex items-center gap-1"
              >
                {item.icon && <item.icon className="w-4 h-4" aria-hidden="true" />}
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium truncate max-w-[200px]" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
