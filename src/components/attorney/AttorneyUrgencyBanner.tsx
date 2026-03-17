'use client'

import { motion } from 'framer-motion'
import { Zap, Clock, CheckCircle, RefreshCw } from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'

interface UrgencyItem {
  icon: React.ElementType
  label: string
  color: string
}

function getUrgencyItems(attorney: LegacyAttorney): UrgencyItem[] {
  const items: UrgencyItem[] = []

  if (attorney.accepts_new_clients === true) {
    items.push({
      icon: Zap,
      label: 'Accepting new clients',
      color: 'text-emerald-500',
    })
  }

  if (attorney.available_24h === true) {
    items.push({
      icon: Clock,
      label: 'Available 24/7 — Emergencies',
      color: 'text-amber-500',
    })
  }

  if (attorney.free_quote === true) {
    items.push({
      icon: CheckCircle,
      label: 'Free consultation, no obligation',
      color: 'text-clay-400',
    })
  }

  if (attorney.updated_at) {
    const updatedAt = new Date(attorney.updated_at)
    const now = new Date()
    const diffMs = now.getTime() - updatedAt.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) {
      items.push({
        icon: RefreshCw,
        label: 'Active less than an hour ago',
        color: 'text-green-500',
      })
    } else if (diffHours < 24) {
      items.push({
        icon: RefreshCw,
        label: `Active ${diffHours}h ago`,
        color: 'text-green-500',
      })
    } else if (diffDays < 7) {
      items.push({
        icon: RefreshCw,
        label: `Active ${diffDays} day${diffDays > 1 ? 's' : ''} ago`,
        color: 'text-blue-500',
      })
    } else if (diffDays < 30) {
      items.push({
        icon: RefreshCw,
        label: 'Profile updated this month',
        color: 'text-blue-500',
      })
    }
    // If > 30 days, don't show anything (removes vague "Profile recently updated")
  }

  return items
}

export function AttorneyUrgencyBanner({ attorney }: { attorney: LegacyAttorney }) {
  const items = getUrgencyItems(attorney)

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
            {item.label === 'Accepting new clients' ? (
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
            {item.label === 'Accepting new clients' ? (
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
