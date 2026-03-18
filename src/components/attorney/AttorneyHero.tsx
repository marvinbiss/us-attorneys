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
import { cn } from '@/lib/utils'
import { getDisplayName } from './types'
import type { LegacyAttorney } from '@/types/legacy'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  VerificationLevelBadge,
} from '@/components/reviews/VerifiedBadge'
import { VerifiedAttorneyBadge } from '@/components/ui/VerifiedBadge'
import { TrustBar } from '@/components/ui/TrustBar'
import { SocialProof } from '@/components/ui/SocialProof'
import { BarVerificationLink } from '@/components/attorney/BarVerificationLink'
import { BookingFunnel } from '@/lib/analytics/tracking'
import { ConsultationModal } from '@/components/booking/ConsultationModal'
import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge'
import { SubscriptionBadge } from '@/components/ui/SubscriptionBadge'
import { getSubscriptionTier } from '@/lib/search/ranking'
import type { AvailabilitySlot } from '@/lib/availability'
import type { SubscriptionTier } from '@/lib/billing/cpa-model'

interface AttorneyHeroProps {
  attorney: LegacyAttorney
  /** Bar association URL from states table (for verification link) */
  barAssociationUrl?: string | null
  /** Attorney's bar state abbreviation */
  barState?: string | null
  /** Verification date from bar_admissions (ISO string) */
  verificationDate?: string | null
  /** Average response time in hours (from actual data) */
  responseTimeHours?: number | null
  /** Years of experience */
  yearsExperience?: number | null
  /** Number of consultations this month (from bookings table) */
  consultationsThisMonth?: number | null
  /** ISO date of last booking */
  lastBookedAt?: string | null
  /** Real availability slot from server (replaces pseudo-random fallback) */
  availability?: AvailabilitySlot | null
  /** Subscription tier (from boost_level or explicitly set) */
  subscriptionTier?: SubscriptionTier
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

export function AttorneyHero({
  attorney,
  barAssociationUrl,
  barState,
  verificationDate,
  responseTimeHours,
  yearsExperience,
  consultationsThisMonth,
  lastBookedAt,
  availability,
  subscriptionTier,
}: AttorneyHeroProps) {
  const displayName = getDisplayName(attorney)
  const verificationLevel = getVerificationLevel(attorney)
  const [showPhone, setShowPhone] = useState(false)
  const [showConsultationModal, setShowConsultationModal] = useState(false)
  const reducedMotion = useReducedMotion()
  const noMotion = { duration: 0 }

  // Derive tier from prop or from boost_level on attorney (if available from DB)
  const tier: SubscriptionTier = subscriptionTier || getSubscriptionTier((attorney as unknown as { boost_level?: number | null }).boost_level)
  const isPremium = tier === 'premium'
  const isPro = tier === 'pro'
  const isPaid = isPremium || isPro

  const hasPortfolioImage = attorney.portfolio && attorney.portfolio.length > 0 && attorney.portfolio[0].imageUrl
  const nextAvailable = getNextAvailableDate(attorney.id)

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? noMotion : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'bg-[#FFFCF8] dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden',
        isPremium
          ? 'border-2 border-amber-300 dark:border-amber-600 shadow-lg shadow-amber-100/30 dark:shadow-amber-900/20'
          : isPro
            ? 'border-2 border-blue-300 dark:border-blue-600 shadow-lg shadow-blue-100/30 dark:shadow-blue-900/20'
            : 'border border-stone-200/60 dark:border-gray-700',
      )}
      role="banner"
      aria-label={`${displayName}'s profile`}
    >
      {/* Featured Attorney banner for premium */}
      {isPremium && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white text-center py-2 px-4">
          <span className="text-sm font-bold tracking-wide uppercase">Featured Attorney</span>
        </div>
      )}

      {/* Top gradient accent bar */}
      <div className={cn(
        'h-1.5 bg-gradient-to-r',
        isPremium
          ? 'from-amber-400 via-yellow-300 to-amber-500'
          : isPro
            ? 'from-blue-400 via-blue-500 to-blue-400'
            : 'from-clay-400 via-clay-300 to-clay-500',
      )} />

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
              <div className={cn(
                'w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-lg overflow-hidden ring-4 relative',
                isPremium
                  ? 'from-amber-400 to-amber-600 shadow-glow-amber ring-amber-200 dark:ring-amber-700'
                  : isPro
                    ? 'from-blue-400 to-blue-600 shadow-glow-blue ring-blue-200 dark:ring-blue-700'
                    : 'from-clay-400 to-clay-600 shadow-glow-clay ring-[#FFFCF8] dark:ring-gray-800',
              )}>
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
              {availability !== undefined ? (
                <AvailabilityBadge slot={availability} size="md" />
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-700">
                  <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                  Next available: {nextAvailable}
                </span>
              )}
            </div>

            {/* Name & Specialty */}
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 font-heading tracking-tight">
                {displayName}
                <span className="sr-only"> — {attorney.specialty} in {attorney.city}</span>
              </h1>
              {isPaid && <SubscriptionBadge tier={tier} size="md" />}
            </div>
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
                <VerifiedAttorneyBadge
                  isVerified={attorney.is_verified}
                  verificationDate={verificationDate}
                  size="sm"
                />
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

            {/* Trust bar — aggregated trust signals */}
            <TrustBar
              isVerified={attorney.is_verified}
              responseTimeHours={responseTimeHours}
              ratingAverage={attorney.average_rating}
              reviewCount={attorney.review_count}
              yearsExperience={yearsExperience}
              className="mb-4"
            />

            {/* Social proof from real booking data */}
            <SocialProof
              consultationsThisMonth={consultationsThisMonth}
              lastBookedAt={lastBookedAt}
              className="mb-4"
            />

            {/* Independent bar verification link */}
            <div className="mb-5">
              <BarVerificationLink
                barState={barState || attorney.department_code}
                barNumber={attorney.bar_number}
                barAssociationUrl={barAssociationUrl}
              />
            </div>

            {/* "Why Choose" section for premium profiles */}
            {isPremium && (
              <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-amber-50/80 to-yellow-50/60 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200/60 dark:border-amber-700/40">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  Why Choose {displayName}
                </h3>
                <ul className="space-y-1.5 text-sm text-amber-900/80 dark:text-amber-200/80">
                  {attorney.is_verified && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      Bar-verified and in active standing
                    </li>
                  )}
                  {yearsExperience && yearsExperience > 0 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      {yearsExperience}+ years of legal experience
                    </li>
                  )}
                  {attorney.average_rating > 0 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      {attorney.average_rating.toFixed(1)}-star average from {attorney.review_count} client reviews
                    </li>
                  )}
                  {responseTimeHours != null && responseTimeHours > 0 && responseTimeHours <= 24 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      Responds within {responseTimeHours < 1 ? 'minutes' : `${Math.round(responseTimeHours)} hours`}
                    </li>
                  )}
                  {attorney.free_quote && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      Offers free initial consultations
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Primary CTA row */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                onClick={() => setShowConsultationModal(true)}
                className={cn(
                  'rounded-xl text-white font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  isPremium
                    ? 'px-8 py-4 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30 focus:ring-amber-400'
                    : isPro
                      ? 'px-7 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30 focus:ring-blue-400'
                      : 'px-6 py-3 bg-gradient-to-r from-clay-400 to-clay-500 hover:from-clay-500 hover:to-clay-600 shadow-glow-clay focus:ring-clay-400',
                )}
                aria-label="Request a free consultation"
              >
                <MessageCircle className={cn('aria-hidden', isPremium ? 'w-6 h-6' : 'w-5 h-5')} aria-hidden="true" />
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
      {/* Consultation Request Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        attorney={{
          id: attorney.id,
          name: displayName,
          slug: attorney.slug || attorney.id,
          specialty: attorney.specialty,
        }}
      />
    </motion.div>
  )
}
