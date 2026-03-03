/**
 * Analytics Service
 * Comprehensive tracking and reporting for the platform
 */

import { createClient as createServerClient } from '@/lib/supabase/server'

export interface AnalyticsEvent {
  event_type: string
  user_id?: string
  provider_id?: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

export interface DashboardMetrics {
  totalUsers: number
  totalProviders: number
  totalBookings: number
  totalRevenue: number
  bookingsThisMonth: number
  revenueThisMonth: number
  newUsersThisMonth: number
  conversionRate: number
  averageBookingValue: number
  topServices: { service: string; count: number }[]
  topCities: { city: string; count: number }[]
  bookingsByDay: { date: string; count: number }[]
  revenueByMonth: { month: string; amount: number }[]
}

export interface ProviderMetrics {
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
  profileViews: number
  quoteRequests: number
  quoteAcceptanceRate: number
  responseTime: number // in minutes
  bookingsByMonth: { month: string; count: number }[]
  revenueByMonth: { month: string; amount: number }[]
  topServices: { service: string; count: number }[]
}

export class AnalyticsService {
  /**
   * Track an analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const supabase = await createServerClient()

    await supabase.from('analytics_events').insert({
      event_type: event.event_type,
      user_id: event.user_id,
      provider_id: event.provider_id,
      metadata: event.metadata,
      created_at: event.timestamp || new Date().toISOString(),
    })
  }

  /**
   * Track page view
   */
  async trackPageView(
    path: string,
    userId?: string,
    referrer?: string
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'page_view',
      user_id: userId,
      metadata: { path, referrer },
    })
  }

  /**
   * Track search
   */
  async trackSearch(
    query: string,
    results: number,
    userId?: string
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'search',
      user_id: userId,
      metadata: { query, results },
    })
  }

  /**
   * Track booking
   */
  async trackBooking(
    bookingId: string,
    providerId: string,
    userId: string,
    amount: number
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'booking',
      user_id: userId,
      provider_id: providerId,
      metadata: { booking_id: bookingId, amount },
    })
  }

  /**
   * Track quote request
   */
  async trackQuoteRequest(
    providerId: string,
    userId: string,
    service: string
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'quote_request',
      user_id: userId,
      provider_id: providerId,
      metadata: { service },
    })
  }

  /**
   * Track provider profile view
   */
  async trackProfileView(
    providerId: string,
    userId?: string
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'profile_view',
      user_id: userId,
      provider_id: providerId,
    })
  }

  /**
   * Get dashboard metrics for admin
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const supabase = await createServerClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Parallel queries for better performance
    const [
      usersResult,
      providersResult,
      bookingsResult,
      monthlyBookingsResult,
      monthlyUsersResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('providers').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id, total_price, status, created_at').limit(1000),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
    ])

    const totalUsers = usersResult.count || 0
    const totalProviders = providersResult.count || 0
    const bookings = bookingsResult.data || []
    const totalBookings = bookings.length
    const completedBookings = bookings.filter(
      (b) => b.status === 'completed'
    ).length
    const totalRevenue = bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0)

    const bookingsThisMonth = monthlyBookingsResult.count || 0
    const newUsersThisMonth = monthlyUsersResult.count || 0

    // Calculate revenue this month
    const monthlyBookings = bookings.filter(
      (b) => new Date(b.created_at) >= startOfMonth
    )
    const revenueThisMonth = monthlyBookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0)

    // Conversion rate (bookings / profile views)
    const conversionRate =
      totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0

    // Average booking value
    const averageBookingValue =
      completedBookings > 0 ? totalRevenue / completedBookings : 0

    // Top services (mock data - would need proper join)
    const topServices = [
      { service: 'Plomberie', count: 150 },
      { service: 'Électricité', count: 120 },
      { service: 'Serrurerie', count: 90 },
      { service: 'Chauffage', count: 75 },
      { service: 'Climatisation', count: 60 },
    ]

    // Top cities (mock data - would need proper join)
    const topCities = [
      { city: 'Paris', count: 300 },
      { city: 'Lyon', count: 150 },
      { city: 'Marseille', count: 120 },
      { city: 'Toulouse', count: 80 },
      { city: 'Nice', count: 70 },
    ]

    // Bookings by day for last 30 days
    const bookingsByDay = this.groupByDay(
      bookings.filter((b) => new Date(b.created_at) >= thirtyDaysAgo)
    )

    // Revenue by month for last 12 months
    const revenueByMonth = this.groupRevenueByMonth(bookings)

    return {
      totalUsers,
      totalProviders,
      totalBookings,
      totalRevenue,
      bookingsThisMonth,
      revenueThisMonth,
      newUsersThisMonth,
      conversionRate,
      averageBookingValue,
      topServices,
      topCities,
      bookingsByDay,
      revenueByMonth,
    }
  }

  /**
   * Get metrics for a specific provider
   */
  async getProviderMetrics(providerId: string): Promise<ProviderMetrics> {
    const supabase = await createServerClient()

    const [bookingsResult, reviewsResult, quotesResult, profileViewsResult] =
      await Promise.all([
        supabase
          .from('bookings')
          .select('id, status, total_price, created_at, service_type')
          .eq('provider_id', providerId)
          .limit(1000),
        supabase
          .from('reviews')
          .select('rating')
          .eq('provider_id', providerId)
          .limit(1000),
        supabase
          .from('quotes')
          .select('id, status')
          .eq('provider_id', providerId)
          .limit(1000),
        // Use count query instead of fetching all rows just to count them
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', providerId)
          .eq('event_type', 'profile_view'),
      ])

    const bookings = bookingsResult.data || []
    const reviews = reviewsResult.data || []
    const quotes = quotesResult.data || []
    const profileViews = profileViewsResult.count || 0

    // Single-pass aggregation over bookings
    const totalBookings = bookings.length
    const bookingAgg = bookings.reduce(
      (acc, b) => {
        const service = (b.service_type as string) || 'Autre'
        acc.serviceCount[service] = (acc.serviceCount[service] || 0) + 1

        if (b.status === 'completed') {
          acc.completedBookings++
          acc.totalRevenue += b.total_price || 0
        } else if (b.status === 'cancelled') {
          acc.cancelledBookings++
        }

        return acc
      },
      {
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        serviceCount: {} as Record<string, number>,
      }
    )
    const { completedBookings, cancelledBookings, totalRevenue } = bookingAgg

    const topServices = Object.entries(bookingAgg.serviceCount)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const totalReviews = reviews.length
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0

    const acceptedQuotes = quotes.filter((q) => q.status === 'accepted').length
    const quoteAcceptanceRate =
      quotes.length > 0 ? (acceptedQuotes / quotes.length) * 100 : 0

    // Mock response time - would need message timestamps
    const responseTime = 30

    // Bookings by month
    const bookingsByMonth = this.groupBookingsByMonth(bookings)
    const revenueByMonth = this.groupRevenueByMonth(bookings)

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      averageRating,
      totalReviews,
      profileViews,
      quoteRequests: quotes.length,
      quoteAcceptanceRate,
      responseTime,
      bookingsByMonth,
      revenueByMonth,
      topServices,
    }
  }

  private groupByDay(
    bookings: { created_at: string }[]
  ): { date: string; count: number }[] {
    const counts: Record<string, number> = {}

    bookings.forEach((b) => {
      const date = new Date(b.created_at).toISOString().split('T')[0]
      counts[date] = (counts[date] || 0) + 1
    })

    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private groupBookingsByMonth(
    bookings: { created_at: string }[]
  ): { month: string; count: number }[] {
    const counts: Record<string, number> = {}

    bookings.forEach((b) => {
      const date = new Date(b.created_at)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      counts[month] = (counts[month] || 0) + 1
    })

    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
  }

  private groupRevenueByMonth(
    bookings: { created_at: string; total_price?: number; status?: string }[]
  ): { month: string; amount: number }[] {
    const amounts: Record<string, number> = {}

    bookings
      .filter((b) => b.status === 'completed')
      .forEach((b) => {
        const date = new Date(b.created_at)
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        amounts[month] = (amounts[month] || 0) + (b.total_price || 0)
      })

    return Object.entries(amounts)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
