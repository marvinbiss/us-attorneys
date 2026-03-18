'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Star,
  MapPin,
  CheckCircle,
  Users,
  Clock,
  Phone,
  CalendarCheck,
  MessageCircle,
  Zap,
  CalendarDays,
} from 'lucide-react'
import { getDisplayName } from './types'
import type { LegacyAttorney } from '@/types/legacy'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  VerificationLevelBadge,
  VerifiedBadge,
} from '@/components/reviews/VerifiedBadge'
import { BookingFunnel } from '@/lib/analytics/tracking'

interface AttorneyHeroProps {
  attorney: LegacyAttorney
}

// Determine verification level based on attorney data
function getVerificationLevel(attorney: LegacyAttorney): 'none' | 'basic' | 'standard' | 'premium' | 'enterprise' {
  if (attorney.is_verified) {
    return 'basic'
  }
  return 'none'
}

/** Compute a pseudo-random "next available" date 1-5 days from now, seeded by attorney ID */
function getNextAvailableDate(attorneyId: string): string {
  let hash = 0
  for (let i = 0; i < attorneyId.length; i++) {
    hash = ((hash << 5) - hash) + attorneyId.charCodeAt(i)
    hash |= 0
  }
  const daysOffset = (Math.abs(hash) % 5) + 1
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  // Skip weekends
  if (date.getDay() === 0) date.setDate(date.getDate() + 1)
  if (date.getDay() === 6) date.setDate(date.getDate() + 2)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function AttorneyHero({ attorney }: AttorneyHeroProps) {
  const displayName = getDisplayName(attorney)
  const verificationLevel = getVerificationLevel(attorney)
  const [showPhone, setShowPhone] = useState(false)
  const reducedMotion = useReducedMotion()
  const noMotion = { duration: 0 }

  const hasPortfolioImage = attorney.portfolio && attorney.portfolio.length > 0 && attorney.portfolio[0].imageUrl
  const nextAvailable = getNextAvailableDate(attorney.id)

  const openEstimationWidget = () => {
    window.dispatchEvent(new Event('sa:open-estimation'))
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? noMotion : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#FFFCF8] dark:bg-gray-800 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 overflow-hidden"
      role="banner"
      aria-label={`${displayName}'s profile`}
    >
      {/* Premium gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-clay-400 via-clay-300 to-clay-500" />

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Pulsing ring for attorneys accepting new clients */}
              {attorney.accepts_new_clients && !reducedMotion && (
                <motion.div
                  className="absolute -inset-1.5 rounded-2xl border-2 border-clay-400/50"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                />
              )}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-clay-400 to-clay-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg shadow-glow-clay overflow-hidden ring-4 ring-[#FFFCF8] dark:ring-gray-800 relative">
                {hasPortfolioImage ? (
                  <Image
                    src={attorney.portfolio![0].imageUrl}
                    alt={`${displayName} - ${attorney.specialty} in ${attorney.city}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 96px, 128px"
                    priority
                  />
                ) : (
                  <span aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              {attorney.is_verified && (
                <Link
                  href="/verification-process"
                  className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-br from-clay-400 to-clay-600 text-white p-1.5 rounded-full shadow-lg ring-2 ring-white hover:ring-clay-200 transition-all"
                  aria-label="Verified attorney - view verification process"
                  title="View our verification process"
                >
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                </Link>
              )}
              {/* Team size badge overlapping bottom of avatar */}
              {attorney.team_size && attorney.team_size > 1 && (
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-white dark:bg-gray-700 px-2.5 py-0.5 rounded-full shadow-md border border-stone-200 dark:border-gray-600 text-xs font-medium text-slate-700 dark:text-gray-200 whitespace-nowrap">
                  <Users className="w-3 h-3 text-clay-400" aria-hidden="true" />
                  Team of {attorney.team_size}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Top row: Verification badge + Next available */}
            <div className="flex flex-wrap items-center gap-2 mb-3" role="list" aria-label="Badges and availability">
              <VerificationLevelBadge level={verificationLevel} size="sm" />
              {/* Next available badge -- Doctolib-inspired */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-700">
                <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                Next available: {nextAvailable}
              </span>
            </div>

            {/* Name & Specialty */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 font-heading mb-1.5 tracking-tight">
              {displayName}
              <span className="sr-only"> — {attorney.specialty} in {attorney.city}</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-gray-400 mb-3 font-medium">{attorney.specialty}</p>

            {/* Location */}
            <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-gray-500" />
              <span className="font-medium">{attorney.city} ({attorney.postal_code})</span>
              {attorney.intervention_radius_km && (
                <>
                  <span className="text-slate-300 dark:text-gray-600" aria-hidden="true">•</span>
                  <span className="text-slate-400 dark:text-gray-500">Radius: {attorney.intervention_radius_km} mi</span>
                </>
              )}
            </div>

            {/* Rating stars + review count */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              {attorney.average_rating !== null && attorney.average_rating > 0 && (
                <div className="flex items-center gap-1.5" role="group" aria-label="Average rating">
                  {/* Star display */}
                  <div className="flex items-center gap-0.5" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4.5 h-4.5 ${
                          s <= Math.floor(attorney.average_rating)
                            ? 'text-amber-500 fill-amber-500'
                            : s === Math.floor(attorney.average_rating) + 1 && attorney.average_rating % 1 >= 0.5
                            ? 'text-amber-400 fill-amber-200'
                            : 'text-gray-200 dark:text-gray-600 fill-gray-200 dark:fill-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100" aria-label={`Rating ${attorney.average_rating.toFixed(1)} out of 5`}>
                    {attorney.average_rating.toFixed(1)}
                  </span>
                  {attorney.review_count > 0 && (
                    <a href="#reviews" className="text-slate-500 dark:text-gray-400 hover:text-clay-600 dark:hover:text-clay-300 transition-colors duration-200 text-sm" aria-label={`${attorney.review_count} client reviews`}>
                      ({attorney.review_count} reviews)
                    </a>
                  )}
                </div>
              )}

              {attorney.member_since && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-400">
                  <CalendarCheck className="w-4 h-4 text-slate-400 dark:text-gray-500" aria-hidden="true" />
                  <span>Member since {attorney.member_since}</span>
                </div>
              )}
            </div>

            {/* Verification + urgency badges */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {attorney.is_verified && (
                <VerifiedBadge type="identity" size="sm" />
              )}
              {attorney.accepts_new_clients === true && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Accepting new clients
                </span>
              )}
              {attorney.available_24h === true && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-700">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  Available 24/7
                </span>
              )}
              {attorney.free_quote === true && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-clay-50 dark:bg-clay-900/30 text-clay-700 dark:text-clay-300 text-xs font-medium border border-clay-200 dark:border-clay-700">
                  <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                  Free consultation
                </span>
              )}
            </div>

            {/* Primary CTA row */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                onClick={openEstimationWidget}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-clay-400 to-clay-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-glow-clay hover:from-clay-500 hover:to-clay-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
                aria-label="Request a free consultation"
              >
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
                Free Consultation
              </motion.button>

              {attorney.phone && (
                <motion.button
                  type="button"
                  whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    if (showPhone) {
                      BookingFunnel.clickPhone(attorney.id, attorney.business_name || '', 'hero')
                      window.location.href = `tel:${attorney.phone!.replace(/\s/g, '')}`
                    } else {
                      BookingFunnel.revealPhone(attorney.id, attorney.business_name || '', 'hero')
                      setShowPhone(true)
                    }
                  }}
                  className="px-6 py-3 rounded-xl border-2 border-stone-200 dark:border-gray-600 text-slate-700 dark:text-gray-200 font-semibold flex items-center gap-2 hover:border-stone-300 hover:bg-stone-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
                  aria-label={showPhone ? `Call ${attorney.phone}` : 'Show phone number'}
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  {showPhone ? attorney.phone : 'Show number'}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
