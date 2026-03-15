'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { FileText, MessageSquare, Star, Settings, TrendingUp, Euro, Calendar, ExternalLink, Search, Image as ImageIcon, Inbox, LayoutDashboard, Menu, X } from 'lucide-react'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { getSupabaseClient } from '@/lib/supabase/client'

interface AttorneySidebarProps {
  activePage?: 'dashboard' | 'leads' | 'demandes-recues' | 'calendrier' | 'messages' | 'portfolio' | 'statistiques' | 'avis-recus' | 'profil' | 'abonnement'
  newDemandesCount?: number
  unreadMessagesCount?: number
  publicUrl?: string | null
  subscriptionPlan?: string
}

type NavItemKey = AttorneySidebarProps['activePage']

interface NavItem {
  key: NonNullable<NavItemKey>
  href: string
  icon: typeof LayoutDashboard
  label: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Activité',
    items: [
      { key: 'dashboard', href: '/attorney-dashboard/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
      { key: 'demandes-recues', href: '/attorney-dashboard/demandes-recues', icon: FileText, label: 'Demandes reçues' },
      { key: 'leads', href: '/attorney-dashboard/leads', icon: Inbox, label: 'Opportunités' },
      { key: 'calendrier', href: '/attorney-dashboard/calendrier', icon: Calendar, label: 'Calendrier' },
      { key: 'messages', href: '/attorney-dashboard/messages', icon: MessageSquare, label: 'Messages' },
    ],
  },
  {
    title: 'Mon espace',
    items: [
      { key: 'portfolio', href: '/attorney-dashboard/portfolio', icon: ImageIcon, label: 'Portfolio' },
      { key: 'statistiques', href: '/attorney-dashboard/statistiques', icon: TrendingUp, label: 'Statistiques' },
      { key: 'avis-recus', href: '/attorney-dashboard/reviews-recus', icon: Star, label: 'Avis reçus' },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { key: 'profil', href: '/attorney-dashboard/profil', icon: Settings, label: 'Mon profil' },
      { key: 'abonnement', href: '/attorney-dashboard/abonnement', icon: Euro, label: 'Mon compte' },
    ],
  },
]

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function AttorneySidebar({ activePage = 'dashboard', newDemandesCount = 0, unreadMessagesCount = 0, publicUrl, subscriptionPlan }: AttorneySidebarProps) {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const mobileSidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  // Auto-focus close button when mobile sidebar opens
  useEffect(() => {
    if (mobileOpen) {
      // Small delay to let the transition start before focusing
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [mobileOpen])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [mobileOpen])

  // Focus trap + Escape handler for mobile sidebar
  const handleMobileKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setMobileOpen(false)
      return
    }

    if (e.key === 'Tab' && mobileSidebarRef.current) {
      const focusables = Array.from(
        mobileSidebarRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      )
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }, [])

  function getBadge(key: string) {
    if (key === 'demandes-recues' && newDemandesCount > 0) {
      return (
        <span
          role="status"
          aria-label={`${newDemandesCount} nouvelle${newDemandesCount > 1 ? 's' : ''} demande${newDemandesCount > 1 ? 's' : ''}`}
          className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
        >
          {newDemandesCount}
        </span>
      )
    }
    if (key === 'messages' && unreadMessagesCount > 0) {
      return (
        <span
          role="status"
          aria-label={`${unreadMessagesCount} message${unreadMessagesCount > 1 ? 's' : ''} non lu${unreadMessagesCount > 1 ? 's' : ''}`}
          className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full"
        >
          {unreadMessagesCount}
        </span>
      )
    }
    if (key === 'calendrier' && (subscriptionPlan === 'pro' || subscriptionPlan === 'premium')) {
      return <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Pro</span>
    }
    return null
  }

  function renderNavLink(item: NavItem) {
    const Icon = item.icon
    const isActive = activePage === item.key
    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-l-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          isActive
            ? 'bg-blue-50 text-blue-600 font-medium border-blue-600'
            : 'text-gray-700 hover:bg-gray-50 border-transparent'
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
        {getBadge(item.key)}
      </Link>
    )
  }

  const navContent = (
    <>
      {navSections.map((section, sectionIndex) => (
        <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : undefined}>
          <p className="px-3 sm:px-4 mb-1 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map(renderNavLink)}
          </div>
        </div>
      ))}
      <div className="mt-4 pt-2 border-t border-gray-100">
        <LogoutButton />
      </div>
    </>
  )

  return (
    <div className="lg:col-span-1">
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-3 py-2 mb-2 bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label="Ouvrir le menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium">Menu</span>
      </button>

      {/* Mobile backdrop — fades in/out */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile sidebar */}
      <div
        id="mobile-sidebar"
        ref={mobileSidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal artisan"
        onKeyDown={handleMobileKeyDown}
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</span>
          <div className="flex items-center gap-2">
            <NotificationBell userId={userId} />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav
          role="navigation"
          aria-label="Menu principal artisan"
          className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-56px)]"
        >
          {navContent}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <nav
        role="navigation"
        aria-label="Menu principal artisan"
        className="hidden lg:block bg-white rounded-xl shadow-sm p-2 sm:p-4 space-y-0.5 sm:space-y-1"
      >
        {/* Notifications */}
        <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-gray-100">
          <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</span>
          <NotificationBell userId={userId} />
        </div>
        {navContent}
      </nav>

      {/* Voir mon profil public */}
      {publicUrl && (
        <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
          <Link
            href={publicUrl}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Voir mon profil public
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-4 hidden lg:block">
        <QuickSiteLinks />
      </div>

      {/* Additional links */}
      <div className="bg-white rounded-xl shadow-sm p-4 mt-4 hidden lg:block">
        <h4 className="font-medium text-gray-900 mb-3">Liens utiles</h4>
        <div className="space-y-2 text-sm">
          <Link href="/services" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
            <Search className="w-4 h-4" aria-hidden="true" />
            Parcourir les services
          </Link>
          <Link href="/search" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
            <Search className="w-4 h-4" aria-hidden="true" />
            Rechercher un artisan
          </Link>
        </div>
      </div>
    </div>
  )
}
