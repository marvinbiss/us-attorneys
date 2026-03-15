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
  Menu,
  X,
} from 'lucide-react'

const nav = [
  { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Système', href: '/admin/systeme', icon: Gauge },
  { name: 'Demandes', href: '/admin/leads', icon: FileText },
  { name: 'Leads Estimation', href: '/admin/estimation-leads', icon: MessageSquare },
  { name: 'Répartition', href: '/admin/dispatch', icon: ArrowRight },
  { name: 'Algorithme', href: '/admin/algorithme', icon: Sliders },
  { name: 'Outils', href: '/admin/tools', icon: Wrench },
  { name: 'Journal', href: '/admin/journal', icon: BookOpen },
  { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
  { name: 'Artisans', href: '/admin/attorneys', icon: Briefcase },
  { name: 'Revendications', href: '/admin/revendications', icon: BadgeCheck },
  { name: 'Réservations', href: '/admin/reservations', icon: Calendar },
  { name: 'Devis', href: '/admin/quotes', icon: FileText },
  { name: 'Avis', href: '/admin/reviews', icon: Star },
  { name: 'Paiements', href: '/admin/paiements', icon: CreditCard },
  { name: 'Services', href: '/admin/services', icon: Grid },
  { name: 'Contenu', href: '/admin/contenu', icon: FileEdit },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { name: 'Signalements', href: '/admin/signalements', icon: Flag },
  { name: 'Audit', href: '/admin/audit', icon: Shield },
  { name: 'RGPD', href: '/admin/rgpd', icon: Lock },
  { name: 'Prospection', href: '/admin/prospection', icon: Megaphone },
  { name: 'Paramètres', href: '/admin/parametres', icon: Settings },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'bg-gray-900 min-h-screen flex flex-col z-50 transition-transform duration-300',
          'fixed lg:static lg:translate-x-0 w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navigation administration"
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link href="/admin" className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Administration
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-white"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto" aria-label="Menu principal administration">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            ← Retour au site
          </Link>
        </div>
      </aside>
    </>
  )
}
