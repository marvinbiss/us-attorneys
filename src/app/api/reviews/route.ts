/**
 * Reviews API - ServicesArtisans
 * Handles review submission and retrieval with proper validation
 * World-class review system with fraud detection
 */

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { logger } from '@/lib/logger'
import { slugify } from '@/lib/utils'
import { createReviewSchema, validateRequest, formatZodErrors } from '@/lib/validations/schemas'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/errors/types'
import { z } from 'zod'
import type { SupabaseClientType } from '@/types'

// Type definitions for database responses
interface ClientProfile {
  full_name: string | null
  email: string | null
  phone_e164: string | null
}

interface ArtisanProfile {
  id: string
  name: string | null
}

interface BookingWithRelations {
  id: string
  provider_id: string
  service_name: string | null
  status: string
  client: ClientProfile | ClientProfile[] | null
  artisan: ArtisanProfile | ArtisanProfile[] | null
}

interface Review {
  id: string
  rating: number
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

// Helper to get artisan display name
function getArtisanDisplayName(artisan: ArtisanProfile | ArtisanProfile[] | null): string {
  if (!artisan) return 'Artisan'

  const profile = Array.isArray(artisan) ? artisan[0] : artisan

  return profile?.name || 'Artisan'
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
  bookingId: z.string().uuid('ID de réservation invalide').optional(),
  artisanId: z.string().uuid().optional(),
}).refine(data => data.bookingId || data.artisanId, {
  message: 'bookingId ou artisanId requis',
})

// GET /api/reviews - Get booking info for review or artisan reviews
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const queryValidation = getQuerySchema.safeParse({
      bookingId: searchParams.get('bookingId') || undefined,
      artisanId: searchParams.get('artisanId') || undefined,
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          queryValidation.error.issues[0]?.message || 'Parametres invalides'
        ),
        { status: 400 }
      )
    }

    const { bookingId, artisanId } = queryValidation.data
    const supabase = getSupabaseClient()

    // Get booking info for review submission - use exact match to prevent enumeration
    if (bookingId) {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          id,
          provider_id,
          service_name,
          status,
          client:profiles!client_id(full_name, email, phone_e164),
          artisan:providers!bookings_provider_id_fkey(id, name)
        `)
        .eq('id', bookingId)
        .single()

      if (error || !booking) {
        // Don't reveal whether the booking exists or not to prevent enumeration
        return NextResponse.json(
          createErrorResponse(ErrorCode.NOT_FOUND, 'Reservation non trouvee'),
          { status: 404 }
        )
      }

      const typedBooking = booking as BookingWithRelations

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', typedBooking.id)
        .single()

      return NextResponse.json(
        createSuccessResponse({
          artisanName: getArtisanDisplayName(typedBooking.artisan),
          serviceName: typedBooking.service_name || 'Service',
          alreadyReviewed: !!existingReview,
        })
      )
    }

    // Get published reviews for an artisan (only status = 'published')
    if (artisanId) {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          would_recommend,
          client_name,
          created_at,
          artisan_response,
          artisan_responded_at
        `)
        .eq('artisan_id', artisanId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Database error:', error)
        return NextResponse.json(
          createErrorResponse(ErrorCode.DATABASE_ERROR, 'Erreur lors de la recuperation des avis'),
          { status: 500 }
        )
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

      return NextResponse.json(
        createSuccessResponse({
          reviews: typedReviews,
          stats: {
            total: totalReviews,
            average: Math.round(avgRating * 10) / 10,
            recommendRate: Math.round(recommendRate),
            distribution,
          },
        })
      )
    }

    return NextResponse.json(
      createErrorResponse(ErrorCode.VALIDATION_ERROR, 'bookingId ou artisanId requis'),
      { status: 400 }
    )
  } catch (error) {
    logger.error('Reviews GET error:', error)
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Erreur serveur'),
      { status: 500 }
    )
  }
}

// POST /api/reviews - Submit a review
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = validateRequest(createReviewSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          'Donnees invalides',
          { fields: formatZodErrors(validation.errors) }
        ),
        { status: 400 }
      )
    }

    const { bookingId, rating, comment, reviewToken } = validation.data
    const wouldRecommend = body.wouldRecommend ?? true

    // Validate HMAC review token (prevents fake reviews)
    if (process.env.REVIEW_HMAC_SECRET && reviewToken) {
      const expected = createHmac('sha256', process.env.REVIEW_HMAC_SECRET)
        .update(bookingId)
        .digest('hex')
        .slice(0, 32)
      const provided = Buffer.from(reviewToken, 'hex')
      const expectedBuf = Buffer.from(expected, 'hex')
      if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
        return NextResponse.json(createErrorResponse(ErrorCode.UNAUTHORIZED, 'Token invalide'), { status: 401 })
      }
    }
    // If no REVIEW_HMAC_SECRET configured, allow without token (backward compat)

    // Validate bookingId is a valid UUID to prevent enumeration
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(bookingId)) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'ID de réservation invalide'),
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Find the booking using exact match to prevent enumeration
    // Join profiles via client_id to get client name and email
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        provider_id,
        status,
        client:profiles!client_id(full_name, email, phone_e164)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      // Generic error to prevent enumeration
      return NextResponse.json(
        createErrorResponse(ErrorCode.NOT_FOUND, 'Reservation non trouvee'),
        { status: 404 }
      )
    }

    // Check booking status
    if (!['confirmed', 'completed'].includes(booking.status)) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Cette reservation ne peut pas etre evaluee'),
        { status: 400 }
      )
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking.id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.REVIEW_ALREADY_EXISTS, 'Vous avez déjà laissé un avis pour cette réservation'),
        { status: 409 }
      )
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
        artisan_id: booking.provider_id,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        rating,
        comment: cleanComment,
        would_recommend: wouldRecommend,
        status: fraudIndicators.length > 0 ? 'pending_review' : 'published',
        fraud_indicators: fraudIndicators.length > 0 ? fraudIndicators : null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Review insert error:', insertError)
      return NextResponse.json(
        createErrorResponse(ErrorCode.DATABASE_ERROR, 'Erreur lors de la creation de l\'avis'),
        { status: 500 }
      )
    }

    // Update artisan's average rating (non-blocking)
    updateArtisanRating(supabase, booking.provider_id).catch((err) => logger.error('Update rating failed', err))

    // Revalidation on-demand des pages affectées (non-bloquant)
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('specialty, address_city, slug, stable_id')
        .eq('id', booking.provider_id)
        .single()

      if (providerData) {
        const serviceSlug = slugify(providerData.specialty || 'artisan')
        const locationSlug = slugify(providerData.address_city || 'france')
        const publicId = providerData.slug || providerData.stable_id

        // Page profil artisan
        if (publicId) {
          revalidatePath(`/services/${serviceSlug}/${locationSlug}/${publicId}`, 'page')
        }
        // Page avis ville
        revalidatePath(`/avis/${serviceSlug}/${locationSlug}`, 'page')
        // Listing ville
        revalidatePath(`/services/${serviceSlug}/${locationSlug}`, 'page')

        logger.info('Revalidated paths after review submission', {
          providerId: booking.provider_id,
          reviewId: review.id,
        })
      }
    } catch (revalError) {
      logger.error('Revalidation failed after review submission:', revalError)
    }

    return NextResponse.json(
      createSuccessResponse({
        review: {
          id: review.id,
          status: review.status,
        },
        message: fraudIndicators.length > 0
          ? 'Votre avis sera publie apres verification'
          : 'Merci pour votre avis !',
      }),
      { status: 201 }
    )
  } catch (error) {
    logger.error('Reviews POST error:', error)
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Erreur lors de l\'envoi de l\'avis'),
      { status: 500 }
    )
  }
}

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

// Update artisan's average rating (using ALL real reviews, not just published)
async function updateArtisanRating(supabase: SupabaseClientType, artisanId: string) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('artisan_id', artisanId)
    // REMOVED: .eq('status', 'published') to include ALL real reviews in rating calculation

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length

    await supabase
      .from('profiles')
      .update({
        average_rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
      })
      .eq('id', artisanId)
  }
}
