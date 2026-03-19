'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText,
  MessageSquare,
  Star,
  Settings,
  TrendingUp,
  DollarSign,
  Calendar,
  CalendarClock,
  ExternalLink,
  Search,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Menu,
  X,
  Video,
  CreditCard,
} from 'lucide-react'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'
import ProfileCompletionBar from '@/components/attorney-dashboard/ProfileCompletionBar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { getSupabaseClient } from '@/lib/supabase/client'

interface AttorneySidebarProps {
  activePage?:
    | 'dashboard'
    | 'leads'
    | 'received-cases'
    | 'calendar'
    | 'availability'
    | 'bookings'
    | 'messages'
    | 'portfolio'
    | 'statistics'
    | 'reviews-received'
    | 'profile'
    | 'subscription'
    | 'billing'
  newCasesCount?: number
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
    title: 'Activity',
    items: [
      {
        key: 'dashboard',
        href: '/attorney-dashboard/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
      },
      {
        key: 'received-cases',
        href: '/attorney-dashboard/received-cases',
        icon: FileText,
        label: 'Received requests',
      },
      { key: 'leads', href: '/attorney-dashboard/leads', icon: Inbox, label: 'Opportunities' },
      { key: 'calendar', href: '/attorney-dashboard/calendar', icon: Calendar, label: 'Calendar' },
      {
        key: 'availability',
        href: '/attorney-dashboard/availability',
        icon: CalendarClock,
        label: 'Availability',
      },
      { key: 'bookings', href: '/attorney-dashboard/bookings', icon: Video, label: 'Bookings' },
      {
        key: 'messages',
        href: '/attorney-dashboard/messages',
        icon: MessageSquare,
        label: 'Messages',
      },
    ],
  },
  {
    title: 'My space',
    items: [
      {
        key: 'portfolio',
        href: '/attorney-dashboard/portfolio',
        icon: ImageIcon,
        label: 'Portfolio',
      },
      {
        key: 'statistics',
        href: '/attorney-dashboard/statistics',
        icon: TrendingUp,
        label: 'Statistics',
      },
      {
        key: 'reviews-received',
        href: '/attorney-dashboard/reviews-received',
        icon: Star,
        label: 'Reviews received',
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      { key: 'profile', href: '/attorney-dashboard/profile', icon: Settings, label: 'My profile' },
      { key: 'billing', href: '/attorney-dashboard/billing', icon: CreditCard, label: 'Billing' },
      {
        key: 'subscription',
        href: '/attorney-dashboard/subscription',
        icon: DollarSign,
        label: 'My account',
      },
    ],
  },
]

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function AttorneySidebar({
  activePage = 'dashboard',
  newCasesCount = 0,
  unreadMessagesCount = 0,
  publicUrl,
  subscriptionPlan,
}: AttorneySidebarProps) {
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
    if (key === 'received-cases' && newCasesCount > 0) {
      return (
        <span
          role="status"
          aria-label={`${newCasesCount} new request${newCasesCount > 1 ? 's' : ''}`}
          className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs text-white"
        >
          {newCasesCount}
        </span>
      )
    }
    if (key === 'messages' && unreadMessagesCount > 0) {
      return (
        <span
          role="status"
          aria-label={`${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''}`}
          className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white"
        >
          {unreadMessagesCount}
        </span>
      )
    }
    if (key === 'calendar' && (subscriptionPlan === 'pro' || subscriptionPlan === 'premium')) {
      return (
        <span className="ml-auto rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
          Pro
        </span>
      )
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
        className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-4 sm:py-3 ${
          isActive
            ? 'border-blue-600 bg-blue-50 font-medium text-blue-600'
            : 'border-transparent text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
        {getBadge(item.key)}
      </Link>
    )
  }

  const navContent = (
    <>
      {navSections.map((section, sectionIndex) => (
        <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : undefined}>
          <p className="mb-1 select-none px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4 sm:text-xs">
            {section.title}
          </p>
          <div className="space-y-0.5">{section.items.map(renderNavLink)}</div>
        </div>
      ))}
      <div className="mt-4 border-t border-gray-100 pt-2">
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
        className="mb-2 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 lg:hidden"
        aria-label="Open menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Menu</span>
      </button>

      {/* Mobile backdrop — fades in/out */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
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
        aria-label="Attorney main menu"
        onKeyDown={handleMobileKeyDown}
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white shadow-xl transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Menu</span>
          <div className="flex items-center gap-2">
            <NotificationBell userId={userId} />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded p-1 text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <nav
          role="navigation"
          aria-label="Attorney main menu"
          className="max-h-[calc(100vh-56px)] space-y-0.5 overflow-y-auto p-2"
        >
          {navContent}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <nav
        role="navigation"
        aria-label="Attorney main menu"
        className="hidden space-y-0.5 rounded-xl bg-white p-2 shadow-sm sm:space-y-1 sm:p-4 lg:block"
      >
        {/* Notifications */}
        <div className="mb-1 flex items-center justify-between border-b border-gray-100 px-2 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:text-xs">
            Menu
          </span>
          <NotificationBell userId={userId} />
        </div>
        {navContent}
      </nav>

      {/* View my public profile */}
      {publicUrl && (
        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <Link
            href={publicUrl}
            className="flex items-center gap-2 rounded font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View my public profile
          </Link>
        </div>
      )}

      {/* Profile completion bar */}
      <div className="mt-4 hidden lg:block">
        <ProfileCompletionBar />
      </div>

      {/* Quick links */}
      <div className="mt-4 hidden lg:block">
        <QuickSiteLinks />
      </div>

      {/* Additional links */}
      <div className="mt-4 hidden rounded-xl bg-white p-4 shadow-sm lg:block">
        <h4 className="mb-3 font-medium text-gray-900">Useful links</h4>
        <div className="space-y-2 text-sm">
          <Link
            href="/practice-areas"
            className="flex items-center gap-2 rounded py-1 text-gray-600 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse services
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-2 rounded py-1 text-gray-600 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search for an attorney
          </Link>
        </div>
      </div>
    </div>
  )
}
