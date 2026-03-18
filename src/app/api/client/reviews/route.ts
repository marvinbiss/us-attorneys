/**
 * Client Reviews API
 * GET: Fetch reviews written by the client and pending reviews
 * POST: Submit a new review
 * PUT: Update an existing review
 * DELETE: Delete a review
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { slugify } from '@/lib/utils'
import { withTimeout } from '@/lib/api/timeout'
import { z } from 'zod'

// POST request schema
const createReviewSchema = z.object({
  attorney_id: z.string().uuid(),
  booking_id: z.string().uuid().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(2000),
})

// PUT request schema
const updateReviewSchema = z.object({
  review_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(2000).optional(),
})

// DELETE query params schema
const deleteReviewSchema = z.object({
  id: z.string().uuid(),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ user }) => {
  const supabase = await createClient()

  // Fetch published reviews by this client via bookings (reviews has no direct client FK)
  // Step 1: get booking IDs for this client
  const { data: clientBookings } = await withTimeout(
    supabase
      .from('bookings')
      .select('id')
      .eq('client_id', user!.id)
  )

  const bookingIds = clientBookings?.map((b: { id: string }) => b.id) || []

  // Step 2: fetch reviews for those bookings
  // Note: 'quotes' table does not exist yet (TODO: re-enable join when quotes table is created)
  // Note: profiles does not have company_name or avatar_url
  const { data: publishedReviews, error: reviewsError } = await withTimeout(
    supabase
      .from('reviews')
      .select(`
        *,
        attorney:attorneys!attorney_id(id, name),
        booking:bookings!booking_id(id)
      `)
      .in('booking_id', bookingIds.length > 0 ? bookingIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false })
  )

  if (reviewsError) {
    logger.error('Error fetching reviews:', reviewsError)
    return apiError('DATABASE_ERROR', 'Error retrieving reviews', 500)
  }

  // TODO: quotes table does not exist yet -- pending reviews from completed quotes disabled
  const pendingReviews: unknown[] = []

  // Format published reviews
  const formattedPublishedReviews = publishedReviews?.map(r => ({
    id: r.id,
    attorney: r.attorney?.name || 'Attorney',
    attorney_id: r.attorney_id,
    service: null, // bookings table service_name may not exist in all environments
    date: r.created_at,
    rating: r.rating,
    comment: r.comment,
    response: r.artisan_response,
  })) || []

  return apiSuccess({
    publishedReviews: formattedPublishedReviews,
    pendingReviews: pendingReviews,
  })
}, { requireAuth: true })

export const POST = createApiHandler(async ({ request, user }) => {
  const supabase = await createClient()

  const body = await request.json()
  const result = createReviewSchema.safeParse(body)
  if (!result.success) {
    return apiError('VALIDATION_ERROR', 'Validation error', 400)
  }
  const { attorney_id, booking_id, rating, comment } = result.data

  // Fetch client profile to get name and email for the review record
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user!.id)
    .single()

  // Insert review (reviews has client_name, client_email — no user_id FK)
  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      attorney_id,
      booking_id: booking_id || null,
      client_name: clientProfile?.full_name || user!.email || 'Client',
      client_email: clientProfile?.email || user!.email || '',
      rating,
      comment,
    })
    .select()
    .single()

  if (insertError) {
    logger.error('Error inserting review:', insertError)
    return apiError('DATABASE_ERROR', 'Error publishing review', 500)
  }

  // On-demand revalidation of affected pages (non-blocking)
  try {
    const { data: attorneyData } = await supabase
      .from('attorneys')
      .select('address_city, slug, stable_id, primary_specialty:specialties!attorneys_primary_specialty_id_fkey(slug)')
      .eq('user_id', attorney_id)
      .single()

    if (attorneyData) {
      const primarySpec = attorneyData.primary_specialty as unknown as { slug: string } | null
      const specialtySlug = primarySpec?.slug || 'attorney'
      const locationSlug = slugify(attorneyData.address_city || 'united-states')
      const publicId = attorneyData.slug || attorneyData.stable_id

      if (publicId) {
        revalidatePath(`/practice-areas/${specialtySlug}/${locationSlug}/${publicId}`, 'page')
      }
      revalidatePath(`/reviews/${specialtySlug}/${locationSlug}`, 'page')
      revalidatePath(`/practice-areas/${specialtySlug}/${locationSlug}`, 'page')

      logger.info('Revalidated paths after client review submission', {
        attorneyId: attorney_id,
        reviewId: review.id,
      })
    }
  } catch (revalError) {
    logger.error('Revalidation failed after client review:', revalError)
  }

  return apiSuccess({
    review,
    message: 'Review published successfully',
  })
}, { requireAuth: true })

export const PUT = createApiHandler(async ({ request, user }) => {
  const supabase = await createClient()

  const body = await request.json()
  const result = updateReviewSchema.safeParse(body)
  if (!result.success) {
    return apiError('VALIDATION_ERROR', 'Validation error', 400)
  }
  const { review_id, rating, comment } = result.data

  // Verify the review belongs to this client via booking ownership
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('booking_id')
    .eq('id', review_id)
    .single()

  if (!existingReview) {
    return apiError('AUTHORIZATION_ERROR', 'Review not found or unauthorized', 403)
  }

  const { data: ownerBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', existingReview.booking_id)
    .eq('client_id', user!.id)
    .single()

  if (!ownerBooking) {
    return apiError('AUTHORIZATION_ERROR', 'Review not found or unauthorized', 403)
  }

  // Update review
  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      rating,
      comment,
    })
    .eq('id', review_id)

  if (updateError) {
    logger.error('Error updating review:', updateError)
    return apiError('DATABASE_ERROR', 'Error updating the review', 500)
  }

  return apiSuccess({ message: 'Review updated successfully' })
}, { requireAuth: true })

export const DELETE = createApiHandler(async ({ request, user }) => {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const queryParams = {
    id: searchParams.get('id'),
  }
  const result = deleteReviewSchema.safeParse(queryParams)
  if (!result.success) {
    return apiError('VALIDATION_ERROR', 'Invalid parameters', 400)
  }
  const review_id = result.data.id

  // Verify the review belongs to this client via booking ownership
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('booking_id')
    .eq('id', review_id)
    .single()

  if (!existingReview) {
    return apiError('AUTHORIZATION_ERROR', 'Review not found or unauthorized', 403)
  }

  const { data: ownerBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', existingReview.booking_id)
    .eq('client_id', user!.id)
    .single()

  if (!ownerBooking) {
    return apiError('AUTHORIZATION_ERROR', 'Review not found or unauthorized', 403)
  }

  // Delete review
  const { error: deleteError } = await supabase
    .from('reviews')
    .delete()
    .eq('id', review_id)

  if (deleteError) {
    logger.error('Error deleting review:', deleteError)
    return apiError('DATABASE_ERROR', 'Error deleting review', 500)
  }

  return apiSuccess({ message: 'Review deleted successfully' })
}, { requireAuth: true })
