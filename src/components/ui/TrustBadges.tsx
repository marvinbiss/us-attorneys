'use client'

import { Shield, CheckCircle, Star, BadgeCheck, Database, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// Trust badges like Checkatrade — specific and verifiable
export function TrustBadges({ variant = 'default' }: { variant?: 'default' | 'compact' | 'hero' }) {
  const reducedMotion = useReducedMotion()
  const badges = [
    {
      icon: Database,
      label: 'State bar verified',
      description: 'Every attorney verified through official state bar records',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Shield,
      label: 'Licensed attorneys',
      description: 'Database of attorneys verified through official US records',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: MapPin,
      label: '50 states + DC',
      description: 'Complete coverage across all US states and territories',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: CheckCircle,
      label: '100% free',
      description: 'Search, compare, and get consultations at no cost',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ]

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        {badges.map((badge, i) => (
          <motion.div
            key={i}
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { delay: i * 0.1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
          >
            <badge.icon className={`w-4 h-4 ${badge.color}`} />
            <span className="text-sm font-medium text-slate-700">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
        {badges.slice(0, 3).map((badge, i) => (
          <motion.div
            key={i}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reducedMotion ? { duration: 0 } : { delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] backdrop-blur-sm rounded-full border border-white/10"
          >
            <badge.icon className="w-4 h-4 text-white/90" />
            <span className="text-sm text-white/80">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((badge, i) => (
        <motion.div
          key={i}
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reducedMotion ? { duration: 0 } : { delay: i * 0.1 }}
          className={`${badge.bgColor} rounded-xl p-4 text-center hover:shadow-md transition-shadow`}
        >
          <div className={`w-12 h-12 ${badge.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
            <badge.icon className={`w-6 h-6 ${badge.color}`} />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">{badge.label}</h3>
          <p className="text-sm text-slate-600">{badge.description}</p>
        </motion.div>
      ))}
    </div>
  )
}

// B Corp style certification badge
export function CertificationBadge() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-4 py-2"
    >
      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
        <CheckCircle className="w-5 h-5 text-white" />
      </div>
      <div className="text-left">
        <div className="text-xs text-green-600 font-medium">Certified platform</div>
        <div className="text-sm font-semibold text-green-800">Quality & Trust</div>
      </div>
    </motion.div>
  )
}

// Animated social proof counter
export function SocialProofCounter({
  value,
  label,
  icon: Icon,
  suffix = ''
}: {
  value: number
  label: string
  icon: React.ElementType
  suffix?: string
}) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        whileInView={reducedMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-bold text-slate-900 mb-1"
      >
        {value.toLocaleString('en-US')}{suffix}
      </motion.div>
      <div className="text-slate-500">{label}</div>
    </motion.div>
  )
}

// "Available now" badge (Doctolib style)
export function AvailabilityBadge({ count = 0 }: { count?: number }) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2.5 bg-white/[0.07] backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/10"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
      </span>
      <span className="text-sm text-white/80 font-medium">
        {count > 0 ? `${count.toLocaleString('en-US')}+ attorneys listed across the US` : 'Attorneys verified through official state bar records'}
      </span>
    </motion.div>
  )
}

// Verified badge for profiles
export function VerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div className="inline-flex items-center gap-1" title="Verified profile">
      <BadgeCheck className={`${sizes[size]} text-blue-500`} />
    </div>
  )
}

// Airbnb-style star rating
export function RatingStars({
  rating,
  reviewCount,
  showCount = true,
  size = 'md'
}: {
  rating: number
  reviewCount?: number
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: { star: 'w-3 h-3', text: 'text-xs' },
    md: { star: 'w-4 h-4', text: 'text-sm' },
    lg: { star: 'w-5 h-5', text: 'text-base' },
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Star className={`${sizes[size].star} text-amber-400 fill-amber-400`} />
      <span className={`font-semibold text-slate-900 ${sizes[size].text}`}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className={`text-slate-500 ${sizes[size].text}`}>
          ({reviewCount.toLocaleString('en-US')} reviews)
        </span>
      )}
    </div>
  )
}
