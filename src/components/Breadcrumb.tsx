'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm ${className}`}>
      <ol className="flex items-center gap-2" itemScope itemType="https://schema.org/BreadcrumbList">
        <li className="flex items-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-500 hover:text-clay-400 transition-colors"
            itemProp="item"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only" itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-clay-400 transition-colors"
                itemProp="item"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span className="text-gray-900 font-medium" itemProp="name">{item.label}</span>
            )}
            <meta itemProp="position" content={String(index + 2)} />
          </li>
        ))}
      </ol>
    </nav>
  )
}
