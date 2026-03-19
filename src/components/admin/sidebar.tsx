'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  Star,
  CreditCard,
  Grid,
  MessageSquare,
  Flag,
  Shield,
  Lock,
  Settings,
  ArrowRight,
  Wrench,
  BookOpen,
  Gauge,
  Sliders,
  Megaphone,
  FileEdit,
  BadgeCheck,
  BarChart3,
  DollarSign,
  Menu,
  X,
} from 'lucide-react'

const nav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'System', href: '/admin/system', icon: Gauge },
  { name: 'Requests', href: '/admin/leads', icon: FileText },
  { name: 'Leads Estimation', href: '/admin/lead-estimation', icon: MessageSquare },
  { name: 'Dispatch', href: '/admin/dispatch', icon: ArrowRight },
  { name: 'Algorithm', href: '/admin/algorithm', icon: Sliders },
  { name: 'Tools', href: '/admin/tools', icon: Wrench },
  { name: 'Log', href: '/admin/journal', icon: BookOpen },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Attorneys', href: '/admin/attorneys', icon: Briefcase },
  { name: 'Claims', href: '/admin/claims', icon: BadgeCheck },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Quotes', href: '/admin/quote-requests', icon: FileText },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { name: 'Services', href: '/admin/services', icon: Grid },
  { name: 'Content', href: '/admin/content', icon: FileEdit },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { name: 'Reports', href: '/admin/reports', icon: Flag },
  { name: 'Audit', href: '/admin/audit', icon: Shield },
  { name: 'GDPR', href: '/admin/gdpr', icon: Lock },
  { name: 'Prospection', href: '/admin/prospection', icon: Megaphone },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-gray-900 p-2 text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'z-50 flex min-h-screen flex-col bg-gray-900 transition-transform duration-300',
          'fixed w-64 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation"
      >
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-white">
            <Shield className="h-6 w-6" />
            Administration
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-gray-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main admin menu">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-gray-800 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            ← Back to site
          </Link>
        </div>
      </aside>
    </>
  )
}
