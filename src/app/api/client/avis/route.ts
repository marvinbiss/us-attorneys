/**
 * Client Reviews API
 * GET: Fetch reviews written by the client and pending reviews
 * POST: Submit a new review
 * PUT: Update an existing review
 * DELETE: Delete a review
 */

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

// POST request schema
const createReviewSchema = z.object({
  artisan_id: z.string().uuid(),
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

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Fetch published reviews by this client via bookings (reviews has no direct client FK)
    // Step 1: get booking IDs for this client
    const { data: clientBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('client_id', user.id)

    const bookingIds = clientBookings?.map((b: { id: string }) => b.id) || []

    // Step 2: fetch reviews for those bookings
    // Note: 'devis' table does not exist (TODO: re-enable join when reconciled)
    // Note: profiles does not have company_name or avatar_url
    const { data: avisPublies, error: avisError } = await supabase
      .from('reviews')
      .select(`
        *,
        artisan:profiles!artisan_id(id, full_name),
        booking:bookings!booking_id(service_name)
      `)
      .in('booking_id', bookingIds.length > 0 ? bookingIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false })

    if (avisError) {
      logger.error('Error fetching reviews:', avisError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des avis' },
        { status: 500 }
      )
    }

    // TODO: table 'devis' does not exist — pending reviews from completed devis disabled
    const avisEnAttente: unknown[] = []

    // Format published reviews
    const formattedAvisPublies = avisPublies?.map(r => ({
      id: r.id,
      artisan: r.artisan?.full_name || 'Artisan',
      artisan_id: r.artisan_id,
      service: (r.booking as { service_name?: string } | null)?.service_name || null,
      date: r.created_at,
      note: r.rating,
      commentaire: r.comment,
      reponse: r.artisan_response,
    })) || []

    return NextResponse.json({
      avisPublies: formattedAvisPublies,
      avisEnAttente,
    })
  } catch (error) {
    logger.error('Client avis GET error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = createReviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { artisan_id, booking_id, rating, comment } = result.data

    // Fetch client profile to get name and email for the review record
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Insert review (reviews has client_name, client_email — no user_id FK)
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        artisan_id,
        booking_id: booking_id || null,
        client_name: clientProfile?.full_name || user.email || 'Client',
        client_email: clientProfile?.email || user.email || '',
        rating,
        comment,
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Error inserting review:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la publication de l\'avis' },
        { status: 500 }
      )
    }

    // Revalidation on-demand des pages affectées (non-bloquant)
    try {
      const { data: providerData } = await supabase
        .from('providers')
        .select('specialty, address_city, slug, stable_id')
        .eq('user_id', artisan_id)
        .single()

      if (providerData) {
        const serviceSlug = slugify(providerData.specialty || 'artisan')
        const locationSlug = slugify(providerData.address_city || 'france')
        const publicId = providerData.slug || providerData.stable_id

        if (publicId) {
          revalidatePath(`/services/${serviceSlug}/${locationSlug}/${publicId}`, 'page')
        }
        revalidatePath(`/avis/${serviceSlug}/${locationSlug}`, 'page')
        revalidatePath(`/services/${serviceSlug}/${locationSlug}`, 'page')

        logger.info('Revalidated paths after client review submission', {
          artisanId: artisan_id,
          reviewId: review.id,
        })
      }
    } catch (revalError) {
      logger.error('Revalidation failed after client review:', revalError)
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Avis publié avec succès',
    })
  } catch (error) {
    logger.error('Client avis POST error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = updateReviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { review_id, rating, comment } = result.data

    // Verify the review belongs to this client via booking ownership
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('id', review_id)
      .single()

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avis non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    const { data: ownerBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', existingReview.booking_id)
      .eq('client_id', user.id)
      .single()

    if (!ownerBooking) {
      return NextResponse.json(
        { error: 'Avis non trouvé ou non autorisé' },
        { status: 403 }
      )
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
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'avis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Avis mis à jour avec succès',
    })
  } catch (error) {
    logger.error('Client avis PUT error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      id: searchParams.get('id'),
    }
    const result = deleteReviewSchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const review_id = result.data.id

    // Verify the review belongs to this client via booking ownership
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('id', review_id)
      .single()

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avis non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    const { data: ownerBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', existingReview.booking_id)
      .eq('client_id', user.id)
      .single()

    if (!ownerBooking) {
      return NextResponse.json(
        { error: 'Avis non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    // Delete review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', review_id)

    if (deleteError) {
      logger.error('Error deleting review:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'avis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Avis supprimé avec succès',
    })
  } catch (error) {
    logger.error('Client avis DELETE error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
