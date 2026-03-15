/**
 * Artisan Devis (Quotes) API
 * GET: Get quotes sent by the artisan (from `quotes` table)
 * POST: Send a quote to a client for a given devis_request
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireArtisan } from '@/lib/auth/artisan-guard'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const DEFAULT_VALID_UNTIL = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const createQuoteSchema = z.object({
  request_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(1).max(5000),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis')
    .optional(),
})

export async function GET() {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    // Get provider linked to this user
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!provider) {
      return NextResponse.json({ success: false, error: { message: 'Profil artisan non trouvé' } }, { status: 404 })
    }

    // Fetch quotes sent by this provider
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        id,
        request_id,
        attorney_id,
        amount,
        description,
        valid_until,
        status,
        created_at,
        request:devis_requests!request_id(id, service_name, city, postal_code, description, status, created_at)
      `)
      .eq('attorney_id', provider.id)
      .order('created_at', { ascending: false })

    if (quotesError) {
      logger.error('Error fetching quotes:', quotesError)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la récupération des devis' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ devis: quotes || [] })
  } catch (error) {
    logger.error('Artisan devis GET error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    // Get provider linked to this user
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!provider) {
      return NextResponse.json({ success: false, error: { message: 'Profil artisan non trouvé' } }, { status: 404 })
    }

    const body = await request.json()
    const result = createQuoteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { request_id, amount, description, valid_until } = result.data

    // Validate valid_until is in the future if provided
    if (valid_until !== undefined) {
      const validUntilDate = new Date(valid_until)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (validUntilDate < today) {
        return NextResponse.json(
          { success: false, error: { message: 'La date d\'expiration doit être dans le futur' } },
          { status: 400 }
        )
      }
    }

    // Verify the devis_request exists
    const { data: devisRequest } = await supabase
      .from('devis_requests')
      .select('id, status')
      .eq('id', request_id)
      .single()

    if (!devisRequest) {
      return NextResponse.json({ success: false, error: { message: 'Demande introuvable' } }, { status: 404 })
    }

    // Reject quotes on closed/completed requests
    if (!['pending', 'sent'].includes(devisRequest.status)) {
      return NextResponse.json(
        { success: false, error: { message: 'Cette demande n\'accepte plus de devis' } },
        { status: 409 }
      )
    }

    // Check for duplicate quote (same request_id + attorney_id)
    const { data: existing } = await supabase
      .from('quotes')
      .select('id')
      .eq('request_id', request_id)
      .eq('attorney_id', provider.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Un devis a déjà été envoyé pour cette demande' } },
        { status: 409 }
      )
    }

    // Insert quote
    const { data: quote, error: insertError } = await supabase
      .from('quotes')
      .insert({
        request_id,
        attorney_id: provider.id,
        amount,
        description,
        valid_until: valid_until ?? DEFAULT_VALID_UNTIL(),
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Error inserting quote:', insertError)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la création du devis' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      devis: quote,
      message: 'Devis envoyé avec succès',
    })
  } catch (error) {
    logger.error('Artisan devis POST error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

const updateQuoteSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(5000).optional(),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis')
    .optional(),
})

export async function PUT(request: Request) {
  try {
    const { error: guardError, user, supabase } = await requireArtisan()
    if (guardError) return guardError

    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!provider) {
      return NextResponse.json({ success: false, error: { message: 'Profil artisan non trouvé' } }, { status: 404 })
    }

    const body = await request.json()
    const result = updateQuoteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { id, amount, description, valid_until } = result.data

    // Validate valid_until is in the future if provided
    if (valid_until !== undefined) {
      const validDate = new Date(valid_until)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (validDate <= today) {
        return NextResponse.json(
          { success: false, error: { message: 'La date d\'expiration doit être dans le futur' } },
          { status: 400 }
        )
      }
    }

    // Verify quote exists, belongs to this provider, and is still pending
    const { data: existingQuote } = await supabase
      .from('quotes')
      .select('id, status')
      .eq('id', id)
      .eq('attorney_id', provider.id)
      .single()

    if (!existingQuote) {
      return NextResponse.json({ success: false, error: { message: 'Devis introuvable' } }, { status: 404 })
    }
    if (existingQuote.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { message: 'Seul un devis en attente peut être modifié' } },
        { status: 403 }
      )
    }

    const patch: Record<string, unknown> = {}
    if (amount !== undefined) patch.amount = amount
    if (description !== undefined) patch.description = description
    if (valid_until !== undefined) patch.valid_until = valid_until

    const { data: quote, error: updateError } = await supabase
      .from('quotes')
      .update(patch)
      .eq('id', id)
      .eq('attorney_id', provider.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating quote:', updateError)
      return NextResponse.json(
        { success: false, error: { message: 'Erreur lors de la mise à jour du devis' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, devis: quote })
  } catch (error) {
    logger.error('Artisan devis PUT error:', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
