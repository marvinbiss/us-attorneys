'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Provider {
  id: string
  name: string
  slug: string
  bar_number: string | null
  phone: string | null
  email: string | null
  is_verified: boolean
  is_active: boolean
  stable_id: string | null
  noindex: boolean | null
  address_city: string | null
  address_zip: string | null
  address_line1: string | null
  address_state: string | null
  address_county: string | null
  specialty: { slug: string; name: string } | null
  rating_average: number
  review_count: number
  created_at: string
}

export interface AttorneyStats {
  totalBookings: number
  completedBookings: number
  pendingBookings: number
  totalRevenue: number
  averageRating: number
  reviewCount: number
  responseRate: number
  responseTime: number
}

interface UseProviderReturn {
  provider: Provider | null
  stats: AttorneyStats | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateAttorney: (data: Partial<Provider>) => Promise<void>
}

export function useProvider(): UseProviderReturn {
  const [provider, setProvider] = useState<Provider | null>(null)
  const [stats, setStats] = useState<AttorneyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchAttorney = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProvider(null)
        setStats(null)
        return
      }

      // Fetch provider profile with explicit column list
      const { data: attorneyData, error: attorneyError } = await supabase
        .from('attorneys')
        .select('id, name, slug, email, phone, bar_number, is_verified, is_active, stable_id, noindex, address_city, address_zip, address_line1, address_state, address_county, rating_average, review_count, created_at, specialty:specialties!primary_specialty_id(slug,name)')
        .eq('user_id', user.id)
        .single()

      if (attorneyError) {
        if (attorneyError.code === 'PGRST116') {
          // No provider found
          setProvider(null)
          setStats(null)
          return
        }
        throw attorneyError
      }

      // Supabase returns FK joins as arrays; unwrap to single object
      const specialty = Array.isArray(attorneyData.specialty)
        ? attorneyData.specialty[0] ?? null
        : attorneyData.specialty ?? null
      setProvider({ ...attorneyData, specialty } as Provider)

      // Fetch provider stats in parallel to avoid N+1 queries
      const [{ data: bookingsData }, { data: reviewsData }] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, status')
          .eq('attorney_id', attorneyData.id)
          .limit(500),
        supabase
          .from('reviews')
          .select('rating')
          .eq('attorney_id', attorneyData.id)
          .limit(500),
      ])

      if (bookingsData) {
        const completed = bookingsData.filter(b => b.status === 'completed')
        const pending = bookingsData.filter(b => b.status === 'pending')
        const totalRevenue = 0 // bookings table has no price column

        const ratings = reviewsData?.map(r => r.rating) || []
        const avgRating = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0

        setStats({
          totalBookings: bookingsData.length,
          completedBookings: completed.length,
          pendingBookings: pending.length,
          totalRevenue,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: ratings.length,
          responseRate: 95, // Mock - would calculate from messages
          responseTime: 2, // Mock - hours
        })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Failed to fetch provider'))
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const updateAttorney = useCallback(async (data: Partial<Provider>) => {
    if (!provider) throw new Error('No provider to update')

    try {
      const { error: updateError } = await supabase
        .from('attorneys')
        .update(data)
        .eq('id', provider.id)

      if (updateError) throw updateError

      setProvider(prev => prev ? { ...prev, ...data } : null)
    } catch (err: unknown) {
      throw err instanceof Error ? err : new Error('Failed to update provider')
    }
  }, [provider, supabase])

  useEffect(() => {
    fetchAttorney()
  }, [fetchAttorney])

  return {
    provider,
    stats,
    isLoading,
    error,
    refetch: fetchAttorney,
    updateAttorney,
  }
}

export default useProvider
