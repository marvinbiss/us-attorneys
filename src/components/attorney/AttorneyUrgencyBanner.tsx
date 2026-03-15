'use client'

import { motion } from 'framer-motion'
import { Zap, Clock, CheckCircle, RefreshCw } from 'lucide-react'
import type { LegacyArtisan } from '@/types/legacy'

interface UrgencyItem {
  icon: React.ElementType
  label: string
  color: string
}

function getUrgencyItems(artisan: LegacyArtisan): UrgencyItem[] {
  const items: UrgencyItem[] = []

  if (artisan.accepts_new_clients === true) {
    items.push({
      icon: Zap,
      label: 'Accepte de nouveaux clients',
      color: 'text-emerald-500',
    })
  }

  if (artisan.available_24h === true) {
    items.push({
      icon: Clock,
      label: 'Disponible 24h/7j — Urgences',
      color: 'text-amber-500',
    })
  }

  if (artisan.free_quote === true) {
    items.push({
      icon: CheckCircle,
      label: 'Devis gratuit et sans engagement',
      color: 'text-clay-400',
    })
  }

  if (artisan.updated_at) {
    const updatedAt = new Date(artisan.updated_at)
    const now = new Date()
    const diffMs = now.getTime() - updatedAt.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) {
      items.push({
        icon: RefreshCw,
        label: 'Actif il y a moins d\'une heure',
        color: 'text-green-500',
      })
    } else if (diffHours < 24) {
      items.push({
        icon: RefreshCw,
        label: `Actif il y a ${diffHours}h`,
        color: 'text-green-500',
      })
    } else if (diffDays < 7) {
      items.push({
        icon: RefreshCw,
        label: `Actif il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`,
        color: 'text-blue-500',
      })
    } else if (diffDays < 30) {
      items.push({
        icon: RefreshCw,
        label: 'Profil mis à jour ce mois',
        color: 'text-blue-500',
      })
    }
    // If > 30 days, don't show anything (removes vague "Profil mis à jour récemment")
  }

  return items
}

export function AttorneyUrgencyBanner({ artisan }: { artisan: LegacyArtisan }) {
  const items = getUrgencyItems(artisan)

  if (items.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-gradient-to-r from-clay-50 to-sand-100 rounded-2xl border border-clay-200/40 px-5 py-3.5"
    >
      <div className="hidden sm:flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm font-medium text-gray-900">
            {item.label === 'Accepte de nouveaux clients' ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            ) : (
              <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} aria-hidden="true" />
            )}
            {item.label}
          </div>
        ))}
      </div>

      {/* Mobile: 2-column grid */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs font-medium text-gray-900">
            {item.label === 'Accepte de nouveaux clients' ? (
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${item.color}`} aria-hidden="true" />
            )}
            {item.label}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
