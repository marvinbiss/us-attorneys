/**
 * Reviews API - US Attorneys
 * Handles review submission and retrieval with proper validation
 * World-class review system with fraud detection
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { apiLogger } from '@/lib/logger'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'
import { slugify } from '@/lib/utils'
import { createReviewSchema, validateRequest } from '@/lib/validations/schemas'
import { withTimeout } from '@/lib/api/timeout'
import { z } from 'zod'
import type { SupabaseClientType } from '@/types'

// Type definitions for database responses
interface ClientProfile {
  full_name: string | null
  email: string | null
  phone_e164: string | null
}

interface AttorneyProfile {
  id: string
  name: string | null
}

interface BookingWithRelations {
  id: string
  attorney_id: string
  service_name: string | null
  status: string
  client: ClientProfile | ClientProfile[] | null
  attorney: AttorneyProfile | AttorneyProfile[] | null
}

interface Review {
  id: string
  rating: number
  rating_communication: number | null
  rating_result: number | null
  rating_responsiveness: number | null
  comment: string | null
  would_recommend: boolean
  client_name: string
  created_at: string
  artisan_response: string | null
  artisan_responded_at: string | null
}

// Initialize Supabase client (anon key only — RLS enforced)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Helper to get attorney display name
function getAttorneyDisplayName(attorneyData: AttorneyProfile | AttorneyProfile[] | null): string {
  if (!attorneyData) return 'Attorney'

  const profile = Array.isArray(attorneyData) ? attorneyData[0] : attorneyData

  return profile?.name || 'Attorney'
}

// Helper to get client info from profiles join
function getClientInfo(client: ClientProfile | ClientProfile[] | null): { name: string; email: string; phone: string | null } {
  if (!client) return { name: 'Client', email: '', phone: null }
  const profile = Array.isArray(client) ? client[0] : client
  return {
    name: profile?.full_name || 'Client',
    email: profile?.email || '',
    phone: profile?.phone_e164 || null,
  }
}

// Query schema for GET request - require full UUID for bookingId to prevent enumeration
const getQuerySchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID').optional(),
  attorneyId: z.string().uuid().optional(),
}).refine(data => data.bookingId || data.attorneyId, {
  message: 'bookingId or attorneyId required',
})

// GET /api/reviews - Get booking info for review or attorney reviews
export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ request }) => {
    const { searchParams } = new URL(request.url)

    const queryValidation = getQuerySchema.safeParse({
      bookingId: searchParams.get('bookingId') || undefined,
      attorneyId: searchParams.get('attorneyId') || undefined,
    })

    if (!queryValidation.success) {
      return apiError('VALIDATION_ERROR', queryValidation.error.issues[0]?.message || 'Invalid parameters', 400)
    }

    const { bookingId, attorneyId } = queryValidation.data
    const supabase = getSupabaseClient()

    // Get booking info for review submission - use exact match to prevent enumeration
    if (bookingId) {
      const { data: booking, error } = await withTimeout(
        supabase
          .from('bookings')
          .select(`
            id,
            attorney_id,
            service_name,
            status,
            client:profiles!client_id(full_name, email, phone_e164),
            attorney:attorneys!bookings_attorney_id_fkey(id, name)
          `)
          .eq('id', bookingId)
          .single()
      )

      if (error || !booking) {
        // Don't reveal whether the booking exists or not to prevent enumeration
        return apiError('NOT_FOUND', 'Booking not found', 404)
      }

      const typedBooking = booking as BookingWithRelations

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', typedBooking.id)
        .single()

      return apiSuccess({
        attorneyName: getAttorneyDisplayName(typedBooking.attorney),
        specialtyName: typedBooking.service_name || 'Service',
        alreadyReviewed: !!existingReview,
      })
    }

    // Get published reviews for an attorney (only status = 'published')
    if (attorneyId) {
      const { data: reviews, error } = await withTimeout(
        supabase
          .from('reviews')
          .select(`
            id,
            rating,
            rating_communication,
            rating_result,
            rating_responsiveness,
            comment,
            would_recommend,
            client_name,
            created_at,
            artisan_response,
            artisan_responded_at
          `)
          .eq('attorney_id', attorneyId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
      )

      if (error) {
        apiLogger.error('Database error:', error)
        return apiError('DATABASE_ERROR', 'Error retrieving reviews', 500)
      }

      const typedReviews = (reviews || []) as Review[]

      // Calculate stats
      const totalReviews = typedReviews.length
      const avgRating = totalReviews > 0
        ? typedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0
      const recommendRate = totalReviews > 0
        ? (typedReviews.filter((r) => r.would_recommend).length / totalReviews) * 100
        : 0

      // Rating distribution
      const distribution = [0, 0, 0, 0, 0]
      typedReviews.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[r.rating - 1]++
        }
      })

      return apiSuccess({
        reviews: typedReviews,
        stats: {
          total: totalReviews,
          average: Math.round(avgRating * 10) / 10,
          recommendRate: Math.round(recommendRate),
          distribution,
        },
      })
    }

    return apiError('VALIDATION_ERROR', 'bookingId or attorneyId required', 400)
}, {})

// POST /api/reviews - Submit a review
export const POST = createApiHandler(async ({ request }) => {
    const body = await request.json()

    // Validate request body
    const validation = validateRequest(createReviewSchema, body)

    if (!validation.success) {
      return apiError('VALIDATION_ERROR', 'Invalid data', 400)
    }

    const {
      bookingId,
      comment,
      reviewToken,
      ratingCommunication,
      ratingResult,
      ratingResponsiveness,
      isAnonymous,
    } = validation.data

    // Compute overall rating: prefer sub-ratings average, fallback to single rating
    const hasSubRatings = ratingCommunication && ratingResult && ratingResponsiveness
    const rating = hasSubRatings
      ? Math.round((ratingCommunication + ratingResult + ratingResponsiveness) / 3)
      : validation.data.rating ?? 3
    const wouldRecommend = validation.data.wouldRecommend ?? body.wouldRecommend ?? true

    // Validate HMAC review token (prevents fake reviews)
    if (!reviewToken) {
      return apiError('VALIDATION_ERROR', 'Review token is required', 400)
    }
    if (!process.env.REVIEW_HMAC_SECRET) {
      apiLogger.error('REVIEW_HMAC_SECRET is not configured — rejecting review submission')
      return apiError('INTERNAL_ERROR', 'Review submission is temporarily unavailable', 503)
    }
    {
      const expected = createHmac('sha256', process.env.REVIEW_HMAC_SECRET)
        .update(bookingId)
        .digest('hex')
        .slice(0, 32)
      const provided = Buffer.from(reviewToken, 'hex')
      const expectedBuf = Buffer.from(expected, 'hex')
      if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
        return apiError('AUTHENTICATION_ERROR', 'Invalid token', 401)
      }
    }

    // Validate bookingId is a valid UUID to prevent enumeration
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(bookingId)) {
      return apiError('VALIDATION_ERROR', 'Invalid booking ID', 400)
    }

    const supabase = getSupabaseClient()

    // Find the booking using exact match to prevent enumeration
    // Join profiles via client_id to get client name and email
    const { data: booking, error: bookingError } = await withTimeout(
      supabase
        .from('bookings')
        .select(`
          id,
          attorney_id,
          status,
          client:profiles!client_id(full_name, email, phone_e164)
        `)
        .eq('id', bookingId)
        .single()
    )

    if (bookingError || !booking) {
      // Generic error to prevent enumeration
      return apiError('NOT_FOUND', 'Booking not found', 404)
    }

    // Check booking status
    if (!['confirmed', 'completed'].includes(booking.status)) {
      return apiError('VALIDATION_ERROR', 'This booking cannot be reviewed', 400)
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking.id)
      .single()

    if (existingReview) {
      return apiError('REVIEW_ALREADY_EXISTS', 'You have already left a review for this booking', 409)
    }

    // Extract client info from profiles join
    const clientInfo = getClientInfo(booking.client as ClientProfile | ClientProfile[] | null)

    // Basic fraud detection
    const cleanComment = comment.trim()
    const fraudIndicators = detectFraudIndicators(cleanComment, rating)

    // Create the review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        booking_id: booking.id,
        attorney_id: booking.attorney_id,
        client_name: isAnonymous ? 'Verified Client' : clientInfo.name,
        client_email: clientInfo.email,
        rating,
        rating_communication: ratingCommunication || null,
        rating_result: ratingResult || null,
        rating_responsiveness: ratingResponsiveness || null,
        comment: cleanComment,
        would_recommend: wouldRecommend,
        status: fraudIndicators.length > 0 ? 'pending_review' : 'published',
        fraud_indicators: fraudIndicators.length > 0 ? fraudIndicators : null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      apiLogger.error('Review insert error:', insertError)
      return apiError('DATABASE_ERROR', 'Error creating review', 500)
    }

    // Update attorney's average rating (non-blocking)
    updateAttorneyRating(supabase, booking.attorney_id).catch((err) => apiLogger.error('Update rating failed', err))

    // On-demand revalidation of affected pages (non-blocking)
    try {
      const { data: attorneyData } = await supabase
        .from('attorneys')
        .select('address_city, slug, stable_id, primary_specialty:specialties!attorneys_primary_specialty_id_fkey(slug)')
        .eq('id', booking.attorney_id)
        .single()

      if (attorneyData) {
        const primarySpec = attorneyData.primary_specialty as unknown as { slug: string } | null
        const specialtySlug = primarySpec?.slug || 'attorney'
        const locationSlug = slugify(attorneyData.address_city || 'united-states')
        const publicId = attorneyData.slug || attorneyData.stable_id

        // Attorney profile page
        if (publicId) {
          revalidatePath(`/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`, 'page')
        }
        // City reviews page
        revalidatePath(`/reviews/${specialtySlug}/${locationSlug}`, 'page')
        // City listing
        revalidatePath(`/practice-areas/${specialtySlug}/${locationSlug}`, 'page')

        apiLogger.info('Revalidated paths after review submission', {
          attorneyId: booking.attorney_id,
          reviewId: review.id,
        })
      }
    } catch (revalError) {
      apiLogger.error('Revalidation failed after review submission:', revalError)
    }

    return apiSuccess({
      review: {
        id: review.id,
        status: review.status,
      },
      message: fraudIndicators.length > 0
        ? 'Your review will be published after verification'
        : 'Thank you for your review!',
    }, 201)
}, {})

// Fraud detection helper
function detectFraudIndicators(comment: string, rating: number): string[] {
  const indicators: string[] = []

  if (comment.length > 0) {
    // All caps
    if (comment === comment.toUpperCase() && comment.length > 20) {
      indicators.push('all_caps')
    }

    // Repeated characters
    if (/(.)\1{4,}/.test(comment)) {
      indicators.push('repeated_chars')
    }

    // Links
    if (/https?:\/\/|www\./i.test(comment)) {
      indicators.push('contains_links')
    }

    // Excessive punctuation
    if (/[!?]{3,}/.test(comment)) {
      indicators.push('excessive_punctuation')
    }

    // Very short extreme rating
    if (comment.length < 10 && (rating === 1 || rating === 5)) {
      indicators.push('short_extreme_rating')
    }
  }

  return indicators
}

// Update attorney's average rating (using ALL real reviews, not just published)
async function updateAttorneyRating(supabase: SupabaseClientType, attorneyId: string) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('attorney_id', attorneyId)
    // REMOVED: .eq('status', 'published') to include ALL real reviews in rating calculation

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length

    await supabase
      .from('attorneys')
      .update({
        rating_average: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
      })
      .eq('id', attorneyId)
  }
}
