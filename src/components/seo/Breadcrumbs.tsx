import Link from 'next/link'
import { SITE_URL } from '@/lib/seo/config'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Reusable SEO Breadcrumbs component (P1-19).
 * Server component — renders both visual breadcrumbs AND BreadcrumbList JSON-LD.
 * Home is always prepended as the first item.
 */
export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Build full list with Home always first
  const allItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...items,
  ]

  // Build JSON-LD BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => {
      const isLast = index === allItems.length - 1
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        ...(!isLast && item.href && {
          item: `${SITE_URL}${item.href}`,
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

            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <span aria-hidden="true" className="text-gray-400 mx-1">/</span>
                )}

                {isLast ? (
                  <span
                    aria-current="page"
                    className="text-gray-900 font-medium"
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="text-blue-600 hover:underline"
                  >
                    {item.label}
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
