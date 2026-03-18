'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Star,
  MapPin,
  Phone,
  Shield,
  Briefcase,
  ChevronRight,
  Award,
  GraduationCap,
  ChevronDown,
  Globe,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge'
import { VerifiedAttorneyBadge } from '@/components/ui/VerifiedBadge'
import { ResponseTimeBadge } from '@/components/ui/ResponseTimeBadge'
import { SubscriptionBadge } from '@/components/ui/SubscriptionBadge'
import { ConsultationModal } from '@/components/booking/ConsultationModal'
import { getSubscriptionTier } from '@/lib/search/ranking'
import type { AvailabilitySlot } from '@/lib/availability'
import type { SubscriptionTier } from '@/lib/billing/cpa-model'

export interface SearchAttorney {
  id: string
  name: string
  slug: string
  specialty_slug?: string | null
  specialty_name?: string | null
  specialty?: { slug: string; name: string } | null
  address_city: string | null
  address_state: string | null
  address_county: string | null
  is_verified: boolean | null
  rating_average: number | null
  review_count: number | null
  phone: string | null
  bar_number: string | null
  is_featured: boolean | null
  distance_miles?: number | null
  /** Next available booking slot (from getNextAvailableBatch) */
  availability?: AvailabilitySlot | null
  // ── Trust signal fields ──────────────────────────────────────────
  years_experience?: number | null
  consultation_fee?: number | null // 0 = free consultation
  languages?: string[] | null
  response_time_hours?: number | null // avg response time in hours
  practice_areas?: { slug: string; name: string }[] | null
  // ── Subscription tier ────────────────────────────────────────────
  subscription_tier?: SubscriptionTier
  boost_level?: number | null
}

interface SearchResultCardProps {
  attorney: SearchAttorney
  index: number
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.25

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i <= fullStars
                ? 'text-amber-400 fill-amber-400'
                : i === fullStars + 1 && hasHalf
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-gray-200 dark:text-gray-600'
            )}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {rating.toFixed(1)}
      </span>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        ({count} review{count !== 1 ? 's' : ''})
      </span>
    </div>
  )
}

export function SearchResultCard({ attorney }: SearchResultCardProps) {
  const [showAllPAs, setShowAllPAs] = useState(false)
  const [showConsultation, setShowConsultation] = useState(false)

  const tier = attorney.subscription_tier || getSubscriptionTier(attorney.boost_level)
  const isPro = tier === 'pro'
  const isPremium = tier === 'premium'
  const isPaid = isPro || isPremium

  const specialtyName = attorney.specialty_name || attorney.specialty?.name || null
  const locationParts = [attorney.address_city, attorney.address_state].filter(Boolean)
  const locationText = locationParts.join(', ')
  const profileHref = `/attorneys/${attorney.slug}`
  const isFreeConsultation = attorney.consultation_fee != null && attorney.consultation_fee === 0

  // Practice areas: show top 3, expandable
  const practiceAreas = attorney.practice_areas || []
  const visiblePAs = showAllPAs ? practiceAreas : practiceAreas.slice(0, 3)
  const hiddenCount = practiceAreas.length - 3

  // Generate initials for avatar
  const initials = attorney.name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Generate a deterministic color from the name
  const colors = [
    'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600',
    'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
  ]
  const colorIndex = attorney.name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % colors.length
  const avatarColor = colors[colorIndex]

  return (
    <article
      className={cn(
        'group relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300',
        // Premium tier: gold gradient border
        isPremium
          ? 'border-amber-300 dark:border-amber-600 shadow-md shadow-amber-100/50 dark:shadow-amber-900/20 ring-1 ring-amber-200/50 dark:ring-amber-700/30'
          // Pro tier: blue border
          : isPro
            ? 'border-blue-300 dark:border-blue-600 shadow-md shadow-blue-100/50 dark:shadow-blue-900/20 ring-1 ring-blue-200/50 dark:ring-blue-700/30'
            // Featured (legacy)
            : attorney.is_featured
              ? 'border-amber-200 dark:border-amber-700 shadow-md shadow-amber-100/50 dark:shadow-amber-900/20'
              // Default
              : 'border-gray-100 dark:border-gray-700 shadow-sm',
        'hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-gray-900/40 hover:-translate-y-0.5 hover:border-gray-200 dark:hover:border-gray-600'
      )}
    >
      {/* Top accent bar for paid tiers */}
      {isPremium && (
        <div className="h-1 rounded-t-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
      )}
      {isPro && !isPremium && (
        <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400" />
      )}

      {/* Featured / Premium badge */}
      {isPremium && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-sm shadow-amber-500/30 z-10">
          Featured Attorney
        </div>
      )}
      {isPro && !isPremium && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/30 z-10">
          Pro
        </div>
      )}
      {!isPaid && attorney.is_featured && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold rounded-full shadow-sm shadow-amber-500/30">
          Featured
        </div>
      )}

      <Link
        href={profileHref}
        className="block p-5 sm:p-6"
        aria-label={`View profile of ${attorney.name}`}
      >
        <div className="flex gap-4 sm:gap-5">
          {/* Avatar with tier-based ring */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Ring for premium/pro */}
              {isPremium && (
                <div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 opacity-80"
                  aria-hidden="true"
                />
              )}
              {isPro && !isPremium && (
                <div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 opacity-70"
                  aria-hidden="true"
                />
              )}
              <div
                className={cn(
                  'relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-inner',
                  avatarColor
                )}
                aria-hidden="true"
              >
                {initials}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {attorney.name}
                  </h3>
                  {isPaid && <SubscriptionBadge tier={tier} size="sm" />}
                </div>
                {/* Badges row: Verified + Bar + Free consultation + Response time + Availability */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {attorney.is_verified && (
                    <VerifiedAttorneyBadge
                      isVerified={!!attorney.is_verified}
                      size="sm"
                    />
                  )}
                  {attorney.bar_number && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      <Shield className="w-3 h-3" />
                      Bar #{attorney.bar_number}
                    </span>
                  )}
                  {isFreeConsultation && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      <Award className="w-3 h-3" />
                      Free consultation
                    </span>
                  )}
                  {attorney.response_time_hours != null && attorney.response_time_hours > 0 && (
                    <ResponseTimeBadge
                      responseTimeHours={attorney.response_time_hours}
                      size="sm"
                    />
                  )}
                  {/* Availability badge -- Doctolib-inspired inline display */}
                  {'availability' in attorney && (
                    <AvailabilityBadge slot={attorney.availability} size="sm" />
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
            </div>

            {/* Rating */}
            {attorney.rating_average && attorney.rating_average > 0 && (
              <div className="mt-2.5">
                <StarRating
                  rating={attorney.rating_average}
                  count={attorney.review_count || 0}
                />
              </div>
            )}

            {/* Practice area + location + experience + distance + languages */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm">
              {specialtyName && (
                <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  {specialtyName}
                </span>
              )}
              {locationText && (
                <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  {locationText}
                </span>
              )}
              {attorney.distance_miles != null && (
                <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {attorney.distance_miles.toFixed(1)} mi away
                </span>
              )}
              {attorney.years_experience != null && attorney.years_experience > 0 && (
                <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {attorney.years_experience} yr{attorney.years_experience !== 1 ? 's' : ''} experience
                </span>
              )}
              {attorney.languages && attorney.languages.length > 1 && (
                <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Globe className="w-3.5 h-3.5" />
                  {attorney.languages.slice(0, 3).join(', ')}
                  {attorney.languages.length > 3 && ` +${attorney.languages.length - 3}`}
                </span>
              )}
            </div>

            {/* Practice area tags (top 3, expandable) */}
            {practiceAreas.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {visiblePAs.map((pa) => (
                  <span
                    key={pa.slug}
                    className="inline-block text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full"
                  >
                    {pa.name}
                  </span>
                ))}
                {hiddenCount > 0 && !showAllPAs && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowAllPAs(true)
                    }}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full transition-colors"
                    aria-label={`Show ${hiddenCount} more practice areas`}
                  >
                    +{hiddenCount} more
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Phone + CTA on desktop */}
            <div className="hidden sm:flex items-center gap-4 mt-4">
              {attorney.phone && (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-3.5 h-3.5" />
                  {attorney.phone}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowConsultation(true)
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors rounded-full',
                  // Premium CTA: more prominent
                  isPremium
                    ? 'text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-1.5 shadow-sm shadow-amber-500/20'
                    : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
                )}
                aria-label={`Request consultation with ${attorney.name}`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Consultation
              </button>
              <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                View profile
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Mobile CTA bar */}
        <div className="sm:hidden mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowConsultation(true)
            }}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold rounded-full',
              isPremium
                ? 'text-white bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 shadow-sm'
                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1',
            )}
            aria-label={`Request consultation with ${attorney.name}`}
          >
            <MessageCircle className="w-3 h-3" />
            Consultation
          </button>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
            View profile
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {/* Consultation Modal */}
      {showConsultation && (
        <ConsultationModal
          isOpen={showConsultation}
          onClose={() => setShowConsultation(false)}
          attorney={{
            id: attorney.id,
            name: attorney.name,
            slug: attorney.slug,
            specialty: specialtyName,
          }}
        />
      )}
    </article>
  )
}

export default SearchResultCard
