'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, FileText, Wrench, AlertTriangle } from 'lucide-react'
import { useMobileMenu } from '@/contexts/MobileMenuContext'

const navItems = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/recherche', icon: Search, label: 'Recherche' },
  { href: '/services', icon: Wrench, label: 'Services' },
  { href: '/devis', icon: FileText, label: 'Devis' },
  { href: '/urgence', icon: AlertTriangle, label: 'Urgence' },
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

  // Ne pas afficher dans les espaces connectés (ils ont leur propre nav)
  const hideOnPages = ['/espace-client', '/espace-artisan', '/admin']
  const shouldHide = hideOnPages.some(page => pathname.startsWith(page))

  // Masquer quand le menu mobile est ouvert ou quand le widget estimation est ouvert
  if (shouldHide || isMenuOpen || estimationOpen) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      aria-label="Navigation mobile"
    >
      <div className="flex items-center justify-around h-16 pb-safe">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors touch-manipulation active:scale-95 ${
                isActive ? 'text-amber-600' : 'text-gray-500'
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
