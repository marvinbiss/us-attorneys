'use client'

/**
 * Stub — real-time availability removed in v2 cleanup.
 * Will be re-implemented with Supabase Realtime subscriptions.
 */

export interface Slot {
  id: string
  date: string
  time: string
  startTime: string
  endTime: string
  duration: number
  is_available: boolean
  isAvailable: boolean
  is_peak: boolean
  isPeak: boolean
  price_modifier: number
  priceModifier: number
  teamMemberName?: string
  isOptimistic?: boolean
  price?: number
}

interface UseRealTimeAvailabilityOptions {
  attorneyId?: string
  month?: string
  enabled?: boolean
}

export function useRealTimeAvailability(_options?: UseRealTimeAvailabilityOptions | string) {
  return {
    slots: {} as Record<string, Slot[]>,
    loading: false,
    isLoading: false,
    error: null as string | null,
    refresh: async () => {},
    optimisticallyReserve: (_slotId: string) => {},
    cancelOptimisticReservation: (_slotId: string) => {},
  }
}
