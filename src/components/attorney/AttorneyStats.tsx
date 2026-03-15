'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  MessageCircle,
  Award,
  Star,
  Shield,
  Users,
  Clock,
  Navigation,
  CheckCircle,
} from 'lucide-react'
import type { LegacyArtisan } from '@/types/legacy'

interface AttorneyStatsProps {
  artisan: LegacyArtisan
}

interface StatConfig {
  icon: typeof Calendar
  label: string
  value: string
  subValue?: string
  color: string
  bgColor: string
}

export function AttorneyStats({ artisan }: AttorneyStatsProps) {
  const stats: StatConfig[] = []
  const currentYear = new Date().getFullYear()

  // Average rating
  if (artisan.average_rating > 0) {
    stats.push({
      icon: Star,
      label: 'Average rating',
      value: artisan.average_rating.toFixed(1),
      subValue: '/ 5',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-100',
    })
  }

  // Review count
  if (artisan.review_count > 0) {
    stats.push({
      icon: MessageCircle,
      label: 'Client reviews',
      value: artisan.review_count.toString(),
      color: 'text-clay-600',
      bgColor: 'bg-clay-50 border-clay-100',
    })
  }

  // Company creation year (from SIRENE / provider data)
  if (artisan.creation_date) {
    const year = new Date(artisan.creation_date).getFullYear()
    const age = currentYear - year
    stats.push({
      icon: Calendar,
      label: age > 1 ? `${age} years of experience` : 'Firm established',
      value: year.toString(),
      color: 'text-stone-700',
      bgColor: 'bg-sand-200 border-sand-300',
    })
  } else if (artisan.member_since && parseInt(artisan.member_since, 10) < currentYear) {
    // member_since is the platform join year — only show if it's a meaningful past year
    stats.push({
      icon: Calendar,
      label: 'Member since',
      value: artisan.member_since,
      color: 'text-stone-700',
      bgColor: 'bg-sand-200 border-sand-300',
    })
  }

  // SIRET verified
  if (artisan.is_verified) {
    stats.push({
      icon: Shield,
      label: 'Identity verified',
      value: 'Bar #',
      color: 'text-clay-700',
      bgColor: 'bg-clay-50 border-clay-100',
    })
  }

  // Available 24h/7j
  if (artisan.available_24h) {
    stats.push({
      icon: Clock,
      label: 'Availability',
      value: '24h/7j',
      color: 'text-clay-500',
      bgColor: 'bg-clay-50 border-clay-100',
    })
  }

  // Free quote
  if (artisan.free_quote) {
    stats.push({
      icon: CheckCircle,
      label: 'Consultation',
      value: 'Free',
      color: 'text-stone-700',
      bgColor: 'bg-sand-200 border-sand-300',
    })
  }

  // Team size
  if (artisan.team_size && artisan.team_size > 1) {
    stats.push({
      icon: Users,
      label: 'Team',
      value: artisan.team_size.toString(),
      subValue: 'pers.',
      color: 'text-stone-700',
      bgColor: 'bg-sand-200 border-sand-300',
    })
  }

  // Intervention radius
  if (artisan.intervention_radius_km) {
    stats.push({
      icon: Navigation,
      label: "Service area",
      value: artisan.intervention_radius_km.toString(),
      subValue: 'km',
      color: 'text-clay-600',
      bgColor: 'bg-clay-50 border-clay-100',
    })
  }

  if (stats.length === 0) return null

  const gridCols =
    stats.length >= 4
      ? 'md:grid-cols-4'
      : stats.length === 3
      ? 'md:grid-cols-3'
      : 'md:grid-cols-2'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 overflow-hidden"
    >
      {/* Section header */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-xl font-semibold text-gray-900 font-heading flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-clay-50 flex items-center justify-center">
            <Award className="w-4.5 h-4.5 text-clay-400" aria-hidden="true" />
          </div>
          At a Glance
        </h2>
      </div>

      {/* Stats grid */}
      <div className="px-6 pb-6 pt-4">
        <div
          className={`grid grid-cols-2 ${gridCols} gap-3`}
          role="list"
          aria-label="Key information about this attorney"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              role="listitem"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
              className={`text-center p-4 rounded-xl border ${stat.bgColor}`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.color} bg-white/80 flex items-center justify-center mx-auto mb-2.5 shadow-sm`}
                aria-hidden="true"
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div
                className="text-2xl font-bold text-gray-900 leading-none"
                aria-label={`${stat.label} : ${stat.value}${stat.subValue ? ' ' + stat.subValue : ''}`}
              >
                {stat.value}
                {stat.subValue && (
                  <span className="text-sm font-normal text-slate-500 ml-0.5">{stat.subValue}</span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1.5 font-medium leading-tight" aria-hidden="true">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
