'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, FileText, Wrench, AlertTriangle } from 'lucide-react'
import { useMobileMenu } from '@/contexts/MobileMenuContext'

const navItems: { href: string; icon: typeof Home; label: string; isPrimary?: boolean }[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/quotes', icon: FileText, label: 'Consult', isPrimary: true },
  { href: '/services', icon: Wrench, label: 'Services' },
  { href: '/emergency', icon: AlertTriangle, label: 'Emergency' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { isMenuOpen } = useMobileMenu()
  const [estimationOpen, setEstimationOpen] = useState(false)

  // Watch for estimation widget open/close via body attribute
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setEstimationOpen(document.body.hasAttribute('data-estimation-open'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-estimation-open'] })
    return () => observer.disconnect()
  }, [])

  // Don't display in logged-in areas (they have their own nav)
  const hideOnPages = ['/client-dashboard', '/attorney-dashboard', '/admin']
  const shouldHide = hideOnPages.some(page => pathname.startsWith(page))

  // Hide when the mobile menu is open or when the estimation widget is open
  if (shouldHide || isMenuOpen || estimationOpen) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 pb-safe">
        {navItems.map(({ href, icon: Icon, label, isPrimary }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))

          if (isPrimary) {
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors touch-manipulation active:scale-95"
              >
                <div className="w-11 h-11 -mt-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-white dark:ring-gray-900">
                  <Icon className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-semibold text-blue-600">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors touch-manipulation active:scale-95 ${
                isActive ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Wrapper component to add padding for bottom nav
export function MobileNavSpacer() {
  return <div className="h-16 md:hidden" />
}
