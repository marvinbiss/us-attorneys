'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  Star,
  Shield,
  MapPin,
  Clock,
  Globe,
  GraduationCap,
  Briefcase,
  Award,
  X,
  MessageCircle,
  DollarSign,
  Building2,
  Target,
  Trophy,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials, getAvatarColor } from '@/lib/utils'
import type { CompareAttorney } from '@/app/api/compare/route'

interface ComparisonCardProps {
  attorneys: CompareAttorney[]
  onRemove: (slug: string) => void
}

// ── Badge computation ────────────────────────────────────────────────
function getAttorneyBadges(attorney: CompareAttorney, all: CompareAttorney[]): { label: string; icon: typeof Trophy; color: string }[] {
  if (all.length < 2) return []
  const badges: { label: string; icon: typeof Trophy; color: string }[] = []

  // Best rated
  const withRating = all.filter((a) => a.rating_average != null && a.rating_average > 0)
  if (withRating.length > 0) {
    const best = withRating.reduce((a, b) => ((a.rating_average ?? 0) >= (b.rating_average ?? 0) ? a : b))
    if (best.id === attorney.id) {
      badges.push({ label: 'Best Rated', icon: Trophy, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' })
    }
  }

  // Most experienced
  const withExp = all.filter((a) => a.years_experience != null && a.years_experience > 0)
  if (withExp.length > 0) {
    const best = withExp.reduce((a, b) => ((a.years_experience ?? 0) >= (b.years_experience ?? 0) ? a : b))
    if (best.id === attorney.id) {
      badges.push({ label: 'Most Experienced', icon: GraduationCap, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' })
    }
  }

  // Fastest response
  const withResponse = all.filter((a) => a.response_time_hours != null && a.response_time_hours > 0)
  if (withResponse.length > 0) {
    const best = withResponse.reduce((a, b) => ((a.response_time_hours ?? Infinity) <= (b.response_time_hours ?? Infinity) ? a : b))
    if (best.id === attorney.id) {
      badges.push({ label: 'Fastest Response', icon: Zap, color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' })
    }
  }

  // Most reviewed
  const withReviews = all.filter((a) => a.review_count != null && a.review_count > 0)
  if (withReviews.length > 0) {
    const best = withReviews.reduce((a, b) => ((a.review_count ?? 0) >= (b.review_count ?? 0) ? a : b))
    if (best.id === attorney.id) {
      badges.push({ label: 'Most Reviewed', icon: TrendingUp, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' })
    }
  }

  return badges
}

// ── Star rating ──────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'
            )}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-500">({count})</span>
    </div>
  )
}

// ── Detail row ───────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, children }: { icon: typeof Star; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex-1 text-sm text-gray-900 dark:text-white">{children}</div>
    </div>
  )
}

// ── Single attorney card ─────────────────────────────────────────────
function AttorneyMobileCard({
  attorney,
  allAttorneys,
  onRemove,
}: {
  attorney: CompareAttorney
  allAttorneys: CompareAttorney[]
  onRemove: (slug: string) => void
}) {
  const initials = getInitials(attorney.name)
  const avatarColor = getAvatarColor(attorney.name)
  const badges = getAttorneyBadges(attorney, allAttorneys)
  const location = [attorney.address_city, attorney.address_state].filter(Boolean).join(', ')

  return (
    <div className="w-full flex-shrink-0 snap-center px-2">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="relative p-5 pb-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(attorney.slug)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
            aria-label={`Remove ${attorney.name}`}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner bg-gradient-to-br flex-shrink-0',
                avatarColor
              )}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/attorneys/${attorney.slug}`}
                  className="text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                >
                  {attorney.name}
                </Link>
                {attorney.is_verified && (
                  <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" aria-label="Verified" />
                )}
              </div>
              {attorney.firm_name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{attorney.firm_name}</p>
              )}
              {location && (
                <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="mt-3">
            {attorney.rating_average && attorney.rating_average > 0 ? (
              <StarRating rating={attorney.rating_average} count={attorney.review_count || 0} />
            ) : (
              <span className="text-sm text-gray-400">No reviews yet</span>
            )}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {badges.map((badge) => {
                const BadgeIcon = badge.icon
                return (
                  <span
                    key={badge.label}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                      badge.color
                    )}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="px-5 py-3">
          {attorney.years_experience != null && (
            <DetailRow icon={GraduationCap} label="Experience">
              <span className="font-medium">{attorney.years_experience} year{attorney.years_experience !== 1 ? 's' : ''}</span>
            </DetailRow>
          )}

          {attorney.practice_areas.length > 0 && (
            <DetailRow icon={Briefcase} label="Practice">
              <div className="flex flex-wrap gap-1">
                {attorney.practice_areas.map((pa) => (
                  <span key={pa.slug} className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 font-medium">
                    {pa.name}
                  </span>
                ))}
              </div>
            </DetailRow>
          )}

          <DetailRow icon={DollarSign} label="Fee">
            {attorney.consultation_fee != null ? (
              attorney.consultation_fee === 0 ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Free
                </span>
              ) : (
                <span className="font-medium">${attorney.consultation_fee}</span>
              )
            ) : (
              <span className="text-gray-400">Contact for pricing</span>
            )}
          </DetailRow>

          {attorney.response_time_hours != null && attorney.response_time_hours > 0 && (
            <DetailRow icon={Clock} label="Response">
              <span className="font-medium">
                {attorney.response_time_hours < 1
                  ? `${Math.round(attorney.response_time_hours * 60)} min`
                  : attorney.response_time_hours < 24
                    ? `${attorney.response_time_hours.toFixed(0)} hr${attorney.response_time_hours !== 1 ? 's' : ''}`
                    : `${Math.round(attorney.response_time_hours / 24)} day${Math.round(attorney.response_time_hours / 24) !== 1 ? 's' : ''}`}
              </span>
            </DetailRow>
          )}

          {attorney.languages && attorney.languages.length > 0 && (
            <DetailRow icon={Globe} label="Languages">
              <div className="flex flex-wrap gap-1">
                {attorney.languages.map((lang) => (
                  <span key={lang} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </DetailRow>
          )}

          {(attorney.bar_admissions.length > 0 || attorney.bar_state) && (
            <DetailRow icon={Building2} label="Bar">
              <div className="flex flex-wrap gap-1">
                {attorney.bar_admissions.length > 0
                  ? attorney.bar_admissions.map((ba) => (
                      <span
                        key={`${ba.state}-${ba.bar_number}`}
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          ba.status === 'active' || ba.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        )}
                      >
                        {ba.state}
                      </span>
                    ))
                  : attorney.bar_state && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 font-medium">
                        {attorney.bar_state}
                      </span>
                    )}
              </div>
            </DetailRow>
          )}

          {attorney.win_rate != null && attorney.win_rate > 0 && (
            <DetailRow icon={Target} label="Win Rate">
              <div className="flex items-center gap-2">
                <span className="font-bold">{(attorney.win_rate * 100).toFixed(0)}%</span>
                {attorney.cases_handled != null && attorney.cases_handled > 0 && (
                  <span className="text-xs text-gray-500">({attorney.cases_handled} cases)</span>
                )}
              </div>
            </DetailRow>
          )}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <Link
            href={`/attorneys/${attorney.slug}`}
            className="w-full text-center px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            View Profile
          </Link>
          <Link
            href={`/attorneys/${attorney.slug}#consultation`}
            className="w-full text-center px-4 py-2.5 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            Request Consultation
          </Link>
          {attorney.phone && (
            <a
              href={`tel:${attorney.phone}`}
              className="w-full text-center px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <Phone className="w-4 h-4" />
              {attorney.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main swipeable card container ────────────────────────────────────
export function ComparisonCard({ attorneys, onRemove }: ComparisonCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const scrollLeft = scrollRef.current.scrollLeft
    const cardWidth = scrollRef.current.clientWidth
    const index = Math.round(scrollLeft / cardWidth)
    setActiveIndex(Math.min(index, attorneys.length - 1))
  }, [attorneys.length])

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.clientWidth
    scrollRef.current.scrollTo({ left: cardWidth * index, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  if (attorneys.length === 0) return null

  return (
    <div className="relative">
      {/* Navigation arrows */}
      {activeIndex > 0 && (
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          aria-label="Previous attorney"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {activeIndex < attorneys.length - 1 && (
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          aria-label="Next attorney"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-2"
        role="region"
        aria-label="Attorney cards - swipe to compare"
        aria-roledescription="carousel"
      >
        {attorneys.map((attorney) => (
          <AttorneyMobileCard
            key={attorney.id}
            attorney={attorney}
            allAttorneys={attorneys}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Dots indicator */}
      {attorneys.length > 1 && (
        <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Attorney cards">
          {attorneys.map((attorney, index) => (
            <button
              key={attorney.id}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                index === activeIndex
                  ? 'bg-blue-600 dark:bg-blue-400 scale-125'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              )}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`View ${attorney.name}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ComparisonCard
