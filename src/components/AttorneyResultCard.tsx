'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star, CheckCircle, Building2, Wrench, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAttorneyUrl } from '@/lib/utils'
import { CompareButton } from '@/components/ui/CompareButton'

interface TimeSlot {
  time: string
  available: boolean
}

interface DayAvailability {
  date: string
  dayName: string
  dayNumber: number
  month: string
  slots: TimeSlot[]
}

interface Attorney {
  id: string
  stable_id?: string
  slug?: string
  business_name: string | null
  first_name: string | null
  last_name: string | null
  city: string
  postal_code: string
  address?: string
  specialty: string
  description?: string
  average_rating: number
  review_count: number
  is_verified: boolean
  is_center?: boolean
  team_size?: number
  distance?: number
  accepts_new_clients?: boolean
  intervention_zone?: string
}

interface AttorneyResultCardProps {
  attorney: Attorney
  availability?: DayAvailability[]
  showDistance?: boolean
}

export default function AttorneyResultCard({
  attorney,
  availability,
  showDistance = true,
}: AttorneyResultCardProps) {
  const router = useRouter()
  const [calendarOffset, setCalendarOffset] = useState(0)
  const [localAvailability, setLocalAvailability] = useState<DayAvailability[]>(availability || [])
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadAvailability = useCallback(
    async (startDate?: Date) => {
      try {
        const params = new URLSearchParams({
          attorneyIds: attorney.id,
          days: '5',
        })
        if (startDate) {
          params.set('startDate', startDate.toISOString().split('T')[0])
        }

        const response = await fetch(`/api/availability/slots?${params}`)
        if (response.ok) {
          const data = await response.json()
          if (data.availability[attorney.id]) {
            setLocalAvailability(data.availability[attorney.id])
          }
        }
      } catch (error: unknown) {
        console.error('Failed to load availability:', error)
      }
    },
    [attorney.id]
  )

  // Load availability if not provided
  useEffect(() => {
    if (!availability) {
      loadAvailability()
    }
  }, [availability, loadAvailability])

  const loadMoreDays = async (direction: 'prev' | 'next') => {
    setIsLoadingMore(true)
    const newOffset = direction === 'next' ? calendarOffset + 5 : calendarOffset - 5

    const startDate = new Date()
    startDate.setDate(startDate.getDate() + newOffset)

    await loadAvailability(startDate)
    setCalendarOffset(newOffset)
    setIsLoadingMore(false)
  }

  const handleSlotClick = (date: string, time: string) => {
    router.push(`/booking/${attorney.id}?date=${date}&time=${time}`)
  }

  const formatDistance = (meters?: number) => {
    if (!meters) return null
    if (meters < 1000) return `${meters} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  const displayName = attorney.is_center
    ? attorney.business_name
    : attorney.business_name || `${attorney.first_name || ''} ${attorney.last_name || ''}`.trim()

  const hasAnyAvailability = localAvailability.some((day) => day.slots.length > 0)
  const firstAvailableDate = localAvailability.find((day) => day.slots.length > 0)

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4 sm:p-6">
        <div className="flex gap-4">
          {/* Avatar / Logo */}
          <div className="flex-shrink-0">
            {attorney.is_center ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white">
                {displayName?.charAt(0) || 'A'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                {/* Name & Distance */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={getAttorneyUrl(attorney)}
                    className="text-lg font-semibold text-blue-600 hover:underline"
                  >
                    {displayName}
                  </Link>
                  {showDistance && attorney.distance && (
                    <span className="text-sm text-gray-500">
                      {formatDistance(attorney.distance)}
                    </span>
                  )}
                </div>

                {/* Specialty */}
                <p className="text-gray-600">{attorney.specialty}</p>

                {/* Team size for centers */}
                {attorney.is_center && attorney.team_size && (
                  <p className="text-sm text-gray-500">
                    {attorney.team_size} professional{attorney.team_size > 1 ? 's' : ''}
                  </p>
                )}

                {/* Address */}
                <div className="mt-2 text-sm text-gray-600">
                  {attorney.address && <p>{attorney.address}</p>}
                  <p>
                    {attorney.postal_code} {attorney.city}
                  </p>
                </div>

                {/* Intervention Zone */}
                {attorney.intervention_zone && (
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span>Zone: {attorney.intervention_zone}</span>
                  </div>
                )}

                {/* Badges */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {attorney.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                      <CheckCircle className="h-3 w-3" />
                      Certified
                    </span>
                  )}
                  {attorney.is_center && (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      <Wrench className="h-3 w-3" />
                      Firm
                    </span>
                  )}
                  <CompareButton
                    provider={{
                      id: attorney.id,
                      name: displayName || attorney.id,
                      slug: attorney.slug || attorney.stable_id || attorney.id,
                      stable_id: attorney.stable_id,
                      address_city: attorney.city || undefined,
                      is_verified: attorney.is_verified,
                      rating_average: attorney.average_rating || undefined,
                      review_count: attorney.review_count || undefined,
                    }}
                    size="sm"
                  />
                </div>
              </div>

              {/* Rating */}
              {attorney.average_rating > 0 && (
                <div className="flex flex-shrink-0 items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{attorney.average_rating.toFixed(1)}</span>
                  <span className="text-gray-400">({attorney.review_count})</span>
                </div>
              )}
            </div>

            {/* Availability Calendar */}
            <div className="mt-4">
              <div className="relative">
                {/* Navigation Arrows */}
                {calendarOffset > 0 && (
                  <button
                    onClick={() => loadMoreDays('prev')}
                    disabled={isLoadingMore}
                    className="absolute left-0 top-1/2 z-10 -translate-x-2 -translate-y-1/2 rounded-full bg-white p-1 shadow hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => loadMoreDays('next')}
                  disabled={isLoadingMore}
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-2 rounded-full bg-white p-1 shadow hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Calendar Grid */}
                <div className="flex gap-1 overflow-x-auto px-2 pb-2">
                  {localAvailability.map((day, dayIndex) => (
                    <div key={dayIndex} className="w-[72px] flex-shrink-0 text-center">
                      {/* Day Header */}
                      <div className="mb-1 text-xs text-gray-500">{day.dayName}</div>
                      <div className="mb-2 text-sm font-medium text-gray-700">
                        {day.dayNumber} {day.month}
                      </div>

                      {/* Slots */}
                      <div className="min-h-[100px] space-y-1">
                        {day.slots.length > 0
                          ? day.slots.slice(0, 4).map((slot, slotIndex) => (
                              <button
                                key={slotIndex}
                                onClick={() => handleSlotClick(day.date, slot.time)}
                                className="w-full rounded bg-blue-50 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                              >
                                {slot.time}
                              </button>
                            ))
                          : // No slots - show dashes
                            [...Array(4)].map((_, i) => (
                              <div key={i} className="py-1.5 text-xs text-gray-300">
                                —
                              </div>
                            ))}
                      </div>
                    </div>
                  ))}

                  {/* Loading state */}
                  {isLoadingMore && (
                    <div className="flex w-[72px] flex-shrink-0 items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability Note */}
              <div className="mt-2 text-xs text-gray-500">
                {attorney.accepts_new_clients === false ? (
                  <span className="text-amber-600">
                    This attorney reserves online booking for existing clients only.
                  </span>
                ) : hasAnyAvailability && firstAvailableDate ? (
                  <span>
                    Available from {firstAvailableDate.dayName}, {firstAvailableDate.month}{' '}
                    {firstAvailableDate.dayNumber}
                  </span>
                ) : (
                  <span>No online availability</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
