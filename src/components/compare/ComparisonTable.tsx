'use client'

import { useState, useRef, useCallback } from 'react'
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
  Crown,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Scale as ScaleIcon,
  Calendar,
  Building2,
  Trophy,
  Zap,
  TrendingUp,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials, getAvatarColor } from '@/lib/utils'
import type { CompareAttorney } from '@/app/api/compare/route'

interface ComparisonTableProps {
  attorneys: CompareAttorney[]
  onRemove: (slug: string) => void
}

// ── Helper: find the "best" attorney for a numeric metric ──────────────
function findBestId(
  attorneys: CompareAttorney[],
  getter: (a: CompareAttorney) => number | null | undefined,
  mode: 'max' | 'min' = 'max'
): string | null {
  let bestId: string | null = null
  let bestVal: number | null = null
  for (const a of attorneys) {
    const val = getter(a)
    if (val == null) continue
    if (bestVal == null || (mode === 'max' ? val > bestVal : val < bestVal)) {
      bestVal = val
      bestId = a.id
    }
  }
  return bestId
}

// ── "Best for" recommendation badges ─────────────────────────────────
interface RecommendBadge {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

function computeBadges(
  attorneys: CompareAttorney[],
  bestRating: string | null,
  bestExperience: string | null,
  bestResponseTime: string | null,
  bestReviews: string | null,
  bestFee: string | null
): Map<string, RecommendBadge[]> {
  const map = new Map<string, RecommendBadge[]>()
  attorneys.forEach((a) => map.set(a.id, []))

  if (attorneys.length < 2) return map

  if (bestRating) {
    map.get(bestRating)?.push({ label: 'Best Rated', icon: Trophy, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' })
  }
  if (bestExperience) {
    map.get(bestExperience)?.push({ label: 'Most Experienced', icon: GraduationCap, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' })
  }
  if (bestResponseTime) {
    map.get(bestResponseTime)?.push({ label: 'Fastest Response', icon: Zap, color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' })
  }
  if (bestReviews) {
    map.get(bestReviews)?.push({ label: 'Most Reviewed', icon: TrendingUp, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' })
  }
  if (bestFee) {
    const fee = attorneys.find((a) => a.id === bestFee)?.consultation_fee
    if (fee === 0) {
      map.get(bestFee)?.push({ label: 'Free Consultation', icon: Target, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' })
    }
  }

  return map
}

// ── Star rating display ──────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.25

  return (
    <div className="flex flex-col items-center gap-1">
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
      <span className="text-xs text-gray-500 dark:text-gray-400">
        ({count} review{count !== 1 ? 's' : ''})
      </span>
    </div>
  )
}

// ── Common practice areas highlight ──────────────────────────────────
function PracticeAreaTags({
  areas,
  commonSlugs,
}: {
  areas: { slug: string; name: string }[]
  commonSlugs: Set<string>
}) {
  if (areas.length === 0) {
    return <span className="text-sm text-gray-400 dark:text-gray-500">Not specified</span>
  }
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {areas.map((pa) => (
        <span
          key={pa.slug}
          className={cn(
            'inline-block text-xs font-medium px-2 py-0.5 rounded-full',
            commonSlugs.has(pa.slug)
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-700'
              : 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20'
          )}
        >
          {pa.name}
        </span>
      ))}
    </div>
  )
}

// ── Row component ────────────────────────────────────────────────────
function CompareRow({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid items-start gap-4 py-4 border-b border-gray-100 dark:border-gray-800', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 col-span-full px-4 pb-2">
        <Icon className="w-4 h-4 flex-shrink-0" />
        {label}
      </div>
      {children}
    </div>
  )
}

// ── Cell value wrapper ───────────────────────────────────────────────
function CellValue({
  isBest,
  children,
}: {
  isBest?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center px-3 py-2 rounded-lg min-h-[40px] justify-center',
        isBest && 'bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800'
      )}
    >
      {children}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────
export function ComparisonTable({ attorneys, onRemove }: ComparisonTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPos, setScrollPos] = useState(0)

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollPos(scrollRef.current.scrollLeft)
    }
  }, [])

  const scrollTo = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const cardWidth = 280
    const newPos = direction === 'left'
      ? scrollRef.current.scrollLeft - cardWidth
      : scrollRef.current.scrollLeft + cardWidth
    scrollRef.current.scrollTo({ left: newPos, behavior: 'smooth' })
  }, [])

  if (attorneys.length === 0) {
    return (
      <div className="text-center py-16">
        <ScaleIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No attorneys to compare
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Add attorneys from search results to start comparing.
        </p>
        <Link
          href="/practice-areas"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse attorneys
        </Link>
      </div>
    )
  }

  // ── Compute "best" for each metric ─────────────────────────────────
  const bestRating = findBestId(attorneys, (a) => a.rating_average)
  const bestExperience = findBestId(attorneys, (a) => a.years_experience)
  const bestResponseTime = findBestId(attorneys, (a) => a.response_time_hours, 'min')
  const bestFee = findBestId(attorneys, (a) => a.consultation_fee, 'min')
  const bestReviews = findBestId(attorneys, (a) => a.review_count)

  const badges = computeBadges(attorneys, bestRating, bestExperience, bestResponseTime, bestReviews, bestFee)

  // Overall "winner" based on rating (with review count as tiebreaker)
  const winnerId = attorneys.reduce((best, a) => {
    const bestRat = best.rating_average || 0
    const aRat = a.rating_average || 0
    if (aRat > bestRat) return a
    if (aRat === bestRat && (a.review_count || 0) > (best.review_count || 0)) return a
    return best
  }, attorneys[0]).id

  // Common practice areas across all attorneys
  const allPASets = attorneys.map(
    (a) => new Set(a.practice_areas.map((pa) => pa.slug))
  )
  const commonPASlugs = new Set<string>()
  if (allPASets.length >= 2) {
    for (const slug of Array.from(allPASets[0])) {
      if (allPASets.every((s) => s.has(slug))) {
        commonPASlugs.add(slug)
      }
    }
  }

  const colCount = attorneys.length

  const gridCols = colCount === 2
    ? 'grid-cols-2'
    : colCount === 3
      ? 'grid-cols-3'
      : 'grid-cols-4'

  const canScrollLeft = scrollPos > 0
  const canScrollRight = scrollRef.current
    ? scrollPos < scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 5
    : false

  return (
    <div className="relative">
      {/* Mobile scroll controls */}
      <div className="md:hidden flex justify-between items-center mb-3 px-2">
        <button
          type="button"
          onClick={() => scrollTo('left')}
          disabled={!canScrollLeft}
          className={cn(
            'p-2 rounded-full border transition-colors',
            canScrollLeft
              ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Swipe to compare
        </span>
        <button
          type="button"
          onClick={() => scrollTo('right')}
          disabled={!canScrollRight}
          className={cn(
            'p-2 rounded-full border transition-colors',
            canScrollRight
              ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable container for mobile, grid for desktop */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="md:overflow-visible overflow-x-auto snap-x snap-mandatory scrollbar-hide"
      >
        <div className="min-w-[560px] md:min-w-0">
          {/* ── Sticky header with attorney photos and names ──────── */}
          <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b-2 border-gray-200 dark:border-gray-700 pb-4">
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => {
                const initials = getInitials(a.name)
                const avatarColor = getAvatarColor(a.name)
                const isWinner = a.id === winnerId && attorneys.length >= 2

                return (
                  <div key={a.id} className="flex flex-col items-center text-center snap-center relative pt-2">
                    {/* Winner crown */}
                    {isWinner && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                        <Crown className="w-6 h-6 text-amber-500 fill-amber-400" />
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => onRemove(a.slug)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                      aria-label={`Remove ${a.name} from comparison`}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner bg-gradient-to-br',
                        avatarColor,
                        isWinner && 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-gray-900'
                      )}
                    >
                      {initials}
                    </div>

                    {/* Name + verified */}
                    <div className="mt-2 flex items-center gap-1">
                      <Link
                        href={`/attorneys/${a.slug}`}
                        className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {a.name}
                      </Link>
                      {a.is_verified && (
                        <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" aria-label="Verified" />
                      )}
                    </div>

                    {/* Firm name */}
                    {a.firm_name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {a.firm_name}
                      </span>
                    )}

                    {/* Recommendation badges */}
                    {(badges.get(a.id) ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mt-2">
                        {(badges.get(a.id) ?? []).map((badge) => {
                          const BadgeIcon = badge.icon
                          return (
                            <span
                              key={badge.label}
                              className={cn(
                                'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
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
                )
              })}
            </div>
          </div>

          {/* ── Rating row ─────────────────────────────────────────── */}
          <CompareRow label="Rating" icon={Star}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id} isBest={a.id === bestRating}>
                  {a.rating_average && a.rating_average > 0 ? (
                    <StarRating rating={a.rating_average} count={a.review_count || 0} />
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">No reviews</span>
                  )}
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Practice areas ─────────────────────────────────────── */}
          <CompareRow label="Practice Areas" icon={Briefcase}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id}>
                  <PracticeAreaTags areas={a.practice_areas} commonSlugs={commonPASlugs} />
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Experience ─────────────────────────────────────────── */}
          <CompareRow label="Experience" icon={GraduationCap}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id} isBest={a.id === bestExperience}>
                  {a.years_experience != null ? (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {a.years_experience} year{a.years_experience !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Not specified</span>
                  )}
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Location ──────────────────────────────────────────── */}
          <CompareRow label="Location" icon={MapPin}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => {
                const parts = [a.address_city, a.address_state].filter(Boolean)
                return (
                  <CellValue key={a.id}>
                    {parts.length > 0 ? (
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {parts.join(', ')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">Not specified</span>
                    )}
                  </CellValue>
                )
              })}
            </div>
          </CompareRow>

          {/* ── Response time ─────────────────────────────────────── */}
          <CompareRow label="Response Time" icon={Clock}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id} isBest={a.id === bestResponseTime}>
                  {a.response_time_hours != null && a.response_time_hours > 0 ? (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {a.response_time_hours < 1
                        ? `${Math.round(a.response_time_hours * 60)} min`
                        : a.response_time_hours < 24
                          ? `${a.response_time_hours.toFixed(0)} hr${a.response_time_hours !== 1 ? 's' : ''}`
                          : `${Math.round(a.response_time_hours / 24)} day${Math.round(a.response_time_hours / 24) !== 1 ? 's' : ''}`}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Not specified</span>
                  )}
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Consultation fee ──────────────────────────────────── */}
          <CompareRow label="Consultation Fee" icon={DollarSign}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id} isBest={a.id === bestFee}>
                  {a.consultation_fee != null ? (
                    a.consultation_fee === 0 ? (
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Free
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${a.consultation_fee}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Not specified</span>
                  )}
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Languages ─────────────────────────────────────────── */}
          <CompareRow label="Languages" icon={Globe}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id}>
                  {a.languages && a.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {a.languages.map((lang) => (
                        <span
                          key={lang}
                          className="inline-block text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">English</span>
                  )}
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Bar admissions ────────────────────────────────────── */}
          <CompareRow label="Bar Admissions" icon={Building2}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id}>
                  {a.bar_admissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {a.bar_admissions.map((ba) => (
                        <span
                          key={`${ba.state}-${ba.bar_number}`}
                          className={cn(
                            'inline-block text-xs font-medium px-2 py-0.5 rounded-full',
                            ba.status === 'active' || ba.status === 'Active'
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                              : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
                          )}
                        >
                          {ba.state}
                        </span>
                      ))}
                    </div>
                  ) : a.bar_state ? (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {a.bar_state}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Not specified</span>
                  )}
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Review count ──────────────────────────────────────── */}
          <CompareRow label="Total Reviews" icon={MessageCircle}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id} isBest={a.id === bestReviews}>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {a.review_count || 0} review{(a.review_count || 0) !== 1 ? 's' : ''}
                  </span>
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Win rate (if available) ────────────────────────────── */}
          {attorneys.some((a) => a.win_rate != null && a.win_rate > 0) && (
            <CompareRow label="Win Rate" icon={Target}>
              <div className={cn('grid gap-4 px-4', gridCols)}>
                {attorneys.map((a) => {
                  const bestWinRate = findBestId(attorneys, (x) => x.win_rate)
                  return (
                    <CellValue key={a.id} isBest={a.id === bestWinRate}>
                      {a.win_rate != null && a.win_rate > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {(a.win_rate * 100).toFixed(0)}%
                          </span>
                          {a.cases_handled != null && a.cases_handled > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {a.cases_handled} cases
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                      )}
                    </CellValue>
                  )
                })}
              </div>
            </CompareRow>
          )}

          {/* ── Verified status ────────────────────────────────────── */}
          <CompareRow label="Verified" icon={Shield}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id}>
                  {a.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      <Shield className="w-4 h-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Not verified</span>
                  )}
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── Member since ──────────────────────────────────────── */}
          <CompareRow label="Listed Since" icon={Calendar}>
            <div className={cn('grid gap-4 px-4', gridCols)}>
              {attorneys.map((a) => (
                <CellValue key={a.id}>
                  {a.created_at ? (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(a.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">Unknown</span>
                  )}
                </CellValue>
              ))}
            </div>
          </CompareRow>

          {/* ── CTA row ──────────────────────────────────────────── */}
          <div className={cn('grid gap-4 px-4 py-6', gridCols)}>
            {attorneys.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-2">
                <Link
                  href={`/attorneys/${a.slug}`}
                  className="w-full text-center px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href={`/attorneys/${a.slug}#consultation`}
                  className="w-full text-center px-4 py-2.5 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultation
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComparisonTable
