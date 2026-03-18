import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { SITE_URL } from '@/lib/seo/config'
import type { SemanticBreadcrumbItem, SemanticBreadcrumbType } from '@/lib/seo/jsonld'

export interface BreadcrumbItem {
  label: string
  href?: string
  /** Schema.org type for semantic breadcrumb (e.g. 'LegalService', 'City', 'Person') */
  semanticType?: SemanticBreadcrumbType
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  /** Show home icon instead of "Home" text (default: true) */
  showHomeIcon?: boolean
}

/**
 * Reusable SEO Breadcrumbs component.
 * Server component — renders both:
 * 1. Visible <nav> breadcrumbs with aria-label and aria-current
 * 2. BreadcrumbList JSON-LD with Doctolib-style semantic types
 *
 * Home is always prepended as the first item with @type Organization.
 */
export default function Breadcrumbs({ items, className = '', showHomeIcon = true }: BreadcrumbsProps) {
  // Build full list with Home always first
  const allItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/', semanticType: 'Organization' },
    ...items,
  ]

  // Build JSON-LD BreadcrumbList with semantic types
  const jsonLdItems: SemanticBreadcrumbItem[] = allItems.map((item) => ({
    name: item.label,
    url: item.href || '',
    semanticType: item.semanticType,
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: jsonLdItems.map((item, index) => {
      const isLast = index === jsonLdItems.length - 1
      const fullUrl = item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`

      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(!isLast && item.url && {
          item: item.semanticType
            ? { '@type': item.semanticType, '@id': fullUrl, name: item.name, url: fullUrl }
            : fullUrl,
        }),
      }
    }),
  }

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026'),
        }}
      />

      {/* Visual breadcrumbs */}
      <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
        <ol className="flex flex-wrap items-center gap-1">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1
            const isHome = index === 0

            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-0.5 flex-shrink-0" aria-hidden="true" />
                )}

                {isLast ? (
                  <span
                    aria-current="page"
                    className="text-gray-900 font-medium truncate max-w-[240px]"
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center gap-1"
                  >
                    {isHome && showHomeIcon ? (
                      <>
                        <Home className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="sr-only">{item.label}</span>
                      </>
                    ) : (
                      item.label
                    )}
                  </Link>
                ) : (
                  <span className="text-gray-500">{item.label}</span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
